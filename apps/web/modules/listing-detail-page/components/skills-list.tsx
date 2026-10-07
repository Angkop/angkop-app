import { Badge } from '@/components/ui/badge'

export function SkillsList({ skills }: { skills: string[] }) {
  return (
    <div className="mt-6 border-t border-border pt-4">
      <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Skills</h2>
      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <Badge key={skill} className="job-skill">
              {skill}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No skills identified for this listing.</p>
      )}
    </div>
  )
}
