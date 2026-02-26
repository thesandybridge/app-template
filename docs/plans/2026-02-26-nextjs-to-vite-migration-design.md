# Next.js to Vite Migration Design

## Overview

Migrate app-template from Next.js 15 (App Router) to Vite + TanStack Router + Nitro v3, enabling full-stack Rust/React development with devforge orchestrating the backend.

## Motivation

- Rust API via devforge handles all backend/business logic — Next.js SSR and API routes are redundant
- No vendor lock-in to Vercel/Next.js ecosystem
- Simpler mental model: Vite for frontend, Rust for backend
- Vite SSR available when needed without forcing it everywhere

## Architecture

```
┌─────────────────────────────────────────────┐
│                  Browser                     │
│  React + TanStack Router + TanStack Query    │
└──────────────┬──────────────┬───────────────┘
               │              │
       /api/auth/*    /api/* (business logic)
               │              │
┌──────────────▼──────┐ ┌─────▼──────────────┐
│   Nitro v3 Server   │ │    Rust API         │
│   (Vite plugin)     │ │    (via devforge)   │
│   - SSR rendering   │ │    - DB queries     │
│   - Auth.js middleware│ │   - Business logic │
│   - Static serving   │ │    - Auth validation│
└─────────────────────┘ └────────────────────┘
```

Two servers:
1. **Nitro v3** (Node): SSR rendering, Auth.js, static assets
2. **Rust API** (devforge): Business logic, database, auth token validation

## Project Structure

```
app-template/
├── index.html                  # Vite entry point
├── vite.config.ts              # Vite + Nitro + MDX plugins
├── server.ts                   # Nitro SSR server config
├── server-entry.tsx            # React SSR render (renderToPipeableStream)
├── client-entry.tsx            # React hydration entry
├── src/
│   ├── router.tsx              # TanStack Router config
│   ├── routes/
│   │   ├── __root.tsx          # Root layout (providers, navbar, footer)
│   │   ├── index.tsx           # Home page (/)
│   │   ├── docs/
│   │   │   ├── index.tsx       # /docs
│   │   │   └── $slug.tsx       # /docs/:slug
│   │   └── icons/
│   │       └── index.tsx       # /icons
│   ├── components/
│   │   ├── ui/                 # shadcn/ui primitives (unchanged)
│   │   ├── theme-provider.tsx
│   │   ├── font-provider.tsx
│   │   ├── command-palette.tsx
│   │   ├── navbar.tsx
│   │   ├── footer.tsx
│   │   ├── logo.tsx
│   │   ├── favicon.tsx
│   │   ├── query-provider.tsx
│   │   ├── session-provider.tsx # Auth.js session (adapted)
│   │   ├── toaster.tsx
│   │   ├── docs-sidebar.tsx
│   │   ├── copyable-pre.tsx
│   │   └── icon-preview.tsx
│   └── lib/
│       ├── utils.ts
│       ├── docs.ts             # MDX loading (import.meta.glob)
│       └── auth.ts             # Auth.js client helpers
├── content/
│   └── docs/                   # MDX files
├── template.json               # Updated feature flags
├── package.json
├── tsconfig.json
└── postcss.config.mjs
```

## Dependency Changes

### Removed
- `next` — replaced by Vite + Nitro
- `next-auth` — replaced by `@auth/core` (framework-agnostic)

### Added
- `vite` — build tool + dev server
- `@tanstack/react-router` — file-based routing
- `@tanstack/react-router-devtools` — dev tools
- `@tanstack/router-plugin` — Vite plugin for file-based route generation
- `nitropack` (v3) — SSR server + API routes as Vite plugin
- `@mdx-js/rollup` — MDX compilation for Vite
- `@auth/core` — Auth.js core (framework-agnostic)

### Unchanged
- `react`, `react-dom` (v19)
- `tailwindcss` v4, `@tailwindcss/postcss`
- `@thesandybridge/themes`, `@thesandybridge/ui`
- `@tanstack/react-query` + devtools
- `radix-ui` primitives
- `class-variance-authority`, `clsx`, `tailwind-merge`
- `lucide-react`, `sonner`, `cmdk`
- All shadcn/ui components

## Component Migration

### No changes needed
- All `ui/` shadcn primitives — framework-agnostic
- `theme-provider.tsx` — pure React context
- `command-palette.tsx` — pure React
- `navbar.tsx`, `footer.tsx`, `logo.tsx`, `favicon.tsx` — pure JSX
- `toaster.tsx` — Sonner wrapper
- `query-provider.tsx` — TanStack Query

### Needs adaptation
- `session-provider.tsx` — Replace NextAuth SessionProvider with @auth/core session fetching
- `font-provider.tsx` — Replace `next/font/google` with `@fontsource/*` packages or `<link>` tags
- `docs-sidebar.tsx` — Data comes from route loaders instead of server component props

### Import replacements
- `next/link` → TanStack Router `<Link>`
- `next/navigation` → TanStack Router hooks (`useRouter`, `useMatch`, etc.)
- `next/image` → standard `<img>` tag
- `generateMetadata` → TanStack Router route `meta` or `react-helmet-async`

## SSR Data Flow

1. Route loaders fetch data before rendering (server-side during SSR, client-side on navigation)
2. Nitro calls `renderToPipeableStream` with TanStack `<RouterProvider>`
3. Auth session available via Nitro `event.context`, passed as initial props
4. TanStack Router handles dehydration/hydration automatically — no double-fetching

## Auth Flow

1. User clicks sign in → `/api/auth/signin` (Nitro middleware)
2. Auth.js handles OAuth callback, creates JWT session (httpOnly cookie)
3. Frontend reads session via `GET /api/auth/session`
4. Rust API validates JWT tokens directly for authorized requests

## MDX Docs System

- `@mdx-js/rollup` Vite plugin compiles MDX at build time
- `lib/docs.ts` uses `import.meta.glob` instead of Node `fs` for file discovery
- Frontmatter parsing via `gray-matter` (unchanged)
- `@thesandybridge/ui/mdx` components work unchanged

## Template System Updates

### template.json
Feature flags stay the same concept, updated file paths:
- `docs`: `src/routes/docs/**/*`, `content/docs/**/*`, `src/lib/docs.ts`
- `auth`: `src/lib/auth.ts`, `src/components/session-provider.tsx`, Nitro auth middleware
- `db`: Simplified — Rust API handles DB. Keep only if needed for Auth.js DB adapter.

### create-sandybridge-app
- Clone updated Vite-based template (same mechanism)
- Feature filtering: updated file paths
- Dependency manipulation: updated package names
- Adapt `cleanup_layout_for_no_auth()` for `__root.tsx`
- Scaffolder logic mostly unchanged — it's a generic template processor

## Migration Scope

This migration affects:
1. **app-template** — full rewrite of build/routing/server, component adaptations
2. **create-sandybridge-app** — update file paths, dependency lists, layout cleanup logic
3. **CLAUDE.md** — update project instructions to reflect new stack

Does NOT affect:
- `@thesandybridge/themes` — CSS-only package, framework-agnostic
- `@thesandybridge/ui` — React components, framework-agnostic
- `devforge` — Rust orchestration, independent of frontend framework
