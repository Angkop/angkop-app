import { APPLICATION_STATUS_ORDER, MATCH_SCORE_THRESHOLDS, type Course } from '@angkop/shared'
import { prisma } from '../../lib/prisma'
import { skillGap as skillGapRequest } from '../../lib/ml-client'
import { getOrSetSkillGaps } from '../../lib/redis'
import { logger } from '../../lib/logger'
import type { ApplicationStatus } from '@angkop/shared'
import {
  DEFAULT_JOB_MATCHES_PAGE_SIZE,
  DEFAULT_SAVED_JOBS_PAGE_SIZE,
  DEFAULT_SKILL_GAPS_PAGE_SIZE,
  IN_PROGRESS_SAVED_JOB_STATUSES,
  MAX_JOB_MATCHES_PAGE_SIZE,
  MAX_SAVED_JOBS_PAGE_SIZE,
  MAX_SKILL_GAPS_PAGE_SIZE
} from './constants'
import {
  computeHybridScoresByJobId,
  computeScoredJobs,
  getJobMatchInsight,
  hydrateJobMatches,
  loadProfileForMe,
  serializeSavedJob
} from './helpers'
import type { GraphQLContext } from './types'

const IN_PROGRESS_STATUS_SET = new Set<ApplicationStatus>(IN_PROGRESS_SAVED_JOB_STATUSES)

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

type SavedJobsArgs = {
  page?: number | null
  pageSize?: number | null
  status?: ApplicationStatus | null
}

