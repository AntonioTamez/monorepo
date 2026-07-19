---
title: 'Rubric Review — ARCHITECTURE-SPINE.md (Llano)'
type: review
target: '../ARCHITECTURE-SPINE.md'
sources_checked:
  - '../ARCHITECTURE-SPINE.md'
  - '../../../prds/prd-monorepo-2026-07-17/prd.md'
  - '../../../prds/prd-monorepo-2026-07-17/addendum.md'
  - '../../../ux-designs/ux-monorepo-2026-07-17/DESIGN.md'
  - '../../../ux-designs/ux-monorepo-2026-07-17/EXPERIENCE.md'
related_reviews:
  - 'review-versions.md (independent web-verification of Stack claims)'
  - 'reconcile-prd.md (PRD→spine reconciliation)'
  - 'reconcile-ux.md (UX spine→architecture spine reconciliation)'
created: '2026-07-18'
method: 'Full read of all 5 source docs + live WebSearch verification of Stack claims (Nx, Angular, native-federation, Node.js, Cloudflare Pages current status as of 2026-07-18). Graded against the 8-point good-spine checklist.'
---

# Rubric Review — ARCHITECTURE-SPINE.md

## Overall Verdict

**Conditional pass — solid paradigm-level bones, but not yet safe to drive epics/stories without closing 3 load-bearing gaps.** The lib-boundary architecture (AD-1/AD-2, enforced via real Nx tooling) is sound and the Capability → Architecture Map nominally covers all 11 FRs. But the spine has one **internally self-contradictory stack pin** (Nx 22.7 does not support Angular 22 — the two headline versions in the Stack table are mutually incompatible per Nx's own compatibility matrix), one **critical mechanism gap in the exact invariant meant to guarantee the project's core promise** (AD-6's singleton rule covers Angular/RxJS but never says `libs/shared/cart`/`libs/shared/auth` themselves must be declared as shared federation modules — without that, FR-4/FR-7 cross-remote consistency is not actually guaranteed by anything written), and a **silent deployment-mechanics gap** (no `_redirects`/rewrite design for serving 4 independently-built static apps at fixed sub-paths from one Cloudflare Pages project — a real, documented failure mode for exactly this topology). These three would each surface as confusing, hard-to-debug runtime bugs late in the build, which is precisely what an architecture spine exists to prevent.

Corroboration note: this review's version-verification findings independently converge with `review-versions.md`; its Tailwind/token-sharing and AD-6-scope findings independently converge with `reconcile-ux.md`; its NFR-budget and pitfall-coverage findings converge with `reconcile-prd.md`. Where findings overlap, this report cites the corroborating file rather than re-deriving evidence already established there.

---

## 1. Divergence points fixed / missed (level below: epics/code)

| # | Finding | Severity | Ref |
|---|---|---|---|
| 1.1 | AD-6 fixes Angular/RxJS singleton sharing but never states that `libs/shared/auth` and `libs/shared/cart` — workspace TS libraries, not npm packages — must themselves be declared as shared/externalized modules in every `federation.config.js` (Shell + 3 Remotes). Without that, Nx/esbuild will by default inline each lib's source separately into each of the 4 bundles, producing 4 distinct `AuthService`/`CartService` class identities. Angular's `providedIn:'root'` singleton resolution is per-injector-per-token; even though all Remotes run in one browser tab/root injector, 4 different bundled copies are 4 different tokens — so FR-4/FR-7's "no re-login, same cart" promise silently breaks despite every AD in the spine being technically satisfied. This is the single most consequential missed divergence point in the document (full derivation in `reconcile-ux.md` §3). | **Critical** | ARCHITECTURE-SPINE.md:106-110 (AD-6) |
| 1.2 | No AD constrains what a Remote's federation `exposes` map may point at — nothing prevents wiring `exposes: { './Module': './app.module.ts' }` (whole `AppModule`) instead of a lazy feature/route entry point, the exact antipattern `addendum.md` names as a distinct pitfall from version mismatch. The Structural Seed's folder tree is descriptive ("compone libs catalogo-feature-*") but not a binding rule. | High | ARCHITECTURE-SPINE.md:161-186; addendum.md:37 |
| 1.3 | "Forgetting to share transitive dependencies" (addendum.md pitfall, distinct from Angular/RxJS) is only closed for Angular/RxJS by AD-6. If `libs/shared/ui` pulls in a third-party runtime dep (icon set, date lib), nothing requires it to also land in the federation `shared` map across all 4 projects. Same root cause as 1.1, generalized. | High | ARCHITECTURE-SPINE.md:106-110; addendum.md:38 |
| 1.4 | No AD/convention governs where Tailwind config and the DESIGN.md token set (colors, typography, spacing) live relative to 4 independently-buildable projects. Two legitimate implementations (single root config referenced by all 4, vs. 4 duplicated configs) diverge in exactly the way AD-4 was written to prevent for TS types — but no equivalent exists for CSS/tokens. EXPERIENCE.md names Tailwind as foundational; the spine's Stack table doesn't mention it at all. (Independently found in `reconcile-ux.md` §5.) | High | ARCHITECTURE-SPINE.md:122-133 (Stack table, no Tailwind row); EXPERIENCE.md:18 |
| 1.5 | Nested/child routing inside a Remote (e.g. does Carrito expose a child route that must line up with what `loadChildren` expects from the Shell) is only addressed at the top level (`/catalogo`, `/carrito`, `/perfil` naming) — the addendum's actual "routing cross-remoto mal configurado" pitfall is about child-route/remote-entry mismatches, which is unaddressed. | Medium | ARCHITECTURE-SPINE.md:117 |
| 1.6 | Package manager (npm/pnpm/yarn) is never pinned anywhere in the spine — a workspace-level choice that affects lockfile determinism and is conventionally part of a Stack table. Low stakes for a solo dev but still a silent gap. | Low | ARCHITECTURE-SPINE.md:122-133 |
| 1.7 | Mock data format/location convention (e.g., is Catálogo's product dataset a static TS array or a JSON asset, and where does it live within `data-access`) isn't pinned anywhere, only implied via PRD `[ASSUMPTION]`. Low severity — plausibly below "feature altitude." | Low | ARCHITECTURE-SPINE.md:169-186 |

## 2. AD Rule enforceability (Prevents/Rule pairing sanity)

| # | Finding | Severity | Ref |
|---|---|---|---|
| 2.1 | AD-6's Rule literally names `federation.config.js`. But the Stack table pins `@angular-architects/native-federation` at `22.0.3` — verified via web search to be the **v4 rework** shipped for Angular 22, which drops CommonJS: the config file for this exact pinned version is `federation.config.mjs` using `import`/`export default`, not `federation.config.js` with `require`/`module.exports`. As literally written, a builder following AD-6's rule would create the wrong file for the pinned package version, and the singleton/strictVersion declaration would not take effect — meaning AD-6 does not actually prevent the divergence it claims to, for the specific dependency version the spine itself pins. This is the same "package pinned but the exact configuration surface named in the Rule is stale" pattern as finding 1.1/1.3, and it is independently verifiable (see native-federation.com/docs/v3-vs-v4.html). | **Critical** | ARCHITECTURE-SPINE.md:110 (Rule text), 128 (Stack pin) |
| 2.2 | AD-3 and AD-4's Rules are conventions enforced only by manual discipline/code review — unlike AD-1/AD-2 (Nx tags + `@nx/enforce-module-boundaries`, a real static-analysis gate) and AD-6 (a framework-level flag that fails loudly at runtime if violated), nothing stops a future contributor from defining a second `Product` interface in `catalogo/data-access` or standing up a second cart-tracking mechanism elsewhere — the boundary tooling cited by AD-1/AD-2 does not, by itself, catch either violation (it constrains *which libs* can import *which libs*, not *what* gets redeclared inside a permitted lib). Given the entire point of the rubric's "enforceable" bar, this is worth calling out even though solo-dev risk is lower than a multi-team repo. | Medium | ARCHITECTURE-SPINE.md:88-98 |
| 2.3 | AD-5's Rule specifies *what* renders (`RemoteUnavailableComponent`) and *where* (inside the route's outlet), but doesn't pin what "Reintentar" actually does mechanically (re-invoke the same `.catch()`-wrapped `loadRemoteModule()` vs. `location.reload()` vs. full route re-navigation) — two builders could satisfy the letter of AD-5 with implementations that differ exactly on the property EXPERIENCE.md cares about (isolated failure, not a full Shell reload). Also doesn't pin the `role="alert"`/`aria-live="polite"` a11y contract EXPERIENCE.md requires for this exact state, even though AD-5 is the only place in the spine that owns this UX requirement. (Full derivation: `reconcile-ux.md` §1.) | Medium | ARCHITECTURE-SPINE.md:100-104 |

## 3. Deferred — silent divergence risk for MVP1

The 5 explicit Deferred bullets themselves are legitimately scoped (testing depth per PRD Open Question 4, per-Remote CI/CD explicitly out of MVP1 per PRD §6.2, dynamic federation correctly bucketed as MVP2, classic Module Federation comparison correctly optional, NgRx escalation correctly conditional) — no issue with what's *in* Deferred.

The checklist concern here is instead about items that **should have been acknowledged (decided, deferred-with-rationale, or flagged as open) but are simply absent, with no Deferred entry at all**:

| # | Finding | Severity | Ref |
|---|---|---|---|
| 3.1 | PRD §9's performance budget ("bundle inicial del Shell objetivo <300KB gzip") does not appear anywhere in the spine — not in Stack, not as an AD, not in Deferred. Given the spine otherwise takes care to make NFRs concrete (AD-6 for reliability, AD-1/AD-2 for the DX/`nx affected` NFR), dropping this one silently is inconsistent with the document's own pattern. (Independently found in `reconcile-prd.md` §4.) | High | ARCHITECTURE-SPINE.md:122-133 (absent) |
| 3.2 | PRD §9's version-freeze *policy* ("fijada para el resto de las 5 fases... se actualiza solo ante un blocker real") is carried into the spine only as a version table (Stack), never as a stated rule/invariant. A reader of only the spine has no signal that upgrading mid-build is off-limits absent a security blocker — the Stack table reads as "current pin," not "frozen invariant," which matters given version-mismatch is the addendum's headline pitfall. (Independently found in `reconcile-prd.md` §3.) | Medium | ARCHITECTURE-SPINE.md:122-133 |
| 3.3 | See 1.4 (Tailwind/token sharing) and 1.1/1.3 (shared-lib federation treatment) — both are silent, not deferred, and both are exactly the class of gap this checklist item is designed to catch (units built independently could diverge in ways that matter for MVP1's core promises). | High | (cross-ref) |

## 4. Named tech — verified-current vs. asserted from training data

Verified live via WebSearch against npm/nx.dev/angular.dev/endoflife.date (not recalled from training data); full citations in `review-versions.md`.

| # | Claim | Verdict | Severity | Ref |
|---|---|---|---|---|
| 4.1 | Nx 22.7 (Stack table) | **Wrong, and internally self-contradictory with the Angular 22 pin on the same table.** Nx 22.7.0 (released 2026-04-24) predates Angular 22 support entirely; Nx's own compatibility matrix requires Nx ≥23.1.0 for Angular ~22.0.0. Current stable as of the spine's own "today" (2026-07-18) is Nx 23.1 (released 2026-07-13). The two headline stack rows contradict each other as written. | **Critical** | ARCHITECTURE-SPINE.md:126-127 |
| 4.2 | Angular 22 (Stack table) | Correct — Angular 22 released 2026-06-03, current Active-phase release as of 2026-07-18. | — (confirmed) | ARCHITECTURE-SPINE.md:127 |
| 4.3 | `@angular-architects/native-federation` 22.0.3 | Real version, compatible with Angular 22 (peerDeps `@angular/build: ~22.0.0`), but 3 patches stale — npm `latest` dist-tag is 22.0.6. Not wrong, just reads as a number picked without checking npm at authoring time rather than "latest 22.x." | Low | ARCHITECTURE-SPINE.md:128 |
| 4.4 | Node.js 24, "Active LTS" | Correct and precisely worded — Node 24's Active LTS phase runs through 2026-10-20, which is exactly the correct pick on 2026-07-18. | — (confirmed) | ARCHITECTURE-SPINE.md:129 |
| 4.5 | Cloudflare Pages, free tier | Free tier / unlimited static bandwidth still accurate. But Cloudflare has been steering new projects toward Workers Static Assets since reaching feature parity (~March 2026); Pages is in maintenance-only mode for new platform features. The spine's silent choice of Pages isn't wrong for MVP1 (simplicity, $0 cost, no backend), but a technical reader in 2026 would expect at least one line acknowledging Workers Static Assets as the vendor's now-preferred path and why Pages was still chosen. | Medium | ARCHITECTURE-SPINE.md:131 |
| 4.6 | Process point: no verification trail shown | The spine states exact patch-level versions (e.g. `22.0.3`) with no indication of when/how they were checked. Given 4.1 shows one of these claims is flatly wrong, the document reads as asserted-from-training-data rather than verified-at-authoring-time — this is exactly what the checklist asks to flag regardless of whether every individual number happens to be right. | Medium | ARCHITECTURE-SPINE.md:122-133 |

## 5. FR-1..FR-11 coverage (Capability → Architecture Map)

All 11 FRs are present in the map with a named AD or structural anchor (baseline: sound, no FR is fully unmapped). Gaps found:

| # | Finding | Severity | Ref |
|---|---|---|---|
| 5.1 | FR-10's row governs to **"Renderings & polish (deck de portafolio, ver Finalize)"** — no section named "Renderings & polish" or "Finalize" exists anywhere in this document. This is a dangling cross-reference that reads like an unresolved leftover from the authoring template/workflow (a "Finalize" step that either never got written or was renamed) — functionally identical to the unresolved-placeholder problem the checklist's item 8 is looking for, just not in literal `{brace}` form. As written, FR-10 (README + diagram) has no real architectural governance in this document at all. | High | ARCHITECTURE-SPINE.md:201 |
| 5.2 | The Structural Seed's deployment paragraph says "ver Deferred/hosting" — but no bullet in the Deferred section is titled or scoped to "hosting" (the closest, "CI/CD con deploy independiente por Remote," is about a different concern: per-Remote pipelines, not the mechanics of the single combined deploy this paragraph is actually describing). Second dangling cross-reference of the same kind as 5.1. | Medium | ARCHITECTURE-SPINE.md:159 |
| 5.3 | FR-2's row cites only "Consistency Conventions (naming rutas), DESIGN.md Header/Nav" — but FR-2's own testable consequence ("el header muestra un contador... que se actualiza... realiza parte de FR-4") depends directly on AD-3 (shared cart state reactivity). AD-3 isn't cited for this row even though FR-4's row correctly cites it. Minor, but the map is otherwise consistent about citing every AD a capability actually depends on. | Low | ARCHITECTURE-SPINE.md:193 |

## 6. Structural dimensions owned by "feature altitude" — decided / deferred / open (esp. operational envelope)

This is where the spine is weakest. "Where do we host" is decided (Cloudflare Pages, single project, single origin — Stack + Structural Seed); "how does that actually work mechanically" is largely silent, not deferred:

| # | Finding | Severity | Ref |
|---|---|---|---|
| 6.1 | **No `_redirects`/rewrite design for the single-Pages-project, multi-sub-path topology the Structural Seed itself draws.** Serving a root SPA (Shell, needing a catch-all `/* /index.html 200` for deep-linking) *and* real static assets at path prefixes (`/catalogo/remoteEntry.json` + chunks, etc.) from one Cloudflare Pages project is a documented failure mode — the catch-all rewrite can swallow requests meant for the sub-path static Remote assets unless `_redirects` is deliberately scoped/ordered. AD-6's static-federation approach depends on the Remotes' JS actually being fetchable at those fixed URLs at runtime; this gap directly threatens FR-11 ("abrir la URL pública... muestra los tres Remotes navegables") in production, not just in theory. (Independently confirmed with a documented Cloudflare community failure report in `review-versions.md` §5.) | **Critical** | ARCHITECTURE-SPINE.md:137-159 |
| 6.2 | **No described mechanism for assembling the 4 independently-built Nx projects' `dist/` outputs into the single Cloudflare Pages deploy directory**, nor for how each project's `base-href`/asset paths get set to match its production sub-path (vs. local dev, where each runs on its own port under `/`). This is a real build-time integration step FR-11 depends on and it isn't named as an Nx target, a script, or even flagged as an open question — it's simply absent. | High | ARCHITECTURE-SPINE.md:159 |
| 6.3 | No stated mechanism for how code reaches Cloudflare Pages at all (git-integration auto-build vs. a manual/CI-triggered `wrangler pages deploy`) — the Deferred section only excludes *per-Remote* CI/CD, leaving the reader to assume *some* single-pipeline mechanism exists, but it's never named. | Medium | ARCHITECTURE-SPINE.md:204-210 (absent) |
| 6.4 | Static federation means Remote URLs are "fixed in the Shell's config" (Design Paradigm) — but the spine never states that these fixed URLs must differ between local dev (`http://localhost:420x/remoteEntry.json`) and production (`/catalogo/remoteEntry.json` under the same origin), nor how that environment switch is implemented (Angular environment files, per-target Nx config, etc.). This is the same class of silent operational gap as 6.2. | Medium | ARCHITECTURE-SPINE.md:24-35 |
| 6.5 | Performance budget enforcement mechanism (Angular CLI `budgets` in `angular.json`, tied to PRD §9's <300KB gzip figure) isn't mentioned — see also 3.1. | Low | ARCHITECTURE-SPINE.md:122-133 (absent) |

Dimensions confirmed **adequately decided** (no gap): lib-type dependency direction (AD-2), inter-Remote isolation (AD-1), entity-shape consistency (AD-4), cost/hosting-provider choice at the "where" level (Stack), no-staging rationale (Structural Seed prose, explicitly justified against PRD §2.2).

## 7. Mermaid diagram validity / meaningfulness

| # | Finding | Severity | Ref |
|---|---|---|---|
| 7.1 | AD-2 dependency-direction diagram (`graph LR`) — valid syntax, meaningful (encodes the real feature/ui/data-access/util graph plus shared-lib fan-in and the federation edges), not a placeholder. No issues found. | — (sound) | ARCHITECTURE-SPINE.md:51-86 |
| 7.2 | Structural Seed diagram (`graph TB`) — meaningful (real infra topology, one origin, federation edges, state ownership), but has a copy-paste defect: `Per --> SharedAuth` is duplicated verbatim on two consecutive lines. Cosmetic (Mermaid will just draw a redundant edge or silently dedupe), but it signals the diagram wasn't proofread after the last edit. | Low | ARCHITECTURE-SPINE.md:155-156 |
| 7.3 | Same diagram: node labels `SharedCart[(libs/shared/cart\nen memoria del tab)]` and `SharedAuth[(libs/shared/auth\nlocalStorage)]` use a bare `\n` inside an unquoted bracket label. Mermaid's documented convention for a forced line break inside a node label is `<br/>` (or a backtick-quoted markdown-string node); a literal `\n` in an unquoted `[...]`/`[(...)]` label is not guaranteed to render as a line break in current Mermaid — in many renderers it will display the literal characters `\n` in the label text. Worth fixing to `<br/>` for reliability. | Medium | ARCHITECTURE-SPINE.md:150, 152 |

## 8. Unresolved template placeholders / `{curly brace}` leftovers

| # | Finding | Severity | Ref |
|---|---|---|---|
| 8.1 | No literal unfilled `{placeholder}` tokens found in ARCHITECTURE-SPINE.md itself. The `{scope}-{type}-{nombre}` and `scope:{catalogo\|carrito\|perfil\|shell\|shared}` notations (Consistency Conventions) are deliberate enumerated-grammar descriptions, not leftover template variables — these are fine. (Note: DESIGN.md/EXPERIENCE.md's `{colors.accent}`-style tokens are a different, intentional token-reference convention in those documents, out of scope for this spine review.) | — (clean) | ARCHITECTURE-SPINE.md:116-117 |
| 8.2 | However, two dangling cross-references function exactly like unresolved template leftovers — they point at document sections that don't exist, which is the functional equivalent of an unfilled placeholder (see 5.1, 5.2 for full detail): **"ver Finalize"** (no "Finalize" section anywhere) and **"ver Deferred/hosting"** (no "hosting" entry in Deferred). Both read as artifacts of the authoring/workflow process that were never resolved into real content or removed. | High / Medium | ARCHITECTURE-SPINE.md:201; ARCHITECTURE-SPINE.md:159 |

---

## Summary of Findings by Severity

**Critical (3)**
- 1.1 / 2.1 (same root cause, two angles): AD-6 doesn't extend singleton/shared treatment to `libs/shared/auth`/`cart` themselves, and its Rule names a stale config filename (`federation.config.js` vs. the `.mjs` the pinned v4 package actually requires) — the invariant meant to guarantee FR-4/FR-7 cross-remote consistency does not, as written, actually do so.
- 4.1: Nx 22.7 and Angular 22 are pinned side-by-side in the same Stack table despite being mutually incompatible per Nx's own compatibility matrix (Angular 22 needs Nx ≥23.1.0).
- 6.1: No `_redirects`/rewrite design for the single-Cloudflare-Pages-project, multi-sub-path topology — a documented failure mode that threatens FR-11 in production, not just a theoretical gap.

**High (6)**
- 1.2, 1.3, 1.4 — AppModule-exposure pitfall, transitive shared-dependency generalization, and Tailwind/design-token sharing all left as silent divergence points.
- 3.1 — Performance budget (<300KB gzip) dropped silently, inconsistent with the spine's own pattern of making NFRs concrete elsewhere.
- 5.1 / 8.2 — "ver Finalize" dangling reference leaves FR-10 with no real governance.
- 6.2 — Build-assembly mechanism for combining 4 projects into one deploy is undescribed.

**Medium (7)**
- 2.2, 2.3 — AD-3/AD-4 enforcement relies on discipline, not tooling; AD-5's retry mechanism and a11y contract unpinned.
- 3.2 — Version-freeze policy not carried as a rule, only as a table.
- 4.5, 4.6 — Cloudflare Pages strategic-direction caveat and lack of a stated verification trail for Stack claims.
- 5.2 / 8.2 — "ver Deferred/hosting" dangling reference.
- 6.3, 6.4 — CI-trigger mechanism and dev/prod remote-URL environment switching undescribed.
- 7.3 — Mermaid node labels use unreliable `\n` line-break syntax.

**Low (6)**
- 1.5, 1.6, 1.7 — nested routing convention, package manager, mock-data convention all unpinned (low stakes for solo dev).
- 4.3 — native-federation patch version 3 releases stale.
- 5.3 — FR-2 map row omits AD-3 citation.
- 6.5 — performance-budget enforcement mechanism (Angular `budgets`) unmentioned.
- 7.2 — duplicate edge in Structural Seed diagram.
