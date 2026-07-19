# Spine Pair Review — monorepo (Llano)

## Overall verdict

The pair is a strong first draft for a genuinely small IA (3 surfaces): section shape matches the canonical order exactly, no color token is missing a hex value, and the editorial voice stays disciplined without bloating either file. It is not yet a clean source-extract, though — a self-contradicting shape rule inside DESIGN.md, one fabricated source citation in EXPERIENCE.md, a couple of component-name mismatches across the two files, and a dangling `.working/key-screens/` pointer would each trip a downstream consumer who trusts the spine literally. None require a rewrite; all are targeted edits.

## 1. Flow coverage — adequate

Checked: PRD §2.3 defines exactly UJ-1 and UJ-2 (verbatim names). Both appear in EXPERIENCE.md Key Flows with matching names, a named protagonist (Antonio for UJ-1), numbered steps, and an explicit **Climax** beat. A third, unsourced flow (Flow 3, session cross-remote) is added and clearly labeled as not PRD-numbered — reasonable, since PRD FR-7 has no dedicated UJ.

### Findings
- **medium** UJ-1 and UJ-2 — the two flows sourced directly from the PRD — have no failure path, while the one invented flow (Flow 3) does. Federation load failure is exactly the kind of thing UJ-1 (a dev checking DevTools) or UJ-2 (a visitor hitting a slow/broken Remote) could plausibly hit, and a "Remote no disponible" state already exists in State Patterns to hang it on. (EXPERIENCE.md, Key Flows, UJ-1 lines 109–117 and UJ-2 lines 119–127.) *Fix:* add a one-line failure branch to each, e.g. UJ-1: Remote fails to appear as a separate bundle → federation misconfigured; UJ-2: a Remote fails to load for the visitor → scoped error per State Patterns.
- **low** UJ-2's protagonist is an unnamed role ("Un recruiter" / "Un visitante del portafolio") rather than an individual, unlike Flow 3 (Antonio) and the shape examples (Mira, Sarah, Devon). Defensible since the PRD itself treats this persona anonymously, but worth a name for consistency with the flow-writing convention. (EXPERIENCE.md, Key Flows, UJ-2.)

## 2. Token completeness — adequate

Checked: every frontmatter token in DESIGN.md and every `{path.to.token}` reference in both files' prose. All referenced tokens resolve to a frontmatter definition; every color token carries a hex value (no critical misses).

### Findings
- **medium** `{colors.error}` is explicitly committed in DESIGN.md Colors as reserved for "estados de error de formulario," but no form-validation error state is ever defined in EXPERIENCE.md — Login Form and Profile edit only specify success feedback (border → `{colors.success}`). The token is used once elsewhere (Cart Line Item delete-icon hover), but the stated form-error purpose is never realized. (DESIGN.md line 127 vs. EXPERIENCE.md Component Patterns "Login Form (mock)" / State Patterns "Con sesión.") *Fix:* either add the validation-error state to EXPERIENCE.md (when/how it fires) or narrow DESIGN.md's claim if no validation is in scope for MVP1.
- **medium** Contrast for the load-bearing `{colors.accent}`-on-`{colors.background}` pairing (used for price text and primary CTAs) is deferred to "verificar... antes de implementar" rather than stated as a committed decision. Computed ratio is ~5.4:1 (passes AA for normal text, fails AAA) — worth stating explicitly rather than leaving it open. (EXPERIENCE.md Accessibility Floor, line 81.) *Fix:* state the actual ratio in DESIGN.md Colors so the decision is committed, not deferred.
- **low** Several frontmatter tokens are defined but never referenced in either file's prose: `colors.accent-hover`, `colors.success-foreground`, `colors.error-foreground`, `typography.body-lg`, `spacing.unit`, `spacing.gutter`, and the entire numeric spacing scale (`1`, `2`, `3`, `4`, `6`, `8`, `12`, `16`). Notably `accent-hover` exists but no component spec (button-primary included) defines a hover treatment that would use it. *Fix:* wire unused tokens to a concrete rule (e.g., button-primary hover using `{colors.accent-hover}`) or trim them.
- **low** Inconsistent reference syntax: some typography tokens are cited bare (`` `display-lg-mobile`/`headline-md` ``, `` headline-sm ``) instead of the `{typography.X}` path syntax used everywhere else. (EXPERIENCE.md State Patterns, "Carrito vacío" and "Checkout confirmado" rows.)

## 3. Component coverage — thin

Checked: every component named in DESIGN.md's `components` frontmatter block, DESIGN.md's prose Components section, and EXPERIENCE.md's Component Patterns table, cross-referenced for a matching row in both.

