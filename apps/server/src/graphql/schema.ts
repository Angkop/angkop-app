// Simplification: profile.education/experience/preferences are exposed as JSON-encoded
// strings rather than a custom JSON scalar, to avoid an extra dependency for this MVP.
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

  type UserProfile {
    id: ID!
    skills: [String!]!
    skillsText: String!
    education: String!
    experience: String!
    preferences: String!
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
  }

  input UpdateProfileInput {
    skills: [String!]!
    skillsText: String!
  }

  type Mutation {
    updateProfile(input: UpdateProfileInput!): UserProfile!
    logInteraction(jobId: ID!, eventType: String!): Boolean!
  }
`
