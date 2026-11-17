import { FIELD_TYPE } from '@/components/common/form/constants/field-type'
import { CAREER_LEVEL_OPTIONS } from '@/constants/profile-form'
import { ProfileField } from './profile-field'

export function AboutFields() {
  return (
    <>
      <ProfileField
        fieldType={FIELD_TYPE.TEXT_INPUT}
        name="headline"
        label="Headline"
        orientation="horizontal"
        placeholder="e.g. Front-End Developer"
      />
      <ProfileField
        fieldType={FIELD_TYPE.SELECT}
        name="careerLevel"
        label="Where are you in your career?"
        orientation="horizontal"
        options={CAREER_LEVEL_OPTIONS}
        placeholder="Select one"
      />
      <ProfileField
        fieldType={FIELD_TYPE.TEXT_INPUT}
        name="location"
        label="Where are you based?"
        orientation="horizontal"
        placeholder="e.g. Muntinlupa City, Metro Manila"
      />
      <ProfileField
        fieldType={FIELD_TYPE.MULTILINE_TEXT_INPUT}
        name="about"
        label="About"
        orientation="horizontal"
        placeholder="A short introduction: what you do and what you're looking for."
      />
    </>
  )
}
