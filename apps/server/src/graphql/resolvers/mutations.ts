import { INTERACTION_WEIGHTS, type ApplicationStatus, type InteractionEventType } from '@angkop/shared'
import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { invalidateMatchScoresForUser, invalidateSkillGapsForUser } from '../../lib/redis'
import { embed } from '../../lib/ml-client'
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

    // Deduped by name up front: the bulk upsert below sends every skill as one multi-row
    // statement, and a duplicate name in the same statement would make Postgres try to
    // update the same ON CONFLICT target twice, which it rejects outright. Last occurrence
    // wins, same as a plain object/Map would behave.
    const skillsByName = new Map<string, (typeof input.skills)[number]>()
    for (const skill of input.skills) {
      if (skill.name.trim().length > 0) skillsByName.set(skill.name, skill)
    }
    const skills = Array.from(skillsByName.values())
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
      education,
      experience,
      certifications,
      projects,
      languages,
      preferences: input.preferences
    })

    // skillsText's embedding is computed once here and stored, instead of the job feed
    // re-embedding it from scratch for every job on every feed load (see computeJobMatches
    // in helpers.ts) - that redundant re-embedding was the main cause of the feed being slow.
    //
    // skill.upsert used to run once per skill via Promise.all(skills.map(...)) - fine at a
    // handful of skills, but 50 submitted at once means 50 simultaneous queries fighting over
    // the Supabase pooler's connection slots, which is exactly the shape of problem the comment
    // below describes for userSkill. A single multi-row INSERT ... ON CONFLICT is one round
    // trip no matter how many skills come in.
    // "updatedAt" is included explicitly below (and in the UserSkill insert further down) -
    // @updatedAt is a Prisma Client-side convenience, not a database default, so a raw
    // INSERT that skips it hits a NOT NULL violation (Postgres code 23502) instead of
    // getting a timestamp for free the way a normal Prisma Client call would.
    const skillValues: Prisma.Sql[] = []
    for (const skill of skills) {
      skillValues.push(Prisma.sql`(${skill.name}, ${skill.category ?? null}, now())`)
    }

    const [{ embedding }, skillRecords] = await Promise.all([
      embed({ text: skillsText }),
      skillValues.length > 0
        ? prisma.$queryRaw<{ id: number; name: string }[]>`
            INSERT INTO "Skill" (name, category, "updatedAt")
            VALUES ${Prisma.join(skillValues)}
            ON CONFLICT (name) DO UPDATE SET
              category = COALESCE(EXCLUDED.category, "Skill"."category"),
              "updatedAt" = now()
            RETURNING id, name
          `
        : Promise.resolve([] as { id: number; name: string }[])
    ])

    const skillIdByName = new Map<string, number>()
    for (const skill of skillRecords) {
      skillIdByName.set(skill.name, skill.id)
    }

    const userSkillValues: Prisma.Sql[] = []
    for (const skill of skills) {
      const skillId = skillIdByName.get(skill.name)
      if (skillId === undefined) continue
      userSkillValues.push(
        Prisma.sql`(${context.userId}, ${skillId}, ${skill.level ?? null}::"SkillLevel",
          ${skill.years ?? null}, false, now())`
      )
    }

    // Interactive transactions ($transaction(async tx => ...)) need one connection held
    // open across every round-trip while app code runs in between. Supabase's DATABASE_URL
    // here is the transaction-mode pooler (schema.prisma datasource comment), which doesn't
    // guarantee that — mid-transaction the engine can lose track of it and throw "Transaction
    // not found". Raising timeout/maxWait only made that rarer, not impossible, and got worse
    // the more skills a user had (2 round-trips per skill, all sequential). The fix is to stop
    // using the interactive form: resolve the profile with a plain (non-transactional) call
    // first, then do the rest as one *batched* `$transaction([...])` - Prisma sends that as a
    // single request with no app-code round trips in between, which is the form Prisma
    // documents as pooler-safe.
    const profile = await prisma.userProfile.upsert({
      where: { userId: context.userId },
      update: {
        headline: input.headline ?? null,
        about: input.about ?? null,
        location: input.location ?? null,
        careerLevel: input.careerLevel ?? null,
        resumeFileName: input.resumeFileName ?? null,
        skillsText,
        embedding
      },
      create: {
        userId: context.userId,
        headline: input.headline ?? null,
        about: input.about ?? null,
        location: input.location ?? null,
        careerLevel: input.careerLevel ?? null,
        resumeFileName: input.resumeFileName ?? null,
        skillsText,
        embedding
      }
    })

    // Re-running onboarding (or editing the profile later) shouldn't duplicate child rows,
    // and hard deletes are off-limits — soft-delete the previous set before recreating it,
    // same pattern prisma/seed.ts already uses.
    await prisma.$transaction([
      prisma.userSkill.updateMany({
        where: { userId: context.userId, deleted: false },
        data: { deleted: true }
      }),
      prisma.education.updateMany({
        where: { userProfileId: profile.id, deleted: false },
        data: { deleted: true }
      }),
      prisma.workExperience.updateMany({
        where: { userProfileId: profile.id, deleted: false },
        data: { deleted: true }
      }),
      prisma.certification.updateMany({
        where: { userProfileId: profile.id, deleted: false },
        data: { deleted: true }
      }),
      prisma.project.updateMany({
        where: { userProfileId: profile.id, deleted: false },
        data: { deleted: true }
      }),
      prisma.language.updateMany({
        where: { userProfileId: profile.id, deleted: false },
        data: { deleted: true }
      }),
      // Same N-round-trips problem as the skill.upsert above, but worse here since every one
      // of these was also spread into this transaction's statement list individually - a
      // single multi-row upsert keeps the transaction small regardless of skill count.
      ...(userSkillValues.length > 0
        ? [
            prisma.$executeRaw`
              INSERT INTO "UserSkill"
                ("userId", "skillId", "level", "years", "deleted", "updatedAt")
              VALUES ${Prisma.join(userSkillValues)}
              ON CONFLICT ("userId", "skillId") DO UPDATE SET
                level = EXCLUDED.level,
                years = EXCLUDED.years,
                deleted = false,
                "updatedAt" = now()
            `
          ]
        : []),
      ...(education.length > 0
        ? [
            prisma.education.createMany({
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
          ]
        : []),
      ...(experience.length > 0
        ? [
            prisma.workExperience.createMany({
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
          ]
        : []),
      ...(certifications.length > 0
        ? [
            prisma.certification.createMany({
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
          ]
        : []),
      ...(projects.length > 0
        ? [
            prisma.project.createMany({
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
          ]
        : []),
      ...(languages.length > 0
        ? [
            prisma.language.createMany({
              data: languages.map((entry) => ({
                userProfileId: profile.id,
                language: entry.language,
                proficiency: entry.proficiency ?? null
              }))
            })
          ]
        : []),
      prisma.userPreference.upsert({
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
    ])

    // Skills/skillsText feed straight into the semantic score, so cached scores from
    // before this edit are now wrong for every job, not just one.
    await invalidateMatchScoresForUser(context.userId)
    // Skills are also one of the two inputs to the skill-gap report.
    await invalidateSkillGapsForUser(context.userId)

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
    // The newly-saved job's required skills are an input to the skill-gap report.
    await invalidateSkillGapsForUser(context.userId)

    return serializeSavedJob(savedJob)
  },

  unsaveJob: async (_parent: unknown, args: { jobId: string }, context: GraphQLContext) => {
    await prisma.savedJob.updateMany({
      where: { userId: context.userId, jobId: args.jobId, deleted: false },
      data: { deleted: true }
    })
    // The removed job's required skills no longer belong in the skill-gap report.
    await invalidateSkillGapsForUser(context.userId)
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
