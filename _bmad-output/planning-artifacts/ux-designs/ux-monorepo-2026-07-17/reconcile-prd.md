---
title: Reconciliation — PRD (prd-monorepo-2026-07-17) vs UX Spine (DESIGN.md + EXPERIENCE.md)
created: 2026-07-17
---

# Input Reconciliation: PRD vs UX Spine

**Input checked:** `prd.md` + `addendum.md` (prd-monorepo-2026-07-17)
**Against:** `DESIGN.md` + `EXPERIENCE.md` (ux-monorepo-2026-07-17)

## Overall Verdict

Coverage is strong. All eleven FRs (FR-1 through FR-11) have a corresponding surface, component, or explicit state in the UX spine pair — including FR-9 and FR-10/FR-11, which are dev/documentation-facing rather than end-user-facing and could easily have been silently dropped but weren't (FR-9's standalone-mode caveat is explicitly reproduced in EXPERIENCE.md's Flow 3; FR-11's public demo is the premise of UJ-2). No Non-Goal is violated: no real payment UI, no i18n (explicit single-language assumption), no native mobile patterns, no real backend/auth. No MVP2 (dynamic federation) leakage — "Manifest" and "federación dinámica" are correctly absent from both spine documents, and EXPERIENCE.md's Foundation section explicitly pins itself to "Native Federation, MVP1 estático."

The gaps below are narrower: two citation/traceability issues, not missing coverage or contradicted decisions.

## Gaps

1. **Asymmetric glossary anchoring: "Carrito Compartido" / `libs/shared/cart` is never cited, while "Sesión Compartida" / `libs/shared/auth` is cited three times.** EXPERIENCE.md explicitly names `libs/shared/auth` when describing cross-remote session behavior (Foundation, Session Widget row, Flow 3 climax) but never once names `libs/shared/cart` or the glossary term "Carrito Compartido" when describing the functionally equivalent cross-remote cart behavior (Product Card add-to-cart, cart-badge increment, Cart Line Item). The behavior itself is fully and correctly specified — this is a traceability/consistency gap in how explicitly the spine anchors back to the PRD's glossary vocabulary for FR-4 vs. FR-7, not a missing or wrong feature.
   - PRD: §3 Glossary ("Carrito Compartido"), FR-4 (§4.2, ties cart state explicitly to `libs/shared/cart`)
   - UX: `EXPERIENCE.md` Component Patterns (Product Card, Cart Line Item rows) and State Patterns (Carrito vacío, Checkout confirmado) — `libs/shared/cart` and "Carrito Compartido" do not appear anywhere in `DESIGN.md` or `EXPERIENCE.md` (verified via search).

2. **Broken citation: "Fix H2 del PRD" does not exist in the PRD.** `EXPERIENCE.md` (Flow 3, "Falla esperada" footnote, line 138) cites: *"comportamiento esperado, no bug (PRD FR-9, alcance aclarado en Fix H2 del PRD)"* — but no section, heading, or fix-ID labeled "Fix H2" (or "H2") exists anywhere in `prd.md` or `addendum.md`. The underlying claim is factually correct and consistent with FR-9's actual text (§4.7, standalone Remotes don't sync shared state), so this isn't a contradiction of PRD content — it's a dangling reference, likely a leftover pointer to an external adversarial-review pass that isn't part of the reconciled document set. Worth cleaning up so a reader chasing the citation isn't sent to a section that doesn't exist.
   - PRD: no match for "Fix H2" or "H2" anywhere in `prd.md` (confirmed via search); the actual relevant content is FR-9 (§4.7).
   - UX: `EXPERIENCE.md` line 138.

3. **Minor: the "Singleton" glossary term is never named explicitly in the UX spine**, though its *effect* is correctly dramatized. EXPERIENCE.md's UJ-1 climax step describes checking DevTools to confirm "Angular/RxJS solo se cargaron una vez" — which is exactly what FR-1's third consequence and the Singleton glossary entry describe — but without using the anchor term "Singleton." This is defensible (Singleton is an architecture/build concept, arguably out of scope for a UX-facing document) and is flagged here only for completeness, not as a real defect.
   - PRD: §3 Glossary ("Singleton"), FR-1 consequence 3 (§4.1).
   - UX: `EXPERIENCE.md` Key Flows, UJ-1 step 5.
