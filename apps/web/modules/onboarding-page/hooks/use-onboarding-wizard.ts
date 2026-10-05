import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@apollo/client/react'
import type { CareerLevel } from '@angkop/shared'
import { supabaseClient } from '@/lib/supabase-client'
import type {
  CertificationEntry,
  EducationEntry,
  ExperienceEntry,
  LanguageEntry,
  PreferencesEntry,
  ProfileSkillEntry,
  ProjectEntry
} from '@/lib/onboarding-profile'
import {
  EMPTY_CERTIFICATION,
  EMPTY_EDUCATION,
  EMPTY_EXPERIENCE,
  EMPTY_LANGUAGE,
  EMPTY_PREFERENCES,
  EMPTY_PROJECT,
  STEPS
} from '../constants'
import { buildCompleteOnboardingInput, makeArrayHelpers, monthInputFromIso } from '../utils'
import { COMPLETE_ONBOARDING_MUTATION, ME_QUERY } from '../queries'
import type { MeProfile, MeQueryResult } from '../types'

export function useOnboardingWizard() {
  const router = useRouter()
  const { data } = useQuery<MeQueryResult>(ME_QUERY)
  const [completeOnboarding, { loading: isSaving, error: saveError }] = useMutation(COMPLETE_ONBOARDING_MUTATION)
  const [isChecking, setIsChecking] = useState(true)
  const [step, setStep] = useState(0)

  const [headline, setHeadline] = useState('')
  const [about, setAbout] = useState('')
  const [careerLevel, setCareerLevel] = useState<CareerLevel | ''>('')
  const [location, setLocation] = useState('')
  const [skills, setSkills] = useState<ProfileSkillEntry[]>([])
  const [education, setEducation] = useState<EducationEntry[]>([EMPTY_EDUCATION])
  const [experience, setExperience] = useState<ExperienceEntry[]>([])
  const [certifications, setCertifications] = useState<CertificationEntry[]>([])
  const [projects, setProjects] = useState<ProjectEntry[]>([])
  const [languages, setLanguages] = useState<LanguageEntry[]>([])
  const [preferences, setPreferences] = useState<PreferencesEntry>(EMPTY_PREFERENCES)
  const [resumeFileName, setResumeFileName] = useState('')

  const [loadedProfile, setLoadedProfile] = useState<MeProfile | null | undefined>(undefined)

  useEffect(() => {
    let isMounted = true

    // Right after the Google redirect lands here, Supabase is still parsing the auth
    // tokens out of the URL — getSession() awaits that before resolving, so this won't
    // bounce the user back to "/" while the session is still being established.
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return
      if (!session) {
        router.replace('/')
        return
      }
      setIsChecking(false)
    })

    return () => {
      isMounted = false
    }
  }, [router])

  // Deriving wizard state from the query result during render (React's documented
  // pattern for this — see profile-page.tsx), so the wizard prefills from whatever was
  // saved before, and re-entering it later doubles as "edit my profile."
  if (data?.me.profile && data.me.profile !== loadedProfile) {
    const profile = data.me.profile
    setLoadedProfile(profile)
    setHeadline(profile.headline ?? '')
    setAbout(profile.about ?? '')
    setCareerLevel(profile.careerLevel ?? '')
    setLocation(profile.location ?? '')
    setResumeFileName(profile.resumeFileName ?? '')
    setSkills(
      profile.skills.map((skill) => ({
        name: skill.name,
        category: skill.category ?? undefined,
        level: skill.level ?? undefined,
        years: skill.years ?? undefined
      }))
    )
    setEducation(
      profile.education.length > 0
        ? profile.education.map((entry) => ({
            school: entry.school,
            degree: entry.degree ?? '',
            fieldOfStudy: entry.fieldOfStudy ?? '',
            startYear: entry.startYear ? String(entry.startYear) : '',
            endYear: entry.endYear ? String(entry.endYear) : '',
            description: entry.description ?? ''
          }))
        : [EMPTY_EDUCATION]
    )
    setExperience(
      profile.experience.map((entry) => ({
        title: entry.title,
        company: entry.company,
        location: entry.location ?? '',
        employmentType: entry.employmentType ?? undefined,
        description: entry.description ?? '',
        startDate: monthInputFromIso(entry.startDate),
        endDate: monthInputFromIso(entry.endDate),
        current: entry.current
      }))
    )
    setCertifications(
      profile.certifications.map((entry) => ({
        name: entry.name,
        issuer: entry.issuer,
        issueDate: monthInputFromIso(entry.issueDate),
        expirationDate: monthInputFromIso(entry.expirationDate),
        credentialId: entry.credentialId ?? '',
        credentialUrl: entry.credentialUrl ?? ''
      }))
    )
    setProjects(
      profile.projects.map((entry) => ({
        name: entry.name,
        description: entry.description,
        technologies: entry.technologies,
        url: entry.url ?? '',
        startDate: monthInputFromIso(entry.startDate),
        endDate: monthInputFromIso(entry.endDate)
      }))
    )
    setLanguages(
      profile.languages.map((entry) => ({ language: entry.language, proficiency: entry.proficiency ?? undefined }))
    )
    if (profile.preferences) {
      setPreferences({
        desiredRoles: profile.preferences.desiredRoles,
        preferredLocations: profile.preferences.preferredLocations,
        preferredJobTypes: profile.preferences.preferredJobTypes,
        preferredIndustries: profile.preferences.preferredIndustries,
        workSetup: profile.preferences.workSetup ?? undefined,
        minimumSalary: profile.preferences.minimumSalary != null ? String(profile.preferences.minimumSalary) : '',
        maximumSalary: profile.preferences.maximumSalary != null ? String(profile.preferences.maximumSalary) : '',
        willingToRelocate: profile.preferences.willingToRelocate,
        willingToRemote: profile.preferences.willingToRemote
      })
    }
  }

  const email = data?.me.email ?? ''
  const name = data?.me.name ?? null
  const activeStep = STEPS[step]
  const progress = Math.round(((step + 1) / STEPS.length) * 100)
  const canContinue = step !== 0 || careerLevel !== ''

  const educationHelpers = makeArrayHelpers(setEducation, EMPTY_EDUCATION)
  const experienceHelpers = makeArrayHelpers(setExperience, EMPTY_EXPERIENCE)
  const certificationHelpers = makeArrayHelpers(setCertifications, EMPTY_CERTIFICATION)
  const projectHelpers = makeArrayHelpers(setProjects, EMPTY_PROJECT)
  const languageHelpers = makeArrayHelpers(setLanguages, EMPTY_LANGUAGE)

  function goNext() {
    setStep((current) => Math.min(current + 1, STEPS.length - 1))
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 0))
  }

  // Finishing and skipping both save whatever's been filled in so far and land on the
  // dashboard — "skip" just means "stop here," not "discard this." Either one is enough
  // for /auth/callback to treat this user as already onboarded next time they sign in.
  async function saveAndGoToDashboard() {
    const input = buildCompleteOnboardingInput({
      headline,
      about,
      location,
      careerLevel,
      resumeFileName,
      skills,
      education,
      experience,
      certifications,
      projects,
      languages,
      preferences
    })
    await completeOnboarding({ variables: { input } })
    router.push('/dashboard')
  }

  async function handleFinish() {
    await saveAndGoToDashboard()
  }

  async function handleSkip() {
    await saveAndGoToDashboard()
  }

  return {
    isChecking,
    email,
    name,
    step,
    setStep,
    activeStep,
    progress,
    canContinue,
    goNext,
    goBack,
    headline,
    setHeadline,
    about,
    setAbout,
    careerLevel,
    setCareerLevel,
    location,
    setLocation,
    skills,
    setSkills,
    education,
    educationHelpers,
    experience,
    experienceHelpers,
    certifications,
    certificationHelpers,
    projects,
    projectHelpers,
    languages,
    languageHelpers,
    preferences,
    setPreferences,
    resumeFileName,
    setResumeFileName,
    isSaving,
    saveError,
    handleFinish,
    handleSkip
  }
}

export type OnboardingWizard = ReturnType<typeof useOnboardingWizard>
