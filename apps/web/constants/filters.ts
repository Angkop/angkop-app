// Sentinel value for a filter <Select> meaning "don't filter on this field" — distinct from
// an empty string, which some of these filters (e.g. search query) use to mean the same
// thing, but a <Select> can't have an empty-string item value.
export const ALL_FILTER_VALUE = 'all'
