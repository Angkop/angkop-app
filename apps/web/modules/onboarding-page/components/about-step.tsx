import { CAREER_LEVEL_LABELS, type CareerLevel } from '@angkop/shared'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  onAboutChange
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

      <div className="space-y-1.5">
        <Label htmlFor="headline">Headline</Label>
        <Input
          id="headline"
          value={headline}
          onChange={(event) => onHeadlineChange(event.target.value)}
          placeholder="e.g. Front-End Developer"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="career-level">Where are you in your career?</Label>
        <Select value={careerLevel} onValueChange={(value) => onCareerLevelChange(value as CareerLevel)}>
          <SelectTrigger id="career-level" className="w-full">
            <SelectValue placeholder="Select one" />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(CAREER_LEVEL_LABELS) as [CareerLevel, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="location">Where are you based?</Label>
        <Input
          id="location"
          value={location}
          onChange={(event) => onLocationChange(event.target.value)}
          placeholder="e.g. Muntinlupa City, Metro Manila"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="about">About</Label>
        <Textarea
          id="about"
          value={about}
          onChange={(event) => onAboutChange(event.target.value)}
          rows={4}
          placeholder="A short introduction — what you do and what you're looking for."
        />
      </div>
    </StepSection>
  )
}
