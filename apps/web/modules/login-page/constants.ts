// Illustrative only — the two jobs the beaver tries on. The same person scores very
// differently for each, and the gap names the skill that would close it. The bar widths are
// spelled out so Tailwind keeps them.
export const JOBS = [
  { title: 'Digital Marketer', score: 0.78, bar: 'w-[78%]', fill: 'bg-match-strong', gap: 'Add Google Ads' },
  { title: 'Site Foreman', score: 0.31, bar: 'w-[31%]', fill: 'bg-match-weak', gap: 'Add blueprint reading' }
] as const

// Illustrative only — what the beaver can already do. The popup in the middle sets these
// against both jobs and shows which one they sit closer to.
export const SKILLS = ['Canva', 'Copywriting', 'Social media', 'Teamwork'] as const
