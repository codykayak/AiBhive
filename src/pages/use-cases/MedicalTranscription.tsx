import UseCasePage from '../../components/UseCasePage';
import heroImage from '../../transcription_service_legal_medical.png';

export default function MedicalTranscription() {
  return (
    <UseCasePage
      seo={{
        title: 'AI Medical Transcription — Clinical-Grade Multi-Agent Accuracy | AiBhive',
        description:
          'AiBhive\'s Medical Transcription mode uses multi-agent AI tuned to clinical terminology, drug names, ICD-10 codes, and SOAP note structure. HIPAA-aware, fast, and built for clinicians and researchers.',
        keywords:
          'medical transcription, AI medical transcription, HIPAA transcription, clinical AI transcription, SOAP notes AI, AiBhive medical',
      }}
      eyebrow="For Clinicians"
      title="Clinical notes,"
      highlight="without the typing."
      subtitle="A multi-agent AI pipeline tuned for clinical terminology, drug names, ICD-10 codes, and SOAP note structure — designed for clinicians and researchers."
      heroImage={heroImage}
      heroAlt="Medical transcription with AI accuracy"
      stats={[
        { value: '99.9%', label: 'Medical jargon accuracy' },
        { value: 'HIPAA', label: 'Aware data handling' },
        { value: 'SOAP', label: 'Note auto-structure' },
        { value: '<30 min', label: 'Per hour of audio' },
      ]}
      intro={
        <>
          <p>
            A misheard medication name or dosage is one of the most consequential errors in
            modern healthcare documentation. Standard speech-to-text engines were not built for
            "metoprolol succinate ER 50 mg PO BID." AiBhive's Medical mode was.
          </p>
          <p>
            The Hive cross-references every drug name, dose, ICD-10 code, anatomical term, and
            procedure against curated medical corpora before finalizing the transcript. The
            result is a clinical document a clinician can actually sign off on with confidence.
          </p>
        </>
      }
      sections={[
        {
          heading: 'Structured SOAP notes from raw audio',
          body: (
            <>
              <p>
                Dictate a patient visit naturally. AiBhive's Medical Agent breaks the audio into
                Subjective, Objective, Assessment, and Plan sections automatically. You get a
                fully structured SOAP note back rather than a wall of text — ready to paste
                into the EHR.
              </p>
              <p>
                For ambulatory specialties we additionally infer chief complaint, history of
                present illness, and medication reconciliation as separate fields. For inpatient
                rounding workflows, the Hive captures problem-oriented documentation across
                multiple bedside encounters in a single session.
              </p>
            </>
          ),
        },
        {
          heading: 'Drug and dose verification',
          body: (
            <>
              <p>
                Drug names are spectacularly difficult for generic speech recognition. "Losartan"
                vs "lorazepam," "Adderall" vs "atenolol" — these are routine confusions for
                non-specialized models. AiBhive's Medical Agent maintains an active drug
                database and validates each candidate against pharmacological context before
                accepting it.
              </p>
              <p>
                The same applies to doses ("five mg q-eight-h PRN") and routes ("PO," "IV,"
                "IM," "SQ"). Dose-name combinations that don't appear in current formularies are
                flagged for review rather than silently transcribed.
              </p>
            </>
          ),
        },
        {
          heading: 'HIPAA-aware data handling',
          body: (
            <>
              <p>
                Patient audio is encrypted at rest and in transit. Identifiers are extracted
                into a separately-stored metadata layer that can be redacted from the
                downstream transcript on request, supporting de-identified research and
                quality-improvement workflows.
              </p>
              <p>
                We sign BAAs with covered entities and offer dedicated tenants for organizations
                with stricter data-residency or audit requirements. Retention policies are
                configurable, and audit logs cover every read and write.
              </p>
            </>
          ),
        },
        {
          heading: 'Translation for multilingual practices',
          body: (
            <>
              <p>
                For practices serving non-English-speaking patients, AiBhive can translate
                clinical notes into the patient's preferred language while preserving terminology
                fidelity. Translated discharge summaries, after-visit summaries, and patient
                instructions are delivered as separate documents alongside the canonical English
                clinical note.
              </p>
              <p>
                This is one of the highest-leverage uses of translation in healthcare —
                patient-facing materials in the patient's native language dramatically improve
                adherence and reduce readmissions.
              </p>
            </>
          ),
        },
      ]}
      checklistTitle="Why clinicians pick AiBhive"
      checklist={[
        'Auto-structured SOAP notes',
        'Drug, dose, and route validation',
        'ICD-10 and CPT code suggestions',
        'HIPAA-aware encryption and audit trail',
        'Translated patient-facing materials',
        'Per-minute pricing — no subscriptions',
      ]}
      faqs={[
        {
          q: 'Is AiBhive a substitute for a certified medical transcriptionist?',
          a: 'AiBhive is typically used as the primary transcription path with optional human review for high-acuity documentation. Many of our customers use the Hive as a first pass and assign their human transcriptionists to edit only flagged segments — typically 5-10% of the audio.',
        },
        {
          q: 'How is PHI protected?',
          a: 'All data is encrypted at rest (AES-256) and in transit (TLS 1.3). PHI is stored separately from transcript content, retention is configurable, and we sign BAAs with covered entities. Dedicated tenants are available for stricter requirements.',
        },
        {
          q: 'Does it work with my EHR?',
          a: 'We export transcripts and structured SOAP notes as plain text, RTF, or via our API. Direct integrations with Epic, Cerner, and Athena are available on the Enterprise tier.',
        },
        {
          q: 'What about specialty-specific terminology (oncology, cardiology, etc.)?',
          a: 'You can opt into specialty-specific terminology packs. The Hive will weight a relevant medical sub-corpus more heavily during the consensus pass and improve accuracy for that specialty.',
        },
      ]}
      ctaTitle="Try the Medical Hive on a sample dictation"
      ctaSubtitle="Upload a brief recording and see the structured output for yourself."
      ctaButton="Upload a Dictation"
    />
  );
}