### Findings
- **high** Self-contradicting shape rule within DESIGN.md itself. Shapes states `{rounded.full}` is reserved "exclusivamente" for the Cart Badge, and Do's and Don'ts repeats it as a hard rule ("Introducir `rounded.lg`/`rounded.full` fuera del Cart Badge" is listed as a *Don't*) — yet the Components section grants **Session Widget** the same `{rounded.full}` treatment, describing it as "único uso fuera del Cart Badge." Three places in the same document disagree on whether this is a one-exception or two-exception rule. (DESIGN.md line 147, line 159, line 170.) *Fix:* update Shapes and the Do's/Don'ts row to name both permitted exceptions (Cart Badge + Session Widget), or revert Session Widget to a non-circular shape.
- **medium** EXPERIENCE.md's Component Patterns table names "Checkout Button" as its own component with a behavioral rule (disabled state via `{colors.ink-faint}` when the cart is empty), but DESIGN.md has no matching "Checkout Button" row — only a generic "Botón primario" bullet, which never specifies a disabled-state appearance (background/opacity/border) at all. (EXPERIENCE.md Component Patterns, "Checkout Button" row vs. DESIGN.md Components, "Botón primario," line 151.) *Fix:* add a disabled-state clause to DESIGN.md's Botón primario spec, and either rename the EXPERIENCE.md row to match ("Botón primario — Carrito") or add a corresponding named row to DESIGN.md.
- **low** Component naming drift across the two files: "Category Chip" (EXPERIENCE.md) vs. "Category Chip/Tag" (DESIGN.md); "Login Form (mock)" (EXPERIENCE.md) vs. "Inputs / Login Form" (DESIGN.md). Same component, different literal string — breaks exact cross-file matching.
- **low** "Header/Nav" has a full visual spec in DESIGN.md but no dedicated row in EXPERIENCE.md's Component Patterns table, despite being persistent and responsive (collapses on mobile, hosts cart/session icons). Its behavior is scattered across Interaction Primitives and Responsive & Platform instead of consolidated in one place.

## 4. State coverage — adequate

Checked: all three IA surfaces (Catálogo, Carrito, Perfil) plus the shell-level federation-load state, against the applicable state set (empty, cold-load, focus, error, offline, permission-denied).

### Findings
- **medium** No validation-error state exists for any form (Login Form, Perfil edit fields) despite DESIGN.md explicitly provisioning a color for exactly this case — see Token completeness finding above (same root cause, stated once there).
- **low** No distinct "offline" state (network loss after initial load, as opposed to a Remote failing to federate) is defined. Likely a defensible omission for a client-side mock demo with no real network dependency post-load, but the rubric calls for walking every applicable state explicitly, so noting the gap rather than silently passing it.
- Permission-denied is correctly not modeled — there is no auth-gated content beyond the session mock itself, so this state doesn't apply. No finding.

## 5. Visual reference coverage — adequate

`mockups/` and `wireframes/` directories do not exist; `imports/` exists but is empty. Expected at this planning stage — not itself a finding.

### Findings
- **medium** EXPERIENCE.md's Information Architecture section states "→ Referencia de composición: `.working/key-screens/` (Finalize)." but `.working/` contains no files — the pointer resolves to nothing. Unlike the missing `mockups/`/`wireframes/` (which are simply absent, expected pre-Finalize), this is an active reference to a specific path that a downstream consumer would try to follow and fail. (EXPERIENCE.md, Information Architecture, line 31.) *Fix:* generate the key-screens working files before Finalize, or remove/soften the pointer until they exist.

## 6. Bloat & overspecification — strong

Checked for pixel specs where tokens should cover it, source restatement, prose-where-a-table-works, and decorative narrative untied to a decision.

### Findings
None of real weight. DESIGN.md's editorial prose consistently ties back to a rule (e.g., "blanco de galería, no blanco hueso" sets a concrete constraint, not just flavor text); EXPERIENCE.md prose stays behavioral and terse throughout, matching the shape convention that DESIGN.md may carry voice and EXPERIENCE.md should not. Components sections use bullet lists (matching all three DESIGN.md shape examples), not padded tables. Brevity is appropriately scaled to the 3-surface IA — this is not a case of "should have been longer." One minor note: the numeric spacing scale (`1`–`16`, `unit`, `gutter`) is fully defined in frontmatter but the actual component specs use raw pixel values instead (e.g., Cart Line Item "48×60px") — two parallel systems that never intersect. Already counted under Token completeness; not double-scored.

## 7. Inheritance discipline — thin

Checked: sources frontmatter resolution, UJ naming fidelity, glossary duplication, component-name identity, and EXPERIENCE.md → DESIGN.md token resolution.

### Findings
- **high** EXPERIENCE.md's Flow 3 failure note cites "PRD FR-9, alcance aclarado en Fix H2 del PRD" — no "Fix H2" label exists anywhere in `prd.md` or `addendum.md` (verified by full-text search, zero matches). The underlying content is accurate and independently supported by FR-9's own text, but the specific citation is unresolvable — a downstream consumer trying to trace "Fix H2" hits a dead end. (EXPERIENCE.md, end of Key Flows, line 138.) *Fix:* drop the "Fix H2" citation (FR-9 alone already supports the claim), or if it points to an external adversarial-review artifact not included in the given source set, name that artifact explicitly instead of an opaque label.
- **low** "la revisión adversarial lo señaló como hueco" (State Patterns, "Remote no disponible" row) references an adversarial review of the PRD that is not part of the given sources and not independently locatable from `prd.md`/`addendum.md` alone. The content itself is sound (a real gap, sensibly filled); the provenance pointer just isn't verifiable by a consumer working only from the stated source set.
- Component-name mismatches ("Category Chip" vs. "Category Chip/Tag"; "Checkout Button" with no DESIGN.md counterpart) already flagged under Component coverage also constitute inheritance-discipline breaks — cross-referenced here, not re-scored.
- What resolves cleanly: both files' `sources` frontmatter (`../../prds/prd-monorepo-2026-07-17/prd.md` and `addendum.md`) resolve correctly to the actual files. UJ-1/UJ-2 are cited verbatim. Neither spine duplicates the PRD Glossary — EXPERIENCE.md defers directly to "`prd.md` §3 Glosario," avoiding drift risk entirely. This is good discipline and worth naming, not just the misses.

## 8. Shape fit — strong

Checked: DESIGN.md section order against the canonical spec; EXPERIENCE.md required-default sections; applicability of optional sections (Inspiration, Responsive).

### Findings
- DESIGN.md sections appear in the exact canonical order: Brand & Style → Colors → Typography → Layout & Spacing → Elevation & Depth → Shapes → Components → Do's and Don'ts. No gaps, no reordering.
- EXPERIENCE.md has all eight required defaults (Foundation, IA, Voice and Tone, Component Patterns, State Patterns, Interaction Primitives, Accessibility Floor, Key Flows), plus both applicable optional sections — Inspiration & Anti-patterns (earns its place: names concrete reference products and three specific rejects with rationale) and Responsive & Platform (earns its place: ties to an actual 3-breakpoint table). Section order matches the shape examples' convention.
- No invented sections. Nothing here needs a finding.
- **low** (mechanical, not a shape-fit violation per se) EXPERIENCE.md's frontmatter has no `name` field (only `title`), while DESIGN.md's frontmatter has both `title` and `name: Llano`. Both illustrative EXPERIENCE.md examples key off `name` as the primary identifier. Minor inconsistency within this same pair, not a structural problem.

## Mechanical notes

- **Fabricated citation:** "Fix H2 del PRD" (EXPERIENCE.md, Key Flows, Flow 3 failure note) does not exist in `prd.md` or `addendum.md`.
- **Dangling reference:** `.working/key-screens/` (EXPERIENCE.md, Information Architecture) is cited as a composition reference but the directory has no files.
- **Component name drift:** "Category Chip" (EXPERIENCE.md) vs. "Category Chip/Tag" (DESIGN.md); "Login Form (mock)" (EXPERIENCE.md) vs. "Inputs / Login Form" (DESIGN.md); "Checkout Button" (EXPERIENCE.md) has no DESIGN.md row.
- **Internal DESIGN.md contradiction:** `{rounded.full}` stated as exclusive to Cart Badge in Shapes (line 147) and Do's/Don'ts (line 170), contradicted by Session Widget's explicit `{rounded.full}` use in Components (line 159).
- **Token reference syntax inconsistency:** bare token names (`display-lg-mobile`, `headline-md`, `headline-sm`) without `{typography.X}` braces appear in EXPERIENCE.md State Patterns, while braced syntax is used everywhere else in both files.
- **Unused frontmatter tokens:** `colors.accent-hover`, `colors.success-foreground`, `colors.error-foreground`, `typography.body-lg`, `spacing.unit`, `spacing.gutter`, and the numeric spacing scale (`1`, `2`, `3`, `4`, `6`, `8`, `12`, `16`) are defined but never referenced in prose.
- **Frontmatter completeness:** `sources` frontmatter resolves correctly in both files (verified against the actual filesystem paths). EXPERIENCE.md frontmatter lacks a `name` field that DESIGN.md and the shape examples carry.
- **Mermaid:** no Mermaid diagrams present in either file — nothing to validate there.
