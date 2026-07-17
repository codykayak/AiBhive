import type { ResumeDocument } from '../../lib/resumeTemplate/types';
import { CODY_RESUME_COLORS } from '../../lib/resumeTemplate/codyVisualStyles';

function SectionTitle({ children }: { children: string }) {
  return (
    <h2
      className="text-[9px] tracking-[0.22em] uppercase font-bold pb-1 mb-2.5 border-b"
      style={{
        fontFamily: '"Courier New", monospace',
        color: CODY_RESUME_COLORS.gold,
        borderColor: CODY_RESUME_COLORS.rule,
      }}
    >
      {children}
    </h2>
  );
}

type Props = {
  doc: ResumeDocument;
  className?: string;
  id?: string;
};

/** Screen preview of the Cody two-column visual resume (matches PDF layout). */
export default function CodyVisualResume({ doc, className = '', id }: Props) {
  return (
    <div
      id={id}
      className={`mx-auto shadow-2xl ${className}`}
      style={{
        width: '8.5in',
        minHeight: '11in',
        background: CODY_RESUME_COLORS.paper,
        color: CODY_RESUME_COLORS.ink,
        padding: '0.55in 0.6in',
      }}
    >
      <header
        className="pb-3.5 mb-4"
        style={{ borderBottom: `3px solid ${CODY_RESUME_COLORS.gold}` }}
      >
        <div
          className="uppercase font-bold leading-none tracking-widest"
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '42px',
          }}
        >
          {doc.firstName}
          <br />
          <span style={{ color: CODY_RESUME_COLORS.gold }}>{doc.lastName}</span>
        </div>
        {doc.tagline && (
          <p
            className="mt-2.5 text-[11px] italic leading-snug max-w-[92%]"
            style={{ color: CODY_RESUME_COLORS.muted }}
          >
            {doc.tagline}
          </p>
        )}
      </header>

      <div className="grid gap-5" style={{ gridTemplateColumns: '1.15fr 0.85fr' }}>
        <div>
          {doc.aboutMe && (
            <section className="mb-4">
              <SectionTitle>About Me</SectionTitle>
              <p className="text-[10.5px] leading-relaxed" style={{ color: CODY_RESUME_COLORS.muted }}>
                {doc.aboutMe}
              </p>
            </section>
          )}

          <section className="mb-4">
            <SectionTitle>Experience</SectionTitle>
            <div className="space-y-3.5">
              {doc.experience.map((exp, index) => (
                <article key={`${exp.company}-${index}`}>
                  <h3
                    className="text-[13px] font-bold mb-0.5"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  >
                    {exp.company}
                  </h3>
                  {(exp.dates || exp.role) && (
                    <p
                      className="text-[9px] uppercase tracking-wide mb-1"
                      style={{ color: CODY_RESUME_COLORS.gold }}
                    >
                      {[exp.dates, exp.role].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {exp.bullets.length > 0 && (
                    <ul
                      className="list-disc pl-3.5 text-[10px] leading-relaxed"
                      style={{ color: CODY_RESUME_COLORS.muted }}
                    >
                      {exp.bullets.map((bullet, bulletIndex) => (
                        <li key={bulletIndex}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          </section>

          {doc.education.length > 0 && (
            <section className="mb-4">
              <SectionTitle>Education</SectionTitle>
              <div className="space-y-2.5">
                {doc.education.map((edu, index) => (
                  <div key={`${edu.credential}-${index}`}>
                    <p className="text-[11px] font-bold">{edu.credential}</p>
                    {(edu.dates || edu.school) && (
                      <p className="text-[9px] uppercase tracking-wide" style={{ color: CODY_RESUME_COLORS.gold }}>
                        {[edu.dates, edu.school].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside
          className="px-3.5 py-3"
          style={{
            background: CODY_RESUME_COLORS.sidebar,
            borderLeft: `2px solid ${CODY_RESUME_COLORS.rule}`,
          }}
        >
          {doc.profile && (
            <section className="mb-4">
              <SectionTitle>Profile</SectionTitle>
              <p className="text-[10.5px] leading-relaxed" style={{ color: CODY_RESUME_COLORS.muted }}>
                {doc.profile}
              </p>
            </section>
          )}

          {doc.skills.length > 0 && (
            <section className="mb-4">
              <SectionTitle>Skills</SectionTitle>
              <ul className="space-y-1">
                {doc.skills.map((skill) => (
                  <li
                    key={skill}
                    className="text-[10px] py-0.5 border-b last:border-b-0"
                    style={{ color: CODY_RESUME_COLORS.muted, borderColor: CODY_RESUME_COLORS.rule }}
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(doc.phone || doc.email || doc.website) && (
            <section className="mb-4">
              <SectionTitle>Contact</SectionTitle>
              <div className="space-y-1 text-[10.5px] font-semibold">
                {doc.phone && <p>{doc.phone}</p>}
                {doc.email && <p>{doc.email}</p>}
                {doc.website && <p>{doc.website}</p>}
              </div>
            </section>
          )}

          <p
            className="mt-4 text-[8px] uppercase tracking-widest"
            style={{ fontFamily: '"Courier New", monospace', color: CODY_RESUME_COLORS.gold }}
          >
            Generated with AiBhive Auto-Bot Resume
          </p>
        </aside>
      </div>
    </div>
  );
}
