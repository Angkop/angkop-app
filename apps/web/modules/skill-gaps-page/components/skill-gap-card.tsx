import Image from 'next/image'
import { BookOpen, ChevronRight, GraduationCap } from 'lucide-react'
import type { Course, SkillGap } from '@angkop/shared'

function CourseRow({ course, onSelect }: { course: Course; onSelect: (course: Course) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(course)}
      className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border p-2.5 text-left transition-colors hover:border-foreground/20 hover:bg-muted/40"
    >
      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
        {course.thumbnail ? (
          <Image src={course.thumbnail} alt="" width={56} height={56} className="size-14 object-cover" unoptimized />
        ) : (
          <BookOpen className="size-5 text-muted-foreground" strokeWidth={1.5} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{course.title}</p>
        <p className="truncate text-xs text-muted-foreground">{course.provider}</p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

export function SkillGapCard({
  gap,
  onSelectCourse
}: {
  gap: SkillGap
  onSelectCourse: (course: Course, skill: string) => void
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <GraduationCap className="size-4" />
        </span>
        <p className="text-sm font-semibold text-foreground">Add {gap.skill}</p>
      </div>
      {gap.courses.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
          {gap.courses.map((course) => (
            <CourseRow key={course.url} course={course} onSelect={(selected) => onSelectCourse(selected, gap.skill)} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
