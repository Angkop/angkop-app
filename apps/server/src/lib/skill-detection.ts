// Best-effort only: used as a fallback when a source listing's own `tags` array is sparse
// or empty, by matching the free-text description against skill names already recorded in
// the Skill table (populated from real user profiles across every industry on the
// platform — see schema.prisma `model Skill`), not a hardcoded list. This keeps detection
// from being biased toward any one field (e.g. tech) and lets it grow on its own as more
// users across more industries join. Never replaces source tags — only tops them up (see
// ingest-jobs.ts).
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function detectSkillsFromTaxonomy(text: string, skillNames: string[]): string[] {
  return skillNames.filter((name) => new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i').test(text))
}
