---
name: nextjs16-app-router
description: >-
  Architectural guidelines and conventions for Next.js 16 App Router and React 19.
  Use when creating or modifying pages, layouts, server actions, route handlers, metadata, or data-fetching logic.
---

# Next.js 16 & React 19 Architecture

## Core Principles
1. **Server Components by Default**: All components in `app/` are React Server Components (RSC) unless explicitly marked with `'use client';`.
2. **Client Boundaries at the Leaves**: Isolate `'use client';` to interactive leaves (e.g., interactive map canvases, photo capture/dropzones, optimistic vote buttons). Pass server data down as serializable props or via `children`.
3. **Async Request APIs**: In Next.js 15+, dynamic parameters such as `params`, `searchParams`, `cookies()`, and `headers()` are asynchronous and **must** be awaited.

## Route Structure & Public Permalinks
The public case permalink is the core SEO asset of the platform:

```text
app/
├── (public)/
│   ├── layout.tsx
│   ├── page.tsx                    # Landing / Hero
│   ├── map/
│   │   └── page.tsx                # Interactive civic map
│   └── case/
│       └── [publicId]/
│           ├── page.tsx            # Public SSR case detail
│           ├── opengraph-image.tsx # Dynamic OG social card
│           └── loading.tsx         # Streaming skeleton
├── (authenticated)/
│   ├── report/
│   │   └── page.tsx                # Multi-step pothole reporting
│   └── profile/
│       └── page.tsx                # User impact dashboard
└── api/
    └── [[...route]]/
        └── route.ts                # Hono edge API handler
```

### Page Pattern with Awaited Dynamic Params
```tsx
interface PageProps {
  params: Promise<{ publicId: string }>;
}

export default async function CasePage({ params }: PageProps) {
  const { publicId } = await params;
  const caseData = await getCaseByPublicId(publicId);

  if (!caseData) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <CaseHeader caseData={caseData} />
      <CaseTimeline caseId={caseData.id} />
    </main>
  );
}
```

## React 19 Server Actions & Mutations
Mutations should use Server Actions defined in dedicated action files (`actions/*.ts`):

```tsx
'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export type ActionState = {
  success: boolean;
  error?: string;
};

export async function confirmCaseAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const caseId = formData.get('caseId') as string;
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.rpc('confirm_case', { target_case_id: caseId });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/case/${caseId}`);
  return { success: true };
}
```

### Client Form Usage with `useActionState`
```tsx
'use client';

import { useActionState } from 'react';
import { confirmCaseAction, ActionState } from '@/actions/cases';

const initialState: ActionState = { success: false };

export function ConfirmButton({ caseId }: { caseId: string }) {
  const [state, formAction, isPending] = useActionState(confirmCaseAction, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="caseId" value={caseId} />
      <button
        type="submit"
        disabled={isPending}
        className="btn-civic"
      >
        {isPending ? 'Confirming...' : 'I See This Too'}
      </button>
      {state.error && <p className="text-red-500 text-sm mt-1">{state.error}</p>}
    </form>
  );
}
```

## Dynamic OpenGraph Sharing Cards
Provide instant social proof cards using `@vercel/og` / `next/og`:
```tsx
// app/case/[publicId]/opengraph-image.tsx
import { ImageResponse } from 'next/og';
import { getCaseByPublicId } from '@/lib/cases';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };

export default async function Image({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const caseItem = await getCaseByPublicId(publicId);

  return new ImageResponse(
    (
      <div tw="flex flex-col w-full h-full bg-slate-900 text-white p-12 justify-between">
        <div tw="flex justify-between items-center">
          <span tw="text-2xl font-bold text-amber-400">Pothole America</span>
          <span tw="text-xl bg-slate-800 px-4 py-2 rounded">{caseItem?.public_id}</span>
        </div>
        <div tw="flex flex-col">
          <h1 tw="text-5xl font-extrabold mb-2">{caseItem?.address}</h1>
          <p tw="text-2xl text-slate-400">{caseItem?.confirmation_count} residents confirmed this hazard</p>
        </div>
        <div tw="flex items-center text-xl text-emerald-400">
          Community Status: {caseItem?.community_status}
        </div>
      </div>
    ),
    { ...size }
  );
}
```
