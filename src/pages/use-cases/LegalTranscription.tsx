import UseCasePage from '../../components/UseCasePage';
import heroImage from '../../transcription_service_legal_medical.png';

export default function LegalTranscription() {
  return (
    <UseCasePage
      seo={{
        title: 'AI Legal Transcription — Citation-Aware Multi-Agent Accuracy | AiBhive',
        description:
          'AiBhive\'s Legal Transcription mode uses multi-agent AI to deliver court-grade transcripts with proper citation formatting, speaker diarization, and verified terminology. Built for litigators, paralegals, and court reporters.',
        keywords:
          'legal transcription, AI legal transcription, deposition transcription, court reporter AI, legal AI transcription accuracy, AiBhive legal',
      }}
      eyebrow="For Legal Teams"
      title="Court-grade transcripts,"
      highlight="without the markup."
      subtitle="A multi-agent AI pipeline specifically tuned for depositions, court proceedings, and legal documentation — with citation awareness baked in."
      heroImage={heroImage}
      heroAlt="Legal transcription with AI accuracy"
      stats={[
        { value: '99.9%', label: 'Accuracy on legal jargon' },
        { value: '10x', label: 'Faster than human transcription' },
        { value: 'HIPAA', label: 'Compliant data handling' },
        { value: 'Multi', label: 'Speaker diarization' },
      ]}
      intro={
        <>
          <p>
            Legal transcription is the single least forgiving domain in transcription. A single
            misheard word — "subacute" vs "acute," "shall" vs "should," "with prejudice" vs
            "without prejudice" — can change the meaning of a discovery exhibit, a deposition
            answer, or a contract. Standard speech-to-text APIs are not built for this.
          </p>
          <p>
            AiBhive's Legal mode is. It runs your audio through a hive of specialized agents
            cross-referencing legal corpora, citation formats, and procedural terminology, then
            assembles a transcript that's ready for filing rather than rewriting.
          </p>
        </>
      }
      sections={[
        {
          heading: 'Citation-aware transcription',
          body: (
            <>
              <p>
                When an attorney says "see Smith v. Jones, 401 U.S. 234, 1971," a generic
                transcription engine will write "401 U S 234 1971" as a comma-soup of digits.
                AiBhive's Legal Agent recognizes the citation pattern, formats it as a proper
                Bluebook citation, and links related references so reviewers can navigate
                quickly.
              </p>
              <p>
                The same applies to case names, statute references (e.g. "Title 17 U.S.C. §
                512"), Federal Rules of Civil Procedure, and procedural objections ("asked and
                answered," "calls for speculation," "form"). The output is structured rather
                than just literal.
              </p>
            </>
          ),
        },
        {
          heading: 'Speaker diarization built for the courtroom',
          body: (
            <>
              <p>
                Most depositions involve at least three speakers — the attorney, the witness,
                and a court reporter — and frequently more. AiBhive separates speakers
                automatically, labels them by role (where role context is available), and
                produces transcripts in the Q/A format counsel actually wants.
              </p>
              <p>
                For multi-party hearings, you can pre-register speakers with a 10-second
                reference sample each and the Hive will name them rather than just numbering
                them. That alone saves hours of post-editing.
              </p>
            </>
          ),
        },
        {
          heading: 'A defensible audit trail',
          body: (
            <>
              <p>
                Every transcript ships with a confidence map indicating where the model was
                uncertain. For high-stakes use, attorneys can sort by lowest-confidence segments
                and listen back to just those moments — typically a few minutes per hour of
                audio rather than re-listening to the whole thing.
              </p>
              <p>
                Each file is stored encrypted at rest and in transit, with retention policies
                you control. The Hive supports air-gapped deployment for firms with strict
                privilege requirements and produces logs suitable for chain-of-custody
                documentation.
              </p>
            </>
          ),
        },
        {
          heading: 'Cost-per-hour comparison',
          body: (
            <>
              <p>
                Traditional certified legal transcription runs roughly $4-$7 per audio minute,
                with multi-day turnaround. AiBhive's Legal mode is priced per audio minute and
                returns transcripts in under 30 minutes for most jobs — typically a 60-90%
                reduction in cost and an order of magnitude reduction in turnaround.
              </p>
              <p>
                For firms doing high-volume discovery work, the savings compound quickly. Many
                of our customers use AiBhive for first-pass transcription and reserve their
                human court reporters for proceedings requiring certification, getting the best
                of both.
              </p>
            </>
          ),
        },
      ]}
      checklistTitle="Why legal teams pick AiBhive"
      checklist={[
        'Citation-aware formatting (Bluebook, USC, FRCP)',
        'Speaker diarization with role labelling',
        'Per-segment confidence scoring',
        'Encrypted storage with chain-of-custody logs',
        '99.9% accuracy on legal terminology',
        'Per-minute pricing — no contracts',
      ]}
      faqs={[
        {
          q: 'Is this admissible in court?',
          a: 'AiBhive transcripts are typically used for case preparation, internal review, and as a starting point for certified court reporting. Certification rules vary by jurisdiction; our transcripts include audit metadata that supports certification by a human court reporter where required.',
        },
        {
          q: 'How is privileged audio handled?',
          a: 'Files are encrypted at rest using AES-256 and in transit using TLS 1.3. Privileged audio can be processed in a private VPC tenant on request, and we sign BAAs and standard legal vendor agreements.',
        },
        {
          q: 'Does it handle accents and overlapping speakers?',
          a: 'Yes. The acoustic model is trained on a broad range of English accents and the Hive specifically segments overlapping speech rather than averaging it. Heavy cross-talk still benefits from a human review pass, but accuracy on overlapping segments is dramatically higher than single-model engines.',
        },
        {
          q: 'Can we self-host?',
          a: 'For firms with strict data residency requirements we offer dedicated tenants and air-gapped deployments. Contact us for details.',
        },
      ]}
      ctaTitle="Try the Legal Hive on a sample deposition"
      ctaSubtitle="Upload a short clip and see the difference in formatting, diarization, and citation handling."
      ctaButton="Upload a Sample"
    />
  );
}
