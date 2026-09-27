import type { ReactNode } from 'react'

export function ErrorMessage({ children }: { children: ReactNode }) {
  return <p className="text-sm text-destructive">{children}</p>
}
