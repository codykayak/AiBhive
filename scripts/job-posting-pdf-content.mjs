const SHARED_PAY = [
  '25% commission, flat, on every closed deal.',
  'At 20 hours per week, expected earnings are $10,000 per month.',
  '100% remote — work from anywhere in the United States.',
  'Commission-only. No base salary. Results vary with closes.',
];

const POSTINGS = [
  {
    id: 'aibhive-ai-solutions-closer',
    title: 'AI Solutions Closer',
    company: 'AiBhive',
    applyUrl: 'https://aibhive.com/jobs/aibhive',
    summary:
      'Sell custom AI software solutions to any company that needs help. You pick the accounts. We build the agents, apps, and automations that solve their problems.',
    role: [
      'Call businesses and close custom AI services — lead gen, ops, phone systems, documents, or whatever they actually need.',
      'You are not locked to one vertical. Any company with a messy workflow is a prospect.',
      'We deliver the build. You open the door and close the deal.',
    ],
    commissionNote:
      'Typical projects: $15,000–$50,000. At 25% commission, one $40,000 close = $10,000. Most closers target 1–2 projects per month.',
  },
  {
    id: 'manydoors-property-manager-closer',
    title: 'Property Manager Closer',
    company: 'ManyDoors AI',
    applyUrl: 'https://aibhive.com/jobs/manydoors',
    summary:
      'Call property managers and put ManyDoors AI on their portfolio. A few hundred dollars a month replaces chaos that costs them hundreds of thousands a year — sometimes millions.',
    role: [
      'Call property managers. Show the math: a few hundred bucks a month versus staff overtime, vacancy drag, and missed leasing.',
      'This is an easy sell when they see the savings. Software and apps for the office and the people in the field.',
      'You close. We onboard the portfolio.',
    ],
    commissionNote:
      'Typical portfolio fee: ~$400/month ($4,800/year). At 25% on first-year value, each close ≈ $1,200. Target ~8 portfolios/month for $10,000.',
  },
  {
    id: 'macrorei-appointment-setter',
    title: 'Homeowner Appointment Setter',
    company: 'MacroREI',
    applyUrl: 'https://aibhive.com/jobs/macrorei',
    summary:
      'This is not a sales pitch job. You call homeowners with distressed properties from proven lists curated by a real estate investor who has done over 100 deals. Ask if they want to sell. Set the appointment.',
    role: [
      'Work a curated list — not random dialing. Distressed owners, already researched.',
      'You are not selling a product. You are asking if they want to sell their house and booking a call with the investor.',
      'Closes on this desk are appointments that turn into deals. Commission is 25% of each deal, same as the other seats.',
    ],
    commissionNote:
      'Typical investor deal: $25,000–$40,000. At 25% commission, one $40,000 deal = $10,000. Target 1–2 closed deals per month.',
  },
];

function listHtml(items) {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
}

function postingHtml(posting) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${posting.title} — ${posting.company}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      color: #111;
      line-height: 1.55;
      margin: 0;
      padding: 0.6in 0.75in;
      font-size: 11.5pt;
    }
    h1 { font-size: 22pt; margin: 0 0 0.15in; font-family: Arial, sans-serif; }
    h2 { font-size: 13pt; margin: 0.28in 0 0.1in; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.04em; }
    .meta { font-family: Arial, sans-serif; font-size: 10.5pt; color: #333; margin-bottom: 0.25in; }
    .meta strong { color: #000; }
    p { margin: 0.12in 0; }
    ul { margin: 0.08in 0 0.12in; padding-left: 0.22in; }
    li { margin-bottom: 0.06in; }
    .apply {
      margin-top: 0.35in;
      padding: 0.18in 0.2in;
      border: 1px solid #ccc;
      background: #f7f7f7;
      font-family: Arial, sans-serif;
      font-size: 10.5pt;
    }
    .apply a { color: #0a58ca; word-break: break-all; }
    .footer { margin-top: 0.35in; font-size: 9pt; color: #666; font-family: Arial, sans-serif; }
  </style>
</head>
<body>
  <h1>${posting.title}</h1>
  <div class="meta">
    <p><strong>Company:</strong> ${posting.company}</p>
    <p><strong>Location:</strong> Remote (United States)</p>
    <p><strong>Job type:</strong> Part-time · Commission-only</p>
    <p><strong>Schedule:</strong> ~20 hours per week, phone-first</p>
    <p><strong>Posted:</strong> September 12, 2026</p>
  </div>

  <h2>Job summary</h2>
  <p>${posting.summary}</p>

  <h2>Responsibilities</h2>
  ${listHtml(posting.role)}

  <h2>Compensation</h2>
  ${listHtml(SHARED_PAY)}
  <p><strong>Commission math:</strong> ${posting.commissionNote}</p>

  <h2>How to apply</h2>
  <div class="apply">
    Apply online at <a href="${posting.applyUrl}">${posting.applyUrl}</a><br />
    Upload your resume, tell us about yourself, and pick the best time for a phone call.
  </div>

  <p class="footer">
    AiBhive hiring · Equal opportunity employer · Commission-only roles; earnings vary by performance.
  </p>
</body>
</html>`;
}

export const JOB_POSTING_PDFS = POSTINGS.map((posting) => ({
  id: posting.id,
  title: `${posting.title} — ${posting.company}`,
  html: postingHtml(posting),
}));
