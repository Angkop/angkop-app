'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { LogOut, Menu, X } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ProfilePage } from '@/modules/profile-page/profile-page'
import { NAV_LINKS } from '@/constants/nav'
import { clearStoredToken, getStoredToken } from '@/lib/auth'
import { supabaseClient } from '@/lib/supabase-client'
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
  const [isProfileOpen, setIsProfileOpen] = useState(false)
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

  async function handleSignOut() {
    await supabaseClient.auth.signOut()
    clearStoredToken()
    router.replace('/')
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="flex h-14 w-full items-center gap-2 px-4 sm:px-6 lg:px-8">
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

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className="flex cursor-pointer flex-col items-center gap-0.5 rounded-md px-2 py-1 outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/10 text-[10px] font-medium text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-xs leading-none font-normal text-foreground sm:block">Account</span>
            </button>

            <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
              <SheetContent showCloseButton={false}>
                <SheetHeader>
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <SheetTitle className="truncate">{name ?? email}</SheetTitle>
                    <p className="truncate text-xs text-muted-foreground">{email}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    aria-label="Sign out"
                    className="gap-1.5"
                  >
                    <LogOut className="size-3.5" />
                    <span className="hidden sm:inline">Sign out</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Close"
                    onClick={() => setIsProfileOpen(false)}
                    className="text-muted-foreground"
                  >
                    <X className="size-4" />
                  </Button>
                </SheetHeader>
                <SheetBody>
                  <ProfilePage />
                </SheetBody>
              </SheetContent>
            </Sheet>
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
