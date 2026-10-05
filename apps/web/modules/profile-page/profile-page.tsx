'use client'

import { useRef } from 'react'
import { useQuery } from '@apollo/client/react'
import { Briefcase, ClipboardList, Sparkles } from 'lucide-react'
import { StatCard } from '@/components/stat-card'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { ErrorMessage } from '@/components/error-message'
import { ProfileHeader } from './components/profile-header'
import { ExperienceSection } from './components/experience-section'
import { EducationSection } from './components/education-section'
import { SkillsSection } from './components/skills-section'
import { CertificationsSection } from './components/certifications-section'
import { ProjectsSection } from './components/projects-section'
import { LanguagesSection } from './components/languages-section'
import { PreferencesSection } from './components/preferences-section'
import { EditAboutForm } from './components/edit-about-form'
import { ME_QUERY, SAVED_JOBS_STATUS_QUERY } from './queries'
import type { MeQueryResult, SavedJobsStatusQueryResult } from './types'

export function ProfilePage() {
  const { data, loading, error } = useQuery<MeQueryResult>(ME_QUERY)
  const { data: savedJobsData } = useQuery<SavedJobsStatusQueryResult>(SAVED_JOBS_STATUS_QUERY)
  const editSectionRef = useRef<HTMLDivElement>(null)

  if (loading) return <LoadingSkeleton heightClassName="h-48" />
  if (error) return <ErrorMessage>Could not load profile: {error.message}</ErrorMessage>

  const email = data?.me.email ?? ''
  const name = data?.me.name ?? null
  const profile = data?.me.profile ?? null
  const jobsAppliedCount = (savedJobsData?.savedJobs ?? []).filter((saved) => saved.status !== 'PENDING').length

  function scrollToEdit() {
    editSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div>
      <ProfileHeader
        email={email}
        name={name}
        headline={profile?.headline}
        careerLevel={profile?.careerLevel}
        location={profile?.location}
        onEditClick={scrollToEdit}
      />

      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatCard label="Skills listed" value={profile?.skills.length ?? 0} icon={Sparkles} />
        <StatCard label="Jobs applied" value={jobsAppliedCount} icon={ClipboardList} />
        <StatCard label="Experience" value={profile?.experience.length ?? 0} icon={Briefcase} />
      </div>

      <div className="mt-4 rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold text-foreground">About</h2>
        <p className="mt-2 text-sm whitespace-pre-wrap text-foreground">
          {profile?.about || 'Nothing added yet — edit your profile below to introduce yourself.'}
        </p>
      </div>

      <ExperienceSection experience={profile?.experience ?? []} />
      <EducationSection education={profile?.education ?? []} />
      <SkillsSection skills={profile?.skills ?? []} />
      <CertificationsSection certifications={profile?.certifications ?? []} />
      <ProjectsSection projects={profile?.projects ?? []} />
      <LanguagesSection languages={profile?.languages ?? []} />
      <PreferencesSection preferences={profile?.preferences ?? null} resumeFileName={profile?.resumeFileName} />

      <div ref={editSectionRef} className="mt-4 scroll-mt-6 rounded-lg border border-border p-5">
        <EditAboutForm about={profile?.about} />
      </div>
    </div>
  )
}
