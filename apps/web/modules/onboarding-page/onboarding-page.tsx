'use client'

import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { FormProvider } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/page-loader'
import { useOnboardingWizard } from './hooks/use-onboarding-wizard'
import { SidebarNav } from './components/sidebar-nav'
import { AboutStep } from './components/about-step'
import { SkillsStep } from './components/skills-step'
import { EducationStep } from './components/education-step'
import { ExperienceStep } from './components/experience-step'
import { CertificationsStep } from './components/certifications-step'
import { ProjectsStep } from './components/projects-step'
import { LanguagesStep } from './components/languages-step'
import { PreferencesStep } from './components/preferences-step'
import { ReviewStep } from './components/review-step'
import { STEPS } from './constants'

export function OnboardingPage() {
  const wizard = useOnboardingWizard()

  if (wizard.isChecking) return <PageLoader label="Setting up your account…" />

  return (
    <div className="grid h-screen overflow-hidden bg-background lg:grid-cols-[380px_1fr]">
      <SidebarNav
        step={wizard.step}
        progress={wizard.progress}
        navUnlocked={wizard.navUnlocked}
        onStepClick={wizard.setStep}
        disabled={wizard.isSaving}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-6 py-4 sm:px-10">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
              A
            </span>
            <span className="text-sm text-muted-foreground">
              Step {wizard.step + 1} of {STEPS.length}
            </span>
          </div>
          <span className="hidden text-sm font-medium text-foreground lg:inline">{wizard.activeStep.label}</span>
          <button
            type="button"
            onClick={wizard.handleSkip}
            disabled={wizard.isSaving}
            className="cursor-pointer text-sm text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {wizard.isSaving ? 'Saving…' : 'Skip onboarding'}
          </button>
        </div>

        <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-6 py-10 sm:px-10">
          <FormProvider {...wizard.form}>
            {wizard.activeStep.id === 'about' ? (
              <AboutStep
                email={wizard.email}
                name={wizard.name}
                onImportParsedResume={wizard.importParsedResume}
              />
            ) : null}

            {wizard.activeStep.id === 'skills' ? <SkillsStep /> : null}
            {wizard.activeStep.id === 'education' ? <EducationStep /> : null}
            {wizard.activeStep.id === 'experience' ? <ExperienceStep /> : null}
            {wizard.activeStep.id === 'certifications' ? <CertificationsStep /> : null}
            {wizard.activeStep.id === 'projects' ? <ProjectsStep /> : null}
            {wizard.activeStep.id === 'languages' ? <LanguagesStep /> : null}
            {wizard.activeStep.id === 'preferences' ? <PreferencesStep /> : null}

            {wizard.activeStep.id === 'review' ? (
              <ReviewStep email={wizard.email} saveError={wizard.saveError} />
            ) : null}
          </FormProvider>

          <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={wizard.goBack}
              disabled={wizard.step === 0 || wizard.isSaving}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
            {wizard.step === STEPS.length - 1 ? (
              <Button type="button" onClick={wizard.handleFinish} disabled={wizard.isSaving}>
                {wizard.isSaving ? 'Saving…' : 'Finish setup'}
                <Check className="size-4" />
              </Button>
            ) : (
              <Button type="button" onClick={wizard.goNext} disabled={wizard.isSaving}>
                Continue
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
