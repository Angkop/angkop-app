import { useEffect, useState } from 'react'
import { getListingSkills } from '@/lib/jobs-api'

// The skill dropdown's options barely change between ingestion runs, so one request per
// browser session is enough. Failures and empty results aren't kept, so the next mount tries
// again instead of leaving the dropdown empty until a full reload.
let skillsRequest: Promise<string[]> | null = null

function loadSkills(): Promise<string[]> {
  if (!skillsRequest) {
    skillsRequest = getListingSkills()
      .catch(() => [])
      .then((skills) => {
        if (skills.length === 0) skillsRequest = null
        return skills
      })
  }
  return skillsRequest
}

export function useListingSkills(): string[] {
  const [skills, setSkills] = useState<string[]>([])

  useEffect(() => {
    let isMounted = true
    loadSkills().then((loaded) => {
      if (isMounted) setSkills(loaded)
    })
    return () => {
      isMounted = false
    }
  }, [])

  return skills
}
