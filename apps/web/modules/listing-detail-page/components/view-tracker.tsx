'use client'

import { useEffect, useRef } from 'react'
import { useMutation } from '@apollo/client/react'
import { LOG_INTERACTION_MUTATION } from '@/lib/job-matches'
import { getStoredToken } from '@/lib/auth'

const VIEWED_JOBS_STORAGE_KEY = 'angkop_viewed_jobs'

function hasAlreadyLoggedView(jobId: string): boolean {
  try {
    const raw = window.sessionStorage.getItem(VIEWED_JOBS_STORAGE_KEY)
    const viewed: string[] = raw ? JSON.parse(raw) : []
    return viewed.includes(jobId)
  } catch {
    return false
  }
}

function markViewLogged(jobId: string): void {
  try {
    const raw = window.sessionStorage.getItem(VIEWED_JOBS_STORAGE_KEY)
    const viewed: string[] = raw ? JSON.parse(raw) : []
    window.sessionStorage.setItem(VIEWED_JOBS_STORAGE_KEY, JSON.stringify([...viewed, jobId]))
  } catch {
    // sessionStorage unavailable (private browsing, etc.) — worst case this tab logs the view again
  }
}

// Renders nothing — fires the 'view' interaction once per job per browser tab session, the
// same passive signal the extension's content script logs on Angkop's own listing pages,
// so the signal exists for users who browse the dashboard directly instead.
export function ViewTracker({ jobId }: { jobId: string }) {
  const [logInteraction] = useMutation(LOG_INTERACTION_MUTATION)
  const hasFired = useRef(false)

  useEffect(() => {
    if (hasFired.current) return
    if (!getStoredToken()) return // anonymous browsing — no user to attribute the view to
    if (hasAlreadyLoggedView(jobId)) return

    hasFired.current = true
    markViewLogged(jobId)
    logInteraction({ variables: { jobId, eventType: 'view' } }).catch(() => {
      // best-effort signal — a failed log shouldn't disrupt browsing
    })
  }, [jobId, logInteraction])

  return null
}
