import { Link } from 'react-router-dom';
import SeoHead from '../components/SeoHead';
import ResponsiveImage from '../components/ResponsiveImage';
import { images } from '../utils/templateImages';
import layout from '../layout/site-layout.module.css';

const steps = [
  {
    title: 'Confirm authority to sell',
    body: 'Locate the will (if any), death certificate, and deed. Determine whether you need full probate, small-estate affidavit, or heirship affidavit under Oregon law. We help you understand which path fits before you spend on unnecessary legal fees.',
  },
  {
    title: 'Open or resolve estate administration',
    body: 'If probate is required, a personal representative is appointed in the county where the decedent lived. For smaller estates, Oregon may allow affidavit procedures — timing varies by county (Lane, Benton, Douglas, Deschutes, Linn).',
  },
  {
    title: 'Secure and insure the property',
    body: 'Change locks if needed, maintain basic utilities, forward mail, and notify insurers. Vacant inherited homes are targets for vandalism and pipe bursts — act quickly.',
  },
  {
    title: 'Inventory assets and debts',
    body: 'List mortgages, property taxes, HOA dues, and liens. Back taxes can often be resolved at closing when selling to a cash buyer who structures the payoff into the transaction.',
  },
  {
    title: 'Agree among heirs',
    body: 'All owners/heirs must align on price and terms. We regularly coordinate family calls and document signatures so one heir is not stuck managing everything alone.',
  },
  {
    title: 'Choose sale method: retail vs cash',
    body: 'Retail maximizes price only if the home is show-ready and heirs can wait. Cash is common when the house needs work, heirs live out of state, or emotions run high.',
  },
  {
    title: 'Title & closing',
    body: 'A Oregon title company issues commitment, clears liens, and records the deed. We work with title officers familiar with heirship sales and can close at their office or remotely when allowed.',
  },
  {
    title: 'Distribution of proceeds',
    body: 'After closing, the estate or heirs receive net proceeds per the will or Oregon intestate rules. Keep records for any final accounting if probate court requires it.',
  },
];

export default function ProbateGuide() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Sell an Inherited House in Oregon',
    description: 'Step-by-step guide to selling inherited and probate property in Oregon with NW Investor handling paperwork coordination.',
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.title,
      text: s.body,
    })),
  };

  return (
    <>
      <SeoHead
        title="Probate & Inherited House Guide Oregon | NW Investor"
        description="Sell an inherited Oregon home: probate, heirship affidavits, and cash sales explained. NW Investor coordinates title paperwork and closes fast."
        path="/probate-inherited-house-guide"
        keywords="sell inherited house Oregon, probate home sale Eugene, heirship affidavit Lane County"
        jsonLd={jsonLd}
      />

      <section className={layout.section}>
        <div className={layout.container}>
          <p className={layout.breadcrumb}>
            <Link to="/">Home</Link> / Probate & Inherited Guide
          </p>
          <div className={layout.grid2}>
            <div className={layout.prose}>
              <p className={layout.sectionLabel}>Inherited Property</p>
              <h1 className={layout.sectionTitle}>Probate & Inherited House Guide</h1>
              <p className={layout.sectionSub}>
                Losing a family member is hard enough without navigating county probate rules alone.
                <strong> We can take care of the paperwork coordination</strong> with your title
                company or ours — while you focus on family and closure.
              </p>
              <p>
                This is general Oregon information, not legal advice. For complex estates, consult an
                estate attorney; we are happy to work alongside them.
              </p>
            </div>
            <div className={layout.card} style={{ padding: 0, overflow: 'hidden' }}>
              <ResponsiveImage
                candidates={[images.affidavit, images.seller]}
                alt="Oregon heirship affidavit and inherited property sale"
              />
            </div>
          </div>

          <ol className={layout.prose} style={{ marginTop: 48, paddingLeft: 0, listStyle: 'none' }}>
            {steps.map((s, i) => (
              <li key={s.title} className={layout.card} style={{ marginBottom: 20 }}>
                <span className={layout.sectionLabel}>Step {i + 1}</span>
                <h2 style={{ marginTop: 8, fontSize: 22 }}>{s.title}</h2>
                <p style={{ margin: 0 }}>{s.body}</p>
              </li>
            ))}
          </ol>

          <div className={layout.ctaRow}>
            <Link to="/cash-offer-calculator" className={layout.ctaPrimary}>
              Estimate Cash Offer →
            </Link>
            <a href="/#offer" className={layout.ctaSecondary}>
              Tell Us About the Inherited Property
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