export const queryResolvers = {
  me: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
    const user = await prisma.user.findFirstOrThrow({ where: { id: context.userId, deleted: false } })
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      // A function, not an awaited value: graphql-js's default field resolver calls it only
      // when the query actually selects `profile`. Awaiting it here ran the profile's ~8
      // queries on every page, because AppShellMe (email + name only) hits this resolver too.
      profile: () => loadProfileForMe(context.userId)
    }
  },

  jobMatches: async (_parent: unknown, args: JobMatchesArgs, context: GraphQLContext) => {
    // Saved and dismissed jobs are already excluded here (see computeScoredJobs).
    const allMatches = await computeScoredJobs(context.userId)
    // Below MINIMUM the match is too weak to be worth showing at all — excluded from the
    // browse list entirely, not just styled differently like the STRONG/PARTIAL labels.
    const visibleMatches = allMatches.filter((match) => match.hybridScore >= MATCH_SCORE_THRESHOLDS.MINIMUM)
    const strongMatchCount = visibleMatches.filter(
      (match) => match.hybridScore >= MATCH_SCORE_THRESHOLDS.STRONG
    ).length

    const search = args.search?.trim().toLowerCase()
    const skill = args.skill?.trim()
    const filtered = visibleMatches
      .filter((match) =>
        search
          ? match.title.toLowerCase().includes(search) ||
            match.company.toLowerCase().includes(search) ||
            match.requiredSkills.some((jobSkill) => jobSkill.toLowerCase().includes(search))
          : true
      )
      .filter((match) => (skill ? match.requiredSkills.includes(skill) : true))

    const page = Math.max(1, args.page ?? 1)
    const pageSize = Math.min(Math.max(1, args.pageSize ?? DEFAULT_JOB_MATCHES_PAGE_SIZE), MAX_JOB_MATCHES_PAGE_SIZE)
    const start = (page - 1) * pageSize

    return {
      items: await hydrateJobMatches(context.userId, filtered.slice(start, start + pageSize)),
      total: filtered.length,
      strongMatchCount
    }
  },

  jobMatchInsight: async (_parent: unknown, args: { jobId: string }, context: GraphQLContext) => {
    return getJobMatchInsight(context.userId, args.jobId)
  },

  skillGaps: async (_parent: unknown, args: SkillGapsArgs, context: GraphQLContext) => {
    // Everything inside this closure only runs on a cache miss - a genuine recompute after
    // a saved job or a skill actually changed (see invalidateSkillGapsForUser call sites).
    // A cache hit must stay a single Redis round trip with no Postgres reads at all, or the
    // frontend's "is this a real recompute" timing heuristic (RECOMPUTE_REVEAL_DELAY_MS)
    // sees a slow response even when nothing changed.
    const result = await getOrSetSkillGaps(context.userId, async () => {
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
        return { missingSkills: [] }
      }

      const computed = await skillGapRequest({
        userSkills: userSkills.map((userSkill) => userSkill.skill.name),
        jobRequiredSkills
      })

      if (savedJobs[0] && computed.missingSkills.length > 0) {
        // One create() per missing skill in parallel used to mean N round trips to
        // Postgres on every cache-miss recompute - createMany sends every row in a
        // single statement regardless of how many missing skills come back.
        const jobId = savedJobs[0].job.id
        const data: {
          userId: string
          jobId: string
          skill: string
          confidence: number
          courses: Course[]
        }[] = []
        for (const gap of computed.missingSkills) {
          data.push({
            userId: context.userId,
            jobId,
            skill: gap.skill,
            confidence: gap.confidence,
            courses: gap.courses
          })
        }
        // skipDuplicates backed by SkillGapRecord's @@unique([userId, jobId, skill]) -
        // a recompute after a cache miss shouldn't pile up repeat rows for a skill that
        // was already recorded against this saved job.
        await prisma.skillGapRecord
          .createMany({ data, skipDuplicates: true })
          .catch((error) => logger.warn({ error }, 'Failed to persist skill gap records'))
      }

      return computed
    })

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

  // Just the ids — lets a page (e.g. /listings, which is public/unauthenticated) show
  // which jobs the signed-in viewer already saved, without paying for savedJobs' hybrid
  // score computation when all that's needed is "is this one bookmarked".
  savedJobIds: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
    const savedJobs = await prisma.savedJob.findMany({
      where: { userId: context.userId, deleted: false, job: { deleted: false } },
      select: { jobId: true }
    })
    return savedJobs.map((savedJob) => savedJob.jobId)
  },

  savedJobs: async (_parent: unknown, args: SavedJobsArgs, context: GraphQLContext) => {
    const where = {
      userId: context.userId,
      deleted: false,
      job: { deleted: false },
      ...(args.status ? { status: args.status } : {})
    }

    const page = Math.max(1, args.page ?? 1)
    const pageSize = Math.min(Math.max(1, args.pageSize ?? DEFAULT_SAVED_JOBS_PAGE_SIZE), MAX_SAVED_JOBS_PAGE_SIZE)

    const [savedJobs, total] = await Promise.all([
      prisma.savedJob.findMany({
        where,
        include: { job: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.savedJob.count({ where })
    ])

    const scoresByJobId = await computeHybridScoresByJobId(
      context.userId,
      savedJobs.map((savedJob) => savedJob.jobId)
    )

    return {
      items: savedJobs.map((savedJob) => serializeSavedJob(savedJob, scoresByJobId.get(savedJob.jobId) ?? 0)),
      total
    }
  },

  // Independent of the list's current page/status filter — always the full picture, since
  // that's what the stats row is for.
  savedJobStats: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
    const baseWhere = { userId: context.userId, deleted: false, job: { deleted: false } }
    // Two queries, not one count per figure: each Promise.all branch holds a connection from a
    // small pool (connection_limit in DATABASE_URL), and the dashboard loads this alongside
    // other queries. total, inProgress and successful are all sums of the per-status counts.
    const [statusGroups, upcomingInterviews] = await Promise.all([
      prisma.savedJob.groupBy({ by: ['status'], where: baseWhere, _count: { _all: true } }),
      prisma.savedJob.count({ where: { ...baseWhere, interviewDate: { not: null } } })
    ])
    const countsByStatus = new Map<string, number>(statusGroups.map((group) => [group.status, group._count._all]))
    const statusCounts = APPLICATION_STATUS_ORDER.map((status) => ({
      status,
      count: countsByStatus.get(status) ?? 0
    }))

    let total = 0
    let inProgress = 0
    for (const { status, count } of statusCounts) {
      total += count
      if (IN_PROGRESS_STATUS_SET.has(status)) inProgress += count
    }
    const successful = countsByStatus.get('SUCCESSFUL') ?? 0

    return { total, inProgress, upcomingInterviews, successful, statusCounts }
  },

  // "Jobs applied" on the profile page — any saved job that's moved past PENDING.
  appliedJobCount: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
    return prisma.savedJob.count({
      where: { userId: context.userId, deleted: false, job: { deleted: false }, status: { not: 'PENDING' } }
    })
  },

  savedCourses: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
    return prisma.savedCourse.findMany({
      where: { userId: context.userId, deleted: false },
      orderBy: { createdAt: 'desc' }
    })
  }
}
