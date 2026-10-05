import type { Dispatch, SetStateAction } from 'react'
import { SkillsFields } from '@/components/profile-fields/skills-fields'
import type { ProfileSkillEntry } from '@/lib/profile-form'
import { StepSection } from './step-section'

export function SkillsStep({
  skills,
  setSkills
}: {
  skills: ProfileSkillEntry[]
  setSkills: Dispatch<SetStateAction<ProfileSkillEntry[]>>
}) {
  return (
    <StepSection
      title="Skills"
      description="Add the skills, tools, and technologies you'd put on a resume. The more specific, the better your matches."
    >
      <SkillsFields skills={skills} setSkills={setSkills} />
    </StepSection>
  )
}
