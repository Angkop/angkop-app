import { prisma } from '../../lib/prisma'
import { skillGap as skillGapRequest } from '../../lib/ml-client'
import { logger } from '../../lib/logger'
import { TOP_JOBS_FOR_SKILL_GAP } from './constants'
import { computeJobMatches, loadProfileForMe, serializeSavedJob } from './helpers'
import type { GraphQLContext } from './types'

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

  jobMatches: (_parent: unknown, _args: unknown, context: GraphQLContext) => computeJobMatches(context.userId),

  skillGaps: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
    const [matches, userSkills] = await Promise.all([
      computeJobMatches(context.userId),
      prisma.userSkill.findMany({
        where: { userId: context.userId, deleted: false },
        include: { skill: true }
      })
    ])

    const topJobs = matches.slice(0, TOP_JOBS_FOR_SKILL_GAP).map((match) => match.job)
    const jobRequiredSkills = Array.from(new Set(topJobs.flatMap((job) => job.requiredSkills)))

    if (jobRequiredSkills.length === 0) {
      return []
    }

    const result = await skillGapRequest({
      userSkills: userSkills.map((userSkill) => userSkill.skill.name),
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
}
