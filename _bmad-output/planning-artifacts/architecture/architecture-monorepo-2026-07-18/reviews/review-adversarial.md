---
title: Adversarial Review — ARCHITECTURE-SPINE.md (Llano)
type: review
subject: '../ARCHITECTURE-SPINE.md'
sources:
  - '../ARCHITECTURE-SPINE.md'
  - '../../../prds/prd-monorepo-2026-07-17/prd.md'
  - '../../../prds/prd-monorepo-2026-07-17/addendum.md'
  - '../../../ux-designs/ux-monorepo-2026-07-17/DESIGN.md'
  - '../../../ux-designs/ux-monorepo-2026-07-17/EXPERIENCE.md'
created: '2026-07-18'
---

# Adversarial Review — Llano Architecture Spine

**Method:** construct pairs of "two units one level down" — a developer building unit A vs. a developer building unit B, at different phases of the PRD's Fase 0-4 roadmap, each reading and obeying every ADOPTED AD in `ARCHITECTURE-SPINE.md` to the letter — and show they still produce incompatible builds. Ranked by likelihood × impact for a solo developer working the phased roadmap, not theoretical edge cases.

---

## Finding 1 — FR-6 (Perfil) is not bound by AD-3, so "same name in the header" can silently fork from "the name you edited"

**Severity: Critical. Likelihood: High.**

**The gap:** AD-3's own `Binds:` line reads `FR-4, FR-7, libs/shared/cart, libs/shared/auth` — **FR-6 is absent**. The Capability → Architecture Map confirms this isn't an oversight in isolation: `FR-6 Ver/editar Perfil mock | libs/perfil/* | AD-2, AD-4` — governed by AD-2 (layering) and AD-4 (types), never AD-3 (single-service-owns-state). Meanwhile FR-7's row is `libs/shared/auth | AD-3` alone. So the spine has two entities that both plausibly mean "the user's name" — `libs/shared/auth`'s `User`/`Session` (bound by AD-3, drives the header's Session Widget per FR-7) and Perfil's own edited profile (bound only by AD-2/AD-4, FR-6's text just says "persistiendo el cambio en `localStorage`" without saying *whose* localStorage-backed store).

**Two units, both spec-compliant:**
- **Unit A — Fase 2 developer building `libs/shared/auth` (FR-7):** implements a `providedIn: 'root'` service with a `signal<Session>()` holding `{ authenticated, name }`, read by the Shell header's Session Widget and by all three Remotes. Fully satisfies AD-3's letter and FR-7's consequences (login from Shell, name consistent in all three Remotes).
- **Unit B — Fase 3 developer building `libs/perfil/data-access` (FR-6):** reads FR-6 literally ("editar nombre/email, persistiendo el cambio en localStorage"), and — since nothing in AD-3's `Binds` or the Capability Map routes FR-6 through `libs/shared/auth` — writes a self-contained `perfil-profile` record straight to its own `localStorage` key from `libs/perfil/data-access`, independent of the auth service's signal.

**Why they break:** Antonio edits his name in Perfil (FR-6 consequence: "editar el nombre... conserva el nuevo valor" — satisfied, F5 reload shows it). He then looks at the header (FR-7 consequence: "mismo nombre... en los tres, sin necesidad de volver a iniciar sesión") — and sees the *old* name, because the Session Widget reads `libs/shared/auth`'s signal, which Unit B never touched. Both units are individually correct against their own FR's testable consequences; the combination visibly fails FR-7's cross-remote consistency promise — in front of exactly the recruiter audience (UJ-2) the whole project exists to impress.

**Fix:** Add FR-6 to AD-3's `Binds`, and add an explicit Rule: "editing name/email in Perfil (FR-6) writes through `libs/shared/auth`'s service — there is no second, Perfil-local copy of the user's identity fields. Perfil's own `data-access` may own non-identity fields (order history mock) but not `name`/`email`." Update the Capability Map row for FR-6 to list AD-3 alongside AD-2/AD-4.

---

## Finding 2 — AD-6 doesn't name a single source for the pinned Angular/RxJS version, across builds weeks apart

**Severity: Critical. Likelihood: High.**

**The gap:** AD-6's Rule requires each of Shell + 3 Remotes' `federation.config.js` to declare Angular/RxJS `singleton: true` + `strictVersion: true` (or a fixed `requiredVersion`) — but never says *where that version string comes from*. `prd.md` §10 paces the roadmap at ~1 phase/week part-time, meaning Shell (Fase 0) and Perfil (Fase 3) are built roughly a month apart, and §9 already flags version-pinning discipline as a named concern ("fijada para el resto de las 5 fases... sin actualizaciones mid-project").

