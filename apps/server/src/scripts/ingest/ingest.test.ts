import assert from 'node:assert/strict'
import { test } from 'node:test'
import { detectExperienceLevel } from '../../lib/experience-detection'
import { buildDescriptionSections, plainTextToHtml } from './description-sections'
import { detectEmploymentType, detectWorkSetup, parseSalary } from './listing-facts'

const PLAIN_TEXT_POSTING = `Acme Corp is a fast-growing BPO company based in Makati.

Key Responsibilities:
- Respond to customer inquiries via chat and email
- Resolve billing issues and escalate when needed

Qualifications
- At least 1 year of customer service experience
- Excellent communication skills

What We Offer
- Monthly salary of PHP 22,000 - 28,000
- HMO from day one`

function headings(sections: { heading: string | null }[]): (string | null)[] {
  return sections.map((section) => section.heading)
}

test('plain-text postings are split under the fixed category labels', () => {
  const sections = buildDescriptionSections(plainTextToHtml(PLAIN_TEXT_POSTING))
  assert.deepEqual(headings(sections), ['Overview', 'Responsibilities', 'Requirements', 'Benefits'])
  assert.equal(sections[1].items.length, 2)
})

test('an unrecognised heading is sorted by what its lines say', () => {
  const sections = buildDescriptionSections('<h3>The Gig</h3><p>Ship features weekly.<br>Mentor juniors.</p>')
  assert.deepEqual(headings(sections), ['Responsibilities'])
})

test('a bold lead-in with text after it starts a section', () => {
  const sections = buildDescriptionSections('<p><strong>Perks &amp; Stuff:</strong> Unlimited PTO and stock options.</p>')
  assert.deepEqual(headings(sections), ['Benefits'])
})

test('headingless prose is split into overview and duties', () => {
  const sections = buildDescriptionSections(
    '<p>We are a Berlin fintech building payments infra. You will own the ledger service.</p>'
  )
  assert.deepEqual(headings(sections), ['Overview', 'Responsibilities'])
})

test('a short bullet that mentions a category word is not mistaken for a heading', () => {
  const sections = buildDescriptionSections('<h2>Requirements</h2><p>Strong Python skills</p>')
  assert.deepEqual(sections, [{ heading: 'Requirements', items: ['Strong Python skills'] }])
})

test('salary keeps its currency and period, and infers PHP monthly', () => {
  assert.deepEqual(parseSalary('Monthly salary of PHP 22,000 - 28,000. HMO from day one.'), {
    min: 22000,
    max: 28000,
    currency: 'PHP',
    period: 'MONTHLY'
  })
  assert.deepEqual(parseSalary('Salary: $80k - $100k per year'), { min: 80000, max: 100000, currency: 'USD', period: 'YEARLY' })
})

test('amounts that are not pay are ignored', () => {
  assert.equal(parseSalary('We raised $5 million in funding'), null)
  assert.equal(parseSalary('Join a team of 50 people'), null)
})

test('employment type and work setup come from the title first', () => {
  assert.equal(detectEmploymentType('Software Engineering Intern', 'a full-time commitment'), 'INTERNSHIP')
  assert.equal(detectWorkSetup('Designer (Remote)', 'in the office twice a week'), 'REMOTE')
  assert.equal(detectWorkSetup('Designer', 'a hybrid schedule with remote days'), 'HYBRID')
  assert.equal(detectEmploymentType('Designer', 'Sign your employment contract on day one'), null)
})

test('experience level ignores incidental seniority words', () => {
  assert.equal(detectExperienceLevel('We report to the manager. 3-5 years of experience.', 'Sales Associate'), 'MID_LEVEL')
  assert.equal(detectExperienceLevel('Lead generation and staff training.', 'Sales Associate'), null)
  assert.equal(detectExperienceLevel('', 'Senior Engineering Manager'), 'MANAGER')
  assert.equal(detectExperienceLevel('At least 1 year of customer service experience', 'Agent'), 'ENTRY_LEVEL')
})
