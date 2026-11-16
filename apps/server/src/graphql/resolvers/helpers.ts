import { EMBEDDING_DIMENSIONS, type JobMatch, type MatchInsight, type MatchInsightRequest, type MatchInsightResponse, type RecommendResponse } from '@angkop/shared'
import { prisma } from '../../lib/prisma'
import { getOrSetMatchScores } from '../../lib/redis'
import { MlServiceError, matchInsight as requestMatchInsight, recommend, recommendBatch } from '../../lib/ml-client'
import { logger } from '../../lib/logger'
import type {
  CertificationInput,
  EducationInput,
  LanguageInput,
  ProjectInput,
  SavedJobWithJob,
  UserPreferenceInput,
  WorkExperienceInput
} from './types'

// A user who hasn't completed onboarding yet has no UserProfile row (and therefore no
// stored embedding) - score them against a neutral zero vector rather than special-casing
// "no profile" through every caller below.
const ZERO_EMBEDDING: number[] = new Array(EMBEDDING_DIMENSIONS).fill(0)

function resolveUserEmbedding(profile: { embedding: number[] } | null): number[] {
  return profile && profile.embedding.length > 0 ? profile.embedding : ZERO_EMBEDDING
}

export function serializeSavedJob(savedJob: SavedJobWithJob, hybridScore = 0) {
  return {
    id: savedJob.id,
    job: savedJob.job,
    status: savedJob.status,
    tags: savedJob.tags,
    interviewDate: savedJob.interviewDate ? savedJob.interviewDate.toISOString() : null,
    createdAt: savedJob.createdAt.toISOString(),
    hybridScore
  }
}

export function buildSkillsText(input: {
  headline?: string | null
  about?: string | null
  careerLevel?: string | null
  skills: { name: string }[]
  education: EducationInput[]
  experience: WorkExperienceInput[]
  certifications: CertificationInput[]
  projects: ProjectInput[]
  languages: LanguageInput[]
  preferences: UserPreferenceInput
}): string {
  const parts: string[] = []
  if (input.headline) parts.push(input.headline)
  if (input.about) parts.push(input.about)
  if (input.careerLevel) parts.push(input.careerLevel.replace(/_/g, ' ').toLowerCase())
  if (input.skills.length > 0) parts.push(`Skills: ${input.skills.map((skill) => skill.name).join(', ')}`)
  for (const experience of input.experience) {
    parts.push(
      `${experience.title} at ${experience.company}` +
        (experience.description ? ` — ${experience.description}` : '')
    )
  }
  for (const education of input.education) {
    const degreeField = [education.degree, education.fieldOfStudy].filter(Boolean).join(' in ')
    parts.push(degreeField ? `${degreeField} from ${education.school}` : education.school)
  }
  for (const project of input.projects) {
    parts.push(`${project.name}: ${project.description}`)
  }
  for (const certification of input.certifications) {
    parts.push(`${certification.name} (${certification.issuer})`)
  }
  if (input.languages.length > 0) {
    parts.push(`Languages: ${input.languages.map((language) => language.language).join(', ')}`)
  }
  if (input.preferences.desiredRoles.length > 0) {
    parts.push(`Looking for: ${input.preferences.desiredRoles.join(', ')}`)
  }
  if (input.preferences.preferredIndustries.length > 0) {
    parts.push(`Interested in: ${input.preferences.preferredIndustries.join(', ')}`)
  }
  return parts.join('. ')
}

export async function loadProfileForMe(userId: string) {
  const [profile, userSkills] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { userId },
      include: {
        education: { where: { deleted: false } },
        experience: { where: { deleted: false } },
        certifications: { where: { deleted: false } },
        projects: { where: { deleted: false } },
        languages: { where: { deleted: false } },
        preferences: true
      }
    }),
    prisma.userSkill.findMany({
      where: { userId, deleted: false },
      include: { skill: true }
    })
  ])

  if (!profile) return null

  return {
    id: profile.id,
    headline: profile.headline,
    about: profile.about,
    skills: userSkills.map((userSkill) => ({
      name: userSkill.skill.name,
      category: userSkill.skill.category,
      level: userSkill.level,
      years: userSkill.years
    })),
    skillsText: profile.skillsText,
    careerLevel: profile.careerLevel,
    location: profile.location,
    resumeFileName: profile.resumeFileName,
    education: profile.education,
    experience: profile.experience.map((experience) => ({
      ...experience,
      startDate: experience.startDate.toISOString(),
      endDate: experience.endDate ? experience.endDate.toISOString() : null
    })),
    certifications: profile.certifications.map((certification) => ({
      ...certification,
      issueDate: certification.issueDate ? certification.issueDate.toISOString() : null,
      expirationDate: certification.expirationDate ? certification.expirationDate.toISOString() : null
    })),
    projects: profile.projects.map((project) => ({
      ...project,
      startDate: project.startDate ? project.startDate.toISOString() : null,
      endDate: project.endDate ? project.endDate.toISOString() : null
    })),
    languages: profile.languages,
    preferences: profile.preferences
      ? {
          desiredRoles: profile.preferences.desiredRoles,
          preferredLocations: profile.preferences.preferredLocations,
          preferredJobTypes: profile.preferences.preferredJobTypes,
          preferredIndustries: profile.preferences.preferredIndustries,
          workSetup: profile.preferences.workSetup,
          minimumSalary: profile.preferences.minimumSalary,
          maximumSalary: profile.preferences.maximumSalary,
          willingToRelocate: profile.preferences.willingToRelocate,
          willingToRemote: profile.preferences.willingToRemote
        }
      : null
  }
}

