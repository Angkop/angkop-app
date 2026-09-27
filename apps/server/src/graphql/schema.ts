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
