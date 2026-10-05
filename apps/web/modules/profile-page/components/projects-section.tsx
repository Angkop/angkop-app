import { FolderGit2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { MeProfile } from '../types'

export function ProjectsSection({ projects }: { projects: MeProfile['projects'] }) {
  return (
    <div className="mt-4 rounded-lg border border-border p-5">
      <h2 className="text-sm font-semibold text-foreground">Projects ({projects.length})</h2>
      {projects.length > 0 ? (
        <div className="mt-3 flex flex-col gap-4">
          {projects.map((item, index) => (
            <div key={index} className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <FolderGit2 className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                <p className="mt-1 text-sm whitespace-pre-wrap text-foreground">{item.description}</p>
                {item.technologies.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.technologies.map((tech) => (
                      <Badge key={tech} variant="secondary">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No projects added yet.</p>
      )}
    </div>
  )
}
