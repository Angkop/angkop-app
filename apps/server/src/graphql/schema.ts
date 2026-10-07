export const typeDefs = `#graphql
  type Job {
    id: ID!
    platformJobId: String!
    platform: String!
    title: String!
    company: String!
    description: String!
    requiredSkills: [String!]!
    url: String!
    sourceName: String
  }

  type JobMatch {
    job: Job!
    semanticScore: Float!
    collaborativeScore: Float!
    hybridScore: Float!
  }

  type JobMatchPage {
    items: [JobMatch!]!
    # Count after search is applied — drives the pagination controls for whatever subset
    # is currently being viewed.
    total: Int!
    # Always computed over every match regardless of search/paging, so dashboard stats
    # don't change just because the client asked for a smaller page or a filtered search.
    strongMatchCount: Int!
  }

  type Course {
    title: String!
    provider: String!
    url: String!
  }

  type SkillGap {
    skill: String!
    confidence: Float!
    courses: [Course!]!
  }

  enum ApplicationStatus {
    PENDING
    APPLIED
    AWAITING_INTERVIEW
    ONGOING_INTERVIEW
    INTERVIEWED
    SUCCESSFUL
    UNSUCCESSFUL
  }

  type SavedJob {
    id: ID!
    job: Job!
    status: ApplicationStatus!
    tags: [String!]!
    interviewDate: String
    createdAt: String!
  }

  type SavedCourse {
    id: ID!
    title: String!
    provider: String!
    url: String!
  }

  enum CareerLevel {
    STUDENT
    ENTRY_LEVEL
    JUNIOR
    MID_LEVEL
    SENIOR
    LEAD
    MANAGER
  }

  enum WorkSetup {
    REMOTE
    HYBRID
    ONSITE
  }

  enum EmploymentType {
    FULL_TIME
    PART_TIME
    CONTRACT
    INTERNSHIP
    FREELANCE
  }

  enum SkillLevel {
    BEGINNER
    INTERMEDIATE
    ADVANCED
  }

  enum LanguageProficiency {
    BASIC
    CONVERSATIONAL
    PROFESSIONAL
    NATIVE
  }

  type ProfileSkill {
    name: String!
    category: String
    level: SkillLevel
    years: Float
  }

  type Education {
    school: String!
    degree: String
    fieldOfStudy: String
    startYear: Int
    endYear: Int
    description: String
  }

  type WorkExperience {
    title: String!
    company: String!
    location: String
    employmentType: EmploymentType
    description: String
    startDate: String!
    endDate: String
    current: Boolean!
  }

  type Certification {
    name: String!
    issuer: String!
    issueDate: String
    expirationDate: String
    credentialId: String
    credentialUrl: String
  }

  type Project {
    name: String!
    description: String!
    technologies: [String!]!
    url: String
    startDate: String
    endDate: String
  }

  type Language {
    language: String!
    proficiency: LanguageProficiency
  }

  type UserPreference {
    desiredRoles: [String!]!
    preferredLocations: [String!]!
    preferredJobTypes: [EmploymentType!]!
    preferredIndustries: [String!]!
    workSetup: WorkSetup
    minimumSalary: Float
    maximumSalary: Float
    willingToRelocate: Boolean!
    willingToRemote: Boolean!
  }

  type UserProfile {
    id: ID!
    headline: String
    about: String
    skills: [ProfileSkill!]!
    skillsText: String!
    careerLevel: CareerLevel
    location: String
    resumeFileName: String
    education: [Education!]!
    experience: [WorkExperience!]!
    certifications: [Certification!]!
    projects: [Project!]!
    languages: [Language!]!
    preferences: UserPreference
  }

  type Me {
    id: ID!
    email: String!
    name: String
    profile: UserProfile
  }

  type Query {
    me: Me!
    jobMatches(page: Int, pageSize: Int, search: String, skill: String): JobMatchPage!
    skillGaps: [SkillGap!]!
    savedJobs: [SavedJob!]!
    savedCourses: [SavedCourse!]!
  }

  input ProfileSkillInput {
    name: String!
    category: String
    level: SkillLevel
    years: Float
  }

  input EducationInput {
    school: String!
    degree: String
    fieldOfStudy: String
    startYear: Int
    endYear: Int
    description: String
  }

  input WorkExperienceInput {
    title: String!
    company: String!
    location: String
    employmentType: EmploymentType
    description: String
    startDate: String!
    endDate: String
    current: Boolean
  }

  input CertificationInput {
    name: String!
    issuer: String!
    issueDate: String
    expirationDate: String
    credentialId: String
    credentialUrl: String
  }

  input ProjectInput {
    name: String!
    description: String!
    technologies: [String!]!
    url: String
    startDate: String
    endDate: String
  }

  input LanguageInput {
    language: String!
    proficiency: LanguageProficiency
  }

  input UserPreferenceInput {
    desiredRoles: [String!]!
    preferredLocations: [String!]!
    preferredJobTypes: [EmploymentType!]!
    preferredIndustries: [String!]!
    workSetup: WorkSetup
    minimumSalary: Float
    maximumSalary: Float
    willingToRelocate: Boolean!
    willingToRemote: Boolean!
  }

  input CompleteOnboardingInput {
    headline: String
    about: String
    location: String
    careerLevel: CareerLevel
    resumeFileName: String
    skills: [ProfileSkillInput!]!
    education: [EducationInput!]!
    experience: [WorkExperienceInput!]!
    certifications: [CertificationInput!]!
    projects: [ProjectInput!]!
    languages: [LanguageInput!]!
    preferences: UserPreferenceInput!
  }

  type Mutation {
    completeOnboarding(input: CompleteOnboardingInput!): UserProfile!
    updateAbout(about: String!): UserProfile!
    logInteraction(jobId: ID!, eventType: String!): Boolean!
    saveJob(jobId: ID!): SavedJob!
    unsaveJob(jobId: ID!): Boolean!
    updateSavedJobStatus(jobId: ID!, status: ApplicationStatus!): SavedJob!
    setSavedJobInterviewDate(jobId: ID!, interviewDate: String): SavedJob!
    addSavedJobTag(jobId: ID!, tag: String!): SavedJob!
    removeSavedJobTag(jobId: ID!, tag: String!): SavedJob!
    saveCourse(title: String!, provider: String!, url: String!): SavedCourse!
    unsaveCourse(url: String!): Boolean!
  }
`
