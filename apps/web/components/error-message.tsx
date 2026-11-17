'use client'

import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

// onRetry and retryLabel come as a pair, so a retry button always says what it reloads.
type RetryProps =
  | {
      // Runs the retry (typically a query's refetch). A failure is ignored here because the
      // query's own error state reports it, so this never throws into an event handler.
      onRetry: () => unknown
      retryLabel: string
    }
  | { onRetry?: undefined; retryLabel?: undefined }

export function ErrorMessage({ children, onRetry, retryLabel }: { children: ReactNode } & RetryProps) {
  const [isRetrying, setIsRetrying] = useState(false)

  async function handleRetry() {
    if (!onRetry) return
    setIsRetrying(true)
    try {
      await onRetry()
    } catch {
      // surfaced again by the caller's error state
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <p className="text-sm text-destructive">{children}</p>
      {onRetry && retryLabel ? (
        <Button type="button" variant="outline" size="sm" onClick={handleRetry} disabled={isRetrying}>
          {isRetrying ? 'Loading…' : retryLabel}
        </Button>
      ) : null}
    </div>
  )
}
