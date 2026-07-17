import type { ResumeDocument, ResumeEducation, ResumeExperience } from './types';

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0].toUpperCase(), lastName: '' };
  return {
    firstName: parts.slice(0, -1).join(' ').toUpperCase(),
    lastName: parts[parts.length - 1].toUpperCase(),
  };
}

function coerceString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function coerceStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => coerceString(item)).filter(Boolean);
}

function coerceExperience(value: unknown): ResumeExperience[] {
  if (!Array.isArray(value)) return [];
  const items: ResumeExperience[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const company = coerceString(row.company);
    const role = coerceString(row.role);
    const dates = coerceString(row.dates);
    const bullets = coerceStringArray(row.bullets);
    if (!company && !role && bullets.length === 0) continue;
    items.push({ company, dates, role, bullets });
  }
  return items;
}

function coerceEducation(value: unknown): ResumeEducation[] {
  if (!Array.isArray(value)) return [];
  const items: ResumeEducation[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const credential = coerceString(row.credential);
    if (!credential) continue;
    items.push({
      credential,
      dates: coerceString(row.dates) || undefined,
      school: coerceString(row.school) || undefined,
    });
  }
  return items;
}

/** Parse Gemini `[VISUAL RESUME JSON]` output into a typed document. */
export function parseVisualResumeJson(raw: string): ResumeDocument | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const jsonText = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
    const firstName = coerceString(parsed.firstName);
    const lastName = coerceString(parsed.lastName);
    if (!firstName && !lastName) return null;

    return {
      firstName,
      lastName,
      tagline: coerceString(parsed.tagline) || undefined,
      aboutMe: coerceString(parsed.aboutMe) || undefined,
      profile: coerceString(parsed.profile) || undefined,
      experience: coerceExperience(parsed.experience),
      education: coerceEducation(parsed.education),
      skills: coerceStringArray(parsed.skills),
      phone: coerceString(parsed.phone) || undefined,
      email: coerceString(parsed.email) || undefined,
      website: coerceString(parsed.website) || undefined,
    };
  } catch {
    return null;
  }
}

/** Build a minimal document from profile fields when structured JSON is unavailable. */
export function buildFallbackResumeDocument(input: {
  name: string;
  email?: string;
  phone?: string;
  history?: string;
  rewrittenResume?: string;
  profileSummary?: string;
}): ResumeDocument {
  const { firstName, lastName } = splitName(input.name);
  const rewritten = input.rewrittenResume?.trim() || '';
  const history = input.history?.trim() || '';

  const experience: ResumeExperience[] = [];
  const blocks = rewritten.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    const header = lines[0].replace(/^[-•*]\s*/, '');
    const bullets = lines.slice(1).map((l) => l.replace(/^[-•*]\s*/, '')).filter(Boolean);
    if (bullets.length === 0 && header.includes('•')) {
      experience.push({
        company: 'Experience',
        dates: '',
        role: '',
        bullets: lines.map((l) => l.replace(/^[-•*]\s*/, '')),
      });
    } else {
      experience.push({
        company: header,
        dates: '',
        role: '',
        bullets: bullets.length ? bullets : [header],
      });
    }
  }

  const skills = Array.from(
    new Set(
      (rewritten + '\n' + history)
        .split(/[,;\n•]/)
        .map((s) => s.replace(/^[-*]\s*/, '').trim())
        .filter((s) => s.length > 2 && s.length < 48)
    )
  ).slice(0, 12);

  return {
    firstName,
    lastName,
    tagline: history.split('\n')[0]?.slice(0, 140) || undefined,
    aboutMe: history || undefined,
    profile: input.profileSummary || rewritten.split('\n').slice(0, 3).join(' ').slice(0, 320) || undefined,
    experience: experience.length ? experience : [{
      company: 'Professional background',
      dates: '',
      role: '',
      bullets: (rewritten || history || 'Add work history to populate this section.').split('\n').slice(0, 6),
    }],
    education: [],
    skills,
    phone: input.phone?.trim() || undefined,
    email: input.email?.trim() || undefined,
  };
}

export function mergeResumeDocument(
  structured: ResumeDocument | null,
  fallback: ResumeDocument
): ResumeDocument {
  if (!structured) return fallback;

  return {
    firstName: structured.firstName || fallback.firstName,
    lastName: structured.lastName || fallback.lastName,
    tagline: structured.tagline || fallback.tagline,
    aboutMe: structured.aboutMe || fallback.aboutMe,
    profile: structured.profile || fallback.profile,
    experience: structured.experience.length ? structured.experience : fallback.experience,
    education: structured.education.length ? structured.education : fallback.education,
    skills: structured.skills.length ? structured.skills : fallback.skills,
    phone: structured.phone || fallback.phone,
    email: structured.email || fallback.email,
    website: structured.website || fallback.website,
  };
}
