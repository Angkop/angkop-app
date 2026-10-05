import json

from google import genai
from google.genai import types
from pydantic import BaseModel

from app.config import GEMINI_API_KEY, GEMINI_MODEL

_CAREER_LEVELS = {"STUDENT", "ENTRY_LEVEL", "JUNIOR", "MID_LEVEL", "SENIOR", "LEAD", "MANAGER"}
_EMPLOYMENT_TYPES = {"FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"}
_SKILL_LEVELS = {"BEGINNER", "INTERMEDIATE", "ADVANCED"}
_LANGUAGE_PROFICIENCIES = {"BASIC", "CONVERSATIONAL", "PROFESSIONAL", "NATIVE"}


class ParsedSkill(BaseModel):
    name: str
    category: str | None = None
    level: str | None = None
    years: float | None = None


class ParsedEducation(BaseModel):
    school: str
    degree: str | None = None
    fieldOfStudy: str | None = None
    startYear: int | None = None
    endYear: int | None = None
    description: str | None = None


class ParsedExperience(BaseModel):
    title: str
    company: str
    location: str | None = None
    employmentType: str | None = None
    description: str | None = None
    startDate: str | None = None
    endDate: str | None = None
    current: bool = False


class ParsedCertification(BaseModel):
    name: str
    issuer: str
    issueDate: str | None = None
    expirationDate: str | None = None
    credentialId: str | None = None
    credentialUrl: str | None = None


class ParsedProject(BaseModel):
    name: str
    description: str
    technologies: list[str] = []
    url: str | None = None
    startDate: str | None = None
    endDate: str | None = None


class ParsedLanguage(BaseModel):
    language: str
    proficiency: str | None = None


class ParsedResumeProfile(BaseModel):
    headline: str | None = None
    about: str | None = None
    careerLevel: str | None = None
    location: str | None = None
    skills: list[ParsedSkill] = []
    education: list[ParsedEducation] = []
    experience: list[ParsedExperience] = []
    certifications: list[ParsedCertification] = []
    projects: list[ParsedProject] = []
    languages: list[ParsedLanguage] = []


_PROMPT = f"""You are extracting structured profile data from a resume/CV for a job-matching
platform. Read the attached document and return only the fields you can actually find —
leave anything absent as null or an empty list, never invent details.

- headline: a short professional title (e.g. "Frontend Engineer"), not a full sentence.
- about: a 2-4 sentence professional summary, written in first person if the resume
  doesn't already have one.
- careerLevel: your best single estimate, one of {sorted(_CAREER_LEVELS)}.
- skills[].level: one of {sorted(_SKILL_LEVELS)}, only when the resume gives enough signal.
- experience[].employmentType: one of {sorted(_EMPLOYMENT_TYPES)}.
- languages[].proficiency: one of {sorted(_LANGUAGE_PROFICIENCIES)}.
- startDate/endDate/issueDate/expirationDate: ISO format YYYY-MM-DD (use the 1st of the
  month when only a month/year is given).
- current: true only when the resume marks a role as present/ongoing.
"""


def _clamp_enum(value: str | None, allowed: set[str]) -> str | None:
    # Gemini's structured output follows the schema in the vast majority of cases, but
    # enum drift from a generative model is still possible — this is the one place that
    # value reaches a typed field (CareerLevel, EmploymentType, …) on the client, so a
    # stray value must never slip through instead of just being dropped.
    return value if value in allowed else None


def parse_resume(file_bytes: bytes, mime_type: str) -> ParsedResumeProfile:
    client = genai.Client(api_key=GEMINI_API_KEY)
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=[types.Part.from_bytes(data=file_bytes, mime_type=mime_type), _PROMPT],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ParsedResumeProfile,
        ),
    )

    parsed = ParsedResumeProfile.model_validate(json.loads(response.text))

    parsed.careerLevel = _clamp_enum(parsed.careerLevel, _CAREER_LEVELS)
    for skill in parsed.skills:
        skill.level = _clamp_enum(skill.level, _SKILL_LEVELS)
    for entry in parsed.experience:
        entry.employmentType = _clamp_enum(entry.employmentType, _EMPLOYMENT_TYPES)
    for entry in parsed.languages:
        entry.proficiency = _clamp_enum(entry.proficiency, _LANGUAGE_PROFICIENCIES)

    return parsed