// Scores the given jobs against the user's stored embedding in one batched ML request - both
// embeddings are precomputed (Job.embedding at ingestion, UserProfile.embedding on profile
// save), so this is cosine-similarity + NCF lookup, not live Sentence-BERT inference, and
// the cache misses go out as a single /recommend/batch call instead of one request per job.
//
// Takes ids, not job rows: the 384-float embeddings (~9 MB across the whole catalog), the
// profile, and the interaction count are only read from Postgres inside the cache-miss
// callback, so a fully cached feed never pays to load them.
async function scoreJobs(userId: string, jobIds: string[]): Promise<Map<string, RecommendResponse>> {
  return getOrSetMatchScores(userId, jobIds, async (missingJobIds) => {
    const [jobs, profile, interactionCount] = await Promise.all([
      prisma.job.findMany({
        where: { id: { in: missingJobIds }, deleted: false },
        select: { id: true, embedding: true }
      }),
      prisma.userProfile.findUnique({ where: { userId }, select: { embedding: true } }),
      prisma.interaction.count({ where: { userId, deleted: false } })
    ])

    const { results } = await recommendBatch({
      userId,
      userEmbedding: resolveUserEmbedding(profile),
      userInteractionCount: interactionCount,
      jobs: jobs.map((job) => ({ jobId: job.id, jobEmbedding: job.embedding }))
    })
    return new Map(results.map((result) => [result.jobId, result]))
  })
}

// The fields jobMatches needs to rank, filter (search/skill) and paginate every job - the
// description and embedding stay out of it, and the page's full rows are loaded afterwards
// by hydrateJobMatches.
export type ScoredJob = {
  id: string
  title: string
  company: string
  requiredSkills: string[]
  semanticScore: number
  collaborativeScore: number
  hybridScore: number
}

// Every non-hidden job with its score, best match first. Saved and dismissed jobs are
// excluded before scoring so they're never scored (or cached) for nothing.
export async function computeScoredJobs(userId: string): Promise<ScoredJob[]> {
  const [jobs, savedJobs, dismissedInteractions] = await Promise.all([
    prisma.job.findMany({
      where: { deleted: false },
      select: { id: true, title: true, company: true, requiredSkills: true },
      // Without a tiebreaker, equal scores come back in whatever order Postgres returns them,
      // so a job could appear on two pages (or none) as the user pages through.
      orderBy: { id: 'asc' }
    }),
    prisma.savedJob.findMany({ where: { userId, deleted: false }, select: { jobId: true } }),
    prisma.interaction.findMany({
      where: { userId, deleted: false, eventType: 'dismiss' },
      select: { jobId: true }
    })
  ])

  // Saved jobs move to the Applications page and dismissed jobs are a negative signal —
  // neither belongs in the browse list anymore, otherwise Save/Dismiss appear to do nothing.
  const hiddenJobIds = new Set([
    ...savedJobs.map((savedJob) => savedJob.jobId),
    ...dismissedInteractions.map((interaction) => interaction.jobId)
  ])
  const visibleJobs = jobs.filter((job) => !hiddenJobIds.has(job.id))

  const scoresByJobId = await scoreJobs(
    userId,
    visibleJobs.map((job) => job.id)
  )

  const scoredJobs: ScoredJob[] = []
  for (const job of visibleJobs) {
    const scores = scoresByJobId.get(job.id)
    if (!scores) continue
    scoredJobs.push({
      id: job.id,
      title: job.title,
      company: job.company,
      requiredSkills: job.requiredSkills,
      semanticScore: scores.semanticScore,
      collaborativeScore: scores.collaborativeScore,
      hybridScore: scores.hybridScore
    })
  }

  return scoredJobs.sort((a, b) => b.hybridScore - a.hybridScore)
}

