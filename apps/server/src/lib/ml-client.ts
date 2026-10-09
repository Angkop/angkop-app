import type {
  EmbedRequest,
  EmbedResponse,
  MatchInsightRequest,
  MatchInsightResponse,
  ParsedResumeProfile,
  RecommendBatchRequest,
  RecommendBatchResponse,
  RecommendRequest,
  RecommendResponse,
  ResumeParseRequest,
  SkillGapRequest,
  SkillGapResponse
} from '@angkop/shared'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? 'http://localhost:8000'

// Carries the HTTP status so callers (like the resume route's retry/circuit-breaker
// logic) can tell a transient 429/5xx apart from a permanent 400 without re-parsing text.
export class MlServiceError extends Error {
  constructor(
    public readonly status: number,
    detail: string
  ) {
    super(detail)
  }
}

async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const response = await fetch(`${ML_SERVICE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new MlServiceError(
      response.status,
      `ML service request to ${path} failed with status ${response.status}: ${detail}`
    )
  }

  return response.json() as Promise<TResponse>
}

export function embed(request: EmbedRequest): Promise<EmbedResponse> {
  return postJson<EmbedResponse>('/embed', request)
}

export function recommend(request: RecommendRequest): Promise<RecommendResponse> {
  return postJson<RecommendResponse>('/recommend', request)
}

export function recommendBatch(request: RecommendBatchRequest): Promise<RecommendBatchResponse> {
  return postJson<RecommendBatchResponse>('/recommend/batch', request)
}

export function skillGap(request: SkillGapRequest): Promise<SkillGapResponse> {
  return postJson<SkillGapResponse>('/skill-gap', request)
}

export function parseResume(request: ResumeParseRequest): Promise<ParsedResumeProfile> {
  return postJson<ParsedResumeProfile>('/resume/parse', request)
}

export function matchInsight(request: MatchInsightRequest): Promise<MatchInsightResponse> {
  return postJson<MatchInsightResponse>('/insight/explain', request)
}
