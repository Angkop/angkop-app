export function SkillGapsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 2 }, (_, index) => (
        <div key={index} className="h-44 animate-pulse rounded-lg border border-border bg-muted" />
      ))}
    </div>
  )
}
