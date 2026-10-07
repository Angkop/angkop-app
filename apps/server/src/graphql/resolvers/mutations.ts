import { INTERACTION_WEIGHTS, type ApplicationStatus, type InteractionEventType } from '@angkop/shared'
import { prisma } from '../../lib/prisma'
import { invalidateMatchScoresForUser } from '../../lib/redis'
import { VALID_EVENT_TYPES } from './constants'
import { buildSkillsText, loadProfileForMe, serializeSavedJob } from './helpers'
import type { CompleteOnboardingInput, GraphQLContext } from './types'

export const mutationResolvers = {
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

    // The persisted "why this match" explanation and its matching/missing skill lists are
    // grounded in the old skillsText snapshot — soft-delete so the next dialog open
    // regenerates against the new one instead of serving a stale explanation forever.
    await prisma.matchInsight.updateMany({
      where: { userId: context.userId, deleted: false },
      data: { deleted: true }
    })

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

  addSavedJobTag: async (_parent: unknown, args: { jobId: string; tag: string }, context: GraphQLContext) => {
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

  removeSavedJobTag: async (_parent: unknown, args: { jobId: string; tag: string }, context: GraphQLContext) => {
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
