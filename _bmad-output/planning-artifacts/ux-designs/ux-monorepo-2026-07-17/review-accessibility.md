# Accessibility Review — Llano UX Spine (DESIGN.md + EXPERIENCE.md)

**Reviewed:** `DESIGN.md`, `EXPERIENCE.md` (ux-monorepo-2026-07-17)
**Target:** WCAG 2.2 AA (per `EXPERIENCE.md` Accessibility Floor)
**Date:** 2026-07-17

## Overall Verdict

The core text-color palette is sound: `ink` (~18.4:1), `ink-muted` (~6.7:1), `accent`/`accent-foreground` (~5.4:1 both directions), `success` (~6.1:1) and `error` (~6.5:1) against the white background/surface all clear WCAG AA comfortably, and two of the harder cross-cutting concerns — Category Chip non-color signaling and "Remote no disponible" screen-reader announcement — are already explicitly specified and correctly implemented in the spine. The real gaps are (a) `border-strong`, used as the sole visual boundary for secondary buttons, inactive chips, and input underlines, numerically fails the 3:1 non-text contrast minimum; (b) the "whole card is the add-to-cart control" pattern for Product Card has no accessible-name/semantic guidance, a common source of real keyboard/AT failures; and (c) several secondary interaction feedback loops (cart stepper updates, form error states, loading skeletons) aren't specified to reach assistive tech at all, only visually. None of these are cosmetic — they sit squarely inside the stated AA target and should be resolved before handoff to architecture.

**Findings by severity:** 2 High, 3 Medium, 5 Low (10 total)

---

## Findings

### F1 — [HIGH] Product Card "whole card is clickable" has no accessible-name / semantic-role guidance
**Location:** `EXPERIENCE.md` Component Patterns, "Product Card" row: *"Toda la card es clickeable para 'Agregar al carrito'"*; also Interaction Primitives: *"todo elemento interactivo es alcanzable y operable por teclado"*.

Making an entire card (image + title + price) a single "add to cart" hit target is one of the most common sources of real keyboard/AT failures: a naive `<div>`/`<article>` with a click handler isn't natively focusable or operable by keyboard, and even when `tabindex`/keydown handling is bolted on, its computed accessible name ends up concatenating image alt text + product name + price ("Producto X, $50, agregar al carrito" vs. just "Agregar Producto X al carrito"), which is confusing when announced. The generic floor statement ("todo elemento interactivo es alcanzable y operable por teclado") states the requirement but gives the implementer no guidance on *how* to satisfy it for this specific pattern (native `<button>` wrapping the whole card content vs. a card with a separately-focusable button).

**Fix:** Specify that the card renders as (or contains) a native `<button>` (or `role="button"` with full keydown handling) with an explicit `aria-label="Agregar {producto} al carrito"`, distinct from any nested image alt text. Note whether the image itself should be `alt=""` in this context to avoid double-announcing the product name.

### F2 — [HIGH] `{colors.border-strong}` fails WCAG 1.4.11 non-text contrast (3:1) against the background
**Location:** `DESIGN.md` colors (`border-strong: '#C9C9C5'`, `background: '#FFFFFF'`); used as the sole rest-state boundary for Botón secundario (`DESIGN.md` Components), Category Chip inactive state, and the Login/Perfil Input underline (`DESIGN.md`: *"Borde inferior `{colors.border-strong}` que pasa a `{colors.accent}` en focus"*).

Computed contrast of `#C9C9C5` on `#FFFFFF` ≈ **1.66:1** — well under the 3:1 minimum SC 1.4.11 requires for the boundary of a UI component that needs to be perceivable. This is systemic, not a one-off: it's the *only* visual cue at rest for (a) the underline-style Login/Perfil inputs (explicitly "sin caja" — no box, so the underline is the entire boundary), and (b) inactive Category Chips and secondary buttons, which have no fill-color difference from the background at rest.

**Fix:** Darken `border-strong` (or introduce a separate `border-interactive` token) to at least ~`#8A8A85`-range (verify ≥3:1 against `#FFFFFF`) for any border used to delineate an interactive element's boundary. Decorative separators (`{colors.border}`, used between cards/list rows) are not subject to 1.4.11 and can stay as-is.

