---
title: Reconciliation — ARCHITECTURE-SPINE.md vs. DESIGN.md / EXPERIENCE.md (Llano)
type: reconciliation-review
scope: 'Does the architecture spine give the UX spine's behavioral requirements a real, unambiguous implementation home?'
sources:
  - '../ARCHITECTURE-SPINE.md'
  - '../../../ux-designs/ux-monorepo-2026-07-17/DESIGN.md'
  - '../../../ux-designs/ux-monorepo-2026-07-17/EXPERIENCE.md'
created: '2026-07-18'
---

# Reconciliation Findings

## 1. "Remote no disponible" ↔ AD-5 (RemoteUnavailableComponent + `.catch()`)

**Placement is right; mechanism is incomplete on two points.**

- Putting `RemoteUnavailableComponent` in `libs/shared/ui` is the correct call for the accessibility requirement specifically *because* it centralizes the a11y contract in one implementation instead of letting three Remotes roll their own `role="alert"`/`aria-live="polite"` treatment differently. `type:ui` (no Angular DI of business state, no `data-access` dependency) is also sufficient — the component only needs a label string and a "retry" output event, nothing from `libs/shared/cart`/`auth`. No placement tension here.
- **Gap A — the a11y contract itself isn't in AD-5.** AD-5's rule text only specifies *what* renders (`RemoteUnavailableComponent` inside the route's outlet) and *where* (`libs/shared/ui`). It never states that this component must itself carry `role="alert"` (or `aria-live="polite"`) and that the loading/skeleton state must carry `aria-busy="true"` — both are EXPERIENCE.md Accessibility Floor requirements bound to this exact state. Because AD-5 is the only place in the architecture doc that binds to this UX requirement, and it's silent on the a11y contract, a builder reading only the spine (not cross-referencing EXPERIENCE.md's Accessibility Floor) could ship the component without it. Low severity because there's only one component to fix, but it's a real omission in the invariant that's supposed to own this behavior.
- **Gap B — "Reintentar" has no defined mechanism.** EXPERIENCE.md requires a working "Reintentar" secondary button on this state. AD-5 says nothing about what retry *does*: re-invoke `loadRemoteModule(...)` for that route, force a full route re-navigation (which Angular Router won't naturally do on same-URL by default), or reload the page. This is exactly the kind of decision two builders could implement incompatibly — one might build retry as `location.reload()` (defeats the "isolated failure" story, reloads the whole Shell) and another as a re-attempted dynamic import scoped to the outlet (matches the intent). AD-5 should pin this down (e.g., "Retry re-invokes the same `.catch()`-wrapped `loadRemoteModule()` call and re-renders the outlet, without a full page reload").

## 2. Cart Line Item stepper ↔ AD-3 (Signals singleton service) — "optimistic update"

**Not a real gap, but the spine's silence is worth one clarifying line.**

- There is no backend and no async round-trip anywhere in this system (mock data, in-memory cart per PRD §4.2 Out of Scope). Given that, a Signals-based synchronous mutation (`cartSignal.update(...)`) *is* already what EXPERIENCE.md is asking for — "optimistic" collapses to "immediate, synchronous, no rollback path needed" because there is nothing to roll back from. AD-3's `signal()`/`computed()` model supports this natively; there's no incompatible-implementation risk here (a signal update is inherently synchronous in Angular).
- The one thing AD-3 doesn't say, and arguably should for precision: whether the cart **total** is a `computed()` derived from line items (guaranteeing it can never drift from quantity changes) versus a separately-maintained signal that some future `data-access` method has to remember to update in lockstep. EXPERIENCE.md's requirement that stepper +/- changes and the new total announce together via the same `aria-live="polite"` region only holds trivially if total is derived, not hand-synced. This is a one-line addition, not a structural gap — flagging for completeness, not blocking.

## 3. Cross-remote session/cart consistency ↔ AD-3 + AD-6 — "no re-login needed"

**This is the one substantive gap in the review.**

EXPERIENCE.md (Session Widget pattern, and Flow 3) requires that logging in on Perfil is instantly reflected on Catálogo and Carrito's header, with no re-login, when running federated under the Shell. AD-3 supplies the *application-level* mechanism (single `providedIn:'root'` `AuthService` using Signals). AD-6 supplies the *framework-level* mechanism (Angular/RxJS declared `singleton: true` in `federation.config.js`, preventing duplicate framework instances).

**What's missing between them:** AD-6 only declares Angular and RxJS as shared singletons. It does not say anything about how `libs/shared/auth` and `libs/shared/cart` themselves are treated by the federation build. These are workspace TypeScript libraries, not npm packages — by default, Nx/esbuild will compile-and-inline a library's source into whichever project (Shell, Catálogo, Carrito, Perfil) imports it, unless it is explicitly configured as a shared/externalized chunk in `federation.config.js` (the same mechanism used for Angular/RxJS, extended to workspace libs). If `libs/shared/auth` gets bundled separately into each of the four projects, you end up with structurally-identical but distinct JS class references for `AuthService` in each bundle. Angular's DI resolves `providedIn:'root'` singletons by token/class identity per root injector — even though Native Federation lazy-loads all Remotes into the *same* running Angular application (one root injector, one browser tab), two different bundled copies of the `AuthService` class are two different tokens, and therefore can resolve to two different singleton instances. The result: exactly the symptom EXPERIENCE.md's Flow 3 is designed to catch (session not reflected across Remotes) — but caused by a federation config gap AD-6 doesn't cover, not by an AD-3 problem.

AD-6's own text acknowledges the general shape of this risk for *new* shared libs ("Cualquier lib compartida nueva que dependa de Angular/RxJS hereda este singleton, no declara su propia copia") but that sentence is scoped to libs that merely *depend on* Angular/RxJS — it does not say `libs/shared/auth` and `libs/shared/cart` must themselves be declared as shared singleton modules in every `federation.config.js` (Shell's and all three Remotes'). This is the concrete fix: AD-6 (or a new invariant) should state that `libs/shared/auth` and `libs/shared/cart` are added to the `shared` map in `federation.config.js` with `singleton: true` for Shell + all 3 Remotes, not just Angular/RxJS — otherwise "no re-login" is not actually guaranteed by what's written, only by what a careful builder happens to also do.

## 4. DESIGN.md component set ↔ `libs/shared/ui` + AD-2 (Product Card "add to cart")

**Adequately covered — no gap.** The Consistency Conventions table already states the exact rule needed: "ningún componente de `ui` accede a `libs/shared/cart`/`auth` directo — siempre a través de la `data-access`/`feature` de su propio dominio." Combined with AD-2's `feature → {ui, data-access}` direction and the AD-2 mermaid diagram showing `CatFeature --> CatUI` and `CatDA --> SharedCart`, the only Angular-idiomatic way to satisfy this is: Product Card (`type:ui`, `scope:shared`) emits an `@Output()` event, and the consuming domain's `feature`/`data-access` layer wires that event to `libs/shared/cart`. The spine doesn't spell out "use `@Output()`" verbatim, but there is no other reasonable Angular mechanism given the stated dependency direction, so this isn't treated as an ambiguity two builders could diverge on.

## 5. Tailwind CSS (EXPERIENCE.md Foundation) ↔ architecture Stack

**Real gap.** EXPERIENCE.md's Foundation section states the styling approach outright: "Tailwind CSS + componentes Angular propios en `libs/shared/ui`." The architecture spine's Stack table lists Nx, Angular, native-federation, Node.js, TypeScript, and hosting — Tailwind is not mentioned anywhere in the spine (Stack, Structural Seed, or Deferred). This isn't a cosmetic omission: given AD-1/FR-9 require each of the 4 projects (Shell + 3 Remotes) to build and serve independently, Tailwind's config placement is a real architectural fork —

- one Tailwind config at the repo root shared via Nx project references (consistent design tokens, but needs a decision on how each independently-built project's CSS pipeline picks it up), vs.
- a Tailwind config duplicated per project (guarantees independent buildability per FR-9, but risks four copies of the DESIGN.md token set drifting out of sync over time, and duplicated compiled CSS shipped in every Remote bundle).

Two builders left to infer this from EXPERIENCE.md alone could reasonably choose either, and the choice affects both bundle size (Deferred/hosting is a Cloudflare Pages free-tier single deploy — bundle bloat is not a non-issue here) and whether `DESIGN.md`'s token set stays single-sourced. This belongs in the Stack table (with version) and ideally a one-line rule on where the Tailwind config lives and whether it's referenced or duplicated across the 4 projects — the same kind of "prevents inconsistent reimplementation" reasoning already applied to AD-2/AD-3/AD-4.

## 6. Responsive breakpoints & Spanish-only UI ↔ architecture

**No gap.** EXPERIENCE.md explicitly commits to a single hardcoded Spanish-language UI (flagged as an `[ASSUMPTION]`, not a requirement for i18n tooling), and the architecture spine doesn't introduce or imply any i18n mechanism (no `@angular/localize`, no locale-based build config) that would contradict or need reconciling with that assumption. Responsive breakpoints are a pure CSS/Tailwind concern already covered (or not — see Finding 5) by the Tailwind question; there's no separate architecture-level implication (build target duplication per locale, etc.) that the spine leaves dangling.

---

# Summary Table

| # | UX requirement | Architecture hook | Verdict |
|---|---|---|---|
| 1 | Remote no disponible: scoped error + `role="alert"`/`aria-live="polite"` | AD-5 | Placement correct; a11y contract and retry mechanism not pinned in AD-5 — gap |
| 2 | Cart stepper optimistic update + `aria-live="polite"` | AD-3 | Supported (no backend ⇒ optimistic = synchronous); total-as-`computed()` not stated — minor |
| 3 | Cross-remote session/cart, no re-login | AD-3 + AD-6 | AD-6 covers Angular/RxJS singleton only, not `libs/shared/auth`/`cart` as shared federation modules — real gap |
| 4 | Product Card add-to-cart from a `ui` component | `libs/shared/ui` + AD-2 + Consistency Conventions | Covered |
| 5 | Tailwind CSS foundation | Stack table | Not mentioned at all — real gap |
| 6 | Responsive breakpoints / Spanish-only | — | No architecture-level implication; no gap |
