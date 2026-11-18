import { Briefcase, ClipboardList, LayoutDashboard, ListChecks, Target } from 'lucide-react'

// Pages that need more than the default reading width (the dashboard's fit map is a chart, and
// the matches grid and each match's page lay out in columns).
export const WIDE_PAGE_PATHS = ['/dashboard', '/matches']

// Profile isn't a nav link — it opens as a side sheet from the Account button in AppShell's
// header (see modules/profile-page/profile-sheet.tsx), not from the top-level nav.
export const NAV_LINKS = [
  { href: '/dashboard', label: 'Job Feed', icon: LayoutDashboard, solidIcon: false },
  { href: '/matches', label: 'Matches', icon: ListChecks, solidIcon: false },
  { href: '/listings', label: 'Jobs', icon: Briefcase, solidIcon: false },
  { href: '/skill-gaps', label: 'Skill Gaps', icon: Target, solidIcon: false },
  { href: '/applications', label: 'Applications', icon: ClipboardList, solidIcon: false }
]
