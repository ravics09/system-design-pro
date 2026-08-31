import express from 'express';
import mongoose from 'mongoose';
import { buildMatch, decodeCursor, encodeCursor, tokenize } from './search';

const port = Number(process.env.PORT ?? 3128);

const docSchema = new mongoose.Schema(
  { title: String, tokens: [String], createdAt: { type: Date, default: Date.now } },
  { versionKey: false },
);
docSchema.index({ tokens: 1, _id: -1 }); // multikey index backs token match + keyset sort
const Doc = mongoose.model('Doc', docSchema);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/search');

  const app = express();
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.post('/api/docs', async (req, res) => {
    const title = String(req.body?.title ?? '').trim();
    if (!title) return res.status(400).json({ error: 'title required' });
    const doc = await Doc.create({ title, tokens: tokenize(title) });
    res.status(201).json(doc);
  });

  // Cursor-paginated token search. /api/search?q=terms&limit=&cursor=
  app.get('/api/search', async (req, res) => {
    const tokens = tokenize(String(req.query.q ?? ''));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 10)));
    const cursorId = decodeCursor(req.query.cursor as string | undefined);
    const match = buildMatch(tokens, null); // token predicate (shape tested in unit tests)
    if (cursorId) match._id = { $lt: new mongoose.Types.ObjectId(cursorId) }; // keyset (as ObjectId)
    const items = await Doc.aggregate([
      { $match: match },
      { $sort: { _id: -1 } },
      { $limit: limit + 1 }, // +1 sentinel → is there a next page?
    ]);
    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    res.json({
      tokens,
      items: page,
      nextCursor: hasMore ? encodeCursor(String(page[page.length - 1]._id)) : null,
    });
  });

  app.listen(port, () => console.log(`[cursor-search] listening on :${port}`));
}

main().catch((err) => { console.error('fatal', err); process.exit(1); });
