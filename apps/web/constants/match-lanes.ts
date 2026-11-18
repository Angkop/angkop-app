// The dashboard groups matches by what to do with them, not by score band. Weak matches never
// reach the dashboard (the server drops anything under MATCH_SCORE_THRESHOLDS.MINIMUM).
export const MATCH_LANES = {
  strong: {
    title: 'Apply now',
    description: 'Strong fit, 70% and up',
    ruleClassName: 'border-match-strong'
  },
  partial: {
    title: 'Worth a closer look',
    description: 'Partial fit, 40 to 69%. A few added skills would help.',
    ruleClassName: 'border-match-partial'
  }
} as const
