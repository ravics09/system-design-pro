import express from 'express';
import mongoose from 'mongoose';
import { AuditLog, Invoice } from './models';
import { GENESIS, computeDiff, hashRecord, verifyChain, type AuditCore } from './audit';

const port = Number(process.env.PORT ?? 3133);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/audit');

  // Append an audit record chained to the previous one (tamper-evident).
  async function appendAudit(entityId: string, action: string, actor: string, changes: AuditCore['changes']) {
    const last = await AuditLog.findOne({ entityType: 'invoice' }).sort({ seq: -1 }).lean();
    const prevHash = last?.hash ?? GENESIS;
    const seq = (last?.seq ?? 0) + 1;
    const core: AuditCore = { entityType: 'invoice', entityId, action, actor, changes, at: new Date().toISOString() };
    const hash = hashRecord(prevHash, core);
    await AuditLog.create({ ...core, prevHash, hash, seq });
  }

  const app = express();
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.post('/api/invoices', async (req, res) => {
    const inv = await Invoice.create({ amount: Number(req.body?.amount ?? 0), note: req.body?.note });
    await appendAudit(String(inv._id), 'create', String(req.body?.actor ?? 'system'), computeDiff({}, inv.toObject()));
    res.status(201).json(inv);
  });

  app.put('/api/invoices/:id', async (req, res) => {
    const before = await Invoice.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ error: 'not found' });
    const after = await Invoice.findByIdAndUpdate(
      req.params.id,
      { $set: { amount: req.body?.amount ?? before.amount, status: req.body?.status ?? before.status, note: req.body?.note ?? before.note } },
      { new: true },
    ).lean();
    const changes = computeDiff(before as Record<string, unknown>, after as Record<string, unknown>);
    if (changes.length) await appendAudit(req.params.id, 'update', String(req.body?.actor ?? 'system'), changes);
    res.json({ invoice: after, changes });
  });

  app.get('/api/invoices/:id/audit', async (req, res) => {
    res.json({ items: await AuditLog.find({ entityId: req.params.id }).sort({ seq: 1 }).lean() });
  });

  // Verify the whole chain's integrity (detects tampering/deletion).
  app.get('/api/audit/verify', async (_req, res) => {
    const records = await AuditLog.find({ entityType: 'invoice' }).sort({ seq: 1 }).lean();
    res.json({ count: records.length, intact: verifyChain(records as never) });
  });

  app.listen(port, () => console.log(`[audit] listening on :${port}`));
}

main().catch((err) => { console.error('fatal', err); process.exit(1); });
