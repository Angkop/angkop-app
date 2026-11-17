// Root query fields computed from which jobs a user has saved: the saved lists and counts,
// the skill gap report built from them, and the matches feed that excludes them.
export const SAVED_JOB_DERIVED_FIELDS = [
  'jobMatches',
  'savedJobs',
  'savedJobIds',
  'savedJobStats',
  'savedJobCount',
  'skillGaps'
]
