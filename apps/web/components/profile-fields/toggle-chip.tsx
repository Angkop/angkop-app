import { Button } from '@/components/ui/button'

export function ToggleChip({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <Button type="button" variant="chip" size="chip" aria-pressed={selected} onClick={onToggle}>
      {label}
    </Button>
  )
}
