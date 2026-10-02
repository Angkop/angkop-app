'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { Menu } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
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

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-0.5 px-3">
      {NAV_LINKS.map((link) => {
        const active = pathname === link.href
        const Icon = link.icon
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="size-4" strokeWidth={1.75} />
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}

function BrandLockup() {
  return (
    <div className="flex flex-col gap-2 px-6 pt-6 pb-4">
      <Link href="/dashboard" className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
          A
        </span>
        <span className="text-base font-semibold tracking-tight text-foreground">Angkop</span>
      </Link>
    </div>
  )
}

function UserFooter({ initials, name, email }: { initials: string; name: string | null; email: string }) {
  return (
    <div className="border-t border-border px-4 py-4">
      <Link
        href="/profile"
        className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-muted"
      >
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{name ?? email}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
      </Link>
    </div>
  )
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
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border md:flex">
        <BrandLockup />
        <NavList pathname={pathname} />
        <UserFooter initials={initials} name={name} email={email} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 md:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="size-4" />
            </Button>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex h-full flex-col">
                <BrandLockup />
                <NavList pathname={pathname} onNavigate={() => setMobileOpen(false)} />
                <UserFooter initials={initials} name={name} email={email} />
              </div>
            </SheetContent>
          </Sheet>

          <span className="text-sm font-medium text-foreground">
            {NAV_LINKS.find((link) => link.href === pathname)?.label ?? 'Angkop'}
          </span>

          <div className="flex-1" />

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
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  )
}