**Two units, both spec-compliant:**
- **Unit A — Fase 0 developer scaffolding Shell + Catálogo:** generates `federation.config.js` for both via the Nx generator, which hardcodes the *currently installed* Angular version at that moment (say `22.0.0`) as `requiredVersion` with `strictVersion: true`. Satisfies AD-6 to the letter.
- **Unit B — Fase 3 developer scaffolding Perfil:** a month later, runs `npm install` again (a routine, not-forbidden action — AD-6 doesn't forbid it, and §9's "sin actualizaciones mid-project" governs *deliberate* upgrades, not lockfile-permitted patch drift) picks up Angular `22.1.x` transitively, and generates Perfil's `federation.config.js` with `requiredVersion` reflecting *that* resolved version. Also satisfies AD-6 to the letter — Perfil, too, declares singleton + strictVersion.

**Why they break:** `strictVersion: true` means Native Federation throws at runtime if the required version string doesn't match exactly what's loaded. Shell/Catálogo declare `22.0.0`, Perfil declares `22.1.x` — first federated navigation to `/perfil` throws the exact "version mismatch" error `addendum.md` names as *the* primary pitfall, despite every remote individually following AD-6's Rule word for word.

**Fix:** Tighten AD-6's Rule to name the arbitration mechanism, e.g.: "`requiredVersion` in every `federation.config.js` is never hand-set per remote — it is read programmatically from the workspace root `package.json`'s pinned Angular version (or from a single shared constant), so all four federation configs are guaranteed identical without manual sync." This closes the "who arbitrates" hole the review was asked to check for.

---

## Finding 3 — Cloudflare Pages single-origin sub-path deployment is described in prose/diagram, never pinned as an AD with a testable Rule

**Severity: High. Likelihood: High (near-certain to require rework in Fase 4).**

**The gap:** The Structural Seed states Shell serves `/`, Catálogo `/catalogo`, Carrito `/carrito`, Perfil `/perfil`, "un solo proyecto/deploy... build único que empaqueta Shell + 3 Remotes en sub-paths" — but this is descriptive prose in the Structural Seed, not an ADOPTED AD with a Rule. Nothing pins: (a) each Remote's `baseHref`/`deployUrl` build flag matching its production sub-path; (b) how the merged `dist/` output is assembled into one Cloudflare Pages deploy directory from four independent Nx build targets; (c) whether `remoteEntry.json`/exposed-chunk URLs are emitted as absolute (`/catalogo/remoteEntry.json`) or relative, and who guarantees that consistently; (d) the `_redirects`/SPA-fallback rule needed so Cloudflare doesn't try to resolve `/carrito/algun-item` as a literal file path server-side. FR-9's testable consequences only check standalone `nx serve <remote>`/`nx build <remote>` in isolation — never sub-path-correct production output — so nothing in the spine's testable surface would catch this before Fase 4.

**Two units, both spec-compliant:**
- **Unit A — Fase 0 developer configuring Shell's federation config:** wires the three Remotes' URLs as `http://localhost:420x` for local dev per FR-9's standalone-serve requirement, and — since no AD says otherwise — assumes "someone in Fase 4 will point these at the production sub-paths."
- **Unit B — Fase 4 developer doing the Cloudflare Pages deploy:** builds each of the 4 apps independently with Nx defaults (`baseHref: '/'` unless told otherwise — nothing in the spine instructs setting `baseHref: '/catalogo/'` etc.), copies each `dist/apps/<x>` into a merged deploy folder, and pushes to Cloudflare Pages as "one project."

**Why they break:** With every Remote built at default `baseHref: '/'`, each Remote's own internal asset/chunk references resolve against site root instead of its sub-path — Catálogo's lazily-loaded internal chunks 404 once served from `/catalogo/`, or worse, one Remote's assets silently shadow another's if filenames collide at root. This is exactly the kind of break that only surfaces once, in Fase 4, against the literal FR-11 deliverable (the public demo — portfolio-critical), with no earlier testable checkpoint to catch it.

**Fix:** Promote this to a numbered AD (e.g., AD-7 — Mapeo de build output a sub-path de producción) with a concrete Rule: each Remote's production build sets `baseHref`/`deployUrl` to its assigned sub-path explicitly (not left at Nx defaults); the merge-into-one-deploy-directory step is scripted (not manual copy-paste) and documented in the repo; a `_redirects` (or Cloudflare `_routes.json`) rule sends all non-file paths to Shell's `index.html`. Add a testable consequence: "a production build merged into the deploy directory and served locally via a static file server reproduces the same federated navigation as `nx serve shell`."

