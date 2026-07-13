/**
 * Pros part requests — field tech submits, manager/accountant approves and orders.
 */

function serializePartRequest(id, data) {
  return {
    id,
    status: data.status || 'pending_approval',
    partName: data.partName || '',
    partNumber: data.partNumber || '',
    quantity: data.quantity || 1,
    brand: data.brand || '',
    equipmentModel: data.equipmentModel || '',
    notes: data.notes || '',
    jobId: data.jobId || null,
    jobTitle: data.jobTitle || null,
    packId: data.packId || 'property',
    diagnoseQuery: data.diagnoseQuery || '',
    requestedByUid: data.requestedByUid || null,
    requestedByName: data.requestedByName || '',
    requestedByEmail: data.requestedByEmail || null,
    approvedByUid: data.approvedByUid || null,
    approvedByName: data.approvedByName || null,
    orderedByUid: data.orderedByUid || null,
    orderedByName: data.orderedByName || null,
    declineReason: data.declineReason || null,
    supplierNote: data.supplierNote || null,
    partUrl: data.partUrl || null,
    createdAt: data.createdAt?.toMillis?.() ?? data.createdAt ?? null,
    updatedAt: data.updatedAt?.toMillis?.() ?? data.updatedAt ?? null,
    approvedAt: data.approvedAt?.toMillis?.() ?? data.approvedAt ?? null,
    orderedAt: data.orderedAt?.toMillis?.() ?? data.orderedAt ?? null,
  };
}

export function buildPartSearchLinks({ partName = '', partNumber = '', brand = '', model = '' } = {}) {
  const base = [brand, partNumber || partName, model].filter(Boolean).join(' ').trim();
  if (!base) return [];

  return [
    {
      label: 'Find part number (PDF)',
      query: `"${base}" OEM part number filetype:pdf`,
      googleUrl: `https://www.google.com/search?q=${encodeURIComponent(`"${base}" OEM part number filetype:pdf`)}`,
    },
    {
      label: 'Distributor search',
      query: `${base} replacement part buy`,
      googleUrl: `https://www.google.com/search?q=${encodeURIComponent(`${base} replacement part buy`)}`,
    },
    {
      label: 'Parts diagram',
      query: `"${base}" parts diagram filetype:pdf`,
      googleUrl: `https://www.google.com/search?q=${encodeURIComponent(`"${base}" parts diagram filetype:pdf`)}`,
    },
  ];
}

export async function createPartRequest(db, FieldValue, companyId, user, payload) {
  const partName = String(payload.partName || '').trim();
  if (!partName) throw new Error('Part name or description is required');

  const ref = db.collection('pros_companies').doc(companyId).collection('part_requests').doc();
  const quantity = Math.max(1, Math.min(99, Number(payload.quantity) || 1));

  const doc = {
    id: ref.id,
    status: 'pending_approval',
    partName: partName.slice(0, 200),
    partNumber: String(payload.partNumber || '').trim().slice(0, 80),
    quantity,
    brand: String(payload.brand || '').trim().slice(0, 80),
    equipmentModel: String(payload.equipmentModel || '').trim().slice(0, 80),
    notes: String(payload.notes || '').trim().slice(0, 1000),
    partUrl: String(payload.partUrl || '').trim().slice(0, 500) || null,
    jobId: payload.jobId || null,
    jobTitle: payload.jobTitle || null,
    packId: payload.packId || 'property',
    diagnoseQuery: String(payload.diagnoseQuery || '').slice(0, 500),
    requestedByUid: user.uid,
    requestedByName: payload.requestedByName || user.displayName || user.email?.split('@')[0] || 'Tech',
    requestedByEmail: user.email || null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.set(doc);

  if (payload.jobId) {
    try {
      const jobRef = db.collection('pros_companies').doc(companyId).collection('jobs').doc(payload.jobId);
      await jobRef.set(
        {
          status: 'needs_parts',
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // non-fatal
    }
  }

  return serializePartRequest(ref.id, { ...doc, createdAt: Date.now(), updatedAt: Date.now() });
}

export async function listPartRequests(db, companyId, { status } = {}) {
  let q = db.collection('pros_companies').doc(companyId).collection('part_requests');
  if (status && status !== 'all') {
    q = q.where('status', '==', status);
  }
  const snap = await q.orderBy('createdAt', 'desc').limit(100).get();
  return snap.docs.map((d) => serializePartRequest(d.id, d.data()));
}

export async function updatePartRequestStatus(
  db,
  FieldValue,
  companyId,
  requestId,
  user,
  { status, declineReason, supplierNote, memberName }
) {
  const ref = db.collection('pros_companies').doc(companyId).collection('part_requests').doc(requestId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Part request not found');

  const patch = {
    status,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (status === 'approved') {
    patch.approvedByUid = user.uid;
    patch.approvedByName = memberName || user.email || 'Manager';
    patch.approvedAt = FieldValue.serverTimestamp();
  }
  if (status === 'ordered') {
    patch.orderedByUid = user.uid;
    patch.orderedByName = memberName || user.email || 'Manager';
    patch.orderedAt = FieldValue.serverTimestamp();
    if (supplierNote) patch.supplierNote = String(supplierNote).slice(0, 500);
  }
  if (status === 'declined') {
    patch.declineReason = String(declineReason || 'Declined').slice(0, 300);
  }

  await ref.set(patch, { merge: true });
  const updated = await ref.get();
  return serializePartRequest(updated.id, updated.data());
}

export { serializePartRequest };
