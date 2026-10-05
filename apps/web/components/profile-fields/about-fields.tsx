import { CAREER_LEVEL_LABELS, type CareerLevel } from '@angkop/shared'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ResumeUploadControl } from './resume-upload-control'

export function AboutFields({
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
    <>
      <div className="space-y-1.5">
        <Label>Upload your resume</Label>
        <p className="text-xs text-muted-foreground">
          Optional shortcut — skip manually filling in the fields below if your resume already covers them.
        </p>
        <ResumeUploadControl resumeFileName={resumeFileName} onResumeFileNameChange={onResumeFileNameChange} />
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
    </>
  )
}
