import { ArrowRight, ChevronRight } from 'lucide-react'
import { variantForScore } from '@/components/match-score-badge'
import { NavLink } from '@/components/nav-link'
import { LANE_MATCHES_COUNT } from '@/constants/dashboard'
import { MATCH_LANES } from '@/constants/match-lanes'
import { cn } from '@/lib/utils'
import type { DashboardMatch } from '../types'

type LaneKey = keyof typeof MATCH_LANES

function skillsToAddText(missingSkillCount: number) {
  if (missingSkillCount === 0) return 'Covers every listed skill'
  return `${missingSkillCount} ${missingSkillCount === 1 ? 'skill' : 'skills'} to add`
}

function MatchRow({ match }: { match: DashboardMatch }) {
  return (
    <li>
      <NavLink
        href={`/matches/${match.job.id}`}
        pendingLabel="Opening match…"
        className="group flex min-w-0 items-center gap-3 py-3"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground group-hover:underline">{match.job.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {match.job.company} · {skillsToAddText(match.missingSkillCount)}
          </p>
        </div>
        <p className="shrink-0 text-right">
          <span className="block font-display text-sm font-medium text-foreground tabular-nums">
            {Math.round(match.hybridScore * 100)}%
          </span>
          <span className="block text-[11px] text-muted-foreground">match</span>
        </p>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </NavLink>
    </li>
  )
}

function Lane({
  laneKey,
  matches,
  emptyContent
}: {
  laneKey: LaneKey
  matches: DashboardMatch[]
  emptyContent: React.ReactNode
}) {
  const lane = MATCH_LANES[laneKey]
  const headingId = `lane-${laneKey}-heading`

  return (
    // min-w-0: a grid item won't shrink below its longest title otherwise, pushing the rows
    // past the container on a phone.
    <section aria-labelledby={headingId} className="min-w-0">
      <div className={cn('border-t-2 pt-3', lane.ruleClassName)}>
        <h2 id={headingId} className="text-sm font-semibold text-foreground">
          {lane.title}
        </h2>
        <p className="text-xs text-muted-foreground">{lane.description}</p>
      </div>
      {matches.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">{emptyContent}</p>
      ) : (
        <ul className="mt-1 divide-y divide-border">
          {matches.map((match) => (
            <MatchRow key={match.job.id} match={match} />
          ))}
        </ul>
      )}
    </section>
  )
}

// The matches beyond the hero, sorted into two lanes by what the seeker should do with them.
// Matches arrive best first, so each lane keeps the order it is given.
export function MatchLanes({
  matches,
  totalCount,
  strongMatchCount
}: {
  matches: DashboardMatch[]
  totalCount: number
  strongMatchCount: number
}) {
  const strong: DashboardMatch[] = []
  const partial: DashboardMatch[] = []
  for (const match of matches) {
    const band = variantForScore(match.hybridScore)
    if (band === 'strong' && strong.length < LANE_MATCHES_COUNT) strong.push(match)
    else if (band === 'partial' && partial.length < LANE_MATCHES_COUNT) partial.push(match)
  }

  // The query only fetches the best matches, so partial ones can exist without being in it.
  const unseenPartialCount = totalCount - strongMatchCount

  return (
    <div className="space-y-6">
      <div className="grid gap-8 lg:grid-cols-2">
        <Lane
          laneKey="strong"
          matches={strong}
          emptyContent={
            // The lanes start after the hero, so a lone strong match is the hero, not missing.
            strongMatchCount > 0
              ? 'Your strong match is the next best move above.'
              : 'No strong matches yet. Adding skills to your profile helps Angkop find more.'
          }
        />
        <Lane
          laneKey="partial"
          matches={partial}
          emptyContent={
            unseenPartialCount > 0 ? (
              <>
                {unseenPartialCount} more in{' '}
                <NavLink
                  href="/matches"
                  pendingLabel="Loading matches…"
                  className="font-medium text-primary hover:underline"
                >
                  All Matches
                </NavLink>
              </>
            ) : (
              'No partial matches right now.'
            )
          }
        />
      </div>

      {totalCount > strong.length + partial.length + 1 ? (
        <NavLink
          href="/matches"
          pendingLabel="Loading matches…"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View all {totalCount} matches
          <ArrowRight className="size-3.5" />
        </NavLink>
      ) : null}
    </div>
  )
}
