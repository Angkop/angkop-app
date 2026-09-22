const ANGKOP_API_URL = 'http://localhost:4000'
const ANGKOP_DEMO_USER_ID = 'demo-user-1'

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

// Best-effort selectors for real platforms — not verified against live pages from this
// environment (no live browser available while building this). If a selector below
// returns null, that platform's DOM structure has likely changed; inspect the live page
// and update the selector here.
function scrapeJobStreet() {
  const title = document.querySelector('h1')?.textContent?.trim()
  if (!title) return null
  return {
    platform: 'jobstreet',
    platformJobId: window.location.pathname,
    title,
    company: document.querySelector('[data-automation="advertiser-name"]')?.textContent?.trim() ?? 'Unknown Company',
    description: document.querySelector('[data-automation="jobAdDetails"]')?.textContent?.trim() ?? '',
    requiredSkills: [],
    url: window.location.href
  }
}

function scrapeLinkedIn() {
  const title = document
    .querySelector('.job-details-jobs-unified-top-card__job-title, h1')
    ?.textContent?.trim()
  if (!title) return null
  return {
    platform: 'linkedin',
    platformJobId: window.location.pathname,
    title,
    company:
      document.querySelector('.job-details-jobs-unified-top-card__company-name')?.textContent?.trim() ??
      'Unknown Company',
    description: document.querySelector('.jobs-description__content')?.textContent?.trim() ?? '',
    requiredSkills: [],
    url: window.location.href
  }
}

function scrapeIndeed() {
  const title = document.querySelector('h1.jobsearch-JobInfoHeader-title, h1')?.textContent?.trim()
  if (!title) return null
  return {
    platform: 'indeed',
    platformJobId: window.location.pathname,
    title,
    company: document.querySelector('[data-company-name="true"]')?.textContent?.trim() ?? 'Unknown Company',
    description: document.querySelector('#jobDescriptionText')?.textContent?.trim() ?? '',
    requiredSkills: [],
    url: window.location.href
  }
}

function scrapeCurrentPage() {
  const host = window.location.hostname
  if (host.includes('localhost')) return scrapeDemoPlatform()
  if (host.includes('jobstreet')) return scrapeJobStreet()
  if (host.includes('linkedin')) return scrapeLinkedIn()
  if (host.includes('indeed')) return scrapeIndeed()
  return null
}

async function logEvent(job, eventType) {
  const response = await fetch(`${ANGKOP_API_URL}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: ANGKOP_DEMO_USER_ID, eventType, job })
  })
  if (!response.ok) throw new Error(`Failed to log ${eventType} event`)
  return response.json()
}

async function fetchMatchScore(jobId) {
  const response = await fetch(`${ANGKOP_API_URL}/api/match-score/${jobId}?userId=${ANGKOP_DEMO_USER_ID}`)
  if (!response.ok) throw new Error('Failed to fetch match score')
  return response.json()
}

async function main() {
  const job = scrapeCurrentPage()
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
    console.error('[Angkop] Failed to compute match score — is the Express API running on :4000?', error)
  }
}

main()
