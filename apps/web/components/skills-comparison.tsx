import { Check, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

// A skill you have is a filled tile; a skill to grow is an empty slot waiting for its piece.
// The icon and the screen-reader text say the same thing as the style, so color is never the
// only signal.
function SkillTile({ skill, matched }: { skill: string; matched: boolean }) {
  return (
    <li
      className={cn(
        'flex min-h-9 max-w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm',
        matched
          ? 'bg-match-strong/12 font-medium text-foreground'
          : 'border border-dashed border-foreground/25 text-muted-foreground'
      )}
    >
      {matched ? (
        <Check className="size-4 shrink-0 text-match-strong" strokeWidth={2.5} />
      ) : (
        <Plus className="size-4 shrink-0 text-primary" strokeWidth={2.5} />
      )}
      <span className="min-w-0">
        {skill}
        <span className="sr-only">{matched ? ', on your profile' : ', to grow'}</span>
      </span>
    </li>
  )
}

export function SkillsComparison({ matching, growing }: { matching: string[]; growing: string[] }) {
  const total = matching.length + growing.length

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">How you fit</p>
        {total > 0 ? (
          <p className="text-xs text-muted-foreground tabular-nums">
            {matching.length} of {total} {total === 1 ? 'skill' : 'skills'} on your profile
          </p>
        ) : null}
      </div>

      {total === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          This job doesn&apos;t list any skills yet, so there is nothing to compare.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {matching.map((skill) => (
            <SkillTile key={`matched-${skill}`} skill={skill} matched />
          ))}
          {growing.map((skill) => (
            <SkillTile key={`growing-${skill}`} skill={skill} matched={false} />
          ))}
        </ul>
      )}
    </div>
  )
}
