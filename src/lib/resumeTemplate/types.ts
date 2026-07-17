export type ResumeExperience = {
  company: string;
  dates: string;
  role: string;
  bullets: string[];
};

export type ResumeEducation = {
  credential: string;
  dates?: string;
  school?: string;
};

/** Structured resume content for the Cody visual template. */
export type ResumeDocument = {
  firstName: string;
  lastName: string;
  tagline?: string;
  aboutMe?: string;
  profile?: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: string[];
  phone?: string;
  email?: string;
  website?: string;
};

export const CODY_VISUAL_TEMPLATE_ID = 'cody-visual';