---

## Finding 4 — AD-4 pins entity *names and location*, not entity *shapes/formats* — price and CartItem structure are free variables

**Severity: Medium-High. Likelihood: Medium-High.**

**The gap:** AD-4's Rule only says `libs/shared/util-types` exports `Product`, `CartItem`, `User`/`Session`, and that nobody redefines them locally. It fixes `id` as `string` (Consistency Conventions table) but says nothing about: `Product.price`'s representation (`number` vs `string`; whole currency units vs cents/minor units); currency/locale formatting convention (is display via a shared `currency` pipe, or ad hoc string interpolation?); or `CartItem`'s actual shape (does it nest `product: Product`, or flatten fields like `imageUrl`/`name`/`price` directly onto the cart line?). AD-4's own "Prevents" clause literally names the `imageUrl` vs `image` mismatch as the failure mode it's guarding against — but only guards against *duplicated, diverging definitions*, not against the *first* definition being underspecified in a way two later consumers read differently.

**Two units, both spec-compliant:**
- **Unit A — Fase 1 developer building Catálogo (FR-3/FR-4):** defines `Product.price: number` as raw decimal pesos (e.g. `299.99`), used directly for category-agnostic sort/filter and interpolated into the Product Card template with no currency pipe (DESIGN.md doesn't mandate one, just "precio en `{typography.body-md}` + `{colors.accent}`").
- **Unit B — Fase 2 developer building Carrito (FR-5):** needs to sum `quantity * price` across `CartItem`s for the total, and — following common practice to avoid floating-point cent errors — assumes `price` is stored as **integer cents**, or alternatively pipes every price through Angular's `currency` pipe with default locale (`en-US`, `$`) for consistent formatting.

**Why they break:** If Unit B's total math assumes cents while Unit A's data is decimal pesos, the Carrito total is off by 100×, immediately visible and embarrassing in the recruiter demo (UJ-2). Even without the cents/decimal confusion, if Catálogo shows `299.99` unformatted while Carrito's total shows `$299.99` (en-US locale, `,` thousands separator) the same underlying number renders with visibly different currency conventions across two Remotes that are supposed to look like one seamless store — directly undermining EXPERIENCE.md's "de cara al usuario esto es una sola tienda, no tres apps."

**Fix:** Extend AD-4's Rule to pin representation, not just naming: `Product.price` is `number`, decimal major units (not cents), MXN (or whichever currency is chosen) with a **single shared formatting utility** (e.g., an Angular pipe or function in `libs/shared/util-types` or a sibling `libs/shared/util-format`) that both Catálogo and Carrito are required to use for any price display — no remote formats currency ad hoc. Also pin `CartItem`'s shape explicitly (flat vs nested) in the spine text, not just "defined once."

---

## Finding 5 — AD-5 only isolates *load-time* federation failures, not runtime exceptions after a Remote has mounted

**Severity: Medium. Likelihood: Medium.**

**The gap:** AD-5's Rule is precise but narrow: "cada ruta federada del Shell envuelve su `loadRemoteModule(...)` en un `.catch()`..." — this only guards the *dynamic import* call itself (404, network error, parse error on fetching the remote's bundle). It says nothing about an uncaught exception thrown by code *inside* an already-successfully-loaded Remote (e.g., a null-reference bug in Carrito's total-calculation logic, or a template error in Perfil's order-history rendering) — the AD's title ("Fallo de un Remote se aísla... nunca rompe el Shell") promises isolation broader than its Rule actually delivers, since Angular has no per-route error-boundary primitive analogous to React's, and nothing in the spine assigns a mechanism (custom `ErrorHandler`, `try/catch` at the routed component boundary, etc.) for post-mount failures.

**Two units, both spec-compliant:**
- **Unit A — Fase 0 developer building Shell's routing:** implements exactly AD-5's literal Rule — `.catch()` around each `loadRemoteModule(...)`, rendering `RemoteUnavailableComponent` on load failure. Nothing more is required by the AD, so nothing more is built.
- **Unit B — Fase 2 developer building Carrito's checkout total logic (FR-5):** ships a bug — say, `total()` computed signal divides by a value that can be zero/undefined for an edge-case cart state — that throws at runtime *after* Carrito has already loaded successfully.

**Why they break:** The uncaught exception from Unit B's bug propagates as a normal JS runtime error, unrelated to the `loadRemoteModule().catch()` Unit A built — Angular's default global error handling can crash the whole app shell (white screen, header included) rather than being contained to Carrito's outlet, directly contradicting AD-5's stated intent while both units individually satisfied its literal Rule.

