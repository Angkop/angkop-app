// The first `limit` skills, in the order given (most-asked first), whose name contains `query`
// (case-insensitive). An empty query keeps everything, so it is just the first `limit`.
export function pickSkills(skills: readonly string[], query: string, limit: number): string[] {
  const needle = query.trim().toLowerCase()
  const picked: string[] = []
  for (const skill of skills) {
    if (needle && !skill.toLowerCase().includes(needle)) continue
    picked.push(skill)
    if (picked.length >= limit) break
  }
  return picked
}
