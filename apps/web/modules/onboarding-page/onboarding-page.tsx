'use client'

import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
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
    <div className="grid min-h-screen bg-background lg:grid-cols-[380px_1fr]">
      <SidebarNav step={wizard.step} progress={wizard.progress} onStepClick={wizard.setStep} />

      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4 sm:px-10">
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

        <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10 sm:px-10">
          {wizard.activeStep.id === 'about' ? (
            <AboutStep
              email={wizard.email}
              name={wizard.name}
              headline={wizard.headline}
              onHeadlineChange={wizard.setHeadline}
              careerLevel={wizard.careerLevel}
              onCareerLevelChange={wizard.setCareerLevel}
              location={wizard.location}
              onLocationChange={wizard.setLocation}
              about={wizard.about}
              onAboutChange={wizard.setAbout}
              resumeFileName={wizard.resumeFileName}
              onResumeFileNameChange={wizard.setResumeFileName}
              onImportParsedResume={wizard.importParsedResume}
            />
          ) : null}

          {wizard.activeStep.id === 'skills' ? <SkillsStep skills={wizard.skills} setSkills={wizard.setSkills} /> : null}

          {wizard.activeStep.id === 'education' ? (
            <EducationStep education={wizard.education} educationHelpers={wizard.educationHelpers} />
          ) : null}

          {wizard.activeStep.id === 'experience' ? (
            <ExperienceStep experience={wizard.experience} experienceHelpers={wizard.experienceHelpers} />
          ) : null}

          {wizard.activeStep.id === 'certifications' ? (
            <CertificationsStep
              certifications={wizard.certifications}
              certificationHelpers={wizard.certificationHelpers}
            />
          ) : null}

          {wizard.activeStep.id === 'projects' ? (
            <ProjectsStep projects={wizard.projects} projectHelpers={wizard.projectHelpers} />
          ) : null}

          {wizard.activeStep.id === 'languages' ? (
            <LanguagesStep languages={wizard.languages} languageHelpers={wizard.languageHelpers} />
          ) : null}

          {wizard.activeStep.id === 'preferences' ? (
            <PreferencesStep preferences={wizard.preferences} setPreferences={wizard.setPreferences} />
          ) : null}

          {wizard.activeStep.id === 'review' ? (
            <ReviewStep
              email={wizard.email}
              headline={wizard.headline}
              careerLevel={wizard.careerLevel}
              location={wizard.location}
              skills={wizard.skills}
              education={wizard.education}
              experience={wizard.experience}
              certifications={wizard.certifications}
              projects={wizard.projects}
              preferences={wizard.preferences}
              resumeFileName={wizard.resumeFileName}
              saveError={wizard.saveError}
            />
          ) : null}

          <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={wizard.goBack} disabled={wizard.step === 0}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            {wizard.step === STEPS.length - 1 ? (
              <Button type="button" onClick={wizard.handleFinish} disabled={wizard.isSaving}>
                {wizard.isSaving ? 'Saving…' : 'Finish setup'}
                <Sparkles className="size-4" />
              </Button>
            ) : (
              <Button type="button" onClick={wizard.goNext} disabled={!wizard.canContinue}>
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
