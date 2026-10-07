export type ListingSummary = {
  id: string
  title: string
  company: string
  requiredSkills: string[]
  sourceName: string
}

export type ListingsPageResponse = {
  items: ListingSummary[]
  total: number
  page: number
  pageSize: number
}