**Fix:** Extend AD-5's Rule (or add a companion AD) requiring a route-scoped safety net for federated feature routes beyond the load `.catch()` — e.g., a global `ErrorHandler` that, when the error's stack trace/zone context identifies it as originating from a lazily-federated route, degrades that route's outlet to `RemoteUnavailableComponent` rather than crashing the app; or a documented convention that top-level feature components in each Remote wrap their template in Angular's (already-existing) error-friendly patterns. At minimum, state explicitly that this is a known gap so it isn't assumed "already covered" by AD-5's title.

---

## Lower-severity findings (for completeness)

**6. Tag ambiguity for a future non-component, non-pure-data shared lib (Medium-Low).** The 4-type table (`feature`/`ui`/`data-access`/`util`) has no clear bucket for an Angular-decorated-but-presentational artifact with no template — e.g., a shared currency/date-formatting `Pipe`. `ui` is defined as "componentes presentacionales puros" (implies components); `util` is "sin Angular DI de negocio" (a Pipe has no business DI, but is still an Angular construct). If a Fase 1 developer and a Fase 2 developer each independently need this and read the table differently, one tags/creates `libs/shared/util-format` (`type:util`) and the other creates `libs/shared/ui-format` (`type:ui`) — two near-duplicate libs, neither of which the other discovers, reintroducing exactly the kind of drift AD-4 exists to prevent for data types but doesn't cover for shared behavior. *Fix:* add a fifth guidance line or explicit note that Angular artifacts with no state/DI (pipes, pure directives, formatting helpers) are `type:util` regardless of the `@Pipe`/`@Directive` decorator.

**7. FR-8 "no duplication" doesn't force promotion of remote-scoped presentational components to `shared/ui` (Medium-Low).** AD-1 forbids a Remote importing another Remote's lib, but nothing requires promoting a component to `libs/shared/ui` once a second Remote needs something visually identical (e.g., a price-with-currency display, or an empty-state layout). Two Remotes built at different phases can each build their own near-duplicate presentational component, fully AD-1/AD-2 compliant, and technically not violating FR-8's letter (which only names "botón"/"card" as the example, not price displays or empty states) while violating its spirit and reintroducing the visual-inconsistency risk called out in Finding 4. *Fix:* generalize FR-8/AD-2's consistency convention to "any presentational pattern needed by 2+ Remotes is promoted to `libs/shared/ui` before the second Remote implements its own version," not just button/card by name.

**8. `ui`-row wording vs. mermaid diagram (Low, internal-consistency nit).** The Design Paradigm's type table says `ui` "puede depender de: `util` únicamente," but the `feature` row explicitly appends "de scope:shared," while the `ui`/`data-access` rows don't. The AD-2 mermaid diagram shows `CatUI --> Util` (shared util-types) and `CatUI --> SharedUI` (shared/ui itself), which only makes sense if `ui` may depend on `scope:shared` `util` (and, implicitly, other `scope:shared` `ui`). The prose table and the diagram are both "correct" but a reader taking the prose table in isolation could conclude `ui` may only depend on same-scope `util`, which would make `libs/shared/ui` un-reusable by remote `ui` libs — self-contradictory with FR-8. *Fix:* align the prose table's `ui`/`data-access` rows to explicitly say "same scope; `util` also usable from `scope:shared`," matching the `feature` row's phrasing.

---

## Summary Table

| # | Finding | Severity | Likelihood | FR/AD touched |
|---|---|---|---|---|
| 1 | FR-6 not bound by AD-3 — Perfil name edit doesn't propagate to header | Critical | High | AD-3, FR-6, FR-7 |
| 2 | AD-6 has no single source for pinned Angular/RxJS version across phased builds | Critical | High | AD-6, addendum's #1 pitfall |
| 3 | Cloudflare Pages sub-path mapping never pinned as an AD/Rule | High | High | FR-9, FR-11, Structural Seed |
| 4 | AD-4 pins entity names/location, not shapes/formats (price, CartItem) | Medium-High | Medium-High | AD-4, FR-4, FR-5 |
| 5 | AD-5 only covers load-time failures, not post-mount runtime errors | Medium | Medium | AD-5 |
| 6 | Tag ambiguity for future non-component shared libs (pipes/formatters) | Medium-Low | Medium | AD-1, AD-2, tag scheme |
| 7 | FR-8 doesn't force promotion of remote-scoped ui to shared/ui | Medium-Low | Medium | FR-8, AD-2 |
| 8 | `ui` row wording vs. mermaid diagram inconsistency | Low | Low (internal nit) | AD-2 |
