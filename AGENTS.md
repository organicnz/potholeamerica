# Pothole America — Agent Workspace Directives

## Architecture & Technology Stack
This repository implements **Pothole America**, a civic infrastructure accountability platform inspired by the public reporting model of RosYama, refactored for a modern geospatial and edge-first stack.

- **Runtime & Tooling**: Bun (`bun`, `bun add`, `bun run`, `bunx`) exclusively. Never use npm/npx/yarn/pnpm.
- **Frontend**: Next.js 16 (App Router), React 19 Server Components & Actions.
- **Styling & UI**: Tailwind CSS v4, Shadcn UI, Radix primitives, Lucide icons.
- **Backend & Database**: Supabase (PostgreSQL 16 + PostGIS, Storage, Auth, RLS, Edge Functions).
- **API Layer**: Hono edge routers with Zod validation and typed RPC clients (`hc`).
- **Code Quality**: Biome (formatter & imports), Oxlint (sub-50ms linter), Lefthook (pre-commit orchestration).

---

## Workspace Skills
Specialized procedures and runbooks are organized in `.agents/skills/`:

| Skill | Purpose | Key Commands / Directives |
|---|---|---|
| [bun-workflow](file:///.agents/skills/bun-workflow/SKILL.md) | Package management and script running | `bun add`, `bun run dev`, `bun test`, `bunx` |
| [nextjs16-app-router](file:///.agents/skills/nextjs16-app-router/SKILL.md) | Next.js 16 / React 19 conventions | Server Components, `useActionState`, `/case/[publicId]` |
| [tailwind-shadcn-ui](file:///.agents/skills/tailwind-shadcn-ui/SKILL.md) | UI components and civic tokens | `bunx --bun shadcn@latest add`, `cn()`, dual-status badges |
| [supabase-postgis-backend](file:///.agents/skills/supabase-postgis-backend/SKILL.md) | PostGIS spatial queries, RLS, RPC | `geography(Point, 4326)`, `ST_DWithin`, `confirm_case()` |
| [hono-edge-api](file:///.agents/skills/hono-edge-api/SKILL.md) | Type-safe Edge API & RPC | Hono sub-routers, `zValidator`, `hc<AppType>` |
| [oxlint-biome-quality](file:///.agents/skills/oxlint-biome-quality/SKILL.md) | Formatting, linting, git hooks | `bunx biome check --write .`, `bunx oxlint`, Lefthook |
| [civic-connector-engine](file:///.agents/skills/civic-connector-engine/SKILL.md) | Open311 GeoReport v2 & civic connectors | `CivicConnector`, Open311, REST adapters, mock sandbox |
| [geospatial-maplibre-ui](file:///.agents/skills/geospatial-maplibre-ui/SKILL.md) | MapLibre GL 60 FPS spatial UI & clustering | Supercluster, debounced viewport bounds, draggable pin |
| [exif-media-pipeline](file:///.agents/skills/exif-media-pipeline/SKILL.md) | Field photo capture & EXIF GPS extraction | `exifr`, WebP compression, BlurHash, direct upload |
| [pg-cron-statutory-tracker](file:///.agents/skills/pg-cron-statutory-tracker/SKILL.md) | Automated statutory review & escalation | `pg_cron`, `OVERDUE` transitions, `case_events` emission |
| [civic-jurisdiction-importer](file:///.agents/skills/civic-jurisdiction-importer/SKILL.md) | GeoJSON/Shapefile boundary ingestion | `ST_Contains`, `ST_Multi`, `ST_MakeValid`, agency routing |
| [supabase-realtime-events](file:///.agents/skills/supabase-realtime-events/SKILL.md) | Realtime event streaming & optimistic UI | Postgres Changes, live map pins, React 19 `useOptimistic` |

---

## Core Product Principle
Every road hazard is an **open public case**, not a private 311 ticket. Always maintain the **Dual Status Architecture**:
- `community_status`: What residents observe (`NEW`, `CONFIRMED`, `OPEN`, `FIXED_PENDING_VERIFICATION`, `RESOLVED`, `REOPENED`).
- `official_status`: What government reports (`NOT_SUBMITTED`, `SUBMITTED`, `ACKNOWLEDGED`, `IN_PROGRESS`, `CLOSED`, `REJECTED`).
