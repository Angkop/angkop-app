import {
  INTERACTION_WEIGHTS,
  type ApplicationStatus,
  type InteractionEventType,
  type JobMatch
} from '@angkop/shared'
import { prisma } from '../../lib/prisma'
import { getOrSetMatchScore, invalidateMatchScoresForUser } from '../../lib/redis'
import { recommend, skillGap as skillGapRequest } from '../../lib/ml-client'
import { mapWithConcurrency } from '../../lib/concurrency'
import { logger } from '../../lib/logger'

const VALID_EVENT_TYPES: InteractionEventType[] = ['view', 'save', 'apply', 'dismiss']
const TOP_JOBS_FOR_SKILL_GAP = 3
// The ML service serializes its actual model calls (see ml/app/services/embedder.py), so
// firing more requests at once than that just makes them queue on the Express side instead
// — this keeps a request from timing out while waiting behind a big backlog.
const ML_REQUEST_CONCURRENCY = 3

export type GraphQLContext = {
  userId: string
}

type SavedJobWithJob = {
  id: number
  job: {
    id: string
    platformJobId: string
    platform: string
    title: string
    company: string
    description: string
    requiredSkills: string[]
    url: string
  }
  status: string
  tags: string[]
  interviewDate: Date | null
  createdAt: Date
}

function serializeSavedJob(savedJob: SavedJobWithJob) {
  return {
    id: savedJob.id,
    job: savedJob.job,
    status: savedJob.status,
    tags: savedJob.tags,
    interviewDate: savedJob.interviewDate ? savedJob.interviewDate.toISOString() : null,
    createdAt: savedJob.createdAt.toISOString()
  }
}

