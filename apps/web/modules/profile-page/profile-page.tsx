'use client'

import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { AboutFields } from '@/components/profile-fields/about-fields'
import { SkillsFields } from '@/components/profile-fields/skills-fields'
import { EducationFields } from '@/components/profile-fields/education-fields'
import { ExperienceFields } from '@/components/profile-fields/experience-fields'
import { CertificationsFields } from '@/components/profile-fields/certifications-fields'
import { ProjectsFields } from '@/components/profile-fields/projects-fields'
import { LanguagesFields } from '@/components/profile-fields/languages-fields'
import { PreferencesFields } from '@/components/profile-fields/preferences-fields'
import { Button } from '@/components/ui/button'
import { StatStrip } from '@/components/stat-strip'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { ErrorMessage } from '@/components/error-message'
import { ResumeImportDialog } from '@/components/resume-import-dialog'
import { useProfileEditor } from '@/hooks/use-profile-editor'
import { ProfileHeader } from './components/profile-header'
import { ExperienceSection } from './components/experience-section'
import { EducationSection } from './components/education-section'
import { SkillsSection } from './components/skills-section'
import { CertificationsSection } from './components/certifications-section'
import { ProjectsSection } from './components/projects-section'
import { LanguagesSection } from './components/languages-section'
import { PreferencesSection } from './components/preferences-section'
import { ProfileFieldSection } from './components/profile-field-section'
import { APPLIED_JOB_COUNT_QUERY } from './queries'
import type { AppliedJobCountQueryResult } from './types'

export function ProfilePage() {
  const editor = useProfileEditor()
  const { data: appliedJobCountData } = useQuery<AppliedJobCountQueryResult>(APPLIED_JOB_COUNT_QUERY)
  const [isEditing, setIsEditing] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [isResumeDialogOpen, setIsResumeDialogOpen] = useState(false)

  if (editor.loading) return <LoadingSkeleton heightClassName="h-48" />
  if (editor.error) return <ErrorMessage>Could not load profile: {editor.error.message}</ErrorMessage>

  const profile = editor.profile
  const jobsAppliedCount = appliedJobCountData?.appliedJobCount ?? 0

  async function handleSave() {
    setSavedMessage(null)
    await editor.submit()
    setSavedMessage('Profile saved. New match scores will reflect this on next load.')
    setIsEditing(false)
  }

  function handleCancel() {
    setSavedMessage(null)
    setIsEditing(false)
  }

  return (
    <div>
      <ProfileHeader
        email={editor.email}
        name={editor.name}
        headline={profile?.headline}
        careerLevel={profile?.careerLevel}
        location={profile?.location}
        onEditClick={() => setIsEditing(true)}
        onImportResumeClick={() => setIsResumeDialogOpen(true)}
      />

      <ResumeImportDialog
        open={isResumeDialogOpen}
        onOpenChange={setIsResumeDialogOpen}
        onImport={(parsed, fileName) => {
          editor.importParsedResume(parsed, fileName)
          setIsEditing(true)
        }}
      />

      <div className="mt-4">
        <StatStrip
          items={[
            { label: 'Skills listed', value: profile?.skills.length ?? 0 },
            { label: 'Jobs applied', value: jobsAppliedCount },
            { label: 'Experience', value: profile?.experience.length ?? 0 }
          ]}
        />
      </div>

      {isEditing ? (
        <div className="scroll-mt-6">
          <ProfileFieldSection title="About">
            <AboutFields
              headline={editor.headline}
              onHeadlineChange={editor.setHeadline}
              careerLevel={editor.careerLevel}
              onCareerLevelChange={editor.setCareerLevel}
              location={editor.location}
              onLocationChange={editor.setLocation}
              about={editor.about}
              onAboutChange={editor.setAbout}
            />
          </ProfileFieldSection>

          <ProfileFieldSection title="Skills">
            <SkillsFields skills={editor.skills} setSkills={editor.setSkills} />
          </ProfileFieldSection>

          <ProfileFieldSection title="Education">
            <EducationFields education={editor.education} educationHelpers={editor.educationHelpers} />
          </ProfileFieldSection>

          <ProfileFieldSection title="Experience">
            <ExperienceFields experience={editor.experience} experienceHelpers={editor.experienceHelpers} />
          </ProfileFieldSection>

          <ProfileFieldSection title="Certifications">
            <CertificationsFields
              certifications={editor.certifications}
              certificationHelpers={editor.certificationHelpers}
            />
          </ProfileFieldSection>

          <ProfileFieldSection title="Projects">
            <ProjectsFields projects={editor.projects} projectHelpers={editor.projectHelpers} />
          </ProfileFieldSection>

          <ProfileFieldSection title="Languages">
            <LanguagesFields languages={editor.languages} languageHelpers={editor.languageHelpers} />
          </ProfileFieldSection>

          <ProfileFieldSection title="Looking for">
            <PreferencesFields preferences={editor.preferences} setPreferences={editor.setPreferences} />
          </ProfileFieldSection>

          <div className="sticky bottom-0 -mx-5 -mb-5 border-t border-border bg-card px-5 pt-4 pb-5">
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={handleSave} disabled={editor.isSaving}>
                {editor.isSaving ? 'Saving…' : 'Save changes'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel} disabled={editor.isSaving}>
                Cancel
              </Button>
            </div>
            {editor.saveError ? (
              <ErrorMessage>Could not save your profile: {editor.saveError.message}</ErrorMessage>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <Accordion type="multiple" defaultValue={['about']} className="mt-4 rounded-lg border border-border px-5">
            <AccordionItem value="about">
              <AccordionTrigger className="font-display font-medium text-foreground">About</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm whitespace-pre-wrap text-foreground">
                  {profile?.about || 'Nothing added yet — click Edit to introduce yourself.'}
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="experience">
              <AccordionTrigger className="font-display font-medium text-foreground">Experience</AccordionTrigger>
              <AccordionContent>
                <ExperienceSection experience={profile?.experience ?? []} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="education">
              <AccordionTrigger className="font-display font-medium text-foreground">Education</AccordionTrigger>
              <AccordionContent>
                <EducationSection education={profile?.education ?? []} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="skills">
              <AccordionTrigger className="font-display font-medium text-foreground">
                Skills ({profile?.skills.length ?? 0})
              </AccordionTrigger>
              <AccordionContent>
                <SkillsSection skills={profile?.skills ?? []} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="certifications">
              <AccordionTrigger className="font-display font-medium text-foreground">
                Certifications ({profile?.certifications.length ?? 0})
              </AccordionTrigger>
              <AccordionContent>
                <CertificationsSection certifications={profile?.certifications ?? []} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="projects">
              <AccordionTrigger className="font-display font-medium text-foreground">
                Projects ({profile?.projects.length ?? 0})
              </AccordionTrigger>
              <AccordionContent>
                <ProjectsSection projects={profile?.projects ?? []} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="languages">
              <AccordionTrigger className="font-display font-medium text-foreground">
                Languages ({profile?.languages.length ?? 0})
              </AccordionTrigger>
              <AccordionContent>
                <LanguagesSection languages={profile?.languages ?? []} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="preferences">
              <AccordionTrigger className="font-display font-medium text-foreground">Looking for</AccordionTrigger>
              <AccordionContent>
                <PreferencesSection preferences={profile?.preferences ?? null} resumeFileName={profile?.resumeFileName} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {savedMessage ? <p className="mt-4 text-sm text-muted-foreground">{savedMessage}</p> : null}
        </>
      )}
    </div>
  )
}
