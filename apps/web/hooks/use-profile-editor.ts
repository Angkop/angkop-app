import { useEffect, useMemo } from 'react'
import { gql } from '@apollo/client'
import { useApolloClient, useMutation, useQuery } from '@apollo/client/react'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import type { ParsedResumeProfile } from '@angkop/shared'
import {
  EMPTY_PROFILE_FORM_VALUES,
  buildCompleteOnboardingInput,
  profileEntriesFrom,
  profileFormValuesFromProfile,
  type MeProfile,
  type ProfileFormValues
} from '@/lib/profile-form'
import { profileSchema } from '@/lib/profile-schema'

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

export type { MeProfile }

type MeQueryResult = {
  me: { email: string; name: string | null; profile: MeProfile | null }
}

export function useProfileEditor() {
  const apolloClient = useApolloClient()
  const { data, loading, error, refetch } = useQuery<MeQueryResult>(ME_QUERY)
  const [completeOnboarding, { loading: isMutating, error: saveError }] = useMutation(COMPLETE_ONBOARDING_MUTATION)

  const savedValues = useMemo(
    () => (data?.me.profile ? profileFormValuesFromProfile(data.me.profile) : undefined),
    [data?.me.profile]
  )

  // `values` prefills the form from whatever was saved before. keepDirtyValues stops a later
  // refetch from clobbering what the user has already edited.
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: EMPTY_PROFILE_FORM_VALUES,
    values: savedValues,
    resetOptions: { keepDirtyValues: true }
  })

  // react-hook-form only revalidates on change after a real submit, and the wizard's Continue
  // runs trigger() instead, so a field flagged there would keep its error while the user fixes
  // it. Revalidate just the fields that currently show an error, so they clear as soon as the
  // value is valid without flagging fields the user hasn't finished typing in.
  useEffect(() => {
    const subscription = form.watch((_values, { name }) => {
      if (name && form.getFieldState(name).error) void form.trigger(name)
    })
    return () => subscription.unsubscribe()
  }, [form])

  async function persist(values: ProfileFormValues): Promise<boolean> {
    try {
      await completeOnboarding({ variables: { input: buildCompleteOnboardingInput(values) } })
    } catch (caught) {
      toast.error('Could not save your profile', {
        description: caught instanceof Error ? caught.message : undefined
      })
      return false
    }

    // completeOnboarding only echoes back { id }, so the cache never auto-updates the
    // profile fields — refetch so the read-only view reflects what was just saved. The save
    // already went through, so a failed refetch just falls back to the values we sent.
    const refreshed = await refetch().then(
      (result) => result.data?.me.profile ?? null,
      () => null
    )
    // Reset to the saved values so the form isn't left dirty after a successful save.
    form.reset(refreshed ? profileFormValuesFromProfile(refreshed) : values)
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
    return true
  }

  // Validates first. Resolves to whether the profile was saved; onInvalid lets a caller
  // react to the failing fields (the wizard jumps to the step that holds them).
  async function save(onInvalid?: (errors: FieldErrors<ProfileFormValues>) => void): Promise<boolean> {
    let isSaved = false
    await form.handleSubmit(
      async (values) => {
        isSaved = await persist(values)
      },
      (errors) => {
        toast.error('Some fields need attention', { description: 'Fix the highlighted fields, then save again.' })
        onInvalid?.(errors)
      }
    )()
    return isSaved
  }

  // Saves whatever's filled in without validating — for "Skip onboarding", which means "stop
  // here", not "fix this first". Rows left incomplete are dropped by buildCompleteOnboardingInput.
  function saveDraft(): Promise<boolean> {
    return persist(form.getValues())
  }

  // Fills the in-memory form from a parsed resume — same as a user typing into every
  // field by hand. Nothing is persisted until save() runs via the normal Save/Finish flow.
  // resumeFileName records the actual imported file's name — it's the only place this
  // field is ever set, since Angkop never stores the uploaded file itself. Keeping the
  // saved values as the defaults leaves the form dirty, since the import is unsaved.
  function importParsedResume(parsed: ParsedResumeProfile, fileName: string) {
    form.reset(
      { ...form.getValues(), ...profileEntriesFrom(parsed), resumeFileName: fileName },
      { keepDefaultValues: true }
    )
  }

  return {
    form,
    email: data?.me.email ?? '',
    name: data?.me.name ?? null,
    profile: data?.me.profile ?? null,
    loading,
    error,
    refetch,
    isSaving: isMutating || form.formState.isSubmitting,
    saveError,
    save,
    saveDraft,
    importParsedResume
  }
}

export type ProfileEditor = ReturnType<typeof useProfileEditor>
