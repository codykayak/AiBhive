/**
 * Per-user homework RAG corpus — each user only sees documents they own (createdBy = uid).
 */
import { FieldValue } from 'firebase-admin/firestore';
import { extractDocumentText } from './intelDocuments.js';

const COLLECTION = 'homework_documents';
const MAX_TEXT_CHARS = 200000;
const MAX_CONTEXT_CHARS = 80000;

function serializeDoc(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    chars: data.chars ?? data.text?.length ?? 0,
    mimeType: data.mimeType ?? null,
    originalFilename: data.originalFilename ?? null,
    source: data.source ?? 'upload',
    pageCount: data.pageCount ?? null,
    active: data.active !== false,
    createdBy: data.createdBy ?? null,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? data.updatedAt ?? null,
  };
}

export function createHomeworkRagService({ db, gcsBucket }) {
  const col = () => db.collection(COLLECTION);

  async function listDocuments(ownerKeys) {
    const keys = Array.isArray(ownerKeys) ? ownerKeys : [ownerKeys];
    const snap = await col().where('createdBy', 'in', keys.slice(0, 10)).get();
    return snap.docs
      .map(serializeDoc)
      .sort((a, b) => String(a.title).localeCompare(String(b.title)));
  }

  function ownsDocument(data, ownerKeys) {
    const keys = Array.isArray(ownerKeys) ? ownerKeys : [ownerKeys];
    return keys.includes(data.createdBy);
  }

  async function getDocument(id, ownerKeys) {
    const doc = await col().doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (!ownsDocument(data, ownerKeys)) return null;
    return serializeDoc(doc);
  }

  async function getDocumentText(id, ownerKeys) {
    const doc = await col().doc(id).get();
    if (!doc.exists) throw new Error('Document not found.');
    const data = doc.data();
    if (!ownsDocument(data, ownerKeys)) throw new Error('Document not found.');
    return {
      ...serializeDoc(doc),
      text: data.text ?? '',
    };
  }

  async function addDocument({ title, buffer, mimeType, originalFilename }, ownerId) {
    if (!title?.trim()) throw new Error('Title is required.');
    if (!buffer?.length) throw new Error('File is empty.');

    const base64 = buffer.toString('base64');
    let text = '';
    try {
      text = await extractDocumentText({
        name: originalFilename,
        mimeType,
        base64,
      });
    } catch (err) {
      throw new Error(err.message || 'Could not extract text from document.');
    }

    if (!text.trim()) throw new Error('Document contains no readable text.');
    text = text.slice(0, MAX_TEXT_CHARS);

    const safeName = (originalFilename || 'document').replace(/[^a-zA-Z0-9._-]/g, '_');
    const ref = col().doc();
    const storagePath = `homework/${ownerId}/${ref.id}/${safeName}`;

    await gcsBucket.file(storagePath).save(buffer, {
      metadata: { contentType: mimeType },
      resumable: false,
    });

    await ref.set({
      title: title.trim(),
      text,
      chars: text.length,
      mimeType,
      originalFilename: safeName,
      storagePath,
      active: true,
      createdBy: ownerId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return getDocument(ref.id, ownerId);
  }

  async function addTextDocument({ title, text, source = 'paste', pageCount = null }, ownerId) {
    if (!title?.trim()) throw new Error('Title is required.');
    const trimmed = String(text || '').trim();
    if (!trimmed) throw new Error('Text is required.');

    const ref = col().doc();
    const stored = trimmed.slice(0, MAX_TEXT_CHARS);
    await ref.set({
      title: title.trim(),
      text: stored,
      chars: stored.length,
      mimeType: 'text/plain',
      originalFilename: null,
      storagePath: null,
      source,
      pageCount: pageCount ?? null,
      active: true,
      createdBy: ownerId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return getDocument(ref.id, ownerId);
  }

  async function deleteDocument(id, ownerKeys) {
    const ref = col().doc(id);
    const doc = await ref.get();
    if (!doc.exists) throw new Error('Document not found.');
    const data = doc.data();
    if (!ownsDocument(data, ownerKeys)) throw new Error('Document not found.');

    if (data.storagePath) {
      try {
        await gcsBucket.file(data.storagePath).delete({ ignoreNotFound: true });
      } catch (err) {
        console.warn('[homework] GCS delete failed:', err.message);
      }
    }

    await ref.delete();
    return { success: true };
  }

  async function buildRagContext(ownerKeys) {
    const keys = Array.isArray(ownerKeys) ? ownerKeys : [ownerKeys];
    const snap = await col().where('createdBy', 'in', keys.slice(0, 10)).get();

    if (snap.empty) return '';

    const blocks = [];
    let total = 0;
    for (const doc of snap.docs) {
      const data = doc.data();
      if (data.active === false) continue;
      const text = String(data.text || '').trim();
      if (!text) continue;
      const header = `### ${data.title} (${text.length} chars)\n`;
      const budget = MAX_CONTEXT_CHARS - total - header.length;
      if (budget <= 0) break;
      const slice = text.slice(0, budget);
      blocks.push(`${header}${slice}`);
      total += header.length + slice.length;
    }

    return blocks.join('\n\n');
  }

  return {
    listDocuments,
    getDocument,
    getDocumentText,
    addDocument,
    addTextDocument,
    deleteDocument,
    buildRagContext,
  };
}
