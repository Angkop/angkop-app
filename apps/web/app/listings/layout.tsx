import { AppShell } from '@/components/app-shell'

export default function ListingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell requireAuth={false} mainClassName="max-w-5xl">
      {children}
    </AppShell>
  )
}