### F3 — [MEDIUM] Cart Line Item stepper quantity/total updates aren't specified to be announced to assistive tech
**Location:** `EXPERIENCE.md` Component Patterns, "Cart Line Item": *"Stepper de cantidad (−/+) con actualización optimista del total."*

The visual update ("optimistic total update") is described, but nothing says how a screen-reader user perceives the new quantity or the new cart total after pressing +/−. Without an `aria-live` region (or equivalent) on the quantity value and/or total, an AT user gets silence after each stepper press — they'd have to re-navigate to the value to discover it changed. This is directly analogous to the "Remote no disponible" case, which the spine *does* handle correctly (see below) — this one is missed.

**Fix:** Add a line to Accessibility Floor or the Cart Line Item row specifying `aria-live="polite"` on the quantity display and/or cart total, so changes are announced without moving focus.

### F4 — [MEDIUM] Form error state has a defined color but no behavioral specification (risk of color-only signaling)
**Location:** `DESIGN.md` Colors: *"`{colors.error}` ... Uso estrictamente funcional: ... estados de error de formulario"*; `EXPERIENCE.md` State Patterns only specifies the *success* case (*"Guardar un campo ... borde pasa a `{colors.success}` por un instante"*) — no row or Component Pattern describes when/how the error state actually appears.

`DESIGN.md` reserves `error` explicitly for form validation errors, but `EXPERIENCE.md`'s State Patterns table has no corresponding entry — it's silent on what happens on a failed save (an inline error border color only? accompanying error text? `aria-invalid`/`aria-describedby`?). Since the Login Form has no real validation (PRD §4.5) this may rarely trigger, but Perfil field editing ("Con sesión ... editables") could plausibly hit save failures, and as written an implementer has no non-color guidance to follow — only the border-flip pattern used for success, which if copied 1:1 for errors would be a color-only signal (violates SC 1.4.1 Use of Color).

**Fix:** Either explicitly state this state is out of scope (mock, saves never fail) or add a State Patterns row specifying error text + `aria-invalid="true"` + `aria-describedby` pointing at the message, not just a border-color change.

### F5 — [MEDIUM] No explicit heading-level / landmark structure specified
**Location:** `EXPERIENCE.md` Information Architecture table and Component Patterns; `DESIGN.md` Typography (defines `display-lg`, `headline-md`, `headline-sm` as styles, not as semantic heading levels).

The typography scale gives visual hierarchy (Fraunces sizes) but the spine never states the semantic heading structure: one `<h1>` per surface, `<main>` landmark per composed Remote, `<nav>` for the header. Product Card titles use `headline-sm` — without guidance, an implementer could reasonably (and incorrectly) apply an `<h2>`/`<h3>` to *every* card in the grid with no surface-level `<h1>` above it, or skip heading elements entirely and style a `<div>` (losing SC 1.3.1/2.4.6 structure). This is the kind of gap the task explicitly asked about ("is there enough behavioral specificity to produce correct landmarks/headings") — alt text is well-specified (see below, not a finding), heading hierarchy is not.

**Fix:** Add one line to Information Architecture or Foundation: each surface's Remote root renders inside `<main>`, one `<h1>` per surface, Product Card titles as `<h3>` (or similar) subordinate to the Catálogo's own `<h1>`/section heading.

### F6 — [LOW] Cart Line Item product thumbnail alt text is unaddressed
**Location:** `EXPERIENCE.md` Accessibility Floor: *"Toda imagen de producto lleva `alt` descriptivo ... nunca `alt=\"\"` en el Catálogo."* (scoped explicitly to Catálogo); `DESIGN.md` Cart Line Item: *"imagen pequeña (48×60px...)"*.

The alt-text rule is well-specified for Catálogo (this is correctly *not* a gap there) but is scoped only to Catálogo — the Cart Line Item also renders a product thumbnail, and nothing says whether it needs descriptive alt or can be `alt=""` (arguably fine here since the adjacent title text is redundant with it, but that's a judgment call the spec doesn't make).

**Fix:** Extend the alt-text rule to cover Cart Line Item thumbnails, or explicitly note they may be `alt=""` since the title text beside them is equivalent.

### F7 — [LOW] No `prefers-reduced-motion` consideration for specified transitions
**Location:** `DESIGN.md` Elevation & Depth (card hover shadow), Components/Product Card (*"el título sube 2px en hover"*); `EXPERIENCE.md` Component Patterns (*"el botón cambia a 'Agregado ✓' por ~1.5s"*) and State Patterns (*"borde pasa a `{colors.success}` por un instante"*).

