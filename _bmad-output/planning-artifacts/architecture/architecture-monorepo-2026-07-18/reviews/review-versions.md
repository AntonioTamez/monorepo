---
name: 'Review — Stack version verification against web reality (2026-07-18)'
type: review
target: '../ARCHITECTURE-SPINE.md'
date: '2026-07-18'
---

# Review — Stack Claims vs. Reality (as of 2026-07-18)

Scope: independently verify (via WebSearch/WebFetch, not training-data recall) every
version/tooling claim in the spine's **Stack** section, plus check for known current
gotchas in the architectural choices (AD-3 Signals singleton, static federation with
fixed URLs, AD-1/AD-2 tag-based boundaries) that the spine does not account for.

## 1. Nx 22.7 — claimed current, claimed to support Angular 22

**Verdict: WRONG / STALE.** Nx 22.7.0 was released 2026-04-24 and does **not** support
Angular 22. The official Nx↔Angular compatibility matrix states Angular `~22.0.0`
requires **Nx >=23.1.0**. Nx 23.1 (released 2026-07-13, five days before the spine's
"today") is the release that actually adds Angular 22 support (plus matching
`angular-eslint` and TypeScript 6). Nx 23.0 shipped 2026-06-16. So as of 2026-07-18
the current stable is **Nx 23.1**, not 22.7, and pinning to 22.7 while also claiming
Angular 22 support is an internally inconsistent combination — Nx 22.7 predates
Angular 22 support entirely.

Sources:
- https://nx.dev/docs/technologies/angular/guides/angular-nx-version-matrix (matrix: Angular ~22.0.0 → Nx >=23.1.0 <=latest)
- https://nx.dev/blog/nx-23-1-release ("Nx 23.1 ships support for Angular 22 and the matching angular-eslint", published 2026-07-13)
- https://github.com/nrwl/nx/releases/tag/22.7.0 (released 2026-04-24, no Angular 22 mention)
- https://nx.dev/changelog (Nx 23.0 on 2026-06-16, Nx 23.1 on 2026-07-13 — both newer than 22.7)
- https://github.com/nrwl/nx/discussions/35873 ("Support for Angular v22")

## 2. Angular 22 — claimed current stable

**Verdict: CORRECT.** Angular 22 released 2026-06-03 and is the current Active-phase
release as of 2026-07-18 (Active phase runs ~6 months, then 12 months LTS). Angular 21
(2025-11-19) is now in LTS; Angular 20 (2025-05-28) LTS runs through 2026-11-28. This
part of the spine checks out.

Sources:
- https://angular.dev/reference/releases
- https://angular.dev/events/v22

## 3. @angular-architects/native-federation 22.0.3 — claimed real, compatible with Angular 22

**Verdict: MOSTLY CORRECT, BUT STALE PATCH.** Version 22.0.3 is real (confirmed via
npm registry) and its `peerDependencies` pin `@angular/build: ~22.0.0`, i.e. Angular 22
line — so it is compatible. However the package's `latest` dist-tag is already
**22.0.6** (published after 22.0.3). Pinning to 22.0.3 specifically, rather than
"latest 22.x" or 22.0.6, looks like a number picked without checking npm for the
actual current patch — not wrong, just outdated by three patch releases as of today.

Sources:
- https://registry.npmjs.org/@angular-architects/native-federation/22.0.3 (peerDependencies: `@angular/build: ~22.0.0`)
- https://registry.npmjs.org/@angular-architects/native-federation/latest (resolves to 22.0.6)
- https://www.npmjs.com/package/@angular-architects/native-federation

## 4. Node.js 24 — claimed current Active LTS

**Verdict: CORRECT.** Node 24 became LTS in 2025 and its Active LTS phase runs until
2026-10-20 (security/maintenance support until 2028-04-30), so it is indeed the correct
"Active LTS, recommended for new projects" choice on 2026-07-18. Node 25 was a
Current/non-LTS release that has already exited support (active ended 2026-04-01,
security ended 2026-06-01) — correctly NOT recommended. Node 26 (released 2026-05-05)
is the incoming LTS but wouldn't enter Active LTS until around October 2026, so Node 24
remains the right pick today.

Sources:
- https://endoflife.date/nodejs

## 5. Cloudflare Pages — free tier, unlimited bandwidth, viability, and multi-app sub-path routing

**Verdict: PARTIALLY STALE — flag for the spine.** Two separate issues:

**(a) Free tier / unlimited bandwidth:** still true today. Cloudflare Pages free plan
still offers unlimited static requests/bandwidth (limits are on builds/month, not
bandwidth). Not wrong.

