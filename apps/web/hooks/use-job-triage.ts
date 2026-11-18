'use client'

import { useState } from 'react'
import { useApolloClient, useMutation } from '@apollo/client/react'
import { toast } from 'sonner'
import { SAVED_JOB_DERIVED_FIELDS } from '@/constants/job-cache'
import { invalidateCachedFields } from '@/lib/job-cache'
import { LOG_INTERACTION_MUTATION, SAVE_JOB_MUTATION } from '@/lib/job-matches'

function withId(ids: Set<string>, jobId: string) {
  return new Set(ids).add(jobId)
}

function withoutId(ids: Set<string>, jobId: string) {
  const next = new Set(ids)
  next.delete(jobId)
  return next
}

// Save and dismiss for a job, shared by the matches list and a match's own page.
//
// Save/dismiss just hide a job from the current view — the server already excludes
// saved/dismissed jobs from jobMatches going forward, so there's nothing left to learn
// from a full requery right now. Refetching here would re-score every job in the feed
// (each a cache miss right after invalidateMatchScoresForUser) just to reflect one
// removal — slow, and the other jobs' scores haven't meaningfully changed anyway.
export function useJobTriage() {
  const apolloClient = useApolloClient()
  const [logInteraction] = useMutation(LOG_INTERACTION_MUTATION)
  const [saveJob] = useMutation(SAVE_JOB_MUTATION)
  const [handledJobIds, setHandledJobIds] = useState<Set<string>>(new Set())
  // Apollo's mutation `loading` flag is shared across every call made from that one hook
  // instance, so it can't tell which card is in flight when several jobs render at once —
  // track per-job IDs here instead so one card's save/dismiss doesn't disable every card.
  const [savingJobIds, setSavingJobIds] = useState<Set<string>>(new Set())
  const [dismissingJobIds, setDismissingJobIds] = useState<Set<string>>(new Set())

  // Both actions resolve to whether they went through, so a page can move on only on success.
  async function save(jobId: string): Promise<boolean> {
    setSavingJobIds((prev) => withId(prev, jobId))
    try {
      await saveJob({ variables: { jobId } })
      setHandledJobIds((prev) => withId(prev, jobId))
      // Saving changes the saved lists, the skill gap report and which jobs the feed excludes.
      invalidateCachedFields(apolloClient, SAVED_JOB_DERIVED_FIELDS)
      toast.success('Saved to your applications')
      return true
    } catch (saveError) {
      toast.error('Could not save this job', {
        description: saveError instanceof Error ? saveError.message : undefined
      })
      return false
    } finally {
      setSavingJobIds((prev) => withoutId(prev, jobId))
    }
  }

  async function dismiss(jobId: string): Promise<boolean> {
    setDismissingJobIds((prev) => withId(prev, jobId))
    try {
      await logInteraction({ variables: { jobId, eventType: 'dismiss' } })
      setHandledJobIds((prev) => withId(prev, jobId))
      invalidateCachedFields(apolloClient, ['jobMatches'])
      toast.success('Job dismissed')
      return true
    } catch (dismissError) {
      toast.error('Could not dismiss this job', {
        description: dismissError instanceof Error ? dismissError.message : undefined
      })
      return false
    } finally {
      setDismissingJobIds((prev) => withoutId(prev, jobId))
    }
  }

  return { save, dismiss, handledJobIds, savingJobIds, dismissingJobIds }
}
