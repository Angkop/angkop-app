import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const SEED_DIR = join(__dirname, '../../../seed')
const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? 'http://localhost:8000'

type SeedEducation = { school: string; degree: string; year: number }
type SeedExperience = { title: string; company: string; months: number }
type SeedPreferences = { desiredRole?: string; location?: string }

type SeedUser = {
  id: string
  email: string
  name: string
  isLoginUser: boolean
  skills: string[]
  skillsText: string
  education: SeedEducation[]
  experience: SeedExperience[]
  preferences: SeedPreferences
}

type SeedJob = {
  id: string
  platformJobId: string
  platform: string
  title: string
  company: string
  description: string
  requiredSkills: string[]
  url: string
}

type SeedInteraction = {
  userId: string
  jobId: string
  eventType: string
  weight: number
  platform: string
}

function readSeedFile<T>(fileName: string): T {
  return JSON.parse(readFileSync(join(SEED_DIR, fileName), 'utf-8')) as T
}

async function embed(text: string): Promise<number[]> {
  const response = await fetch(`${ML_SERVICE_URL}/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  })
  if (!response.ok) {
    throw new Error(
      `Failed to embed text via ${ML_SERVICE_URL}/embed (status ${response.status}). ` +
        'Is the ML service running? See ml/README for setup.'
    )
  }
  const data = (await response.json()) as { embedding: number[] }
  return data.embedding
}

async function main() {
  const users = readSeedFile<SeedUser[]>('users.json')
  const jobs = readSeedFile<SeedJob[]>('jobs.json')
  const interactions = readSeedFile<SeedInteraction[]>('interactions.json')

  console.log(`Seeding ${users.length} users, ${jobs.length} jobs, ${interactions.length} interactions...`)

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { email: user.email, name: user.name },
      create: { id: user.id, email: user.email, name: user.name }
    })

    const embedding = await embed(user.skillsText)
    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        skills: user.skills,
        skillsText: user.skillsText,
        embedding,
        desiredRole: user.preferences.desiredRole,
        location: user.preferences.location
      },
      create: {
        userId: user.id,
        skills: user.skills,
        skillsText: user.skillsText,
        embedding,
        desiredRole: user.preferences.desiredRole,
        location: user.preferences.location
      }
    })

    // Re-running the seed shouldn't duplicate education/experience rows, and hard deletes
    // are off-limits — soft-delete the previous rows for this profile before recreating them.
    await prisma.education.updateMany({
      where: { userProfileId: profile.id, deleted: false },
      data: { deleted: true }
    })
    await prisma.workExperience.updateMany({
      where: { userProfileId: profile.id, deleted: false },
      data: { deleted: true }
    })
    if (user.education.length > 0) {
      await prisma.education.createMany({
        data: user.education.map((entry) => ({ ...entry, userProfileId: profile.id }))
      })
    }
    if (user.experience.length > 0) {
      await prisma.workExperience.createMany({
        data: user.experience.map((entry) => ({ ...entry, userProfileId: profile.id }))
      })
    }
  }

  for (const job of jobs) {
    const embedding = await embed(`${job.title}. ${job.description}`)
    await prisma.job.upsert({
      where: { id: job.id },
      update: {
        platformJobId: job.platformJobId,
        platform: job.platform,
        title: job.title,
        company: job.company,
        description: job.description,
        requiredSkills: job.requiredSkills,
        url: job.url,
        embedding
      },
      create: {
        id: job.id,
        platformJobId: job.platformJobId,
        platform: job.platform,
        title: job.title,
        company: job.company,
        description: job.description,
        requiredSkills: job.requiredSkills,
        url: job.url,
        embedding
      }
    })
  }

  // Interactions aren't upserted (no natural unique key) — safe to re-run against a fresh
  // db, but re-running against a db that already has them will duplicate rows.
  const existingInteractionCount = await prisma.interaction.count()
  if (existingInteractionCount === 0) {
    for (const interaction of interactions) {
      await prisma.interaction.create({ data: interaction })
    }
  } else {
    console.log('Interactions already present, skipping to avoid duplicates.')
  }

  console.log('Seed complete.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
