import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const SEED_DIR = join(__dirname, '../../../seed')
const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? 'http://localhost:8000'

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
  const jobs = readSeedFile<SeedJob[]>('jobs.json')

  console.log(`Seeding ${jobs.length} jobs...`)

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
