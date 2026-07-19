---
title: Reconciliation — ARCHITECTURE-SPINE.md vs prd.md + addendum.md
type: reconciliation-review
scope: 'architecture-monorepo-2026-07-18 spine against prd-monorepo-2026-07-17 PRD + addendum'
created: '2026-07-18'
---

# Reconciliation Findings

**Method:** Read `ARCHITECTURE-SPINE.md` in full, `prd.md` in full, and `addendum.md` in full. Cross-checked the spine's Capability → Architecture Map, ADs, Stack, Consistency Conventions, Structural Seed, and Deferred section against every FR, the 6 Non-Goals, the MVP scope boundaries (§6), the Cross-Cutting NFRs (§7), Constraints & Guardrails (§8), the runtime/dependency policy (§9), and the addendum's pitfalls list. This is a reconciliation (does the spine faithfully carry forward every load-bearing PRD item), not a quality review of the spine's own internal soundness.

## Overall Verdict

Coverage is strong on the headline items: all 11 FRs are named in the Capability → Architecture Map with a real AD or structural anchor behind them, the 6 Non-Goals are not contradicted or accidentally enabled anywhere in the Stack/Structural Seed, and the MVP1/MVP2/out-of-scope boundaries (dynamic federation via Manifest, independent CI/CD per Remote, cross-remote e2e tests, cart persistence across sessions) are explicitly kept out of MVP1 in the Deferred section and Consistency Conventions. The gaps found are all "quiet" — items the addendum/PRD state explicitly as constraints or pitfalls, that the spine's terse AD structure gestures at or silently drops rather than binding with a rule.

## Gaps Found

### 1. Addendum pitfall "expose AppModule instead of lazy feature modules/components" — not closed by any AD

`addendum.md` lists this as a named pitfall independent from version mismatch: "Exponer el `AppModule` completo en vez de feature modules/componentes lazy — antipatrón documentado por angular-architects." AD-6 closes the version-mismatch pitfall; AD-1/AD-2 close the spaghetti-dependency-graph pitfall. No AD in the spine states that each Remote's `federation.config.js` `exposes` map must point at a lazy feature/route entry point (e.g. `./Routes` mapped to a `feature-*` lib) rather than the Remote's root `AppModule`/`bootstrapApplication` config. The Structural Seed's folder tree gestures at this ("compone libs catalogo-feature-*") but that's descriptive, not a binding rule — nothing prevents a future contributor from wiring `exposes: { './Module': './src/app/app.module.ts' }` and still technically satisfying every AD in the spine.

### 2. Addendum pitfall "forgetting to share transitive dependencies" — only covered for Angular/RxJS, not shared libs generally

`addendum.md`: "Olvidar compartir dependencias transitivas de las librerías compartidas (no solo las directas)." AD-6 only locks `singleton: true` + `strictVersion` for **Angular and RxJS**, and says new shared libs "inherit this singleton" only insofar as they depend on Angular/RxJS. There is no rule covering the general case — e.g. if `libs/shared/ui` or `libs/shared/cart` pulls in some other third-party runtime dependency (a date lib, an icon set, a signals-adjacent utility), nothing in the spine requires that dependency to also be declared in the federation `shared` config across Shell + 3 Remotes. This is exactly the class of bug the addendum flags as distinct from (and easy to miss alongside) the Angular/RxJS singleton fix.

### 3. PRD §9 version-pinning policy is not carried into the spine as a rule, only as a version table

PRD §9: Angular/Nx versions are "fijada (pinned) para el resto de las 5 fases del roadmap... Se actualiza solo ante un blocker real (ej. vulnerabilidad de seguridad), no por disponibilidad de una versión más nueva" — this is explicitly tied by the PRD to preventing the version-mismatch pitfall. The spine's Stack table lists pinned versions (Nx 22.7, Angular 22, native-federation 22.0.3, Node 24) but nowhere states the *policy* that these are frozen for the MVP1 roadmap and only bumped for a security blocker. A future contributor reading only the spine has no signal that upgrading Angular mid-build is off-limits absent that trigger — the Stack table reads as "current pin," not "frozen invariant."

### 4. PRD §9 performance budget (Shell initial bundle <300KB gzip) is entirely absent from the spine

PRD §9 "Performance Budget: bundle inicial del Shell objetivo `<300KB` gzip" is a concrete, numbered NFR feeding directly into the Cross-Cutting NFRs / SM-4 performance story, but it does not appear anywhere in the spine — not in Stack, not as an AD, not in Consistency Conventions. Nothing in the spine's AD set (e.g., a rule constraining what `libs/shared/ui` may depend on, or a note to configure Angular budgets in `angular.json`) gives this number teeth. Given the spine otherwise takes care to make NFRs concrete (AD-6 for reliability, AD-1/AD-2 for DX/`nx affected`), this one is dropped silently.

### 5. Addendum pitfall "cross-remote routing misconfiguration" — only weakly addressed

`addendum.md`: "Routing cross-remoto mal configurado (rutas hijas que no calzan con el remote entry)." The spine's Consistency Conventions row ("Naming (rutas del Shell)") only fixes the **top-level** route names (`/catalogo`, `/carrito`, `/perfil`) to match the PRD glossary — it does not address the addendum's actual concern, which is nested/child routes inside a Remote failing to line up with what that Remote exposes via `loadRemoteModule`/`loadChildren`. No AD constrains how a Remote's exposed route/module surface must be shaped to avoid this class of mismatch. This is a partial gap rather than a full miss — treat as lower severity than items 1-4.

## Items Explicitly Checked and Found Sound (no gap)

- All 11 FRs land on a real AD or structural anchor in the Capability → Architecture Map — no FR is present in the map with only a vague/no governing AD.
- Non-Goals (§5): no real payments, no real backend, no polyglot federation, no real auth, no i18n/native mobile, no generic starter template — nothing in Stack/Structural Seed introduces or gestures toward any of these.
- MVP2 (dynamic federation via Manifest) is explicitly named and deferred in both the Design Paradigm section and the Deferred section — not built prematurely.
- Independent CI/CD per Remote, cross-remote e2e tests, and cart-session-persistence are all explicitly named in Deferred / Consistency Conventions as out of MVP1.
- $0 cost constraint (§8): Cloudflare Pages free tier, single project/deploy — satisfies the constraint and matches the single-origin federation topology the ADs assume (AD-6 singleton sharing depends on same-origin serving, which the Structural Seed's "1 proyecto, 1 origin" note gets right).
- Addendum pitfalls "version mismatch" and "`nx affected` becoming useless with a spaghetti graph" are both closed with dedicated, enforceable ADs (AD-6; AD-1/AD-2 + Nx tags).
- FR-9's nuance (state consistency only guaranteed when Remotes are accessed federated through the Shell, not in standalone dev mode) is not given its own AD, but is not contradicted either — AD-3's "no Remote keeps its own copy" reads as a code-organization rule (always go through the shared service class), which is naturally compatible with standalone mode producing an isolated instance per origin. Not flagging as a gap, but noting it as the one place a reader could momentarily misread AD-3 as broader than intended.
