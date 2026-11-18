'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@apollo/client/react'
import { Archive, Bookmark, Check, Loader2 } from 'lucide-react'
import { DismissConfirm } from '@/components/dismiss-confirm'
import { NavLink } from '@/components/nav-link'
import { Button, buttonVariants } from '@/components/ui/button'
import { useJobTriage } from '@/hooks/use-job-triage'
import { SAVED_JOB_IDS_QUERY, type SavedJobIdsQueryResult } from '@/lib/job-matches'
import { ApplyLink } from '@/modules/listing-detail-page/components/apply-link'

// The sidebar's actions: apply (the one primary), save, and dismiss. Dismissing confirms in
// place, then leaves for the matches list since the job won't be in it any more.
export function MatchActions({
  jobId,
  title,
  company,
  sourceUrl,
  sourceName
}: {
  jobId: string
  title: string
  company: string
  sourceUrl: string
  sourceName: string
}) {
  const router = useRouter()
  const triage = useJobTriage()
  const { data } = useQuery<SavedJobIdsQueryResult>(SAVED_JOB_IDS_QUERY)
  const [isConfirmingDismiss, setIsConfirmingDismiss] = useState(false)

  const isSaved = Boolean(data?.savedJobIds.includes(jobId)) || triage.handledJobIds.has(jobId)
  const isSaving = triage.savingJobIds.has(jobId)
  const isDismissing = triage.dismissingJobIds.has(jobId)

  async function handleDismiss() {
    const didDismiss = await triage.dismiss(jobId)
    if (didDismiss) router.replace('/matches')
    else setIsConfirmingDismiss(false)
  }

  return (
    <div className="space-y-2">
      <ApplyLink sourceUrl={sourceUrl} sourceName={sourceName} className="w-full" />

      {isSaved ? (
        <NavLink
          href="/applications"
          pendingLabel="Loading applications…"
          className={buttonVariants({ variant: 'secondary', size: 'sm', className: 'w-full' })}
        >
          <Check className="size-4" />
          Saved. View Applications
        </NavLink>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full"
          disabled={isSaving}
          onClick={() => triage.save(jobId)}
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Bookmark className="size-4" />}
          {isSaving ? 'Saving…' : 'Save Job'}
        </Button>
      )}

      {isConfirmingDismiss ? (
        <DismissConfirm
          title={title}
          company={company}
          isDismissing={isDismissing}
          onConfirm={handleDismiss}
          onCancel={() => setIsConfirmingDismiss(false)}
        />
      ) : (
        <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => setIsConfirmingDismiss(true)}>
          <Archive className="size-4" />
          Dismiss Job
        </Button>
      )}
    </div>
  )
}
