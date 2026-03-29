# Research: Vercel Blob Bulk Image Upload Best Practices

## Summary
For 155 JPEG photos (0.5-1.2MB Medium versions), **server-side batch uploads via `@vercel/blob` SDK** is optimal. All files stay under Vercel's 4.5MB request limit. Payload CMS integrates via `@payloadcms/storage-vercel-blob` adapter; Next.js Image handles blob URLs natively.

---

## Key Findings

### 1. Upload Strategy (Server-Side Batch)
**Why server-side?** Your 0.5-1.2MB files comfortably fit within Vercel's 4.5MB Function body limit. Server-side batch upload (`put()`) is simpler than client-side + multipart.

**Rate limits:** Operations counted per API call. Batch 20 uploads per request to stay safely under rate limits. Deletion (`del()`) is free (doesn't count toward billing).

**Code snippet:**
```typescript
import { put } from '@vercel/blob';
import path from 'path';
import { readFileSync } from 'fs';

async function batchUploadPhotos(photoDir: string) {
  const photos = require('fs').readdirSync(photoDir)
    .filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg'))
    .slice(0, 20); // Batch size

  const uploads = photos.map(filename => {
    const filePath = path.join(photoDir, filename);
    const buffer = readFileSync(filePath);

    return put(`photos/${filename}`, buffer, {
      access: 'public', // Required for Next.js Image optimization
      addRandomSuffix: true, // Prevents accidental overwrites
      cacheControlMaxAge: 31536000, // 1 year (immutable assets)
    });
  });

  return Promise.all(uploads);
}
```

### 2. Image Optimization (Pre-Upload)
**Recommendation:** Your Medium versions (0.5-1.2MB) are already reasonable. Optional: convert to WebP for 20-30% size savings.

**With sharp:**
```typescript
import sharp from 'sharp';

async function optimizeToWebP(jpegPath: string): Promise<Buffer> {
  return sharp(jpegPath)
    .webp({ quality: 80 })
    .toBuffer();
}
```

**Without optimization:** Upload JPEG as-is; Vercel's image optimization will handle responsive sizes via Next.js Image component.

### 3. Payload CMS Integration
**Package:** `@payloadcms/storage-vercel-blob`

**Setup in `payload.config.ts`:**
```typescript
import { buildConfig } from 'payload';
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob';

export default buildConfig({
  collections: [
    {
      slug: 'media',
      upload: {
        staticDir: './public/uploads', // Local fallback (unused in prod)
        adminThumbnail: 'medium', // Payload admin preview size
      },
      hooks: {
        beforeValidate: [(args) => {
          // Inject storage adapter
          return args;
        }],
      },
    },
  ],
  plugins: [
    vercelBlobStorage({
      collections: {
        media: true, // Store media collection in Blob
      },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
});
```

**Env requirement:** `BLOB_READ_WRITE_TOKEN` (auto-created by Vercel when Blob enabled).

### 4. File Size Limits & Rate Limits
| Metric | Limit | Notes |
|--------|-------|-------|
| Single file | 512 MB (cached) | Your 1.2MB well under |
| Request body | 4.5 MB | Works for batches of 4× 1.2MB files |
| Multipart | 5 TB | Only needed for 100MB+ files |
| Rate limit | Per-operation | Batch deletes count as 1 op per blob |

**Your 155 photos:** 155 × 1.2MB ≈ 186 MB total. Upload in 8 batches of 20 = 8 operations.

### 5. Responsive URLs for Next.js Image
**Blob URL format:** `https://{hash}.public.blob.vercel-storage.com/folder/filename-{hash}.ext`

**Next.js integration:**
```typescript
import Image from 'next/image';

// Blob URL is standard HTTP — works directly
<Image
  src="https://abc123.public.blob.vercel-storage.com/photos/tour-1-xyz.jpg"
  alt="Tour location"
  width={800}
  height={600}
  sizes="(max-width: 640px) 100vw, 50vw"
/>
```

**Image optimization:** Next.js auto-generates srcset (640w, 750w, etc.) for responsive layouts. Public blob URLs enable CDN caching (1 month default).

**Domain config (optional, for image optimization):** Add to `next.config.ts` if using image optimization:
```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '*.public.blob.vercel-storage.com',
    },
  ],
}
```

### 6. Caching Strategy
- **Public blobs:** Cached for 1 month by default in CDN. Use `cacheControlMaxAge` option to customize.
- **Immutable assets:** Treat photos as immutable (use `addRandomSuffix: true`). Avoids 60-second propagation delays if updates needed.
- **Browser caching:** CDN auto-handles ETags; browsers cache and use conditional requests (304 Not Modified).

---

## Implementation Steps

1. **Prep files:** Confirm all Medium JPEGs are 0.5-1.2MB in photoDir
2. **Batch upload:** Use `batchUploadPhotos()` in a Next.js API route or build script
3. **Configure Payload:** Install `@payloadcms/storage-vercel-blob`, add to config, set `BLOB_READ_WRITE_TOKEN`
4. **Update media refs:** Payload auto-persists blob URLs in database; Next.js Image fetches by URL
5. **Test:** Verify Payload admin shows thumbnail previews, Next.js Image renders with correct srcset

---

## Trade-Offs & Risks

| Factor | Choice | Trade-off |
|--------|--------|-----------|
| **Upload method** | Server-side batch | Simpler than multipart; 0.5-1.2MB files don't need it |
| **Pre-optimization** | Skip sharp (optional) | Vercel image optimization handles responsive sizing; trade: slight latency on first request |
| **Storage access** | Public blobs | Enables Next.js Image optimization & CDN caching; trade: URLs are discoverable |
| **Immutability** | `addRandomSuffix: true` | Avoids overwrites & caching bugs; trade: storage grows if photos updated frequently |

---

## Adoption Risk: LOW

- **Maturity:** Vercel Blob (GA), Payload storage adapter (v3.75.0 stable)
- **Community:** Large—both widely used in Next.js ecosystem
- **Breaking changes:** None expected in next 12 months
- **Abandonment:** Vercel-backed; low risk

---

## Unresolved Questions

1. **Bulk delete after import?** If old photos should be deleted post-migration, use `del([pathnames])` after success.
2. **Regional optimization?** Current Blob region affects upload speed; consider region closest to CI/CD runner.
3. **Concurrent batch uploads?** 8 parallel batches (155 / 20) or sequential? Parallel faster but may hit rate limits; recommend sequential with 100ms delays.

---

**Report saved:** `researcher-01-vercel-blob-upload.md`

**Next steps:**
- Implement batchUploadPhotos() script (Node.js or Next.js API route)
- Configure `@payloadcms/storage-vercel-blob` in Payload config
- Test with 5-10 photos first, then full batch
