import { Briefcase, ClipboardList, LayoutDashboard, ListChecks, Target } from 'lucide-react'

// Profile isn't a nav link — it's reached from the account menu in AppShell's header
// (DropdownMenuTrigger -> "Profile settings"), not the top-level nav.
export const NAV_LINKS = [
  { href: '/dashboard', label: 'Job Feed', icon: LayoutDashboard, solidIcon: false },
  { href: '/matches', label: 'Matches', icon: ListChecks, solidIcon: false },
  { href: '/listings', label: 'Jobs', icon: Briefcase, solidIcon: false },
  { href: '/skill-gaps', label: 'Skill Gaps', icon: Target, solidIcon: false },
  { href: '/applications', label: 'Applications', icon: ClipboardList, solidIcon: false }
]
