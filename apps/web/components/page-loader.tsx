import { BrandLoader } from './brand-loader'

export function PageLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <BrandLoader size="lg" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
