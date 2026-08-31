import fs from 'node:fs/promises';
import path from 'node:path';
import express from 'express';
import sharp from 'sharp';
import { cacheKey, parseTransform } from './transform';

const port = Number(process.env.PORT ?? 3125);
const dataDir = process.env.DATA_DIR ?? './data';
const sourceDir = path.join(dataDir, 'source');
const cacheDir = path.join(dataDir, 'cache');
const allowedWidths = (process.env.ALLOWED_WIDTHS ?? '100,200,400,800,1200').split(',').map(Number);

async function main() {
  await fs.mkdir(sourceDir, { recursive: true });
  await fs.mkdir(cacheDir, { recursive: true });

  const app = express();
  app.use(express.raw({ type: ['image/*', 'application/octet-stream'], limit: '15mb' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  // Upload a source image (raw bytes). In production this is presigned direct-to-object-storage.
  app.put('/api/source/:id', async (req, res) => {
    if (!(req.body as Buffer)?.length) return res.status(400).json({ error: 'raw image body required' });
    try {
      const meta = await sharp(req.body as Buffer).metadata(); // validate it's a real image
      await fs.writeFile(path.join(sourceDir, req.params.id), req.body as Buffer);
      res.status(201).json({ id: req.params.id, width: meta.width, height: meta.height, format: meta.format });
    } catch {
      res.status(400).json({ error: 'invalid image' });
    }
  });

  // On-the-fly optimized delivery: /api/image/:id?w=&format=&q=&fit=
  app.get('/api/image/:id', async (req, res) => {
    const t = parseTransform(req.query as Record<string, unknown>, allowedWidths);
    const key = cacheKey(req.params.id, t);
    const cachePath = path.join(cacheDir, key);

    // Cache hit → serve the derivative, no processing.
    try {
      const cached = await fs.readFile(cachePath);
      res.set('x-cache', 'HIT').type(t.format).set('cache-control', 'public, max-age=31536000, immutable').send(cached);
      return;
    } catch { /* miss → generate */ }

    let source: Buffer;
    try {
      source = await fs.readFile(path.join(sourceDir, req.params.id));
    } catch {
      return res.status(404).json({ error: 'unknown image id' });
    }

    const pipeline = sharp(source).rotate();
    if (t.width) pipeline.resize({ width: t.width, fit: t.fit, withoutEnlargement: true });
    const out = await pipeline.toFormat(t.format, { quality: t.quality }).toBuffer();
    await fs.writeFile(cachePath, out); // cache the derivative for next time
    res.set('x-cache', 'MISS').type(t.format).set('cache-control', 'public, max-age=31536000, immutable').send(out);
  });

  app.listen(port, () => console.log(`[image-opt] listening on :${port}`));
}

main().catch((err) => { console.error('fatal', err); process.exit(1); });
