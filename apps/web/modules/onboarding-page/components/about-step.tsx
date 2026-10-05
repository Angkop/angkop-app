import type { CareerLevel } from '@angkop/shared'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AboutFields } from '@/components/profile-fields/about-fields'
import { getInitials } from '@/lib/utils'
import { StepSection } from './step-section'

export function AboutStep({
  email,
  name,
  headline,
  onHeadlineChange,
  careerLevel,
  onCareerLevelChange,
  location,
  onLocationChange,
  about,
  onAboutChange,
  resumeFileName,
  onResumeFileNameChange
}: {
  email: string
  name: string | null
  headline: string
  onHeadlineChange: (value: string) => void
  careerLevel: CareerLevel | ''
  onCareerLevelChange: (value: CareerLevel) => void
  location: string
  onLocationChange: (value: string) => void
  about: string
  onAboutChange: (value: string) => void
  resumeFileName: string
  onResumeFileNameChange: (value: string) => void
}) {
  return (
    <StepSection title="About you" description="A little context so we can start narrowing down what fits.">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
        <Avatar className="size-10">
          <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
            {email ? getInitials(name, email) : ''}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{name ?? email}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
      </div>

      <AboutFields
        headline={headline}
        onHeadlineChange={onHeadlineChange}
        careerLevel={careerLevel}
        onCareerLevelChange={onCareerLevelChange}
        location={location}
        onLocationChange={onLocationChange}
        about={about}
        onAboutChange={onAboutChange}
        resumeFileName={resumeFileName}
        onResumeFileNameChange={onResumeFileNameChange}
      />
    </StepSection>
  )
}