// Loads the full job rows for just the page being returned, in the page's own order -
// the one place jobMatches reads descriptions and URLs, for ~15 jobs instead of the catalog.
export async function hydrateJobMatches(scoredJobs: ScoredJob[]): Promise<JobMatch[]> {
  if (scoredJobs.length === 0) return []

  const jobs = await prisma.job.findMany({
    where: { id: { in: scoredJobs.map((scoredJob) => scoredJob.id) }, deleted: false },
    select: {
      id: true,
      platformJobId: true,
      platform: true,
      title: true,
      company: true,
      description: true,
      requiredSkills: true,
      url: true,
      sourceName: true
    }
  })
  const jobsById = new Map(jobs.map((job) => [job.id, job]))

  const matches: JobMatch[] = []
  for (const scoredJob of scoredJobs) {
    const job = jobsById.get(scoredJob.id)
    if (!job) continue
    matches.push({
      job,
      semanticScore: scoredJob.semanticScore,
      collaborativeScore: scoredJob.collaborativeScore,
      hybridScore: scoredJob.hybridScore
    } as JobMatch)
  }
  return matches
}

// Scores only the given jobs (e.g. a user's saved jobs) instead of every ingested job like
// computeScoredJobs — cheap even though scores are cached, since saved-job lists are small
// and this runs on every Applications page load. The caller already filtered out deleted jobs.
export async function computeHybridScoresByJobId(userId: string, jobIds: string[]): Promise<Map<string, number>> {
  if (jobIds.length === 0) return new Map()

  const scoresByJobId = await scoreJobs(userId, jobIds)

  return new Map(Array.from(scoresByJobId, ([jobId, scores]) => [jobId, scores.hybridScore]))
}

const MAX_INSIGHT_RETRIES = 2

// Gemini-backed, so transient 429/5xx responses are worth a couple of retries rather than
// failing the dialog outright — same retry/backoff shape as the resume parser's.
async function requestMatchInsightWithRetry(request: MatchInsightRequest): Promise<MatchInsightResponse> {
  let lastError: unknown
  for (let attempt = 0; attempt <= MAX_INSIGHT_RETRIES; attempt++) {
    try {
      return await requestMatchInsight(request)
    } catch (error) {
      lastError = error
      const retryable = error instanceof MlServiceError && (error.status === 429 || error.status >= 500)
      if (!retryable || attempt === MAX_INSIGHT_RETRIES) break
      const backoffMs = 500 * 2 ** attempt + Math.random() * 250
      await new Promise((resolve) => setTimeout(resolve, backoffMs))
    }
  }
  throw lastError
}

// Generated once per (userId, jobId) and persisted — later dialog opens for the same job
// reuse the stored row instead of paying for another Gemini call. Invalidated (soft-
// deleted) by completeOnboarding whenever skillsText changes, since the explanation and
// matching/missing skills are grounded in that snapshot.
export async function getJobMatchInsight(userId: string, jobId: string): Promise<MatchInsight> {
  const job = await prisma.job.findFirstOrThrow({ where: { id: jobId, deleted: false } })

  const existing = await prisma.matchInsight.findUnique({
    where: { userId_jobId: { userId, jobId: job.id } }
  })
  if (existing && !existing.deleted) {
    return {
      semanticScore: existing.semanticScore,
      collaborativeScore: existing.collaborativeScore,
      hybridScore: existing.hybridScore,
      requiredSkillsCount: existing.requiredSkillsCount,
      interactionCount: existing.interactionCount,
      collaborativeWeight: existing.collaborativeWeight,
      skillsReason: existing.skillsReason,
      activityReason: existing.activityReason,
      matchingSkills: existing.matchingSkills,
      missingSkills: existing.missingSkills,
      explanation: existing.explanation
    }
  }

  const [profile, interactionCount] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.interaction.count({ where: { userId, deleted: false } })
  ])

  const userEmbedding = resolveUserEmbedding(profile)
  const scoresByJobId = await getOrSetMatchScores(userId, [job.id], async () => {
    const score = await recommend({
      userId,
      jobId: job.id,
      userEmbedding,
      jobEmbedding: job.embedding,
      userInteractionCount: interactionCount
    })
    return new Map([[job.id, score]])
  })
  const scores = scoresByJobId.get(job.id)!

  const insight = await requestMatchInsightWithRetry({
    jobTitle: job.title,
    jobCompany: job.company,
    jobDescription: job.description,
    jobRequiredSkills: job.requiredSkills,
    userSkillsText: profile?.skillsText ?? '',
    semanticScore: scores.semanticScore,
    collaborativeScore: scores.collaborativeScore,
    hybridScore: scores.hybridScore
  })

  const result: MatchInsight = {
    semanticScore: scores.semanticScore,
    collaborativeScore: scores.collaborativeScore,
    hybridScore: scores.hybridScore,
    requiredSkillsCount: job.requiredSkills.length,
    interactionCount,
    collaborativeWeight: scores.collaborativeWeight,
    skillsReason: insight.skillsReason,
    activityReason: insight.activityReason,
    matchingSkills: insight.matchingSkills,
    missingSkills: insight.missingSkills,
    explanation: insight.explanation
  }

  await prisma.matchInsight
    .upsert({
      where: { userId_jobId: { userId, jobId: job.id } },
      update: { ...result, deleted: false },
      create: { userId, jobId: job.id, ...result }
    })
    .catch((error) => logger.warn({ error }, 'Failed to persist match insight'))

  return result
}
