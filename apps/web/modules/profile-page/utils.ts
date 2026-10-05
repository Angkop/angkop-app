export function formatMonthYear(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function formatExperiencePeriod(startDate: string, endDate: string | null, current: boolean): string {
  const start = formatMonthYear(startDate)
  const end = current || !endDate ? 'Present' : formatMonthYear(endDate)
  return `${start} – ${end}`
}

export function formatEducationPeriod(startYear: number | null, endYear: number | null): string {
  if (startYear && endYear) return `${startYear} – ${endYear}`
  if (startYear) return `${startYear} – Present`
  return ''
}

export function formatSalaryRange(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null
  const format = (value: number) => `₱${value.toLocaleString('en-PH')}`
  if (min != null && max != null) return `${format(min)} – ${format(max)}`
  return format((min ?? max) as number)
}
