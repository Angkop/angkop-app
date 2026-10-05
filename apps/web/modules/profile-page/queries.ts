import { gql } from '@apollo/client'

export const ME_QUERY = gql`
  query Me {
    me {
      id
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

export const UPDATE_ABOUT_MUTATION = gql`
  mutation UpdateAbout($about: String!) {
    updateAbout(about: $about) {
      about
    }
  }
`

export const SAVED_JOBS_STATUS_QUERY = gql`
  query SavedJobsStatus {
    savedJobs {
      id
      status
    }
  }
`
