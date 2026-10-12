import { FolderGit2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { MeProfile } from '../types'

export function ProjectsSection({ projects }: { projects: MeProfile['projects'] }) {
  if (projects.length === 0) return <p className="text-sm text-muted-foreground">No projects added yet.</p>

  return (
    <div className="flex flex-col gap-4">
      {projects.map((item, index) => (
        <div key={index} className="flex gap-3">
          <FolderGit2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
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
  )
}
