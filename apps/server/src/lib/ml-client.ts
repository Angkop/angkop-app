import type {
  CollaborativeBatchRequest,
  CollaborativeBatchResponse,
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

// Without a deadline, a hung ML service (the deployed one is reached through a tunnel) holds every
// request that needs it open until the platform gives up. The ML service's own Gemini calls time
// out at 30s (insight) and 45s (resume parser) and may retry once on a fallback model, so the
// Gemini-backed routes get room for both attempts; everything else is plain math.
const ML_REQUEST_TIMEOUT_MS = 30_000
const ML_GEMINI_REQUEST_TIMEOUT_MS = 100_000

export async function postJson<TResponse>(
  path: string,
  body: unknown,
  timeoutMs = ML_REQUEST_TIMEOUT_MS
): Promise<TResponse> {
  let response: Response
  try {
    response = await fetch(`${ML_SERVICE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs)
    })
  } catch (error) {
    // Reported as a 504 so callers' existing "transient server error" handling (the resume
    // route's retry and circuit breaker, the insight retry) treats it like any other 5xx.
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new MlServiceError(504, `ML service request to ${path} timed out after ${timeoutMs} ms`)
    }
    throw error
  }

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

export function collaborativeBatch(request: CollaborativeBatchRequest): Promise<CollaborativeBatchResponse> {
  return postJson<CollaborativeBatchResponse>('/collaborative/batch', request)
}

export function skillGap(request: SkillGapRequest): Promise<SkillGapResponse> {
  return postJson<SkillGapResponse>('/skill-gap', request)
}

export function parseResume(request: ResumeParseRequest): Promise<ParsedResumeProfile> {
  return postJson<ParsedResumeProfile>('/resume/parse', request, ML_GEMINI_REQUEST_TIMEOUT_MS)
}

export function matchInsight(request: MatchInsightRequest): Promise<MatchInsightResponse> {
  return postJson<MatchInsightResponse>('/insight/explain', request, ML_GEMINI_REQUEST_TIMEOUT_MS)
}
