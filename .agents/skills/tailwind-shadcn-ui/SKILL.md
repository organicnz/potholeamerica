---
name: tailwind-shadcn-ui
description: >-
  Standard practices for Tailwind CSS v4 and Shadcn UI component development.
  Use when creating, modifying, or styling user interface components, dialogs, badges, cards, or map overlay sheets.
---

# Tailwind CSS v4 & Shadcn UI

## Core Setup & Tooling
- **Tailwind CSS v4**: Configured via CSS tokens directly in `src/styles/globals.css` using `@import "tailwindcss";` and `@theme`.
- **Component Generator**: Use `bunx --bun shadcn@latest add <component_name>` to add official UI primitives.
- **Class Merging Utility**: Always merge dynamic classes using the `cn()` helper located at `src/lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Component Conventions

### 1. File Placement
- Primitives (Shadcn): `src/components/ui/` (e.g. `button.tsx`, `dialog.tsx`, `card.tsx`, `badge.tsx`)
- Domain Civic Components: `src/components/cases/`, `src/components/map/`, `src/components/civic/`

### 2. Civic Status Badges
Pothole America requires dual-status visualization. Implement distinct badges to clarify bureaucratic claims vs. civic reality:

```tsx
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function DualStatusBadges({
  officialStatus,
  communityStatus,
  className,
}: {
  officialStatus: 'NOT_SUBMITTED' | 'SUBMITTED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'CLOSED' | 'REJECTED';
  communityStatus: 'NEW' | 'CONFIRMED' | 'OPEN' | 'FIXED_PENDING_VERIFICATION' | 'RESOLVED' | 'REOPENED';
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap gap-2 items-center', className)}>
      {/* Official Status */}
      <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-200">
        Gov: {officialStatus.replace('_', ' ')}
      </Badge>

      {/* Community Status */}
      <Badge
        className={cn('font-semibold', {
          'bg-amber-500 text-slate-950': communityStatus === 'NEW' || communityStatus === 'CONFIRMED',
          'bg-red-600 text-white': communityStatus === 'OPEN' || communityStatus === 'REOPENED',
          'bg-emerald-600 text-white': communityStatus === 'RESOLVED',
          'bg-blue-600 text-white': communityStatus === 'FIXED_PENDING_VERIFICATION',
        })}
      >
        Community: {communityStatus.replace('_', ' ')}
      </Badge>
    </div>
  );
}
```

### 3. Floating Map Card & Mobile Bottom Sheet
When rendering a pothole preview on top of the map:
- Maintain frosted glass / backdrop blur (`backdrop-blur-md bg-slate-900/80 border border-slate-700/50`).
- Ensure touch targets are at least 44x44px for field mobile usage.
- Use `lucide-react` icons (e.g., `AlertTriangle`, `CheckCircle2`, `MapPin`, `Users`).

### 4. Color Palette Tokens
Avoid generic browser primaries. Use the curated civic theme tokens:
- **Alert / Overdue**: `amber-500` / `red-600`
- **Verified Repair**: `emerald-500` / `emerald-600`
- **Bureaucracy / Official**: `slate-600` / `slate-400`
- **Community Accent**: `indigo-500` / `sky-400`
- **Dark Surfaces**: `slate-950` (page), `slate-900` (card), `slate-800` (border)
