// Says what is missing and where to add it, so an empty section is never a dead end.
export function SectionEmpty({ noun }: { noun: string }) {
  return (
    <p className="text-sm text-muted-foreground">No {noun} added yet. Select Edit Profile to add some.</p>
  )
}
