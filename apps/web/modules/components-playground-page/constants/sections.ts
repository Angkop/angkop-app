export const PLAYGROUND_SECTIONS = [
  { id: 'fields', title: 'Fields and Inputs' },
  { id: 'buttons', title: 'Buttons' },
  { id: 'selects-filters', title: 'Selects and Filters' },
  { id: 'cards', title: 'Cards' },
  { id: 'badges', title: 'Badges and Match Score' },
  { id: 'loaders', title: 'Loaders and Skeletons' },
  { id: 'empty-states', title: 'Empty and Error States' },
  { id: 'overlays', title: 'Modals and Popovers' },
  { id: 'uploads', title: 'File Uploads' },
  { id: 'tables-lists', title: 'Tables and Lists' }
] as const

export type PlaygroundSectionId = (typeof PLAYGROUND_SECTIONS)[number]['id']

export const DEFAULT_PLAYGROUND_SECTION: PlaygroundSectionId = 'fields'
