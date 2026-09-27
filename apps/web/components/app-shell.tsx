'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { NAV_LINKS } from '@/constants/nav'
import { clearStoredToken, getStoredToken } from '@/lib/auth'
import { cn } from '@/lib/utils'

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!getStoredToken()) {
      router.replace('/login')
      return
    }
    // Client-only auth gate reading localStorage (a browser API, not derivable from
    // props/state) — there's no non-effect way to know this on first client render.
    setIsChecking(false)
  }, [router])

  if (isChecking) return null

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <nav className="flex items-center gap-4">
          <span className="font-semibold">Angkop</span>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm text-muted-foreground hover:text-foreground',
                pathname === link.href && 'text-foreground font-medium'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            clearStoredToken()
            router.replace('/login')
          }}
        >
          Sign Out
        </Button>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
