export type EducationEntry = { school: string; degree: string; period: string; skills?: string[] }
export type ExperienceEntry = { title: string; company: string; period: string; skills?: string[] }

export type OnboardingProfile = {
  status: string
  location: string
  skills: string[]
  education: EducationEntry[]
  experience: ExperienceEntry[]
  desiredRoles: string[]
  resumeFileName: string
}
