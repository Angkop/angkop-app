import type { JobMatch, MatchInsight, MatchInsightRequest, MatchInsightResponse } from '@angkop/shared'
import { prisma } from '../../lib/prisma'
import { getOrSetMatchScore } from '../../lib/redis'
import { MlServiceError, matchInsight as requestMatchInsight, recommend } from '../../lib/ml-client'
import { mapWithConcurrency } from '../../lib/concurrency'
import { logger } from '../../lib/logger'
import { ML_REQUEST_CONCURRENCY } from './constants'
import type { ProjectInput, SavedJobWithJob, WorkExperienceInput } from './types'

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
  experience: WorkExperienceInput[]
  projects: ProjectInput[]
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
  for (const project of input.projects) {
    parts.push(`${project.name}: ${project.description}`)
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

export async function computeJobMatches(userId: string): Promise<JobMatch[]> {
  const [jobs, profile, interactionCount] = await Promise.all([
    prisma.job.findMany({ where: { deleted: false } }),
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.interaction.count({ where: { userId, deleted: false } })
  ])

  const matches = await mapWithConcurrency(jobs, ML_REQUEST_CONCURRENCY, async (job) => {
    const scores = await getOrSetMatchScore(userId, job.id, () =>
      recommend({
        userId,
        jobId: job.id,
        userSkillsText: profile?.skillsText ?? '',
        jobText: `${job.title}. ${job.description}`,
        userInteractionCount: interactionCount
      })
    )

    return {
      job: {
        id: job.id,
        platformJobId: job.platformJobId,
        platform: job.platform,
        title: job.title,
        company: job.company,
        description: job.description,
        requiredSkills: job.requiredSkills,
        url: job.url,
        sourceName: job.sourceName
      },
      semanticScore: scores.semanticScore,
      collaborativeScore: scores.collaborativeScore,
      hybridScore: scores.hybridScore
    } as JobMatch
  })

  return matches.sort((a, b) => b.hybridScore - a.hybridScore)
}

// Scores only the given jobs (e.g. a user's saved jobs) instead of every ingested job like
// computeJobMatches — cheap even though scores are cached, since saved-job lists are small
// and this runs on every Applications page load.
export async function computeHybridScoresByJobId(userId: string, jobIds: string[]): Promise<Map<string, number>> {
  if (jobIds.length === 0) return new Map()

  const [jobs, profile, interactionCount] = await Promise.all([
    prisma.job.findMany({ where: { id: { in: jobIds }, deleted: false } }),
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.interaction.count({ where: { userId, deleted: false } })
  ])

  const entries = await mapWithConcurrency(jobs, ML_REQUEST_CONCURRENCY, async (job) => {
    const scores = await getOrSetMatchScore(userId, job.id, () =>
      recommend({
        userId,
        jobId: job.id,
        userSkillsText: profile?.skillsText ?? '',
        jobText: `${job.title}. ${job.description}`,
        userInteractionCount: interactionCount
      })
    )
    return [job.id, scores.hybridScore] as const
  })

  return new Map(entries)
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

  const scores = await getOrSetMatchScore(userId, job.id, () =>
    recommend({
      userId,
      jobId: job.id,
      userSkillsText: profile?.skillsText ?? '',
      jobText: `${job.title}. ${job.description}`,
      userInteractionCount: interactionCount
    })
  )

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
