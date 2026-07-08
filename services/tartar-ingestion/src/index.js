import express from 'express';

const app = express();
app.use(express.json());

const WORKER_SECRET = process.env.TARTAR_WORKER_SECRET ?? '';
const PORT = Number(process.env.PORT ?? 8080);
const FUNCTIONS_BASE = process.env.TARTAR_API_URL
  ?? process.env.AIBHIVE_API_URL
  ?? 'https://aibhive.com';

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'tartar-ingestion' });
});

/**
 * POST /ingest — proxy to Firebase tartarIngestionWorker
 * Body: { uid, jobId }
 */
app.post('/ingest', async (req, res) => {
  if (WORKER_SECRET && req.headers['x-tartar-worker-secret'] !== WORKER_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { uid, jobId } = req.body ?? {};
  if (!uid || !jobId) {
    res.status(400).json({ error: 'uid and jobId required' });
    return;
  }
  try {
    const workerRes = await fetch(`${FUNCTIONS_BASE}/api/tartar/ingestion/worker`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tartar-worker-secret': WORKER_SECRET,
      },
      body: JSON.stringify({ uid, jobId }),
    });
    const data = await workerRes.json();
    res.status(workerRes.status).json(data);
  } catch (err) {
    console.error('[ingest]', err);
    res.status(500).json({ error: String(err.message) });
  }
});

app.listen(PORT, () => {
  console.log(`tartar-ingestion listening on :${PORT}`);
});
