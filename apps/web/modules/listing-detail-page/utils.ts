export function formatSalaryRange(salaryMin: number | null, salaryMax: number | null): string | null {
  if (salaryMin === null && salaryMax === null) return null
  const format = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
  if (salaryMin !== null && salaryMax !== null) return `${format(salaryMin)} – ${format(salaryMax)}/yr`
  return `${format(salaryMin ?? salaryMax ?? 0)}/yr`
}