**(b) Strategic direction:** Cloudflare has been steering new projects toward
**Workers with static assets** rather than Pages since Workers gained free static-asset
serving and reached feature parity with Pages (roughly March 2026, per community
sources). Pages is not being killed but is explicitly in "maintenance updates only"
mode — new Cloudflare features (Secrets Store, Workflows, Containers, etc.) land on
Workers first or only. The Cloudflare Workers tech lead is on record saying
Pages-specific features are being folded into general Workers features. This is a
material fact the spine's "Cloudflare Pages" recommendation omits: it's still viable
for MVP1, but a technical reader in 2026 would expect the ADR to at least note that
Workers Static Assets is the vendor's now-preferred path and explain why Pages was
still chosen (e.g., simplicity for a solo/no-backend deploy).

**(c) Sub-path multi-app routing — genuine unaddressed gotcha:** The spine's own
diagram serves Shell at `/` and three federated Remotes' static bundles conceptually
under `/catalogo`, `/carrito`, `/perfil` from **one** Cloudflare Pages project, but the
spine never specifies `_redirects`/rewrite rules. This matters because Cloudflare
Pages' community forum documents exactly this failure mode: when a single Pages
project must serve a root SPA (needing a catch-all `/* /index.html 200` rewrite for
deep-linking) *and* real static files under path prefixes (here, each Remote's
`remoteEntry.json` + chunks at `/catalogo/*` etc.), the catch-all rewrite can swallow
requests meant for the sub-path static assets unless `_redirects` ordering/exclusions
are set up deliberately. The spine's Structural Seed shows the routes but has no
`_redirects` design and doesn't flag this interaction — it should, given AD-6 static
federation depends on the Remotes' JS actually being fetchable at those fixed sub-path
URLs at runtime.

Sources:
- https://developers.cloudflare.com/pages/platform/limits/
- https://developers.cloudflare.com/pages/functions/pricing/
- https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/
- https://news.ycombinator.com/item?id=45593275 / https://news.ycombinator.com/item?id=45112961 (community discussion: "Pages seems to be on the way out")
- https://community.cloudflare.com/t/multiple-spa-apps-in-singe-pages-domain/553517 (documented failure: sub-path SPA/static routing conflicts with root catch-all rewrite in one Pages project)
- https://developers.cloudflare.com/pages/configuration/redirects/

## 6. Nx tag-based module boundary enforcement (`@nx/enforce-module-boundaries`, `type:`/`scope:` tags)

**Verdict: CORRECT / still current.** This remains Nx's standard, actively documented
mechanism for enforcing dependency direction between libs (`depConstraints` keyed off
`sourceTag`/`onlyDependOnLibsWithTags` etc.), unchanged in kind since well before Nx 22
and still the recommended approach in current docs. No deprecation or replacement
mechanism found. AD-1/AD-2's reliance on it is sound regardless of the Nx-version
mismatch flagged in finding #1.

Sources:
- https://nx.dev/docs/features/enforce-module-boundaries
- https://nx.dev/docs/guides/enforce-module-boundaries/tag-multiple-dimensions
- https://nx.dev/blog/mastering-the-project-boundaries-in-nx

## Additional note: AD-3 Signals singleton cross-remote state

Research on Native Federation + Angular Signals for cross-remote shared state (2026
sources) confirms the pattern the spine uses (a `providedIn: 'root'` service with
`signal()`/`computed()`, shared as a `singleton: true`/`strictVersion: true` dependency
in federation config) is the standard, currently-recommended approach — no new gotcha
specific to Native Federation 22.x surfaced beyond the well-known singleton/
strictVersion version-mismatch failure mode AD-6 already covers. No correction needed
here beyond what's already in the spine.

## Summary Table

| # | Claim | Verdict | Severity |
|---|---|---|---|
| 1 | Nx 22.7 current & supports Angular 22 | **Wrong** — current is Nx 23.1 (2026-07-13); Angular 22 needs Nx ≥23.1.0, not 22.7 | Critical |
| 5c | Cloudflare Pages single-project sub-path routing for Shell + 3 Remotes | **Unaddressed gotcha** — no `_redirects` design; catch-all SPA rewrite can conflict with static remote asset paths | High |
| 5b | Cloudflare Pages vs. Workers Static Assets | **Stale framing** — Cloudflare steers new projects to Workers; Pages is maintenance-only for new features | Medium |
| 3 | native-federation pinned to 22.0.3 | **Outdated patch** — latest is 22.0.6; compatible but not "the" current version | Low |
| 2, 4, 6 | Angular 22 current; Node 24 Active LTS; Nx tag-based boundaries current | **Correct**, confirmed | — |
