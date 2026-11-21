import assert from 'node:assert/strict'
import { test } from 'node:test'
import { pickSkills } from './skill-search'

const SKILLS = ['JavaScript', 'React', 'SQL', 'React Native', 'Python', 'Reactive Programming', 'Excel']

test('with no search it is just the first few, in the given order', () => {
  assert.deepEqual(pickSkills(SKILLS, '', 3), ['JavaScript', 'React', 'SQL'])
})

test('a search keeps the order and matches anywhere in the name, ignoring case', () => {
  assert.deepEqual(pickSkills(SKILLS, 'REACT', 10), ['React', 'React Native', 'Reactive Programming'])
  assert.deepEqual(pickSkills(SKILLS, 'script', 10), ['JavaScript'])
})

test('it never returns more than the limit', () => {
  assert.deepEqual(pickSkills(SKILLS, 'react', 2), ['React', 'React Native'])
})

test('surrounding spaces in the search are ignored, and nothing matching gives an empty list', () => {
  assert.deepEqual(pickSkills(SKILLS, '  sql ', 5), ['SQL'])
  assert.deepEqual(pickSkills(SKILLS, 'cobol', 5), [])
})
