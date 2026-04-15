# CRE Lease Negotiation

**One-line description:** Landlord and tenant each submit their real requirements and constraints before LOI negotiation — AI maps the gap term-by-term and produces a negotiated LOI draft both sides can move forward with.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both landlord and tenant must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_property_address` (string, required): Property address.
- `shared_space_description` (string, required): Space being leased — square footage, floor, suite.

### Landlord / Listing Broker Submits Privately
- `landlord_asking_rent` (object, required): Base rent, escalations, and any gross-up provisions.
- `landlord_ti_budget` (object, required): Tenant improvement allowance available and any landlord work included.
- `landlord_lease_terms_required` (object, required): Term length, commencement requirements, guaranty requirements, permitted use.
- `landlord_tenant_quality_requirements` (string, required): What credit profile, use, and covenancy does the landlord need?
- `landlord_non_negotiables` (array, required): What will the landlord not move on under any circumstances?
- `landlord_concerns_about_tenant` (array, required): What concerns do you have about this tenant's requirements or creditworthiness?

### Tenant / Tenant Rep Broker Submits Privately
- `tenant_target_rent` (object, required): Target base rent and acceptable escalation structure.
- `tenant_ti_requirements` (object, required): TI budget needed to build out the space to your requirements.
- `tenant_space_and_term_needs` (object, required): Required term, expansion or contraction rights, sublease rights, early termination options.
- `tenant_flexibility_on_terms` (string, required): Where can you flex? What are true must-haves vs. opening positions?
- `tenant_concerns_about_building_or_landlord` (array, required): What concerns you about the building, the landlord, or the deal?

## Outputs
- `deal_gap_analysis` (object): Where the parties are apart on each material term.
- `term_by_term_negotiation_map` (array): Each term rated — aligned, workable gap, or significant gap — with trade options.
- `ti_alignment_assessment` (object): Whether the TI allowance covers what the tenant actually needs.
- `negotiated_loi_draft` (string): Full LOI draft with negotiated terms — rent, TI, term, options, commencement, and key provisions.
- `risk_flags_for_each_side` (object): What each side should watch out for before executing a lease.
- `path_to_execution` (object): What needs to happen to get from LOI to signed lease, and what will slow it down.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm rent, TI, and term requirements present from both sides.
**Output:** Readiness confirmation.
**Quality Gate:** Rent position and TI budget present from both sides.

---

### Phase 1: Map the Deal Gap
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare landlord's asking rent against tenant's target — calculate the gap in absolute dollars and per-square-foot. 2. Compare TI allowance against what tenant needs — is there a gap that the tenant must fund out of pocket? 3. Map each other material term: lease term, options, escalations, sublease rights, early termination, permitted use. 4. Identify landlord's non-negotiables against tenant's must-haves — where is the real conflict?
**Output:** Rent gap, TI gap, term-by-term alignment map, non-negotiable conflict points.
**Quality Gate:** Gaps are in specific numbers — "$X PSF gap on base rent," "TI gap of $Y PSF."

---

### Phase 2: Identify Trade Space
**Entry Criteria:** Gap mapped.
**Actions:** 1. Identify terms where trade is possible — longer term for more TI, higher rent for more TI, landlord work in lieu of TI allowance. 2. Identify which of tenant's flexibility areas can close the gap on landlord's non-negotiables. 3. Assess whether tenant's credit profile satisfies landlord's requirements. 4. Identify deal-breaking mismatches that cannot be bridged.
**Output:** Trade options by term, credit profile assessment, unbridgeable conflicts.
**Quality Gate:** Every trade option is specific — "tenant accepts 10-year term in exchange for landlord increasing TI from $X to $Y PSF" not "they could negotiate."

---

### Phase 3: Draft the LOI
**Entry Criteria:** Trade space identified.
**Actions:** 1. Draft the Letter of Intent with negotiated terms for each material item. 2. Flag terms that are still open or require further negotiation. 3. Draft risk flags for each side — what to watch for in lease negotiations. 4. Build the path-to-execution timeline.
**Output:** Full LOI draft, open items list, risk flags, execution timeline.
**Quality Gate:** LOI draft reflects actual negotiated terms, not aspirational positions. Open items are named.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** LOI drafted.
**Actions:** 1. Present deal gap analysis term-by-term. 2. Present TI alignment assessment. 3. Deliver negotiated LOI draft. 4. Present risk flags for each side. 5. State path to execution.
**Output:** Full synthesis — gap analysis, TI assessment, LOI draft, risk flags, execution path.
**Quality Gate:** Both sides can evaluate this LOI knowing what was given and what was gained.

---

## Exit Criteria
Done when: (1) rent and TI gap stated in specific dollars PSF, (2) every material term has alignment status, (3) trade options identified for open gaps, (4) LOI draft with all negotiated terms, (5) risk flags for each side named.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
