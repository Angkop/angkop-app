import type { ReactNode } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ExperienceSection } from './experience-section'
import { EducationSection } from './education-section'
import { SkillsSection } from './skills-section'
import { CertificationsSection } from './certifications-section'
import { ProjectsSection } from './projects-section'
import { LanguagesSection } from './languages-section'
import { PreferencesSection } from './preferences-section'
import type { MeProfile } from '../types'

type ProfileSectionDef = {
  value: string
  title: string
  // Shown in parentheses after the title when set.
  count?: (profile: MeProfile | null) => number
  render: (profile: MeProfile | null) => ReactNode
}

const PROFILE_SECTIONS: ProfileSectionDef[] = [
  {
    value: 'about',
    title: 'About',
    render: (profile) =>
      profile?.about ? (
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{profile.about}</p>
      ) : (
        <p className="text-sm text-muted-foreground">Nothing added yet. Select Edit Profile to introduce yourself.</p>
      )
  },
  {
    value: 'experience',
    title: 'Experience',
    render: (profile) => <ExperienceSection experience={profile?.experience ?? []} />
  },
  {
    value: 'education',
    title: 'Education',
    render: (profile) => <EducationSection education={profile?.education ?? []} />
  },
  {
    value: 'skills',
    title: 'Skills',
    count: (profile) => profile?.skills.length ?? 0,
    render: (profile) => <SkillsSection skills={profile?.skills ?? []} />
  },
  {
    value: 'certifications',
    title: 'Certifications',
    count: (profile) => profile?.certifications.length ?? 0,
    render: (profile) => <CertificationsSection certifications={profile?.certifications ?? []} />
  },
  {
    value: 'projects',
    title: 'Projects',
    count: (profile) => profile?.projects.length ?? 0,
    render: (profile) => <ProjectsSection projects={profile?.projects ?? []} />
  },
  {
    value: 'languages',
    title: 'Languages',
    count: (profile) => profile?.languages.length ?? 0,
    render: (profile) => <LanguagesSection languages={profile?.languages ?? []} />
  },
  {
    value: 'preferences',
    title: 'Looking for',
    render: (profile) => (
      <PreferencesSection preferences={profile?.preferences ?? null} resumeFileName={profile?.resumeFileName} />
    )
  }
]

export function ProfileSections({ profile }: { profile: MeProfile | null }) {
  return (
    <Accordion type="multiple" defaultValue={['about']} className="mt-4 rounded-lg border border-border px-5">
      {PROFILE_SECTIONS.map((section) => (
        <AccordionItem key={section.value} value={section.value}>
          <AccordionTrigger className="font-display font-medium text-foreground">
            {section.count ? `${section.title} (${section.count(profile)})` : section.title}
          </AccordionTrigger>
          <AccordionContent>{section.render(profile)}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
