'use client'

import { useState, type ComponentType } from 'react'
import dynamic from 'next/dynamic'
import { FormProvider } from 'react-hook-form'
import { useQuery } from '@apollo/client/react'
import { AboutFields } from '@/components/profile-fields/about-fields'
import { SkillsFields } from '@/components/profile-fields/skills-fields'
import { EducationFields } from '@/components/profile-fields/education-fields'
import { ExperienceFields } from '@/components/profile-fields/experience-fields'
import { CertificationsFields } from '@/components/profile-fields/certifications-fields'
import { ProjectsFields } from '@/components/profile-fields/projects-fields'
import { LanguagesFields } from '@/components/profile-fields/languages-fields'
import { PreferencesFields } from '@/components/profile-fields/preferences-fields'
import { StatStrip } from '@/components/stat-strip'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { ErrorMessage } from '@/components/error-message'
import type { ProfileEditor } from '@/hooks/use-profile-editor'
import { ProfileHeader } from './components/profile-header'
import { ProfileFieldSection } from './components/profile-field-section'
import { ProfileSections } from './components/profile-sections'
import { APPLIED_JOB_COUNT_QUERY } from './queries'
import type { AppliedJobCountQueryResult } from './types'

// Only needed once the user actually opens this dialog, not on every profile-editor
// mount - no reason for its code to ship as part of this (already lazily-loaded, see
// app-shell.tsx) module's own bundle either.
const ResumeImportDialog = dynamic(
  () => import('@/components/resume-import-dialog').then((mod) => mod.ResumeImportDialog),
  { ssr: false }
)

const EDIT_SECTIONS: { title: string; Fields: ComponentType }[] = [
  { title: 'About', Fields: AboutFields },
  { title: 'Skills', Fields: SkillsFields },
  { title: 'Education', Fields: EducationFields },
  { title: 'Experience', Fields: ExperienceFields },
  { title: 'Certifications', Fields: CertificationsFields },
  { title: 'Projects', Fields: ProjectsFields },
  { title: 'Languages', Fields: LanguagesFields },
  { title: 'Looking for', Fields: PreferencesFields }
]

// The editor and the edit/view switch live in ProfileSheet, which needs them to guard
// against closing with unsaved changes and to pin the save bar outside the scroll area.
export function ProfilePage({
  editor,
  isEditing,
  onEditStart
}: {
  editor: ProfileEditor
  isEditing: boolean
  onEditStart: () => void
}) {
  const { data: appliedJobCountData } = useQuery<AppliedJobCountQueryResult>(APPLIED_JOB_COUNT_QUERY)
  const [isResumeDialogOpen, setIsResumeDialogOpen] = useState(false)

  if (editor.loading) return <LoadingSkeleton rows={3} heightClassName="h-28" />
  if (editor.error) {
    return (
      <ErrorMessage onRetry={editor.refetch} retryLabel="Reload Profile">
        Could not load profile: {editor.error.message}
      </ErrorMessage>
    )
  }

  const profile = editor.profile

  return (
    <div>
      <ProfileHeader
        email={editor.email}
        name={editor.name}
        headline={profile?.headline}
        careerLevel={profile?.careerLevel}
        location={profile?.location}
        isEditing={isEditing}
        onEditClick={onEditStart}
        onImportResumeClick={() => setIsResumeDialogOpen(true)}
      />

      <ResumeImportDialog
        open={isResumeDialogOpen}
        onOpenChange={setIsResumeDialogOpen}
        onImport={(parsed, fileName) => {
          editor.importParsedResume(parsed, fileName)
          onEditStart()
        }}
      />

      <div className="mt-4">
        <StatStrip
          items={[
            { label: 'Skills listed', value: profile?.skills.length ?? 0 },
            // A dash until the count arrives (or if it fails), never a made-up 0.
            { label: 'Jobs applied', value: appliedJobCountData ? appliedJobCountData.appliedJobCount : '–' },
            { label: 'Experience', value: profile?.experience.length ?? 0 }
          ]}
        />
      </div>

      {isEditing ? (
        <FormProvider {...editor.form}>
          {EDIT_SECTIONS.map(({ title, Fields }) => (
            <ProfileFieldSection key={title} title={title}>
              <Fields />
            </ProfileFieldSection>
          ))}
        </FormProvider>
      ) : (
        <ProfileSections profile={profile} />
      )}
    </div>
  )
}
