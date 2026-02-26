# Next.js to Vite Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate app-template from Next.js 15 to Vite + TanStack Router + Nitro v3

**Architecture:** Vite builds the React SPA with TanStack Router for file-based routing. Nitro v3 (Vite plugin) provides API routes (Auth.js) and SSR rendering. Rust API via devforge handles business logic/DB.

**Tech Stack:** Vite (beta), TanStack Router, Nitro v3 (alpha), @auth/core, @mdx-js/rollup, React 19, Tailwind CSS v4

**Design doc:** `docs/plans/2026-02-26-nextjs-to-vite-migration-design.md`

---

## Phase 1: Core Migration (SPA)

### Task 1: Bootstrap Vite + TanStack Router

Replace Next.js build system with Vite and set up TanStack Router file-based routing.

**Files:**
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/router.tsx`
- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify: `postcss.config.mjs`
- Delete: `next.config.ts`
- Delete: `next-env.d.ts` (if exists)

**Step 1: Update package.json**

```json
{
  "name": "{{project_name}}",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.72.1",
    "@tanstack/react-router": "^1.163.2",
    "@thesandybridge/themes": "^1.5.0",
    "@thesandybridge/ui": "^1.3.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.4",
    "lucide-react": "^0.477.0",
    "radix-ui": "^1.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "sonner": "^2.0.3",
    "tailwind-merge": "^3.2.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.3",
    "@tanstack/react-query-devtools": "^5.72.1",
    "@tanstack/react-router-devtools": "^1.163.2",
    "@tanstack/router-plugin": "^1.163.2",
    "@types/node": "^22.14.0",
    "@types/react": "^19.1.2",
    "@types/react-dom": "^19.1.2",
    "@vitejs/plugin-react": "^4.5.2",
    "tailwindcss": "^4.1.3",
    "tw-animate-css": "^1.2.9",
    "typescript": "^5.8.3",
    "vite": "^6.3.0"
  }
}
```

Note: Start with stable `vite` (not beta). Nitro v3 requiring `vite@beta` will be handled in Phase 2.

**Step 2: Create `vite.config.ts`**

```ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import path from "node:path"

export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

**Step 3: Create `index.html`**

Standard Vite entry point with inline FOUC-prevention script that reads theme/mode/font from localStorage/cookies and sets `data-*` attributes on `<html>` before first paint. The script only uses hardcoded string literals (no user input) so it is safe to inline.

**Step 4: Create `src/main.tsx`**

```tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "@tanstack/react-router"
import { createRouter } from "./router"

const router = createRouter()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
```

**Step 5: Create `src/router.tsx`**

```tsx
import { createRouter as createReactRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"

export function createRouter() {
  return createReactRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
  })
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
```

**Step 6: Update `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src", "vite.config.ts"],
  "exclude": ["node_modules"]
}
```

**Step 7: Delete Next.js files**

Delete: `next.config.ts`, `next-env.d.ts`

**Step 8: Move source files into `src/`**

Move `components/` to `src/components/` and `lib/` to `src/lib/`.

The `app/` directory will be replaced by `src/routes/` in the next task -- don't delete it yet.

**Step 9: Verify setup**

