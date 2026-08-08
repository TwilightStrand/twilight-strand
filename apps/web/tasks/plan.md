# Migration: Next.js 15 to TanStack Start

## Context

The app is a client-heavy SPA (PoE build planner) with a thin server layer. Next.js surface area is small: 3 pages, 10 API routes (~520 LOC), next-auth, OG image generation, and SEO files. Components have zero Next.js imports. The migration is mostly plumbing.

## Dependency Graph

```
Vite + TanStack Start scaffold
    ├── Router config + routes (pages)
    │       ├── Root layout (head/meta/theme)
    │       └── Components (unchanged, just strip "use client")
    ├── Server functions (API routes)
    │       ├── Auth (next-auth → Auth.js generic)
    │       └── DB routes (builds, character, import, ninja, trade)
    ├── SEO (robots.txt, sitemap.xml)
    ├── OG image generation (next/og → satori)
    └── Build scripts + deployment config
```

---

## Task 1: Scaffold TanStack Start alongside Next.js

**Description:** Install TanStack Start, TanStack Router, and Vite. Create the minimal config files (`app.config.ts`, `app/router.tsx`, `app/routes/__root.tsx`) so TanStack Start can boot alongside the existing Next.js app on a different port during migration.

**Acceptance criteria:**
- [ ] `@tanstack/react-start`, `@tanstack/react-router`, `vinxi` (or `@tanstack/start-vite-plugin`) installed
- [ ] `vite-plugin-wasm` and `vite-plugin-top-level-await` installed
- [ ] `app.config.ts` at web root with Vite config, WASM plugin, and Tailwind
- [ ] Root route renders a "hello world" page
- [ ] `pnpm --filter @tsc/web dev:tanstack` boots on port 3001
- [ ] Existing `pnpm dev` (Next.js) still works on port 3000

**Verification:**
- [ ] `curl localhost:3001` returns HTML with "hello world"
- [ ] `curl localhost:3000` still returns the existing app

**Dependencies:** None

**Files likely touched:**
- `apps/web/package.json`
- `apps/web/app.config.ts` (new)
- `apps/web/app/router.tsx` (new)
- `apps/web/app/routes/__root.tsx` (new)
- `apps/web/app/ssr.tsx` (new)
- `apps/web/app/client.tsx` (new)

**Estimated scope:** Medium

---

## Task 2: Port root layout and home page

**Description:** Move the root layout (metadata, viewport, theme script, SW registration) into TanStack Start's `__root.tsx`. Port the home page component as the index route. Strip `"use client"` directives from all components. WASM loading must work.

**Acceptance criteria:**
- [ ] Root layout renders `<html>`, `<head>` with metadata, theme script, SW registration
- [ ] Index route (`/`) renders the full app (StatusBar, ActivityBar, TabContent, etc.)
- [ ] `@/*` path alias resolves correctly in Vite
- [ ] WASM files (Lua engine, Rust engine) load successfully
- [ ] Tailwind styles render correctly
- [ ] All `"use client"` directives removed from components (no-op in TanStack)

**Verification:**
- [ ] App boots on TanStack Start and shows the passive tree
- [ ] Engine initializes (check console for "Rust WASM Ready")
- [ ] Theme switching works
- [ ] Build succeeds: `pnpm --filter @tsc/web build:tanstack`

**Dependencies:** Task 1

**Files likely touched:**
- `apps/web/app/routes/__root.tsx`
- `apps/web/app/routes/index.tsx` (new)
- ~50 component files (strip `"use client"`)
- `apps/web/app.config.ts` (path aliases, CSS)

**Estimated scope:** Large (many files, but each change is trivial)

---

## Checkpoint: After Tasks 1-2
- [ ] Full app renders and is interactive via TanStack Start
- [ ] WASM engines load
- [ ] No Next.js imports remain in components
- [ ] Review before proceeding to server-side work

---

## Task 3: Port API routes to server functions

**Description:** Convert the 10 Next.js API route handlers (NextRequest/NextResponse) to TanStack Start server functions or Vinxi API routes. Keep the same URL paths (`/api/*`).

Routes to port (520 LOC total):
- `api/builds/route.ts` (67 LOC) - GET/POST
- `api/builds/[id]/share/route.ts` (33 LOC) - POST
- `api/builds/leaderboard/route.ts` (56 LOC) - GET
- `api/builds/shared/route.ts` (41 LOC) - GET
- `api/character/route.ts` (56 LOC) - GET
- `api/import/route.ts` (45 LOC) - POST
- `api/ninja/route.ts` (57 LOC) - GET
- `api/trade/route.ts` (73 LOC) - GET
- `api/og/route.tsx` (71 LOC) - GET (OG image, handled in Task 5)

**Acceptance criteria:**
- [ ] All API routes respond at the same paths
- [ ] Request/response handling uses standard Web API (Request/Response)
- [ ] Cached fetch in ninja route still works (revalidate equivalent)
- [ ] Dynamic route params (`[id]`) work correctly

**Verification:**
- [ ] `curl localhost:3001/api/builds/leaderboard` returns JSON
- [ ] `curl -X POST localhost:3001/api/import -d '...'` works
- [ ] Build import flow works end-to-end through the UI

