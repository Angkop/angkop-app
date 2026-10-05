import {
  INTERACTION_WEIGHTS,
  type ApplicationStatus,
  type CareerLevel,
  type EmploymentType,
  type InteractionEventType,
  type JobMatch,
  type LanguageProficiency,
  type SkillLevel,
  type WorkSetup
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

type ProfileSkillInput = {
  name: string
  category?: string | null
  level?: SkillLevel | null
  years?: number | null
}

type EducationInput = {
  school: string
  degree?: string | null
  fieldOfStudy?: string | null
  startYear?: number | null
  endYear?: number | null
  description?: string | null
}

type WorkExperienceInput = {
  title: string
  company: string
  location?: string | null
  employmentType?: EmploymentType | null
  description?: string | null
  startDate: string
  endDate?: string | null
  current?: boolean | null
}

type CertificationInput = {
  name: string
  issuer: string
  issueDate?: string | null
  expirationDate?: string | null
  credentialId?: string | null
  credentialUrl?: string | null
}

type ProjectInput = {
  name: string
  description: string
  technologies: string[]
  url?: string | null
  startDate?: string | null
  endDate?: string | null
}

type LanguageInput = {
  language: string
  proficiency?: LanguageProficiency | null
}

type UserPreferenceInput = {
  desiredRoles: string[]
  preferredLocations: string[]
  preferredJobTypes: EmploymentType[]
  preferredIndustries: string[]
  workSetup?: WorkSetup | null
  minimumSalary?: number | null
  maximumSalary?: number | null
  willingToRelocate: boolean
  willingToRemote: boolean
}

type CompleteOnboardingInput = {
  headline?: string | null
  about?: string | null
  location?: string | null
  careerLevel?: CareerLevel | null
  resumeFileName?: string | null
  skills: ProfileSkillInput[]
  education: EducationInput[]
  experience: WorkExperienceInput[]
  certifications: CertificationInput[]
  projects: ProjectInput[]
  languages: LanguageInput[]
  preferences: UserPreferenceInput
}

function buildSkillsText(input: {
  headline?: string | null
  about?: string | null
  careerLevel?: string | null
  skills: ProfileSkillInput[]
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

async function loadProfileForMe(userId: string) {
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
  },

  Mutation: {
    completeOnboarding: async (
      _parent: unknown,
      args: { input: CompleteOnboardingInput },
      context: GraphQLContext
    ) => {
      const input = args.input

      const skills = input.skills.filter((skill) => skill.name.trim().length > 0)
      const education = input.education.filter((entry) => entry.school.trim().length > 0)
      const experience = input.experience.filter(
        (entry) => entry.title.trim().length > 0 && entry.company.trim().length > 0 && entry.startDate
      )
      const certifications = input.certifications.filter(
        (entry) => entry.name.trim().length > 0 && entry.issuer.trim().length > 0
      )
      const projects = input.projects.filter(
        (entry) => entry.name.trim().length > 0 && entry.description.trim().length > 0
      )
      const languages = input.languages.filter((entry) => entry.language.trim().length > 0)

      const skillsText = buildSkillsText({
        headline: input.headline,
        about: input.about,
        careerLevel: input.careerLevel,
        skills,
        experience,
        projects
      })

      await prisma.$transaction(async (tx) => {
        const profile = await tx.userProfile.upsert({
          where: { userId: context.userId },
          update: {
            headline: input.headline ?? null,
            about: input.about ?? null,
            location: input.location ?? null,
            careerLevel: input.careerLevel ?? null,
            resumeFileName: input.resumeFileName ?? null,
            skillsText
          },
          create: {
            userId: context.userId,
            headline: input.headline ?? null,
            about: input.about ?? null,
            location: input.location ?? null,
            careerLevel: input.careerLevel ?? null,
            resumeFileName: input.resumeFileName ?? null,
            skillsText,
            embedding: []
          }
        })

        // Re-running onboarding (or editing the profile later) shouldn't duplicate child
        // rows, and hard deletes are off-limits — soft-delete the previous set before
        // recreating it, same pattern prisma/seed.ts already uses.
        await tx.userSkill.updateMany({
          where: { userId: context.userId, deleted: false },
          data: { deleted: true }
        })
        await tx.education.updateMany({
          where: { userProfileId: profile.id, deleted: false },
          data: { deleted: true }
        })
        await tx.workExperience.updateMany({
          where: { userProfileId: profile.id, deleted: false },
          data: { deleted: true }
        })
        await tx.certification.updateMany({
          where: { userProfileId: profile.id, deleted: false },
          data: { deleted: true }
        })
        await tx.project.updateMany({
          where: { userProfileId: profile.id, deleted: false },
          data: { deleted: true }
        })
        await tx.language.updateMany({
          where: { userProfileId: profile.id, deleted: false },
          data: { deleted: true }
        })

        for (const skillInput of skills) {
          const skill = await tx.skill.upsert({
            where: { name: skillInput.name },
            update: skillInput.category ? { category: skillInput.category } : {},
            create: { name: skillInput.name, category: skillInput.category ?? null }
          })
          await tx.userSkill.upsert({
            where: { userId_skillId: { userId: context.userId, skillId: skill.id } },
            update: { level: skillInput.level ?? null, years: skillInput.years ?? null, deleted: false },
            create: {
              userId: context.userId,
              skillId: skill.id,
              level: skillInput.level ?? null,
              years: skillInput.years ?? null
            }
          })
        }

        if (education.length > 0) {
          await tx.education.createMany({
            data: education.map((entry) => ({
              userProfileId: profile.id,
              school: entry.school,
              degree: entry.degree ?? null,
              fieldOfStudy: entry.fieldOfStudy ?? null,
              startYear: entry.startYear ?? null,
              endYear: entry.endYear ?? null,
              description: entry.description ?? null
            }))
          })
        }

        if (experience.length > 0) {
          await tx.workExperience.createMany({
            data: experience.map((entry) => ({
              userProfileId: profile.id,
              title: entry.title,
              company: entry.company,
              location: entry.location ?? null,
              employmentType: entry.employmentType ?? null,
              description: entry.description ?? null,
              startDate: new Date(entry.startDate),
              endDate: entry.endDate ? new Date(entry.endDate) : null,
              current: entry.current ?? false
            }))
          })
        }

        if (certifications.length > 0) {
          await tx.certification.createMany({
            data: certifications.map((entry) => ({
              userProfileId: profile.id,
              name: entry.name,
              issuer: entry.issuer,
              issueDate: entry.issueDate ? new Date(entry.issueDate) : null,
              expirationDate: entry.expirationDate ? new Date(entry.expirationDate) : null,
              credentialId: entry.credentialId ?? null,
              credentialUrl: entry.credentialUrl ?? null
            }))
          })
        }

        if (projects.length > 0) {
          await tx.project.createMany({
            data: projects.map((entry) => ({
              userProfileId: profile.id,
              name: entry.name,
              description: entry.description,
              technologies: entry.technologies,
              url: entry.url ?? null,
              startDate: entry.startDate ? new Date(entry.startDate) : null,
              endDate: entry.endDate ? new Date(entry.endDate) : null
            }))
          })
        }

        if (languages.length > 0) {
          await tx.language.createMany({
            data: languages.map((entry) => ({
              userProfileId: profile.id,
              language: entry.language,
              proficiency: entry.proficiency ?? null
            }))
          })
        }

        await tx.userPreference.upsert({
          where: { userProfileId: profile.id },
          update: {
            desiredRoles: input.preferences.desiredRoles,
            preferredLocations: input.preferences.preferredLocations,
            preferredJobTypes: input.preferences.preferredJobTypes,
            preferredIndustries: input.preferences.preferredIndustries,
            workSetup: input.preferences.workSetup ?? null,
            minimumSalary: input.preferences.minimumSalary ?? null,
            maximumSalary: input.preferences.maximumSalary ?? null,
            willingToRelocate: input.preferences.willingToRelocate,
            willingToRemote: input.preferences.willingToRemote
          },
          create: {
            userProfileId: profile.id,
            desiredRoles: input.preferences.desiredRoles,
            preferredLocations: input.preferences.preferredLocations,
            preferredJobTypes: input.preferences.preferredJobTypes,
            preferredIndustries: input.preferences.preferredIndustries,
            workSetup: input.preferences.workSetup ?? null,
            minimumSalary: input.preferences.minimumSalary ?? null,
            maximumSalary: input.preferences.maximumSalary ?? null,
            willingToRelocate: input.preferences.willingToRelocate,
            willingToRemote: input.preferences.willingToRemote
          }
        })
      })

      // Skills/skillsText feed straight into the semantic score, so cached scores from
      // before this edit are now wrong for every job, not just one.
      await invalidateMatchScoresForUser(context.userId)

      return (await loadProfileForMe(context.userId))!
    },

    updateAbout: async (_parent: unknown, args: { about: string }, context: GraphQLContext) => {
      await prisma.userProfile.update({
        where: { userId: context.userId },
        data: { about: args.about }
      })
      return (await loadProfileForMe(context.userId))!
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
