import { Mail, MapPin, PencilLine, Sparkles } from 'lucide-react'
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
  onEditClick
}: {
  email: string
  name: string | null
  headline: string | null | undefined
  careerLevel: CareerLevel | null | undefined
  location: string | null | undefined
  onEditClick: () => void
}) {
  const isOpenToWork = careerLevel ? OPEN_TO_WORK_LEVELS.has(careerLevel) : false
  const headlineLine = [headline, careerLevel ? CAREER_LEVEL_LABELS[careerLevel] : null].filter(Boolean).join(' · ')

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="h-36 bg-primary sm:h-44" />
      <div className="px-5 pb-5 sm:px-6">
        <div className="-mt-14 sm:-mt-16">
          <Avatar className="size-28 border-4 border-card sm:size-32">
            <AvatarFallback className="bg-primary text-3xl font-medium text-primary-foreground">
              {email ? getInitials(name, email) : ''}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{name ?? email}</h1>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Edit profile"
              onClick={onEditClick}
              className="text-muted-foreground"
            >
              <PencilLine className="size-3.5" />
            </Button>
          </div>
          {headlineLine ? <p className="mt-1 text-sm text-muted-foreground">{headlineLine}</p> : null}

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {location}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <Mail className="size-3.5" />
              {email}
            </span>
          </div>

          {isOpenToWork ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                Open to work
              </Badge>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