None of these (individually subtle, cumulatively several) mention respecting `prefers-reduced-motion`. Note: this is not a hard WCAG 2.2 AA requirement (Animation from Interactions is SC 2.3.3, Level AAA), so this is a best-practice flag, not a compliance gap against the stated floor — worth a one-line mention given the doc is otherwise careful about accessibility and this is a public portfolio piece.

**Fix (optional):** Wrap the hover-lift/transition CSS in a `@media (prefers-reduced-motion: reduce)` fallback that keeps the state change but drops the animated transition.

### F8 — [LOW] Skeleton loading states aren't specified to be announced to AT
**Location:** `EXPERIENCE.md` State Patterns, "Carga inicial (federación en curso)": *"Skeleton del layout esperado ... mientras el Remote correspondiente se descarga."*

By contrast, the "Remote no disponible" error state in the same table is correctly specified to use `role="alert"`/`aria-live="polite"` (see F-none below — this one is done right). The loading/skeleton state has no equivalent — no `aria-busy` or live-region mention — so a screen-reader user gets no indication content is loading versus just empty.

**Fix:** Add `aria-busy="true"` on the loading container, released once content renders (lower priority than F3/F4 since federation load is typically brief).

### F9 — [LOW] `{colors.ink-faint}` fails 3:1 contrast; usage on disabled controls is WCAG-exempt but placeholder usage is ambiguous
**Location:** `DESIGN.md` colors (`ink-faint: '#9A9A95'`); Components: *"`{colors.ink-faint}` para placeholders y estados deshabilitados"*; `EXPERIENCE.md` Checkout Button: *"Deshabilitado ... con `{colors.ink-faint}`."*

Computed contrast of `#9A9A95` on `#FFFFFF` ≈ **2.83:1**, below both 3:1 (UI/large text) and 4.5:1 (normal text). Disabled controls are exempt from SC 1.4.3/1.4.11 (inactive components), so the Checkout Button use is fine as-is. The "placeholders" use is murkier: `EXPERIENCE.md`/`DESIGN.md` correctly mandate visible real labels (not placeholder-as-label), so if placeholder text is only a supplementary hint, low risk — but this isn't stated explicitly.

**Fix:** Low priority — confirm no placeholder text ever conveys information not otherwise available (e.g., required format), and that disabled-button color is paired with a real `disabled`/`aria-disabled` attribute (see F10).

### F10 — [LOW] Checkout Button disabled state described only as a visual token, not confirmed as programmatically disabled
**Location:** `EXPERIENCE.md` Component Patterns, "Checkout Button": *"Deshabilitado (no oculto) si el carrito está vacío, con `{colors.ink-faint}`."*

"Deshabilitado" plausibly implies a real HTML `disabled`/`aria-disabled` state, but the spec states the rule purely in visual-token terms (color), same pattern as several other rows. Minor ambiguity risk that an implementer applies only a CSS class (dimmed but still focusable/clickable) rather than true disabled semantics.

**Fix:** One clause confirming native `disabled` (or `aria-disabled="true"` if it needs to remain focusable for tooltip/explanation purposes) is sufficient to close this.

---

## Confirmed as Already Well-Specified (not findings)

- **Category Chip / filter selected state** — `EXPERIENCE.md` Accessibility Floor explicitly requires `aria-pressed` plus a shape indicator, not just `{colors.accent}`. Correct.
- **Product image alt text (Catálogo)** — explicitly required, non-empty, descriptive (name + category). Correct.
- **Form labels** — explicitly required as always-visible real text, never placeholder-as-label. Correct.
- **Focus visibility** — a general rule (`{colors.accent}` outline, tab order follows reading order) is stated for all interactive elements. Correct, though see F1 for the one component where "interactive element" itself is ambiguous.
- **"Remote no disponible" screen-reader announcement** — explicitly specified via `role="alert"`/`aria-live="polite"`, scoped to the failed Remote's container only. This is the one federation-specific a11y gap the task asked about, and it is correctly closed.
- **Core text/background contrast** (`ink`, `ink-muted`, `accent`, `accent-foreground`, `success`, `error` against `background`) — all comfortably pass WCAG AA (ratios ~5.4:1 to ~18.4:1); no borderline cases among the pairs the task asked to verify.
