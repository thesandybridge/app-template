# App Template — Claude Code Instructions

## Stack
- **Framework:** Next.js 15 (App Router), TypeScript
- **Styling:** Tailwind CSS v4, shadcn/ui (New York style)
- **Packages:** `@thesandybridge/themes` (theme CSS + runtime), `@thesandybridge/ui` (shared components)
- **State:** TanStack React Query for server state

## Theme System
- `data-theme` attribute selects color theme, `data-mode` selects light/dark
- `generateThemeScript()` in `<head>` prevents FOUC
- Theme CSS imported via `@import "@thesandybridge/themes/css"` in globals.css
- `@custom-variant dark` maps to `[data-mode="dark"]`
- Theme/mode persisted in localStorage + cookies

## CSS
- `app/globals.css` uses `@theme inline` to map theme variables to Tailwind colors
- `@import "@thesandybridge/ui/source"` for shared UI component styles
- No CSS modules — all styling via Tailwind utilities

## Optional Features (template.json)
- **Auth:** NextAuth with GitHub OAuth (`auth.ts`, `auth.config.ts`)
- **DB:** PostgreSQL via `pg` (`lib/db.ts`)
- **Docs:** MDX in `content/docs/`, rendered with `@thesandybridge/ui/mdx`

## Components
- **Command palette:** `components/command-palette.tsx` — Cmd+K, navigation + theme + font switching
- **Theme picker:** `components/theme-picker.tsx` — dropdown with live preview on hover
- **Font provider:** `components/font-provider.tsx` — font selection context with localStorage persistence
- **Logo:** `components/logo.tsx` — inline SVG, uses `currentColor`
- **Favicon:** `components/favicon.tsx` — client wrapper drawing logo on 32x32 canvas

## Key File Paths
```
app/layout.tsx          — root layout with providers
app/globals.css         — theme variable mapping + base styles
app/page.tsx            — home page
components/             — all components (no src/ directory)
components/ui/          — shadcn/ui primitives
content/docs/           — MDX documentation files
lib/                    — utilities (db, docs, utils)
template.json           — template variables and feature flags
```

## Code Style
- Prefer editing existing files over creating new ones
- Avoid over-engineering — implement what's needed, not more
- No unnecessary comments or docstrings on obvious code

## Git
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `build:`, `perf:`
- Lowercase messages, concise but descriptive
- No Co-Authored-By lines
