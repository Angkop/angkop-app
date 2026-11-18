import { Mail, MapPin, PencilLine, Upload } from 'lucide-react'
import { CAREER_LEVEL_LABELS, type CareerLevel } from '@angkop/shared'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/lib/utils'
import { OPEN_TO_WORK_LEVELS } from '../constants'

export function ProfileHeader({
  email,
  name,
  headline,
  careerLevel,
  location,
  isEditing,
  onEditClick,
  onImportResumeClick
}: {
  email: string
  name: string | null
  headline: string | null | undefined
  careerLevel: CareerLevel | null | undefined
  location: string | null | undefined
  isEditing: boolean
  onEditClick: () => void
  onImportResumeClick: () => void
}) {
  const isOpenToWork = careerLevel ? OPEN_TO_WORK_LEVELS.has(careerLevel) : false
  const headlineLine = [headline, careerLevel ? CAREER_LEVEL_LABELS[careerLevel] : null].filter(Boolean).join(' · ')

  return (
    <section aria-label="Profile summary">
      <div className="flex items-start gap-4">
        <Avatar className="size-16 shrink-0">
          <AvatarFallback className="bg-primary text-xl font-medium text-primary-foreground">
            {email ? getInitials(name, email) : ''}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-xl font-medium tracking-tight text-foreground">
            {name ?? email}
          </h3>
          {headlineLine ? <p className="mt-0.5 text-sm text-muted-foreground">{headlineLine}</p> : null}

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0" />
                {location}
              </span>
            ) : null}
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Mail className="size-3.5 shrink-0" />
              <span className="truncate">{email}</span>
            </span>
          </div>

          {isOpenToWork ? (
            <Badge variant="outline" className="mt-3">
              Open to work
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {isEditing ? null : (
          <Button type="button" onClick={onEditClick}>
            <PencilLine className="size-3.5" />
            Edit Profile
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onImportResumeClick}>
          <Upload className="size-3.5" />
          Import Resume
        </Button>
      </div>
    </section>
  )
}
