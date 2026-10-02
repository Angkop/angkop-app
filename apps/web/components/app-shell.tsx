'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { Menu, X } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { NAV_LINKS } from '@/constants/nav'
import { clearStoredToken, getStoredToken } from '@/lib/auth'
import { cn, getInitials } from '@/lib/utils'

const ME_QUERY = gql`
  query AppShellMe {
    me {
      email
      name
    }
  }
`

type MeQueryResult = {
  me: { email: string; name: string | null }
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data } = useQuery<MeQueryResult>(ME_QUERY, { skip: isChecking })

  useEffect(() => {
    if (!getStoredToken()) {
      router.replace('/')
      return
    }
    // Client-only auth gate reading localStorage (a browser API, not derivable from
    // props/state) — there's no non-effect way to know this on first client render.
    setIsChecking(false)
  }, [router])

  if (isChecking) return null

  const email = data?.me.email ?? ''
  const name = data?.me.name ?? null
  const initials = email ? getInitials(name, email) : ''

  function handleSignOut() {
    clearStoredToken()
    router.replace('/')
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-2 px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
              A
            </span>
            <span className="text-sm font-semibold tracking-tight text-foreground">Angkop</span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive(pathname, link.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex cursor-pointer items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground">{name ?? email}</p>
                  <p className="truncate text-xs text-muted-foreground">{email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSignOut}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
          </div>
        </div>

        {mobileOpen ? (
          <nav className="flex flex-col gap-0.5 border-t border-border px-4 py-2 lg:hidden">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium',
                    isActive(pathname, link.href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.75} fill={link.solidIcon ? 'currentColor' : 'none'} />
                  {link.label}
                </Link>
              )
            })}
          </nav>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">{children}</main>
    </div>
  )
}
