'use client'

import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { Briefcase, ClipboardList, Sparkles } from 'lucide-react'
import { AboutFields } from '@/components/profile-fields/about-fields'
import { SkillsFields } from '@/components/profile-fields/skills-fields'
import { EducationFields } from '@/components/profile-fields/education-fields'
import { ExperienceFields } from '@/components/profile-fields/experience-fields'
import { CertificationsFields } from '@/components/profile-fields/certifications-fields'
import { ProjectsFields } from '@/components/profile-fields/projects-fields'
import { LanguagesFields } from '@/components/profile-fields/languages-fields'
import { PreferencesFields } from '@/components/profile-fields/preferences-fields'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/stat-card'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { ErrorMessage } from '@/components/error-message'
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
import { SAVED_JOBS_STATUS_QUERY } from './queries'
import type { SavedJobsStatusQueryResult } from './types'

export function ProfilePage() {
  const editor = useProfileEditor()
  const { data: savedJobsData } = useQuery<SavedJobsStatusQueryResult>(SAVED_JOBS_STATUS_QUERY)
  const [isEditing, setIsEditing] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  if (editor.loading) return <LoadingSkeleton heightClassName="h-48" />
  if (editor.error) return <ErrorMessage>Could not load profile: {editor.error.message}</ErrorMessage>

  const profile = editor.profile
  const jobsAppliedCount = (savedJobsData?.savedJobs ?? []).filter((saved) => saved.status !== 'PENDING').length

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
      />

      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatCard label="Skills listed" value={profile?.skills.length ?? 0} icon={Sparkles} />
        <StatCard label="Jobs applied" value={jobsAppliedCount} icon={ClipboardList} />
        <StatCard label="Experience" value={profile?.experience.length ?? 0} icon={Briefcase} />
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
              resumeFileName={editor.resumeFileName}
              onResumeFileNameChange={editor.setResumeFileName}
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

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
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
      ) : (
        <>
          <div className="mt-4 rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground">About</h2>
            <p className="mt-2 text-sm whitespace-pre-wrap text-foreground">
              {profile?.about || 'Nothing added yet — click Edit to introduce yourself.'}
            </p>
          </div>

          <ExperienceSection experience={profile?.experience ?? []} />
          <EducationSection education={profile?.education ?? []} />
          <SkillsSection skills={profile?.skills ?? []} />
          <CertificationsSection certifications={profile?.certifications ?? []} />
          <ProjectsSection projects={profile?.projects ?? []} />
          <LanguagesSection languages={profile?.languages ?? []} />
          <PreferencesSection preferences={profile?.preferences ?? null} resumeFileName={profile?.resumeFileName} />

          {savedMessage ? <p className="mt-4 text-sm text-muted-foreground">{savedMessage}</p> : null}
        </>
      )}
    </div>
  )
}
