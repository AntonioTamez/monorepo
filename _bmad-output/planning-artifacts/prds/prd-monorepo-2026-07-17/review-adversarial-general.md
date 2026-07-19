# Cynical Review — PRD: Monorepo de Microfrontends con Angular y Nx

**Reviewed:** `prd.md` (+ `addendum.md` for context) — `prd-monorepo-2026-07-17`
**Method:** Adversarial/cynical review per `bmad-review-adversarial-general`. Content assumed guilty until proven innocent; findings below are what survived that assumption.
**Context honored:** solo-developer learning project doubling as a portfolio piece, MVP1-only scope, MVP2 (dynamic federation) confirmed-deferred per §6.3. Findings are calibrated to "proyecto interno serio" — moderate rigor — not held to enterprise-PRD standards.

## Findings

- FR-4's cross-remote cart state has no defined mechanism. No `libs/shared/cart` (or equivalent) is named anywhere in the Glossary, Features, or addendum, unlike FR-7 which explicitly cites `libs/shared/auth`. The PRD asserts the *outcome* ("se refleja... sin recargar") without ever committing to *how* two independently-built remotes share mutable state, and the addendum only offers "NgRx u otro store... si se necesitara" as a maybe.

- FR-9 requires every Remote to run/build standalone with no Shell present, yet FR-4 and FR-7 require cross-remote state (cart, session) to stay in sync across Catálogo/Carrito/Perfil. The PRD never reconciles what "shared state" means when a Remote is deliberately run in isolation on its own port (a different origin from the Shell) — localStorage and in-memory services are origin-scoped, so the standalone mode FR-9 requires could silently break the exact consistency FR-6/FR-7 promise, and no consequence/test covers this interaction.

- §9's runtime policy — always adopt the latest stable Angular/Nx "al momento de iniciar cada fase" — commits to re-latesting across five roadmap phases spread over roughly five weeks. That is a live risk of a mid-project Angular/esbuild/Native-Federation upgrade, which directly courts the "version mismatch hell" pitfall the addendum itself calls out as a top risk to mitigate. The PRD names the risk in one document and reintroduces its own cause in the other without connecting the two.

- SM-1 ("Antonio puede explicar y demostrar en voz alta...") and both counter-metrics SM-C1/SM-C2 are entirely self-assessed with no defined bar, checklist, or artifact (recorded walkthrough, written explainer, rubric) that would let anyone — including Antonio in six months — determine pass/fail. As written they are unfalsifiable.

- The NFR performance budgets (build <10s, bundle <300KB gzip) are both explicitly flagged `[ASSUMPTION]` as "not yet measured against a real build," yet SM-4 elevates the unverified 300KB figure to a tracked success metric with no stated measurement method (cold cache vs warm, which remote, dev vs prod build) — a metric that can be trivially gamed by Nx's own cache and has no falsification protocol.

- The public-demo deployment model is never pinned down. §6.2 explicitly defers "independent deploy per Remote to its own host" to a future extension, implying MVP1 ships as one bundled artifact, yet FR-1's consequence claims "cada Remote aparece como bundle separado" and FR-9 sells build/serve isolation as "the requirement that makes this a real microfrontends exercise." A recruiter reading the README (FR-10) could reasonably infer full independent deployability that MVP1 does not actually deliver — the gap is buried in a bracketed NOTE FOR PM (§6.2) rather than surfaced where a portfolio reviewer would see it.

- Open Question 3 (hosting provider undecided) is left open while §8 hard-constrains cost to $0 — but Native Federation's static-federation model depends on how remoteEntry.json / import-map assets are served (paths, MIME types, cross-origin behavior). No NFR or constraint addresses this, so the choice of free-tier host is not just a preference but could determine whether FR-1/FR-11 are achievable at all, and the PRD ships without a spike or fallback plan to de-risk it.

- No FR or NFR addresses federation load failure — what the Shell shows if a Remote's bundle 404s, is slow, or fails to parse. For a project whose entire pedagogical point is understanding microfrontend architecture, failure/degradation handling is itself a core architectural lesson, and it's completely absent from Features, Non-Goals, and Open Questions alike.

- FR-3's product images are unspecified as to source — local assets, base64, or external placeholder URLs. Given the $0-cost, client-side-only, publicly-hosted demo (FR-11), hot-linked external image services are a classic silent-failure point for exactly this kind of portfolio demo, and the PRD gives no guidance ruling it in or out.

- FR-9's isolation claim is only tested in one direction ("cada uno de los tres Remotes puede levantarse... sin que el Shell... necesite estar corriendo"); there is no symmetric consequence verifying the Shell itself builds/serves without the Remotes present, even though static federation typically bakes Remote URLs into the Shell's config at build time — the direction of independence most likely to actually break is untested.

- Vision (§1) scopes "al menos tres" microfrontends ("at least three"), but every subsequent section (Features, Roadmap, Success Metrics, Non-Goals) commits to exactly three named Remotes with no mention of what a fourth would be or when it would trigger. The open-ended phrasing in the one section a stakeholder is most likely to skim contradicts the closed scope enforced everywhere else.

- The roadmap (§10) budgets zero time for debugging or rework despite the project's own stated purpose being deep learning of unfamiliar tooling (Native Federation, Nx affected graphs, esbuild build config) rather than executing known patterns — a phase-per-week cadence with no slack is optimistic specifically for the "first real contact with a new architecture" case the Vision describes.

- FR-9's third consequence (`nx affected` correctly scoping impacted Remotes) is duplicated almost verbatim as the DX NFR in §7 — the same testable claim is asserted as both a Functional Requirement and a cross-cutting NFR with no cross-reference between them, suggesting the FR/NFR boundary wasn't applied consistently.

- §12 Open Question 5 asks whether independent per-Remote CI/CD is worth pursuing "since that's what most faithfully demonstrates independent deployability" — essentially conceding that the MVP as scoped does not demonstrate real independent deployability, the single most-touted architectural payoff of the whole project (§1: "ausencia de acoplamientos de versión... independencia real de cada remoto"). That's a material tension between the Vision's headline claim and what MVP1 actually ships, left as an open question rather than resolved or explicitly caveated in the Vision itself.
