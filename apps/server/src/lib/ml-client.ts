import type {
  EmbedRequest,
  EmbedResponse,
  RecommendRequest,
  RecommendResponse,
  SkillGapRequest,
  SkillGapResponse
} from '@angkop/shared'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? 'http://localhost:8000'

async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const response = await fetch(`${ML_SERVICE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    throw new Error(`ML service request to ${path} failed with status ${response.status}`)
  }

  return response.json() as Promise<TResponse>
}

export function embed(request: EmbedRequest): Promise<EmbedResponse> {
  return postJson<EmbedResponse>('/embed', request)
}

export function recommend(request: RecommendRequest): Promise<RecommendResponse> {
  return postJson<RecommendResponse>('/recommend', request)
}

export function skillGap(request: SkillGapRequest): Promise<SkillGapResponse> {
  return postJson<SkillGapResponse>('/skill-gap', request)
}
