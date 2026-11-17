'use client'

import { useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { annotate } from 'rough-notation'

// From Magic UI's highlighter (https://magicui.design/docs/components/highlighter), adapted: it
// draws in the primary token by default, skips the draw-in animation for reduced-motion users,
// and always shows (the scroll-into-view option, and the `motion` dependency it needs, are left
// out).
type AnnotationAction =
  | 'highlight'
  | 'underline'
  | 'box'
  | 'circle'
  | 'strike-through'
  | 'crossed-off'
  | 'bracket'

type HighlighterProps = {
  children: ReactNode
  action?: AnnotationAction
  color?: string
  strokeWidth?: number
  animationDuration?: number
  // Redraws the annotation from scratch every this many milliseconds, so it loops. Off by default,
  // and ignored for reduced-motion users, who just get the finished drawing.
  repeatInterval?: number
  iterations?: number
  padding?: number
  multiline?: boolean
}

export function Highlighter({
  children,
  action = 'underline',
  color = 'var(--primary)',
  strokeWidth = 3,
  animationDuration = 800,
  repeatInterval,
  iterations = 2,
  padding = 2,
  multiline = true
}: HighlighterProps) {
  const elementRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const element = elementRef.current
    if (!element) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const annotation = annotate(element, {
      type: action,
      color,
      strokeWidth,
      animationDuration,
      iterations,
      padding,
      multiline,
      animate: !prefersReducedMotion
    })
    annotation.show()

    const repeatTimer =
      repeatInterval && !prefersReducedMotion
        ? window.setInterval(() => {
            annotation.hide()
            annotation.show()
          }, repeatInterval)
        : undefined

    // The drawing is sized to the text, so redraw it when the text moves or reflows.
    const resizeObserver = new ResizeObserver(() => {
      annotation.hide()
      annotation.show()
    })
    resizeObserver.observe(element)
    resizeObserver.observe(document.body)

    return () => {
      window.clearInterval(repeatTimer)
      annotation.remove()
      resizeObserver.disconnect()
    }
  }, [action, color, strokeWidth, animationDuration, repeatInterval, iterations, padding, multiline])

  return (
    <span ref={elementRef} className="relative inline-block bg-transparent">
      {children}
    </span>
  )
}
