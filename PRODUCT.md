# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: Daniel (São Paulo) — Head de Estratégia e Marketing do Grupo Sanwey. Builds and operates his own tools; not a full-time engineer. Situation: opens the tool to check what needs a decision for the active brand front, then jumps into producing or reviewing material.

This session also treats the redesign as a skill-quality stress test of Intent + Impeccable, judged by Daniel.

## Product Purpose

trackforge-os writes marketing material that goes out under real company names. Success means the operator can orient quickly on pending work, produce pieces, verify claims against curated facts, see API cost, and publish only what can be sustained. Numbers, dates, norms, and percentages must come from the knowledge base or received material — never invented.

## Positioning

A production bench with a fact-provenance gate: derived pieces cannot invent beyond their source, and only primary sources may become citations in published claims. Neighboring generic “AI content tools” do not carry this gate as product truth.

## Operating Context

- Active brand front (Sanwey, Resibag, Meu) is global chrome — wrong front is a class of bug.
- Home (`/`, Situação) is the hub: CRM queue, unsent paid pieces, claims without source, month cost.
- Spokes: Peças (produce), Fatos (trust), Custos (spend), Instalação (setup).
- Local browser storage holds drafts, productions, and cost log; CRM queue when configured.
- Desktop-first operator workstation (~1900px).

## Capabilities and Constraints

- Confirmed surfaces in Phase 1 redesign scope: entry shell (chrome + nav) and Situação home only. Spoke interiors stay functionally untouched in this phase.
- Must not invent factual claims, prices, testimonials, or norms in UI copy that could be mistaken for published product truth. Structural placeholder counts in wireframes are labeled as such.
- Secrets stay server-side; no secret values in UI or logs.
- Open: whether PRODUCT.md / DESIGN.md become standing project law after this test session (session explicitly allowed temporary freedom from prior visual identity).

## Brand Commitments

- Product name in chrome: trackforge (operator tool name).
- Brand fronts by id/label: Sanwey, Resibag, Meu.
- Session brief (2026-09): prior visual identity (tokens, fonts, shell look) is NOT binding for this redesign test. Modern 2026 web craft is in scope. Industrial-sector aesthetic conventions are not required.
- **Locked visual direction (2026-09-07): Hybrid Wire Service + Type Specimen Desk.**
  Casca = Wire (masthead serif `trackforge`, EDIÇÃO · frente, dateline, faixa LIVE + nav).
  Corpo Situação = Specimen (glifo = prioridade ativa, célula invertida, grade/lista tipográfica).
  Paleta: paper `#f3efe6` / ink `#16140f` / urgent `#d63a22`; tema escuro = ink invertido.
  Referência aprovada: `scratchpad/intent-fase1/impeccable-hibrido-wire-specimen.html`.
  Directions descartadas nesta rodada: Night Desk, Catalog Sleeve, Nixie Bench, Wire puro, Specimen puro.
- Binding operational ethics remain: no fabricated facts; anti dark-pattern.

## Evidence on Hand

- Code routes and shell labels in `src/app/` and `src/components/app/EsteiraShell.tsx`.
- Intent artifacts this session: `scratchpad/intent-fase1/` (journey, organize, wireframes).
- No customer testimonials or external benchmarks on hand — do not fabricate.

## Product Principles

1. Orient before produce — the home answers “what needs me?” for the active front.
2. Provenance over polish — visual craft never excuses invented claims.
3. Honest empty and failure states — CRM off shows as CRM off; no fake queues.
4. Direct jumps — global nav must reach spokes without forcing a hub detour every time.
5. Cost is visible — money spent by the tool is first-class information, not buried metrics.

## Accessibility & Inclusion

Target WCAG 2.2 AA for the redesigned shell and home: keyboard operable chrome, visible focus, contrast ≥4.5:1 body / ≥3:1 UI chrome, `prefers-reduced-motion`, meaningful names for icon-only controls, no information by color alone (urgent KPIs also use label/weight/border).
