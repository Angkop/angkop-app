import type { SkillGap } from '@angkop/shared'

export function SkillGapCard({ gap }: { gap: SkillGap }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-sm font-medium text-foreground">Add {gap.skill}</p>
      {gap.courses.length > 0 ? (
        <div className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3">
          {gap.courses.map((course) => (
            <a
              key={course.url}
              href={course.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-foreground hover:text-primary"
            >
              {course.title} — {course.provider}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  )
}
