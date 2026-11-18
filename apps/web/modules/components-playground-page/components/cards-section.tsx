'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { JobRow } from '@/components/job-row'
import { SkillsComparison } from '@/components/skills-comparison'
import { StatStrip } from '@/components/stat-strip'
import { SAMPLE_JOB } from '../constants/sample-data'
import { PlaygroundSection, Variant } from './playground-section'

export function CardsSection() {
  return (
    <PlaygroundSection
      id='cards'
      title='Cards'
      description='Card is the base surface. StatStrip and JobRow are the shared compositions built on the same tokens.'
    >
      <Variant
        label='Card with header, content and footer'
        usage='<Card><CardHeader /><CardContent /><CardFooter /></Card>'
      >
        <Card>
          <CardHeader>
            <CardTitle>Skill gap report</CardTitle>
            <CardDescription>Based on the jobs you saved this week.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>Add TypeScript and SQL to cover the most common gaps.</p>
          </CardContent>
          <CardFooter>
            <Button variant='outline' size='sm'>
              View Roadmap
            </Button>
          </CardFooter>
        </Card>
      </Variant>
      <Variant label='Stat strip' usage='<StatStrip items={[{ label, value, caption }]} />'>
        <StatStrip
          items={[
            { label: 'Strong matches', value: 12, caption: 'Score 70% or higher' },
            { label: 'Saved jobs', value: 5 },
            { label: 'Applied', value: 3 }
          ]}
        />
      </Variant>
      <Variant label='Job row' usage='<JobRow job score onSave onDismiss onViewInsight />' wide>
        <div className='space-y-2'>
          <JobRow
            job={SAMPLE_JOB}
            score={0.86}
            onSave={() => undefined}
            onDismiss={async () => undefined}
            onViewInsight={() => undefined}
          />
          <JobRow job={SAMPLE_JOB} score={0.52} onSave={() => undefined} onViewInsight={() => undefined} isSaving />
        </div>
      </Variant>
      <Variant label='Skills comparison' usage='<SkillsComparison matching growing />' wide>
        <SkillsComparison
          matching={['React', 'TypeScript']}
          growing={['Node.js', 'PostgreSQL', 'Regulatory Compliance']}
        />
      </Variant>
      <Variant
        label='Skills comparison at dialog width, long names'
        usage='<SkillsComparison matching growing /> inside a 408px body'
        wide
      >
        <div className='max-w-[408px]'>
          <SkillsComparison
            matching={['Tech']}
            growing={['DevSecOps', 'Executive Leadership', 'Regulatory Compliance', 'Security Program Management']}
          />
        </div>
      </Variant>
      <Variant label='Skills comparison, nothing matched' usage='<SkillsComparison matching={[]} growing />' wide>
        <SkillsComparison matching={[]} growing={['DevSecOps', 'Executive Leadership']} />
      </Variant>
      <Variant label='Skills comparison, empty' usage='<SkillsComparison matching={[]} growing={[]} />' wide>
        <SkillsComparison matching={[]} growing={[]} />
      </Variant>
    </PlaygroundSection>
  )
}
