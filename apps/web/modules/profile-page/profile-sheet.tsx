'use client'

import { useState } from 'react'
import { LogOut, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ErrorMessage } from '@/components/error-message'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { useProfileEditor } from '@/hooks/use-profile-editor'
import { ProfilePage } from './profile-page'

// What an open discard prompt will do once confirmed: leave the sheet, or just leave edit mode.
type DiscardTarget = 'close' | 'edit'

export function ProfileSheet({
  open,
  onOpenChange,
  isSigningOut,
  onSignOut
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSigningOut: boolean
  onSignOut: () => void
}) {
  const editor = useProfileEditor()
  const [isEditing, setIsEditing] = useState(false)
  const [discardTarget, setDiscardTarget] = useState<DiscardTarget | null>(null)
  const isDirty = editor.form.formState.isDirty

  function handleOpenChange(next: boolean) {
    if (next) {
      onOpenChange(true)
      return
    }
    // A save in flight owns the form until it settles.
    if (editor.isSaving) return
    if (isEditing && isDirty) {
      setDiscardTarget('close')
      return
    }
    setIsEditing(false)
    onOpenChange(false)
  }

  function handleCancelEdit() {
    if (isDirty) {
      setDiscardTarget('edit')
      return
    }
    setIsEditing(false)
  }

  function handleDiscard() {
    // Back to the last saved values, so reopening Edit doesn't show abandoned changes.
    editor.form.reset()
    setIsEditing(false)
    setDiscardTarget(null)
    if (discardTarget === 'close') onOpenChange(false)
  }

  async function handleSave() {
    // editor.save() toasts and shows the inline error when it fails — stay in edit mode
    // instead of closing out of an edit that didn't actually save.
    if (!(await editor.save())) return
    toast.success('Profile saved', { description: 'New match scores will reflect this on next load.' })
    setIsEditing(false)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader>
          <div className="min-w-0 flex-1">
            <SheetTitle>Profile</SheetTitle>
            <SheetDescription className="sr-only">View and edit your profile, or sign out.</SheetDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
            disabled={isSigningOut}
            aria-label={isSigningOut ? 'Signing out' : 'Sign out'}
            className="gap-1.5"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">{isSigningOut ? 'Signing out…' : 'Sign out'}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close profile"
            onClick={() => handleOpenChange(false)}
            className="text-muted-foreground"
          >
            <X className="size-4" />
          </Button>
        </SheetHeader>

        <SheetBody>
          <ProfilePage editor={editor} isEditing={isEditing} onEditStart={() => setIsEditing(true)} />
        </SheetBody>

        {isEditing ? (
          <SheetFooter>
            {editor.saveError ? (
              <div className="mb-3">
                <ErrorMessage>Could not save your profile: {editor.saveError.message}</ErrorMessage>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={handleSave} disabled={editor.isSaving}>
                {editor.isSaving ? 'Saving…' : 'Save Profile'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={editor.isSaving}>
                Cancel
              </Button>
            </div>
          </SheetFooter>
        ) : null}

        <ConfirmDialog
          open={discardTarget !== null}
          onOpenChange={(next) => {
            if (!next) setDiscardTarget(null)
          }}
          title="Discard unsaved changes?"
          description="Your edits to this profile, including any details imported from a resume, have not been saved. Discarding returns it to the last saved version."
          confirmLabel="Discard Changes"
          cancelLabel="Keep Editing"
          onConfirm={handleDiscard}
        />
      </SheetContent>
    </Sheet>
  )
}
