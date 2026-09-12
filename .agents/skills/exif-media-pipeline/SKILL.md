---
name: exif-media-pipeline
description: >-
  Field photo capture, EXIF GPS extraction, privacy sanitization, and direct signed storage uploads.
  Use when building photo upload components, extracting geotags from images, compressing media, or generating BlurHash placeholders.
---

# EXIF & Media Pipeline

## Architecture Overview
Never route multi-megabyte image uploads through Next.js server functions. All processing happens on the client or at the edge CDN:

```text
User selects photo
      │
      ├── 1. Extract GPS coords & timestamp from EXIF (exifr)
      ├── 2. Auto-orient and compress to WebP (<500KB)
      ├── 3. Generate 32-char BlurHash string for instant placeholder
      └── 4. Upload directly to Supabase Storage via pre-signed URL
```

---

## 1. Client-Side EXIF Extraction & Sanitization

```typescript
// src/lib/media/exif.ts
import exifr from 'exifr';

export interface ExtractedPhotoMetadata {
  latitude?: number;
  longitude?: number;
  capturedAt?: Date;
  hasLocation: boolean;
}

export async function extractPhotoMetadata(file: File): Promise<ExtractedPhotoMetadata> {
  try {
    const data = await exifr.parse(file, {
      gps: true,
      pick: ['latitude', 'longitude', 'DateTimeOriginal', 'CreateDate'],
    });

    if (data && data.latitude && data.longitude) {
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        capturedAt: data.DateTimeOriginal || data.CreateDate || new Date(),
        hasLocation: true,
      };
    }
  } catch (err) {
    console.warn('Could not extract EXIF data:', err);
  }

  return { hasLocation: false };
}
```

---

## 2. Client-Side WebP Compression & BlurHash

```typescript
// src/lib/media/compress.ts
import { encode } from 'blurhash';

export async function processAndCompressImage(file: File, maxDimension = 1600): Promise<{
  blob: Blob;
  blurhash: string;
}> {
  const imageBitmap = await createImageBitmap(file);
  const { width, height } = imageBitmap;

  // Scale down maintaining aspect ratio
  const scale = Math.min(maxDimension / width, maxDimension / height, 1);
  const targetWidth = Math.round(width * scale);
  const targetHeight = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

  // Generate BlurHash from downscaled canvas (32x32)
  const blurCanvas = document.createElement('canvas');
  blurCanvas.width = 32;
  blurCanvas.height = 32;
  const blurCtx = blurCanvas.getContext('2d')!;
  blurCtx.drawImage(canvas, 0, 0, 32, 32);
  const imgData = blurCtx.getImageData(0, 0, 32, 32);
  const blurhash = encode(imgData.data, 32, 32, 4, 3);

  // Convert to WebP blob
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/webp', 0.82);
  });

  return { blob, blurhash };
}
```

---

## 3. Direct Signed Upload Pattern

```typescript
// src/lib/media/upload.ts
import { createBrowserClient } from '@supabase/ssr';

export async function uploadCaseMedia({
  fileBlob,
  caseId,
  publicId,
}: {
  fileBlob: Blob;
  caseId: string;
  publicId: string;
}): Promise<string> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const filename = `${publicId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.webp`;

  const { data, error } = await supabase.storage
    .from('case-media')
    .upload(filename, fileBlob, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: false,
    });

  if (error) throw error;
  return data.path;
}
```
