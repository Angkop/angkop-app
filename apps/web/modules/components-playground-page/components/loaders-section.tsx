import { BrandLoader } from '@/components/brand-loader'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { StepProgress } from '@/components/step-progress'
import { Skeleton } from '@/components/ui/skeleton'
import { PlaygroundSection, Variant } from './playground-section'

const SIZES = ['sm', 'md', 'lg'] as const

export function LoadersSection() {
  return (
    <PlaygroundSection
      id='loaders'
      title='Loaders and Skeletons'
      description='Skeletons stand in for a page or content area. A spinner only belongs inside a button or modal, and the brand loader covers a wait on a real match.'
    >
      <Variant label='Brand loader' usage={'<BrandLoader size="sm | md | lg" />'}>
        <div className='flex items-end gap-6'>
          {SIZES.map((size) => (
            <div key={size} className='flex flex-col items-center gap-1'>
              <BrandLoader size={size} />
              <span className='text-[11px] text-muted-foreground'>{size}</span>
            </div>
          ))}
        </div>
      </Variant>
      <Variant label='Step progress' usage='<StepProgress steps={[...]} />'>
        <StepProgress steps={['Reading your resume', 'Finding your skills', 'Building your profile']} />
      </Variant>
      <Variant label='Skeleton primitive' usage={'<Skeleton className="h-4 w-40" />'}>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-40' />
          <Skeleton className='h-4 w-64 max-w-full' />
          <Skeleton className='size-10 rounded-full' />
        </div>
      </Variant>
      <Variant label='Loading skeleton, list rows' usage="<LoadingSkeleton rows={3} heightClassName='h-16' />">
        <LoadingSkeleton rows={3} heightClassName='h-16' />
      </Variant>
      <Variant label='Full-page loader' usage="<PageLoader label='Loading your matches' />">
        <p className='text-xs text-muted-foreground'>
          PageLoader fills the whole screen, so it is not rendered here. It wraps BrandLoader size lg with a label.
        </p>
      </Variant>
    </PlaygroundSection>
  )
}
