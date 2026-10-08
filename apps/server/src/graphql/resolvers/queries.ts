import { MATCH_SCORE_THRESHOLDS } from '@angkop/shared'
import { prisma } from '../../lib/prisma'
import { skillGap as skillGapRequest } from '../../lib/ml-client'
import { logger } from '../../lib/logger'
import {
  DEFAULT_JOB_MATCHES_PAGE_SIZE,
  DEFAULT_SKILL_GAPS_PAGE_SIZE,
  MAX_JOB_MATCHES_PAGE_SIZE,
  MAX_SKILL_GAPS_PAGE_SIZE
} from './constants'
import {
  computeHybridScoresByJobId,
  computeJobMatches,
  getJobMatchInsight,
  loadProfileForMe,
  serializeSavedJob
} from './helpers'
import type { GraphQLContext } from './types'

type JobMatchesArgs = {
  page?: number | null
  pageSize?: number | null
  search?: string | null
  skill?: string | null
}

type SkillGapsArgs = {
  page?: number | null
  pageSize?: number | null
}

export const queryResolvers = {
  me: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
    const user = await prisma.user.findFirstOrThrow({ where: { id: context.userId, deleted: false } })
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      profile: await loadProfileForMe(context.userId)
    }
  },

  jobMatches: async (_parent: unknown, args: JobMatchesArgs, context: GraphQLContext) => {
    const [allMatches, savedJobs, dismissedInteractions] = await Promise.all([
      computeJobMatches(context.userId),
      prisma.savedJob.findMany({
        where: { userId: context.userId, deleted: false },
        select: { jobId: true }
      }),
      prisma.interaction.findMany({
        where: { userId: context.userId, deleted: false, eventType: 'dismiss' },
        select: { jobId: true }
      })
    ])
    // Saved jobs move to the Applications page and dismissed jobs are a negative signal —
    // neither belongs in the browse list anymore, otherwise Save/Dismiss appear to do nothing.
    const hiddenJobIds = new Set([
      ...savedJobs.map((savedJob) => savedJob.jobId),
      ...dismissedInteractions.map((interaction) => interaction.jobId)
    ])
    const visibleMatches = allMatches.filter((match) => !hiddenJobIds.has(match.job.id))
    const strongMatchCount = visibleMatches.filter(
      (match) => match.hybridScore >= MATCH_SCORE_THRESHOLDS.STRONG
    ).length

    const search = args.search?.trim().toLowerCase()
    const skill = args.skill?.trim()
    const filtered = visibleMatches
      .filter((match) =>
        search
          ? match.job.title.toLowerCase().includes(search) ||
            match.job.company.toLowerCase().includes(search) ||
            match.job.requiredSkills.some((jobSkill) => jobSkill.toLowerCase().includes(search))
          : true
      )
      .filter((match) => (skill ? match.job.requiredSkills.includes(skill) : true))

    const page = Math.max(1, args.page ?? 1)
    const pageSize = Math.min(Math.max(1, args.pageSize ?? DEFAULT_JOB_MATCHES_PAGE_SIZE), MAX_JOB_MATCHES_PAGE_SIZE)
    const start = (page - 1) * pageSize

    return {
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
      strongMatchCount
    }
  },

  jobMatchInsight: async (_parent: unknown, args: { jobId: string }, context: GraphQLContext) => {
    return getJobMatchInsight(context.userId, args.jobId)
  },

  skillGaps: async (_parent: unknown, args: SkillGapsArgs, context: GraphQLContext) => {
    const [savedJobs, userSkills] = await Promise.all([
      prisma.savedJob.findMany({
        where: { userId: context.userId, deleted: false, job: { deleted: false } },
        include: { job: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.userSkill.findMany({
        where: { userId: context.userId, deleted: false },
        include: { skill: true }
      })
    ])

    const jobRequiredSkills = Array.from(new Set(savedJobs.flatMap((savedJob) => savedJob.job.requiredSkills)))

    if (jobRequiredSkills.length === 0) {
      return { items: [], total: 0 }
    }

    const result = await skillGapRequest({
      userSkills: userSkills.map((userSkill) => userSkill.skill.name),
      jobRequiredSkills
    })

    if (savedJobs[0]) {
      await Promise.all(
        result.missingSkills.map((gap) =>
          prisma.skillGapRecord.create({
            data: {
              userId: context.userId,
              jobId: savedJobs[0].job.id,
              skill: gap.skill,
              confidence: gap.confidence,
              courses: gap.courses
            }
          })
        )
      ).catch((error) => logger.warn({ error }, 'Failed to persist skill gap records'))
    }

    const page = Math.max(1, args.page ?? 1)
    const pageSize = Math.min(Math.max(1, args.pageSize ?? DEFAULT_SKILL_GAPS_PAGE_SIZE), MAX_SKILL_GAPS_PAGE_SIZE)
    const start = (page - 1) * pageSize

    return {
      items: result.missingSkills.slice(start, start + pageSize),
      total: result.missingSkills.length
    }
  },

  savedJobCount: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
    return prisma.savedJob.count({
      where: { userId: context.userId, deleted: false, job: { deleted: false } }
    })
  },

  savedJobs: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
    const savedJobs = await prisma.savedJob.findMany({
      where: { userId: context.userId, deleted: false, job: { deleted: false } },
      include: { job: true },
      orderBy: { createdAt: 'desc' }
    })
    const scoresByJobId = await computeHybridScoresByJobId(
      context.userId,
      savedJobs.map((savedJob) => savedJob.jobId)
    )
    return savedJobs.map((savedJob) => serializeSavedJob(savedJob, scoresByJobId.get(savedJob.jobId) ?? 0))
  },

  savedCourses: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
    return prisma.savedCourse.findMany({
      where: { userId: context.userId, deleted: false },
      orderBy: { createdAt: 'desc' }
    })
  }
}
