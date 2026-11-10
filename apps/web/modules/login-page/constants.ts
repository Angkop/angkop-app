// What a job seeker is wondering — the thought bubbles that pop up over the hero capybara.
// The delays stagger them across the same 12s loop as the match demo.
export const THOUGHTS = [
  { text: 'Am I a fit for this job?', delay: '[animation-delay:1s]' },
  { text: 'I want to be a front-end developer.', delay: '[animation-delay:5s]' },
  { text: 'Which skills should I add next?', delay: '[animation-delay:9s]' }
] as const

// Illustrative only — the sign-in screen's match demo. Each pair shares no words, so a
// keyword search finds nothing, while the semantic matcher still scores the pair highly.
export const MATCH_EXAMPLES = [
  { profile: 'React developer', job: 'Front-end Engineer', score: 0.87, bar: 'w-[87%]', delay: '' },
  {
    profile: 'Call center agent',
    job: 'Customer Support Specialist',
    score: 0.84,
    bar: 'w-[84%]',
    delay: '[animation-delay:4s]'
  },
  {
    profile: 'Bookkeeper',
    job: 'Accounting Assistant',
    score: 0.81,
    bar: 'w-[81%]',
    delay: '[animation-delay:8s]'
  }
] as const
