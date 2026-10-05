import type { JobMatch } from '@angkop/shared'
import { prisma } from '../../lib/prisma'
import { getOrSetMatchScore } from '../../lib/redis'
import { recommend } from '../../lib/ml-client'
import { mapWithConcurrency } from '../../lib/concurrency'
import { ML_REQUEST_CONCURRENCY } from './constants'
import type { ProjectInput, SavedJobWithJob, WorkExperienceInput } from './types'

export function serializeSavedJob(savedJob: SavedJobWithJob) {
  return {
    id: savedJob.id,
    job: savedJob.job,
    status: savedJob.status,
    tags: savedJob.tags,
    interviewDate: savedJob.interviewDate ? savedJob.interviewDate.toISOString() : null,
    createdAt: savedJob.createdAt.toISOString()
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
        url: job.url
      },
      semanticScore: scores.semanticScore,
      collaborativeScore: scores.collaborativeScore,
      hybridScore: scores.hybridScore
    } as JobMatch
  })

  return matches.sort((a, b) => b.hybridScore - a.hybridScore)
}