async function computeJobMatches(userId: string): Promise<JobMatch[]> {
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

export const resolvers = {
  Query: {
    me: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      const user = await prisma.user.findFirstOrThrow({ where: { id: context.userId, deleted: false } })
      const profile = await prisma.userProfile.findUnique({
        where: { userId: context.userId },
        include: {
          education: { where: { deleted: false } },
          experience: { where: { deleted: false } }
        }
      })
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        profile: profile
          ? {
              id: profile.id,
              skills: profile.skills,
              skillsText: profile.skillsText,
              desiredRole: profile.desiredRole,
              location: profile.location,
              education: profile.education,
              experience: profile.experience
            }
          : null
      }
    },

    jobMatches: (_parent: unknown, _args: unknown, context: GraphQLContext) => computeJobMatches(context.userId),

    skillGaps: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      const [matches, profile] = await Promise.all([
        computeJobMatches(context.userId),
        prisma.userProfile.findUnique({ where: { userId: context.userId } })
      ])

      const topJobs = matches.slice(0, TOP_JOBS_FOR_SKILL_GAP).map((match) => match.job)
      const jobRequiredSkills = Array.from(new Set(topJobs.flatMap((job) => job.requiredSkills)))

      if (jobRequiredSkills.length === 0) {
        return []
      }

      const result = await skillGapRequest({
        userSkills: profile?.skills ?? [],
        jobRequiredSkills
      })

      if (topJobs[0]) {
        await Promise.all(
          result.missingSkills.map((gap) =>
            prisma.skillGapRecord.create({
              data: {
                userId: context.userId,
                jobId: topJobs[0].id,
                skill: gap.skill,
                confidence: gap.confidence,
                courses: gap.courses
              }
            })
          )
        ).catch((error) => logger.warn({ error }, 'Failed to persist skill gap records'))
      }

      return result.missingSkills
    },

    savedJobs: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      const savedJobs = await prisma.savedJob.findMany({
        where: { userId: context.userId, deleted: false, job: { deleted: false } },
        include: { job: true },
        orderBy: { createdAt: 'desc' }
      })
      return savedJobs.map(serializeSavedJob)
    },

    savedCourses: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      return prisma.savedCourse.findMany({
        where: { userId: context.userId, deleted: false },
        orderBy: { createdAt: 'desc' }
      })
    }
  },

  Mutation: {
    updateProfile: async (
      _parent: unknown,
      args: { input: { skills: string[]; skillsText: string } },
      context: GraphQLContext
    ) => {
      const profile = await prisma.userProfile.upsert({
        where: { userId: context.userId },
        update: { skills: args.input.skills, skillsText: args.input.skillsText },
        create: {
          userId: context.userId,
          skills: args.input.skills,
          skillsText: args.input.skillsText,
          embedding: []
        },
        include: {
          education: { where: { deleted: false } },
          experience: { where: { deleted: false } }
        }
      })

      // Skills/skillsText feed straight into the semantic score, so cached scores from
      // before this edit are now wrong for every job, not just one.
      await invalidateMatchScoresForUser(context.userId)

      return {
        id: profile.id,
        skills: profile.skills,
        skillsText: profile.skillsText,
        desiredRole: profile.desiredRole,
        location: profile.location,
        education: profile.education,
        experience: profile.experience
      }
    },

    logInteraction: async (
      _parent: unknown,
      args: { jobId: string; eventType: string },
      context: GraphQLContext
    ) => {
      if (!VALID_EVENT_TYPES.includes(args.eventType as InteractionEventType)) {
        throw new Error(`eventType must be one of ${VALID_EVENT_TYPES.join(', ')}`)
      }

      const job = await prisma.job.findFirstOrThrow({ where: { id: args.jobId, deleted: false } })
      await prisma.interaction.create({
        data: {
          userId: context.userId,
          jobId: job.id,
          eventType: args.eventType,
          weight: INTERACTION_WEIGHTS[args.eventType as InteractionEventType],
          platform: job.platform
        }
      })

      // Interaction count feeds the collaborative/semantic blend weight (see
      // ml/app/routers/recommendations.py), so it affects every job's hybrid score, not
      // just this one.
      await invalidateMatchScoresForUser(context.userId)

      return true
    },

    saveJob: async (_parent: unknown, args: { jobId: string }, context: GraphQLContext) => {
      const job = await prisma.job.findFirstOrThrow({ where: { id: args.jobId, deleted: false } })

      const savedJob = await prisma.savedJob.upsert({
        where: { userId_jobId: { userId: context.userId, jobId: job.id } },
        update: { deleted: false },
        create: { userId: context.userId, jobId: job.id },
        include: { job: true }
      })

      // Saving also counts as the existing 'save' interaction signal the NCF model trains
      // on, so this records both instead of making the frontend call two mutations.
      await prisma.interaction.create({
        data: {
          userId: context.userId,
          jobId: job.id,
          eventType: 'save',
          weight: INTERACTION_WEIGHTS.save,
          platform: job.platform
        }
      })
      await invalidateMatchScoresForUser(context.userId)

      return serializeSavedJob(savedJob)
    },

    unsaveJob: async (_parent: unknown, args: { jobId: string }, context: GraphQLContext) => {
      await prisma.savedJob.updateMany({
        where: { userId: context.userId, jobId: args.jobId, deleted: false },
        data: { deleted: true }
      })
      return true
    },

    updateSavedJobStatus: async (
      _parent: unknown,
      args: { jobId: string; status: ApplicationStatus },
      context: GraphQLContext
    ) => {
      const savedJob = await prisma.savedJob.update({
        where: { userId_jobId: { userId: context.userId, jobId: args.jobId } },
        data: { status: args.status },
        include: { job: true }
      })
      return serializeSavedJob(savedJob)
    },

    setSavedJobInterviewDate: async (
      _parent: unknown,
      args: { jobId: string; interviewDate: string | null },
      context: GraphQLContext
    ) => {
      const savedJob = await prisma.savedJob.update({
        where: { userId_jobId: { userId: context.userId, jobId: args.jobId } },
        data: { interviewDate: args.interviewDate ? new Date(args.interviewDate) : null },
        include: { job: true }
      })
      return serializeSavedJob(savedJob)
    },

    addSavedJobTag: async (
      _parent: unknown,
      args: { jobId: string; tag: string },
      context: GraphQLContext
    ) => {
      const existing = await prisma.savedJob.findUniqueOrThrow({
        where: { userId_jobId: { userId: context.userId, jobId: args.jobId } }
      })
      const tags = existing.tags.includes(args.tag) ? existing.tags : [...existing.tags, args.tag]
      const savedJob = await prisma.savedJob.update({
        where: { userId_jobId: { userId: context.userId, jobId: args.jobId } },
        data: { tags },
        include: { job: true }
      })
      return serializeSavedJob(savedJob)
    },

    removeSavedJobTag: async (
      _parent: unknown,
      args: { jobId: string; tag: string },
      context: GraphQLContext
    ) => {
      const existing = await prisma.savedJob.findUniqueOrThrow({
        where: { userId_jobId: { userId: context.userId, jobId: args.jobId } }
      })
      const savedJob = await prisma.savedJob.update({
        where: { userId_jobId: { userId: context.userId, jobId: args.jobId } },
        data: { tags: existing.tags.filter((tag: string) => tag !== args.tag) },
        include: { job: true }
      })
      return serializeSavedJob(savedJob)
    },

    saveCourse: async (
      _parent: unknown,
      args: { title: string; provider: string; url: string },
      context: GraphQLContext
    ) => {
      return prisma.savedCourse.upsert({
        where: { userId_url: { userId: context.userId, url: args.url } },
        update: { deleted: false, title: args.title, provider: args.provider },
        create: { userId: context.userId, title: args.title, provider: args.provider, url: args.url }
      })
    },

    unsaveCourse: async (_parent: unknown, args: { url: string }, context: GraphQLContext) => {
      await prisma.savedCourse.updateMany({
        where: { userId: context.userId, url: args.url, deleted: false },
        data: { deleted: true }
      })
      return true
    }
  }
}
