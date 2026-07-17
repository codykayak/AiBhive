import type { ResumeDocument } from './types';
import { CODY_RESUME_COLORS, CODY_RESUME_FONTS } from './codyVisualStyles';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sectionTitle(label: string): string {
  return `<h2 class="section-title">${escapeHtml(label)}</h2>`;
}

function experienceBlock(exp: ResumeDocument['experience'][number]): string {
  const meta = [exp.dates, exp.role].filter(Boolean).join(' · ');
  const bullets =
    exp.bullets.length > 0
      ? `<ul>${exp.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`
      : '';
  return `
    <article class="experience-item">
      <h3 class="company">${escapeHtml(exp.company)}</h3>
      ${meta ? `<p class="meta">${escapeHtml(meta)}</p>` : ''}
      ${bullets}
    </article>
  `;
}

function educationBlock(edu: ResumeDocument['education'][number]): string {
  const meta = [edu.dates, edu.school].filter(Boolean).join(' · ');
  return `
    <div class="education-item">
      <p class="credential">${escapeHtml(edu.credential)}</p>
      ${meta ? `<p class="meta">${escapeHtml(meta)}</p>` : ''}
    </div>
  `;
}

/** Print-ready HTML for the Cody visual resume template. */
export function buildResumePdfHtml(doc: ResumeDocument): string {
  const skills = doc.skills.map((s) => `<li>${escapeHtml(s)}</li>`).join('');
  const contact = [
    doc.phone ? `<p class="contact-line">${escapeHtml(doc.phone)}</p>` : '',
    doc.email ? `<p class="contact-line">${escapeHtml(doc.email)}</p>` : '',
    doc.website ? `<p class="contact-line">${escapeHtml(doc.website)}</p>` : '',
  ].join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(doc.firstName)} ${escapeHtml(doc.lastName)} — Resume</title>
  <style>
    @page { size: letter; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${CODY_RESUME_FONTS.body};
      color: ${CODY_RESUME_COLORS.ink};
      background: ${CODY_RESUME_COLORS.paper};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 8.5in;
      min-height: 11in;
      padding: 0.55in 0.6in;
      margin: 0 auto;
      background: ${CODY_RESUME_COLORS.paper};
    }
    .header {
      border-bottom: 3px solid ${CODY_RESUME_COLORS.gold};
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .name {
      font-family: ${CODY_RESUME_FONTS.display};
      font-size: 42px;
      line-height: 0.95;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      font-weight: 700;
    }
    .name .accent { color: ${CODY_RESUME_COLORS.gold}; }
    .tagline {
      margin-top: 10px;
      font-size: 11px;
      line-height: 1.45;
      color: ${CODY_RESUME_COLORS.muted};
      font-style: italic;
      max-width: 92%;
    }
    .grid {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 22px;
    }
    .section-title {
      font-family: ${CODY_RESUME_FONTS.mono};
      font-size: 9px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: ${CODY_RESUME_COLORS.gold};
      border-bottom: 1px solid ${CODY_RESUME_COLORS.rule};
      padding-bottom: 4px;
      margin: 0 0 10px;
      font-weight: 700;
    }
    .section { margin-bottom: 18px; }
    .body-text {
      font-size: 10.5px;
      line-height: 1.55;
      color: ${CODY_RESUME_COLORS.muted};
    }
    .sidebar {
      background: ${CODY_RESUME_COLORS.sidebar};
      border-left: 2px solid ${CODY_RESUME_COLORS.rule};
      padding: 14px 14px 10px;
    }
    .experience-item { margin-bottom: 14px; }
    .company {
      font-family: ${CODY_RESUME_FONTS.display};
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .meta {
      font-size: 9px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: ${CODY_RESUME_COLORS.gold};
      margin-bottom: 5px;
    }
    ul {
      padding-left: 14px;
      font-size: 10px;
      line-height: 1.5;
      color: ${CODY_RESUME_COLORS.muted};
    }
    li { margin-bottom: 3px; }
    .education-item { margin-bottom: 10px; }
    .credential {
      font-size: 11px;
      font-weight: 700;
      color: ${CODY_RESUME_COLORS.ink};
    }
    .skills-list {
      list-style: none;
      padding: 0;
    }
    .skills-list li {
      font-size: 10px;
      line-height: 1.45;
      padding: 3px 0;
      border-bottom: 1px solid ${CODY_RESUME_COLORS.rule};
      color: ${CODY_RESUME_COLORS.muted};
    }
    .skills-list li:last-child { border-bottom: none; }
    .contact-line {
      font-size: 10.5px;
      line-height: 1.6;
      color: ${CODY_RESUME_COLORS.ink};
      font-weight: 600;
    }
    .footer-url {
      margin-top: 16px;
      font-family: ${CODY_RESUME_FONTS.mono};
      font-size: 8px;
      letter-spacing: 0.12em;
      color: ${CODY_RESUME_COLORS.gold};
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="page">
    <header class="header">
      <div class="name">${escapeHtml(doc.firstName)}<br />${escapeHtml(doc.lastName)}</div>
      ${doc.tagline ? `<p class="tagline">${escapeHtml(doc.tagline)}</p>` : ''}
    </header>

    <div class="grid">
      <div class="main">
        ${doc.aboutMe ? `<section class="section">${sectionTitle('About Me')}${`<p class="body-text">${escapeHtml(doc.aboutMe)}</p>`}</section>` : ''}
        <section class="section">
          ${sectionTitle('Experience')}
          ${doc.experience.map(experienceBlock).join('')}
        </section>
        ${
          doc.education.length
            ? `<section class="section">${sectionTitle('Education')}${doc.education.map(educationBlock).join('')}</section>`
            : ''
        }
      </div>

      <aside class="sidebar">
        ${doc.profile ? `<section class="section">${sectionTitle('Profile')}${`<p class="body-text">${escapeHtml(doc.profile)}</p>`}</section>` : ''}
        ${
          doc.skills.length
            ? `<section class="section">${sectionTitle('Skills')}${`<ul class="skills-list">${skills}</ul>`}</section>`
            : ''
        }
        ${
          contact
            ? `<section class="section">${sectionTitle('Contact')}${contact}</section>`
            : ''
        }
        <p class="footer-url">Generated with AiBhive Auto-Bot Resume</p>
      </aside>
    </div>
  </div>
</body>
</html>`;
}