Run: `rm -rf node_modules package-lock.json && npm install`
Run: `npx tsc --noEmit` (will have errors until routes exist -- that's expected)

**Step 10: Commit**

Message: `chore: replace next.js with vite + tanstack router scaffold`

---

### Task 2: Create Root Layout and Home Route

Migrate `app/layout.tsx` to `src/routes/__root.tsx` and `app/page.tsx` to `src/routes/index.tsx`.

**Files:**
- Create: `src/routes/__root.tsx`
- Create: `src/routes/index.tsx`
- Move: `app/globals.css` to `src/globals.css`
- Delete: `app/layout.tsx`, `app/page.tsx`

**Step 1: Move globals.css**

Move `app/globals.css` to `src/globals.css`.

**Step 2: Create `src/routes/__root.tsx`**

This replaces `app/layout.tsx`. In SPA mode, `__root.tsx` provides the layout wrapper (not the full `<html>` document -- that's `index.html`).

```tsx
import { createRootRoute, Outlet } from "@tanstack/react-router"
import { ThemeProvider } from "@/components/theme-provider"
import { FontProvider } from "@/components/font-provider"
import { Favicon } from "@/components/favicon"
import { QueryProvider } from "@/components/query-provider"
import { CommandPaletteProvider } from "@/components/command-palette"
import { Navbar } from "@/components/navbar"
import { Toaster } from "@/components/toaster"
import { Footer } from "@/components/footer"
import "@/globals.css"

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <FontProvider>
          <Favicon />
          <CommandPaletteProvider>
            <Navbar />
            <Toaster />
            <main className="flex flex-1 flex-col">
              <Outlet />
            </main>
            <Footer />
          </CommandPaletteProvider>
        </FontProvider>
      </ThemeProvider>
    </QueryProvider>
  )
}
```

Note: `SessionProvider` is omitted -- Auth.js integration comes in Phase 2.

**Step 3: Create `src/routes/index.tsx`**

Migrate `app/page.tsx`:
- Replace `import Link from "next/link"` with `import { Link } from "@tanstack/react-router"`
- Change `href` props to `to` props
- Wrap in `createFileRoute("/")({ component: Home })`
- Update copy: "A modern Vite + React starter template"

**Step 4: Delete old files**

Delete: `app/page.tsx`, `app/layout.tsx`

**Step 5: Commit**

Message: `feat: root layout and home route with tanstack router`

---

### Task 3: Migrate Components

Adapt all components to remove Next.js dependencies.

Changes applied to ALL components:
- Remove `'use client'` directives
- Replace `next/link` `Link` with `@tanstack/react-router` `Link` (change `href` to `to`)
- Replace `next/navigation` hooks with TanStack Router equivalents

**Files:**
- Modify: `src/components/navbar.tsx`
- Modify: `src/components/command-palette.tsx`
- Modify: `src/components/footer.tsx`
- Modify: `src/components/font-provider.tsx`
- Modify: `src/components/theme-provider.tsx`
- Modify: `src/components/theme-picker.tsx`
- Modify: `src/components/docs-sidebar.tsx`
- Modify: `src/components/favicon.tsx`
- Modify: `src/components/toaster.tsx`
- Modify: `src/components/query-provider.tsx`
- Modify: `src/components/copyable-pre.tsx`

**Step 1: `navbar.tsx`**

- Remove `'use client'`
- Replace `import Link from "next/link"` with `import { Link } from "@tanstack/react-router"`
- Change all `<Link href="...">` to `<Link to="...">`

**Step 2: `command-palette.tsx`**

- Remove `'use client'`
- Replace `import { useRouter } from "next/navigation"` with `import { useNavigate } from "@tanstack/react-router"`
- Replace `const router = useRouter()` with `const navigate = useNavigate()`
- Replace `router.push("/path")` with `navigate({ to: "/path" })`

**Step 3: `footer.tsx`**

- Replace `import Link from "next/link"` with `import { Link } from "@tanstack/react-router"`
- Change all `<Link href="...">` to `<Link to="...">`
- Change "Built with Next.js" to "Built with Vite"

**Step 4: `docs-sidebar.tsx`**

- Remove `'use client'`
- Replace `import Link from "next/link"` with `import { Link, useLocation } from "@tanstack/react-router"`
- Remove `import { usePathname } from "next/navigation"`
- Replace `const pathname = usePathname()` with `const { pathname } = useLocation()`
- Change all `<Link href="...">` to `<Link to="...">`
- For dynamic links: `<Link to="/docs/$slug" params={{ slug: doc.slug }}>`

**Step 5: Remove `'use client'` from remaining components**

These need no other changes:
- `src/components/theme-provider.tsx`
- `src/components/theme-picker.tsx`
- `src/components/favicon.tsx`
- `src/components/toaster.tsx`
- `src/components/query-provider.tsx`
- `src/components/copyable-pre.tsx`
- `src/components/font-provider.tsx`

**Step 6: Install font packages**

Since `next/font/google` is gone, use `@fontsource`:

Install: `npm install @fontsource-variable/inter @fontsource-variable/jetbrains-mono @fontsource/geist-sans`

**Step 7: Update `src/globals.css` font rules**

Add font imports after tailwindcss import:

```css
@import "@fontsource-variable/inter";
@import "@fontsource-variable/jetbrains-mono";
@import "@fontsource/geist-sans/400.css";
@import "@fontsource/geist-sans/500.css";
@import "@fontsource/geist-sans/600.css";
@import "@fontsource/geist-sans/700.css";
```

Update font-family rules (replace CSS variable references with direct family names):

```css
html[data-font="inter"] body {
  font-family: "Inter Variable", "Inter", ui-sans-serif, system-ui, sans-serif;
}
html[data-font="geist-sans"] body {
  font-family: "Geist Sans", ui-sans-serif, system-ui, sans-serif;
}
html[data-font="jetbrains-mono"] body {
  font-family: "JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace;
}
```

**Step 8: Verify compilation**

Run: `npx tsc --noEmit`

**Step 9: Commit**

Message: `feat: migrate components from next.js to tanstack router`

---

### Task 4: Migrate Routes (Icons, Error, Not-Found)

Create remaining routes. Docs routes handled separately in Task 5.

**Files:**
- Create: `src/routes/icons/index.tsx`
- Modify: `src/routes/__root.tsx` (add error/not-found)
- Delete: `app/icons/page.tsx`, `app/error.tsx`, `app/not-found.tsx`
- Delete: `app/robots.ts`, `app/sitemap.ts`, `app/api/`

**Step 1: Create `src/routes/icons/index.tsx`**

Copy `app/icons/page.tsx` content:
- Remove `'use client'`
- Wrap in `createFileRoute("/icons/")({ component: IconsPage })`
- Fix `@/` imports

**Step 2: Add error/not-found to `__root.tsx`**

Add `errorComponent` and `notFoundComponent` options to the root route:
- `ErrorComponent`: shows error message + "Try again" button (calls `router.invalidate()`)
- `NotFoundComponent`: shows 404 message + "Go Home" link

**Step 3: Delete old app files**

Delete: `app/icons/`, `app/error.tsx`, `app/not-found.tsx`, `app/robots.ts`, `app/sitemap.ts`, `app/api/`

**Step 4: Test dev server**

Run: `npm run dev`
Verify: home page loads, icons page works, theme switching works, command palette works.

**Step 5: Commit**

Message: `feat: migrate icons route, error/not-found handling`

---

### Task 5: MDX Documentation System

Set up MDX compilation with Vite and migrate docs routes.

**Files:**
- Modify: `vite.config.ts` (add MDX plugin)
- Modify: `src/lib/docs.ts` (use `import.meta.glob`)
- Create: `src/routes/docs/route.tsx` (docs layout)
- Create: `src/routes/docs/index.tsx` (docs listing)
- Create: `src/routes/docs/$slug.tsx` (individual doc)
- Delete: `app/docs/`

**Step 1: Install MDX dependencies**

Install: `npm install @mdx-js/rollup @mdx-js/react remark-frontmatter remark-mdx-frontmatter`

**Step 2: Add MDX plugin to `vite.config.ts`**

Add `mdx` import from `@mdx-js/rollup` and remark plugins for frontmatter. Add to plugins array before `react()`.

**Step 3: Rewrite `src/lib/docs.ts`**

Replace Node.js `fs.readdir`/`fs.readFile` with Vite's `import.meta.glob`:

```ts
const mdxModules = import.meta.glob("/content/docs/*.mdx", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>
```

Make all functions synchronous (no more `async` -- glob is eager). Parse with `gray-matter` as before.

**Step 4: Create `src/routes/docs/route.tsx`**

Layout route with sidebar. Uses `loader` to call `getAllDocs()`:

```tsx
export const Route = createFileRoute("/docs")({
  component: DocsLayout,
  loader: () => ({
    docs: getAllDocs().map(d => ({ slug: d.slug, title: d.title, headings: d.headings })),
  }),
})
```

Renders `<DocsSidebar>` + `<Outlet />`.

**Step 5: Create `src/routes/docs/index.tsx`**

Docs listing. Uses `loader` to call `getAllDocs()`.
Uses `<Link to="/docs/$slug" params={{ slug }}>` for doc links.

**Step 6: Create `src/routes/docs/$slug.tsx`**

Individual doc page. Uses `loader` with `params.slug` to call `getDocBySlug()`.
Throws `notFound()` if doc doesn't exist.
Uses `head` option for page title/description.
Renders MDX via `<MDXContent>`.

**Step 7: Delete old docs directory**

Delete: `app/docs/`

If `app/` is now empty, delete it entirely.

**Step 8: Test docs**

Run: `npm run dev`
Navigate to `/docs` and `/docs/getting-started`.

**Step 9: Commit**

Message: `feat: migrate docs system to vite mdx plugin + tanstack router`

---

### Task 6: Globals CSS and Font System Cleanup

Finalize CSS -- verify Tailwind v4, fonts, and themes work with Vite.

**Files:**
- Modify: `src/globals.css`
- Verify: `postcss.config.mjs` (unchanged)

**Step 1: Verify `src/globals.css`**

Ensure fontsource imports are present. Remove any `var(--font-inter)` references that came from `next/font`. Verify `@theme inline` block is complete. Verify shiki variables and base styles.

**Step 2: Full visual test**

Run: `npm run dev`
Verify: all themes, dark/light mode, font switching, no FOUC, scrollbars, focus rings, code highlighting.

**Step 3: Commit**

Message: `feat: finalize css and font system for vite`

---

## Phase 2: Server Integration

### Task 7: Add Nitro v3 for API Routes

Add Nitro v3 as a Vite plugin with a test API route.

**Important:** Nitro v3 requires `vite@beta`. Test compatibility with TanStack Router plugin.

**Files:**
- Modify: `package.json` (add `nitro`, upgrade `vite`)
- Modify: `vite.config.ts` (add nitro plugin)
- Create: `api/health.ts`

**Step 1: Install Nitro v3**

Install: `npm install nitro@latest vite@beta`

Verify `@tanstack/router-plugin` still works. If compatibility issues arise, document and find workarounds.

**Step 2: Add nitro plugin to `vite.config.ts`**

Import `{ nitro } from "nitro/vite"` and add to plugins array (first position).

**Step 3: Create `api/health.ts`**

```ts
import { defineHandler } from "nitro/h3"

export default defineHandler(() => {
  return { status: "ok", timestamp: new Date().toISOString() }
})
```

**Step 4: Test**

Run: `npm run dev`
Verify: `curl http://localhost:5173/api/health` returns JSON.

**Step 5: Commit**

Message: `feat: add nitro v3 with api routes`

---

### Task 8: Add Auth.js via Nitro

Set up Auth.js with `@auth/core` as Nitro API routes.

**Files:**
- Create: `api/auth/[...all].ts`
- Create: `src/lib/auth.ts`
- Create: `src/components/session-provider.tsx`
- Modify: `src/routes/__root.tsx` (add SessionProvider)
- Modify: `package.json`
- Create: `.env.example`

**Step 1: Install Auth.js**

Install: `npm install @auth/core`

**Step 2: Create `src/lib/auth.ts`**

Auth configuration using `@auth/core` with GitHub provider, JWT strategy, trustHost. Export `handleAuth(request: Request): Promise<Response>` function that calls `Auth(request, config)`.

**Step 3: Create `api/auth/[...all].ts`**

Catch-all route that passes the request to `handleAuth()`. Convert Nitro's event to a Web `Request` if needed.

**Step 4: Create `src/components/session-provider.tsx`**

Custom React context provider:
- Fetches session from `/api/auth/session` on mount
- Provides `session`, `loading`, `signIn(provider)`, `signOut()` via context
- `signIn` redirects to `/api/auth/signin/{provider}`
- `signOut` POSTs to `/api/auth/signout`

**Step 5: Add SessionProvider to `__root.tsx`**

Wrap the layout in `<SessionProvider>` (outermost provider).

**Step 6: Create `.env.example`**

```
AUTH_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
```

**Step 7: Test**

Run: `npm run dev`
Navigate to `/api/auth/signin` -- should show Auth.js sign-in page.

**Step 8: Commit**

Message: `feat: add auth.js via nitro api routes`

---

### Task 9: Add SSR with Nitro Renderer

Wire up TanStack Router SSR as Nitro's renderer.

**Files:**
- Create: `src/entry-server.tsx`
- Create: `src/entry-client.tsx`
- Modify: `src/routes/__root.tsx` (full HTML document for SSR)
- Modify: `vite.config.ts` (renderer config, client entry)
- Delete: `index.html`, `src/main.tsx`

**Step 1: Create `src/entry-client.tsx`**

Hydration entry using `hydrateRoot` with `RouterClient` from `@tanstack/react-router/ssr/client`.

**Step 2: Create `src/entry-server.tsx`**

SSR entry exporting `{ fetch(req: Request) }` that uses `createRequestHandler` and `renderRouterToString` from `@tanstack/react-router/ssr/server`.

**Step 3: Update `__root.tsx` for SSR**

- Change from `createRootRoute` to `createRootRouteWithContext`
- Render full `<html>`, `<head>`, `<body>`
- Add `<HeadContent />` and `<Scripts />` from TanStack Router
- Move theme FOUC prevention script to a `<script>` tag in `<head>` (uses only hardcoded string literals, no user input -- safe to inline)
- Add `head` option with meta tags and client entry script path

**Step 4: Update `vite.config.ts`**

Add renderer config to nitro plugin: `nitro({ renderer: { handler: "./src/entry-server.tsx" } })`.
Add client entry in `environments.client.build.rollupOptions.input`.

**Step 5: Delete SPA files**

Delete: `index.html`, `src/main.tsx`

**Step 6: Test SSR**

Run: `npm run dev`
View page source -- should see server-rendered HTML.
Run: `npm run build && npm run preview`

**Step 7: Commit**

Message: `feat: add ssr via nitro renderer + tanstack router`

---

## Phase 3: Template System

### Task 10: Update template.json

**Files:**
- Modify: `template.json`

**Step 1: Update feature flag file paths**

- `docs.files`: `src/routes/docs/**/*`, `content/docs/**/*`, `src/lib/docs.ts`, `src/lib/mdx-components.tsx`, `src/components/docs-sidebar.tsx`, `src/components/copyable-pre.tsx`
- `auth.files`: `src/lib/auth.ts`, `src/components/session-provider.tsx`, `api/auth/**/*`, `middleware/auth.ts`
- `auth.dependencies`: `@auth/core` (remove `next-auth`, `jose`)
- `db.default`: change to `false` (Rust API handles DB)
- `version`: bump to `2.0.0`

**Step 2: Commit**

Message: `feat: update template.json for vite migration`

---

### Task 11: Update create-sandybridge-app

**Files:**
- Modify: `/home/sbx/Dev/projects/libs/create-sandybridge-app/src/main.rs`

**Step 1: Update `get_files_to_skip()`**

Change path patterns:
- `app/docs` -> `src/routes/docs`
- `content/docs` stays same
- `lib/docs.ts` -> `src/lib/docs.ts`
- `auth.ts`, `auth.config.ts` -> `src/lib/auth.ts`
- `app/api/auth` -> `api/auth`
- `components/session-provider.tsx` -> `src/components/session-provider.tsx`
- `types/next-auth.d.ts` -> remove (no longer exists)
- `lib/db.ts` -> `src/lib/db.ts`

**Step 2: Update `update_package_json()`**

Change auth dependencies from `next-auth`/`jose`/`@auth/core` to just `@auth/core`.
Add docs dependencies: `@mdx-js/rollup`, `@mdx-js/react`, `remark-frontmatter`, `remark-mdx-frontmatter`.

**Step 3: Update `cleanup_layout_for_no_auth()`**

Change target from `app/layout.tsx` to `src/routes/__root.tsx`.
Update the string patterns to match the new file's formatting.

**Step 4: Update `generate_env_file()`**

Remove `DATABASE_URL` (Rust handles DB). Keep `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`.

**Step 5: Build and test**

Run: `cargo build` in create-sandybridge-app directory.
Test: `cargo run -- test-app --no-install --path /tmp/`
Verify output structure matches new template.
Clean up: `rm -rf /tmp/test-app`

**Step 6: Commit**

Message: `feat: update scaffolder for vite-based template`

---

### Task 12: Update CLAUDE.md and Clean Up

**Files:**
- Modify: `CLAUDE.md`
- Delete: `auth.ts`, `auth.config.ts`, `types/`, remaining `app/` directory

**Step 1: Delete old Next.js files**

Delete: `auth.ts`, `auth.config.ts`, `types/` directory, any remaining `app/` directory contents.

**Step 2: Update `CLAUDE.md`**

Key changes:
- Framework: Vite + TanStack Router (not Next.js)
- SSR: Nitro v3 renderer
- Auth: @auth/core via Nitro API routes
- File structure: `src/routes/` not `app/`, `src/components/` not `components/`
- Path alias: `@/` maps to `src/`
- Build: `vite dev` / `vite build` (not `next dev` / `next build`)
- Routing: TanStack Router conventions (`__root.tsx`, `$param`, `route.tsx`)
- No `'use client'` directives needed

**Step 3: Full end-to-end test**

Run: `npm run dev` -- all pages work
Run: `npm run build` -- builds successfully
Run: `npm run preview` -- production build works
View source -- HTML is server-rendered (if SSR is working)

**Step 4: Commit**

Message: `chore: update claude.md, remove old next.js files`

---

## Compatibility Notes

### Nitro v3 (Alpha)
- Package: `nitro@latest` (v3 alpha)
- Requires: `vite@beta`
- If `vite@beta` breaks `@tanstack/router-plugin`, fall back to stable Vite and use Express instead

### TanStack Router SSR
- `@tanstack/react-router/ssr/server` and `/ssr/client` available in v1.163+
- If SSR + Nitro has issues, the SPA version (Phase 1) is fully functional standalone

### Fallback Plan
If Nitro v3 + TanStack Router SSR proves unstable:
1. Ship Phase 1 (SPA) as the working version
2. Replace Nitro with Express in middleware mode (TanStack Router's official SSR example pattern)
3. Auth.js via `@auth/express` instead of Nitro API routes
4. Component code, routing, and template system remain identical regardless of server choice
