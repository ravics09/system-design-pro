# Image Upload Service — Reference Implementation

A runnable TypeScript/Node.js implementation of the design described in
[`../07-image-upload-service.md`](../07-image-upload-service.md).

It demonstrates the **pre-signed URL, direct-to-S3** upload pattern end to end:

1. The client asks the API for a **pre-signed upload URL** (bytes never flow through the server).
2. The client **PUTs the file directly to S3**.
3. The client (or an S3 event) **confirms** the upload; the record moves `PENDING → UPLOADED`.
4. A **queue** triggers an async **worker** that generates thumbnails/variants (`→ PROCESSING → READY`).
5. Images are served through a **CDN**, with signed URLs for private content.

## Architecture

```
Client ──1. POST /uploads──▶ Upload API ──▶ MongoDB (PENDING)
Client ◀─── pre-signed PUT URL ───
Client ──2. PUT bytes──────▶ S3 (private bucket)
Client ──3. POST /complete─▶ Upload API ──▶ MongoDB (UPLOADED) ──▶ Queue
                                                                     │
                                          Worker ◀── consume ────────┘
                                          Worker ──▶ S3 (derived variants)
                                          Worker ──▶ MongoDB (READY, variants[])
Viewer ──GET image──▶ CDN ──▶ S3
```

## Project layout

```
src/
├── config/            # zod-validated env config
├── types/             # shared types (AuthedRequest, ProcessImageJob, Variant)
├── errors/            # typed HTTP errors
├── lib/
│   ├── db.ts          # mongoose connection
│   ├── logger.ts      # structured logger
│   ├── cdn.ts         # public + signed delivery URLs
│   ├── reaper.ts      # deletes orphaned PENDING uploads
│   ├── storage/       # StorageProvider interface + S3 implementation
│   └── queue/         # JobQueue interface + SQS + in-memory implementations
├── models/
│   └── image.model.ts # metadata + status lifecycle
├── middleware/        # auth, rate limiter, validation, error handler
├── modules/
│   ├── upload/        # createUploadUrl + completeUpload (the 3-step flow)
│   └── image/         # metadata fetch + delivery URLs + delete
├── workers/
│   └── imageProcessor.ts  # async resize/transcode with sharp
├── app.ts             # Express wiring
└── server.ts          # bootstrap (API + in-process worker in dev)
```

## Key design decisions (mapped to the write-up)

| Decision | Where | Why |
|---|---|---|
| Bytes never proxy through Node | `upload.service.ts` (presign only) | Saves memory/bandwidth; S3 scales the transfer |
| Explicit status lifecycle | `image.model.ts`, `upload.service.ts` | Keeps metadata and bytes consistent |
| Verify object after upload | `completeUpload` → `storage.head()` | Never trust the client's declared size/type |
| Async processing | `queue/` + `workers/imageProcessor.ts` | CPU-heavy work must not block uploads |
| Idempotent processing | `processJob` (overwrite same keys, skip READY) | Survives at-least-once delivery / duplicate S3 events |
| Reap orphans | `lib/reaper.ts` | Cleans up uploads that never completed |
| Pluggable storage/queue/rate-limit | `lib/*/index.ts` factories | Runs locally without AWS; swaps to S3/SQS/Redis in prod |

## Running locally

Requirements: Node ≥ 20, a MongoDB instance. S3/SQS/Redis are optional in dev
(the `memory` drivers and a local storage fallback let the control flow run;
actual byte storage and image processing require real/emulated S3).

```bash
npm install
cp .env.example .env      # tweak as needed
npm run typecheck         # tsc --noEmit
npm run dev               # API + in-process worker (QUEUE_DRIVER=memory)
```

In production, run the API and worker as separate processes:

```bash
npm run build
npm run start             # API
npm run start:worker      # dedicated processing worker(s)
```

## API

### 1. Request a pre-signed upload URL

```http
POST /api/v1/uploads
Authorization: Bearer <userId>       # demo auth; swap for real JWT verification
Content-Type: application/json

{ "filename": "beach.jpg", "contentType": "image/jpeg", "size": 2483221 }
```

```json
// 201 Created
{
  "imageId": "img_9f2c...",
  "key": "uploads/<userId>/img_9f2c....jpg",
  "uploadUrl": "https://bucket.s3.amazonaws.com/uploads/...?X-Amz-Signature=...",
  "expiresIn": 300,
  "requiredHeaders": { "Content-Type": "image/jpeg" }
}
```

### 2. Upload the bytes directly to S3

```bash
curl -X PUT --upload-file beach.jpg \
  -H "Content-Type: image/jpeg" \
  "<uploadUrl from step 1>"
```

### 3. Confirm the upload

```http
POST /api/v1/uploads/img_9f2c.../complete
Authorization: Bearer <userId>
```

```json
// 200 OK
{ "imageId": "img_9f2c...", "status": "UPLOADED", "contentType": "image/jpeg", "size": 2483221 }
```

### 4. Fetch metadata + delivery URLs

```http
GET /api/v1/images/img_9f2c...?signed=true
```

```json
{
  "imageId": "img_9f2c...",
  "status": "READY",
  "url": "https://cdn.example.com/uploads/.../img_9f2c....jpg",
  "variants": [
    { "label": "thumb",  "width": 150, "contentType": "image/jpeg", "url": "https://cdn.example.com/derived/..._thumb.jpg" },
    { "label": "medium", "width": 800, "contentType": "image/jpeg", "url": "https://cdn.example.com/derived/..._medium.jpg" },
    { "label": "webp",   "width": 800, "contentType": "image/webp", "url": "https://cdn.example.com/derived/..._webp.webp" }
  ]
}
```

### 5. Delete (owner only)

```http
DELETE /api/v1/images/img_9f2c...
Authorization: Bearer <userId>
```

## Notes & simplifications

- **Auth** accepts a user id via `Authorization: Bearer <userId>` / `x-user-id` to stay runnable without
  an auth server. Replace `middleware/auth.ts` with real JWT verification (see Problem 01).
- **S3 event path** is implemented as `UploadService.markUploadedFromEvent()`; wire it to an S3 →
  SQS/Lambda notification in production as the authoritative "upload happened" signal.
- **Local byte storage**: the code targets S3. To exercise processing without AWS, point `S3_ENDPOINT`
  at LocalStack/MinIO.
- This is teaching code: it favours clarity over exhaustive production hardening (metrics, tracing,
  multipart uploads, virus scanning, moderation) — all discussed in the write-up.
