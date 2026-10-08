'use client'

import Image from 'next/image'
import { BookOpen, ExternalLink, Lightbulb } from 'lucide-react'
import type { Course } from '@angkop/shared'
import { buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export function CourseDetailDialog({
  course,
  skill,
  open,
  onOpenChange
}: {
  course: Course | null
  skill: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {course ? (
          <>
            <DialogHeader>
              <DialogTitle>{course.title}</DialogTitle>
              <DialogDescription>{course.provider}</DialogDescription>
            </DialogHeader>

            {skill ? (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-primary/5 p-3">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-xs leading-relaxed text-foreground">
                  Suggested because <span className="font-medium">{skill}</span> showed up as a gap against your
                  saved jobs — it&apos;s required by at least one of them but isn&apos;t reflected in your profile
                  yet.
                </p>
              </div>
            ) : null}

            <div className="overflow-hidden rounded-xl border border-border bg-muted">
              {course.thumbnail ? (
                <Image
                  src={course.thumbnail}
                  alt=""
                  width={480}
                  height={270}
                  className="aspect-video w-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center">
                  <BookOpen className="size-10 text-muted-foreground" strokeWidth={1.5} />
                </div>
              )}
            </div>

            <p className="mt-4 line-clamp-6 text-sm leading-relaxed text-foreground">
              {course.description || 'No description available for this course.'}
            </p>

            <a
              href={course.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: 'default' }), 'mt-6 w-full')}
            >
              Open Course
              <ExternalLink className="size-3.5" />
            </a>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