**Dependencies:** Task 2

**Files likely touched:**
- `apps/web/app/routes/api/` (new, ~9 files)
- `apps/web/app/routes/api/builds.$id.share.ts` (new)

**Estimated scope:** Medium

---

## Task 4: Port auth (next-auth → Auth.js)

**Description:** Replace `next-auth` with the generic `@auth/core` adapter for TanStack Start. Auth.js is the same library under the hood; the integration layer changes from Next.js-specific to framework-agnostic. Keep GitHub + Discord providers and DrizzleAdapter.

**Acceptance criteria:**
- [ ] `next-auth` removed, `@auth/core` (or `@auth/h3`) installed
- [ ] Auth routes (`/api/auth/*`) handle sign-in/sign-out/callback
- [ ] Session checking works in API routes that use `auth()`
- [ ] DrizzleAdapter still wired to the same DB schema

**Verification:**
- [ ] Sign in with GitHub works
- [ ] Authenticated API calls (builds CRUD) return correct data
- [ ] Unauthenticated calls are rejected where expected

**Dependencies:** Task 3

**Files likely touched:**
- `apps/web/lib/auth.ts`
- `apps/web/app/routes/api/auth.ts` (new)
- `apps/web/package.json`

**Estimated scope:** Medium

---

## Task 5: Port build sharing page and OG image generation

**Description:** Port the `build/[id]` page (server-side DB lookup + redirect + OG metadata) and the OG image generation route (`api/og`). Replace `next/og` (ImageResponse) with `satori` + `@resvg/resvg-js` for server-side image rendering.

**Acceptance criteria:**
- [ ] `/build/:id` does server-side DB lookup, sets OG meta tags, redirects to `/#pobCode`
- [ ] `/api/og?name=...&class=...` returns a 1200x630 PNG image
- [ ] OG tags include correct title, description, and image URL
- [ ] Twitter card tags work

**Verification:**
- [ ] `curl -I localhost:3001/build/some-id` returns redirect with OG meta
- [ ] `curl localhost:3001/api/og?name=Test&class=Witch` returns PNG
- [ ] Sharing a build URL on Discord shows the OG card

**Dependencies:** Task 3

**Files likely touched:**
- `apps/web/app/routes/build.$id.tsx` (new)
- `apps/web/app/routes/api/og.ts` (new)
- `apps/web/package.json` (add satori, @resvg/resvg-js)

**Estimated scope:** Medium

---

## Task 6: Port community page and SEO files

**Description:** Port the community page as a TanStack Router route. Convert `robots.ts` and `sitemap.ts` from Next.js metadata API to plain server-side handlers returning text/xml.

**Acceptance criteria:**
- [ ] `/community` renders the leaderboard + poe.ninja ladder UI
- [ ] `/robots.txt` returns correct robots rules
- [ ] `/sitemap.xml` returns valid sitemap with shared builds

**Verification:**
- [ ] Community page loads and shows builds
- [ ] `curl localhost:3001/robots.txt` returns valid robots.txt
- [ ] `curl localhost:3001/sitemap.xml` returns valid XML

**Dependencies:** Task 3

**Files likely touched:**
- `apps/web/app/routes/community.tsx` (new)
- `apps/web/app/routes/robots.txt.ts` (new)
- `apps/web/app/routes/sitemap.xml.ts` (new)

**Estimated scope:** Small

---

## Checkpoint: After Tasks 3-6
- [ ] All pages render correctly
- [ ] All API routes work
- [ ] Auth flow works end-to-end
- [ ] OG images generate
- [ ] SEO files serve correctly
- [ ] Review before removing Next.js

---

## Task 7: Remove Next.js and clean up

**Description:** Remove all Next.js dependencies, config files, and the old `app/` directory structure. Update scripts (`dev`, `build`, `start`) to use TanStack Start. Update `tsconfig.json` to remove Next.js plugin. Clean up any remaining Next.js artifacts.

**Acceptance criteria:**
- [ ] `next`, `next-auth` removed from dependencies
- [ ] `next.config.ts`, `next-env.d.ts` deleted
- [ ] Old `app/` directory (Next.js App Router pages/routes) deleted
- [ ] `package.json` scripts updated: `dev` → TanStack Start, `build` → TanStack build, `start` → production server
- [ ] `tsconfig.json` updated: remove Next.js plugin, update paths
- [ ] No remaining imports from `next/*`
- [ ] Worker build script still works

**Verification:**
- [ ] `pnpm dev` boots the TanStack Start app
- [ ] `pnpm build` produces a production build
- [ ] `pnpm start` serves the production build
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] Full app flow works: import build → view tree → share → community page

**Dependencies:** Tasks 2, 3, 4, 5, 6

**Files likely touched:**
- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/next.config.ts` (delete)
- `apps/web/app/` (restructure)

**Estimated scope:** Medium

---

## Final Checkpoint
- [ ] All tests pass
- [ ] Production build succeeds
- [ ] Full user flow works end-to-end
- [ ] No Next.js references remain in codebase
- [ ] WASM engines load correctly
- [ ] Performance is comparable or better (bundle size check)
