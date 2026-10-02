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
  }

  type JobMatch {
    job: Job!
    semanticScore: Float!
    collaborativeScore: Float!
    hybridScore: Float!
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

  type Education {
    school: String!
    degree: String!
    year: Int!
  }

  type WorkExperience {
    title: String!
    company: String!
    months: Int!
  }

  type UserProfile {
    id: ID!
    skills: [String!]!
    skillsText: String!
    desiredRole: String
    location: String
    education: [Education!]!
    experience: [WorkExperience!]!
  }

  type Me {
    id: ID!
    email: String!
    name: String
    profile: UserProfile
  }

  type Query {
    me: Me!
    jobMatches: [JobMatch!]!
    skillGaps: [SkillGap!]!
    savedJobs: [SavedJob!]!
    savedCourses: [SavedCourse!]!
  }

  input UpdateProfileInput {
    skills: [String!]!
    skillsText: String!
  }

  type Mutation {
    updateProfile(input: UpdateProfileInput!): UserProfile!
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
