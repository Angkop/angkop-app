import { useState } from 'react'
import { gql } from '@apollo/client'
import { useApolloClient, useMutation, useQuery } from '@apollo/client/react'
import type { CareerLevel, ParsedResumeProfile, UserProfile as SharedUserProfile } from '@angkop/shared'
import {
  EMPTY_CERTIFICATION,
  EMPTY_EDUCATION,
  EMPTY_EXPERIENCE,
  EMPTY_LANGUAGE,
  EMPTY_PREFERENCES,
  EMPTY_PROJECT,
  buildCompleteOnboardingInput,
  makeArrayHelpers,
  monthInputFromIso,
  profileEntriesFromParsedResume,
  type CertificationEntry,
  type EducationEntry,
  type ExperienceEntry,
  type LanguageEntry,
  type PreferencesEntry,
  type ProfileSkillEntry,
  type ProjectEntry
} from '@/lib/profile-form'

const ME_QUERY = gql`
  query ProfileEditorMe {
    me {
      email
      name
      profile {
        headline
        about
        careerLevel
        location
        resumeFileName
        skills {
          name
          category
          level
          years
        }
        education {
          school
          degree
          fieldOfStudy
          startYear
          endYear
          description
        }
        experience {
          title
          company
          location
          employmentType
          description
          startDate
          endDate
          current
        }
        certifications {
          name
          issuer
          issueDate
          expirationDate
          credentialId
          credentialUrl
        }
        projects {
          name
          description
          technologies
          url
          startDate
          endDate
        }
        languages {
          language
          proficiency
        }
        preferences {
          desiredRoles
          preferredLocations
          preferredJobTypes
          preferredIndustries
          workSetup
          minimumSalary
          maximumSalary
          willingToRelocate
          willingToRemote
        }
      }
    }
  }
`

const COMPLETE_ONBOARDING_MUTATION = gql`
  mutation ProfileEditorCompleteOnboarding($input: CompleteOnboardingInput!) {
    completeOnboarding(input: $input) {
      id
    }
  }
`

export type MeProfile = Omit<SharedUserProfile, 'id' | 'userId' | 'skillsText'>

type MeQueryResult = {
  me: { email: string; name: string | null; profile: MeProfile | null }
}

export function useProfileEditor() {
  const apolloClient = useApolloClient()
  const { data, loading, error, refetch } = useQuery<MeQueryResult>(ME_QUERY)
  const [completeOnboarding, { loading: isSaving, error: saveError }] = useMutation(COMPLETE_ONBOARDING_MUTATION)

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

  // Deriving form state from the query result during render (React's documented pattern
  // for this), so the form prefills from whatever was saved before, and editing
  // afterward isn't clobbered by a refetch: https://react.dev/learn/you-might-not-need-an-effect
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

  const educationHelpers = makeArrayHelpers(setEducation, EMPTY_EDUCATION)
  const experienceHelpers = makeArrayHelpers(setExperience, EMPTY_EXPERIENCE)
  const certificationHelpers = makeArrayHelpers(setCertifications, EMPTY_CERTIFICATION)
  const projectHelpers = makeArrayHelpers(setProjects, EMPTY_PROJECT)
  const languageHelpers = makeArrayHelpers(setLanguages, EMPTY_LANGUAGE)

  async function submit() {
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
    // completeOnboarding only echoes back { id }, so the cache never auto-updates the
    // profile fields — refetch so the read-only view reflects what was just saved.
    await refetch()
    // Every one of these reads a hybrid/semantic score or a skill gap computed from the
    // profile that just changed. The server recomputes them fine (see completeOnboarding's
    // Redis cache invalidation), but Apollo's own cache doesn't know they're stale and would
    // otherwise keep serving the old numbers to any page that reads them next - evict so the
    // next read for each goes to the network instead.
    apolloClient.cache.evict({ fieldName: 'jobMatches' })
    apolloClient.cache.evict({ fieldName: 'jobMatchInsight' })
    apolloClient.cache.evict({ fieldName: 'savedJobs' })
    apolloClient.cache.evict({ fieldName: 'skillGaps' })
    apolloClient.cache.gc()
  }

  // Fills in-memory form state from a parsed resume — same as a user typing into every
  // field by hand. Nothing is persisted until submit() runs via the normal Save/Finish flow.
  // resumeFileName records the actual imported file's name — it's the only place this
  // field is ever set, since Angkop never stores the uploaded file itself.
  function importParsedResume(parsed: ParsedResumeProfile, fileName: string) {
    const fields = profileEntriesFromParsedResume(parsed)
    setHeadline(fields.headline)
    setAbout(fields.about)
    setCareerLevel(fields.careerLevel)
    setLocation(fields.location)
    setSkills(fields.skills)
    educationHelpers.replaceAll(fields.education)
    experienceHelpers.replaceAll(fields.experience)
    certificationHelpers.replaceAll(fields.certifications)
    projectHelpers.replaceAll(fields.projects)
    languageHelpers.replaceAll(fields.languages)
    setResumeFileName(fileName)
  }

  return {
    email: data?.me.email ?? '',
    name: data?.me.name ?? null,
    profile: data?.me.profile ?? null,
    loading,
    error,
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
    submit,
    importParsedResume
  }
}

export type ProfileEditor = ReturnType<typeof useProfileEditor>
