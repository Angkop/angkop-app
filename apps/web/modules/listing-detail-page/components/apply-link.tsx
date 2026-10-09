'use client'

import { ExternalLink } from 'lucide-react'
import { useMutation } from '@apollo/client/react'
import { toast } from 'sonner'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LOG_INTERACTION_MUTATION } from '@/lib/job-matches'
import { getStoredToken } from '@/lib/auth'

type ApplyLinkProps = {
  jobId: string
  sourceUrl: string
  sourceName: string
}

// The highest-weighted implicit feedback signal (INTERACTION_WEIGHTS.apply) — logged at the
// moment the user clicks through to actually apply, since Angkop re-serves listings but
// applications themselves always happen on the original posting.
export function ApplyLink({ jobId, sourceUrl, sourceName }: ApplyLinkProps) {
  const [logInteraction] = useMutation(LOG_INTERACTION_MUTATION)

  function handleClick() {
    if (!getStoredToken()) return // anonymous browsing — no user to attribute the interaction to
    logInteraction({ variables: { jobId, eventType: 'apply' } })
      .then(() => toast.success('Logged as applied'))
      .catch(() => {
        // best-effort signal — the external link already opened in a new tab regardless
      })
  }

  return (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={cn(buttonVariants({ size: 'sm' }), 'shrink-0')}
    >
      Apply on {sourceName}
      <ExternalLink className="size-3.5" />
    </a>
  )
}
