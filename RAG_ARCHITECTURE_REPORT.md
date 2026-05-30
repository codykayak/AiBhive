# AiBhive RAG Architecture Report: Legal (Oregon) & Medical Translation

## 1. Executive Summary
To achieve near-perfect accuracy in high-risk translations (legal and medical), AiBhive will implement a Retrieval-Augmented Generation (RAG) system. This system will intercept the translation pipeline *before* the final Gemini 2.5 Pro context check, querying specialized databases to inject authoritative definitions, local statutes (Oregon), and standardized medical nomenclature into the prompt. This prevents LLM "hallucinations" and ensures translations adhere to strict industry standards.

## 2. System Architecture Workflow
1. **Initial Translation:** Whisper transcribes audio (if applicable), and an initial translation pass is made.
2. **Term Extraction:** A fast, cheap LLM pass (e.g., Gemini Flash) scans the text to extract *potential* high-risk English terms (e.g., "Subpoena duces tecum", "Myocardial infarction").
3. **Vector Retrieval (The RAG Step):**
   - The extracted terms are converted into numerical vectors using an embedding model (e.g., `text-embedding-3-small`).
   - These vectors are used to query a Vector Database (e.g., Pinecone, Weaviate, or Google Cloud Vertex AI Vector Search).
   - The database returns the Top-K most relevant text chunks containing definitions, statutes, or bilingual mappings.
4. **Augmented Prompting:** The retrieved context is appended to the prompt for the heavy-duty verification model (Gemini 2.5 Pro, Claude 3.5 Sonnet, etc.).
   - *Example Prompt Addition:* "When verifying this text, adhere strictly to the following Oregon statutes and Medical Subject Headings: [INJECTED RAG CONTEXT]."
5. **Final Output:** The model generates the final annotated output using the provided authoritative context.

## 3. Data Sources & Ingestion Strategy

### A. Oregon Legal Context
To provide accurate legal translations, the system must understand the specific definitions used in Oregon law, which can differ from federal or other state laws.

*   **Oregon Revised Statutes (ORS):**
    *   *Source:* Oregon State Legislature Website (XML/HTML).
    *   *Ingestion:* We will build a web scraper to ingest the ORS, focusing heavily on the "Definitions" sections of each chapter (e.g., ORS 161.015 General definitions).
*   **CourtListener (Free Law Project):**
    *   *Source:* `free.law` API / Bulk Data.
    *   *Ingestion:* Download the bulk archive of Oregon Supreme Court and Court of Appeals opinions. We will chunk these documents and embed them, allowing the system to see how legal terms are applied in actual Oregon case law.
*   **Oregon State Bar (OSB) Public Resources:**
    *   *Source:* `osbar.org/public`.
    *   *Ingestion:* Ingest plain-language pamphlets to bridge the gap between complex legalese and understandable translations.

### B. Medical Terminology
Medical translation requires absolute precision, often requiring exact matching to international standards rather than literal translations.

*   **Medical Subject Headings (MeSH):**
    *   *Source:* National Library of Medicine (NLM).
    *   *Ingestion:* Download the MeSH tree structures. This provides a hierarchy of terms (e.g., knowing that "Heart Attack" maps officially to "Myocardial Infarction").
*   **SNOMED CT (Systematized Nomenclature of Medicine):**
    *   *Source:* UMLS Metathesaurus.
    *   *Ingestion:* SNOMED CT is crucial because it provides established translations of clinical terms in multiple languages (Spanish, French, etc.). Ingesting this allows the RAG system to say "The standard Spanish term for X in SNOMED CT is Y," overriding the LLM's generic translation tendencies.
*   **PubMed Central (Open Access):**
    *   *Source:* NCBI API.
    *   *Ingestion:* While too large to ingest entirely, we can build a dynamic tool that allows the RAG system to perform a live search against the PubMed API for highly obscure terms to find contextual usage in peer-reviewed literature.

## 4. Implementation Next Steps
1. **Infrastructure:** Provision a Vector Database (recommendation: Google Cloud Vertex AI to keep data within the existing GCP ecosystem).
2. **Data Pipeline (ETL):** Write Python scripts to download, chunk (split into 500-word segments), embed, and upload the ORS and MeSH datasets.
3. **Integration:** Update `server/rag.js` to replace the mock data with actual vector database queries.
4. **Prompt Tuning:** Refine the prompt in `server/processing.js` to ensure the multi-model selector heavily weights the injected RAG context over its own pre-training data.
