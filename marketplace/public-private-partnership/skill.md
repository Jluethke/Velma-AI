# Public-Private Partnership

**One-line description:** The government entity and the private partner each submit their real objectives, risk tolerances, and financial expectations before the partnership is structured — Claude designs the P3 framework that delivers public value, gives the private partner a viable return, and allocates risk to the party best able to manage it.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both government and private partner must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_project_name` (string, required): P3 project name.
- `shared_asset_or_service` (string, required): Infrastructure asset or public service being developed or delivered.

### Government Entity Submits Privately
- `government_public_objectives` (object, required): What public value must this project deliver — access, service quality, cost, timeline, community impact.
- `government_fiscal_constraints` (object, required): Available budget, subsidy capacity, debt limits — what the government can contribute financially.
- `government_risk_tolerance` (object, required): What risks is the government willing to retain — demand risk, regulatory risk, political risk — and what must be transferred.
- `government_regulatory_and_political_constraints` (array, required): Procurement rules, public accountability requirements, political sensitivities that constrain the deal structure.
- `government_concerns_about_the_partner` (array, required): What worries you about private sector involvement — profit motive over service quality, risk transfer failures, long-term lock-in?

### Private Partner Submits Privately
- `partner_return_requirements` (object, required): IRR target, return structure, investment horizon — what makes this project commercially viable.
- `partner_risk_appetite` (object, required): What risks can you accept and price — construction risk, demand risk, technology risk — and what you cannot absorb.
- `partner_financing_plan` (object, required): How the project is capitalized — equity, debt, government contribution — and the financing constraints.
- `partner_concerns_about_government_partner` (array, required): What worries you — regulatory change, payment reliability, scope creep, political interference in operations?
- `partner_what_they_need_to_commit` (array, required): Government commitments, risk allocation, return structure — what must be true before you invest.

## Outputs
- `public_value_and_commercial_viability_alignment` (object): Whether the project can deliver public objectives and a private return simultaneously.
- `risk_allocation_framework` (object): Which risks sit with the government, which with the private partner, and which are shared — with rationale.
- `financial_structure` (object): Equity, debt, government contribution — the capital stack and how returns are generated.
- `performance_and_service_standards` (object): What the private partner must deliver, how it is measured, and what the remedy is for non-performance.
- `governance_framework` (object): How decisions are made, how the partnership is overseen, how disputes are resolved.
- `partnership_agreement_framework` (object): Key terms for the concession agreement or partnership contract.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm government's objectives and partner's return requirements present.
**Output:** Readiness confirmation.
**Quality Gate:** Government's public objectives and partner's financial requirements both present.

---

### Phase 1: Assess Public-Private Alignment
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Assess whether the project can deliver the government's public objectives AND provide the private partner's required return — is this a viable P3? 2. Map risk allocation — which risks each party wants to transfer against what they can absorb. 3. Identify the fiscal gap — what the government contribution needs to be for the project to be commercially viable. 4. Flag regulatory and political constraints that affect structure options.
**Output:** Viability assessment, risk allocation map, fiscal gap, structural constraints.
**Quality Gate:** Viability is specific — "project delivers required return at the government's proposed subsidy of $X; removing the subsidy creates a $Y IRR shortfall."

---

### Phase 2: Design the Partnership Structure
**Entry Criteria:** Viability confirmed.
**Actions:** 1. Design the capital structure — equity, debt, government contribution — and how each component is sized. 2. Build the risk allocation framework — name each risk, assign it, and define the contractual mechanism (insurance, guarantees, liquidated damages). 3. Define the service standards and performance regime — what is measured, what the remedy is, escalation to step-in rights. 4. Design the governance structure — board composition, approval thresholds, step-in rights.
**Output:** Capital structure, risk allocation with mechanisms, performance regime, governance structure.
**Quality Gate:** Every allocated risk has a contractual mechanism — not "government bears regulatory risk" but "government indemnifies partner against regulatory change costs exceeding $X."

---

### Phase 3: Build the Agreement Framework
**Entry Criteria:** Structure designed.
**Actions:** 1. Define the concession or contract term — duration, renewal, termination rights. 2. Build the hand-back requirements — what condition the asset must be in at end of term. 3. Define refinancing rights — what happens when debt is refinanced and how value is shared. 4. Assemble the key contract terms for legal drafting.
**Output:** Term and termination structure, hand-back requirements, refinancing framework, contract key terms.
**Quality Gate:** Contract term and termination triggers are specific. Hand-back requirements are measurable standards, not "good condition."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Actions:** 1. Present public-private viability alignment. 2. Deliver risk allocation framework. 3. Deliver financial structure. 4. Deliver performance standards and governance. 5. Present partnership agreement framework.
**Output:** Full synthesis — viability, risk allocation, financial structure, performance, governance, agreement.
**Quality Gate:** Government and private partner have a shared deal framework that can be taken to procurement counsel and financial advisors.

---

## Exit Criteria
Done when: (1) project viability is confirmed with specific return and public value, (2) every risk has an owner and mechanism, (3) capital structure is specific, (4) performance standards are measurable, (5) agreement framework is complete.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
