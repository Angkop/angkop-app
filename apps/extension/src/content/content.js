const ANGKOP_API_URL = 'http://localhost:4000'
const ANGKOP_DEMO_USER_ID = 'demo-user-1'
// The Express API call plus the ML-backed match-score computation behind it can
// occasionally run long - without a bound, a stuck request leaves the overlay waiting
// forever instead of failing fast.
const FETCH_TIMEOUT_MS = 8000

function scrapeDemoPlatform() {
  const listing = document.querySelector('[data-angkop-platform]')
  if (!listing) return null
  return {
    platform: listing.getAttribute('data-angkop-platform'),
    platformJobId: listing.getAttribute('data-angkop-platform-job-id'),
    title: listing.querySelector('.job-title')?.textContent?.trim() ?? document.title,
    company: listing.querySelector('.job-company')?.textContent?.trim() ?? 'Unknown Company',
    description: listing.querySelector('.job-description')?.textContent?.trim() ?? '',
    requiredSkills: Array.from(listing.querySelectorAll('.job-skill')).map((el) => el.textContent.trim()),
    url: window.location.href
  }
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

async function logEvent(job, eventType) {
  const response = await fetchWithTimeout(`${ANGKOP_API_URL}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: ANGKOP_DEMO_USER_ID, eventType, job })
  })
  if (!response.ok) throw new Error(`Failed to log ${eventType} event`)
  return response.json()
}

async function fetchMatchScore(jobId) {
  const response = await fetchWithTimeout(`${ANGKOP_API_URL}/api/match-score/${jobId}?userId=${ANGKOP_DEMO_USER_ID}`)
  if (!response.ok) throw new Error('Failed to fetch match score')
  return response.json()
}

async function main() {
  const job = scrapeDemoPlatform()
  if (!job) {
    console.warn('[Angkop] Could not find a supported job listing on this page.')
    return
  }

  try {
    const { jobId } = await logEvent(job, 'view')
    const score = await fetchMatchScore(jobId)
    window.angkopRenderOverlay(score.hybridScore, {
      onSave: () => logEvent(job, 'save').catch((error) => console.error('[Angkop]', error)),
      onDismiss: () => logEvent(job, 'dismiss').catch((error) => console.error('[Angkop]', error))
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`[Angkop] Request timed out after ${FETCH_TIMEOUT_MS}ms — is the Express API running on :4000?`)
    } else {
      console.error('[Angkop] Failed to compute match score — is the Express API running on :4000?', error)
    }
  }
}

main()
