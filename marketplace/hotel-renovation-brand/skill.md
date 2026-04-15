# Hotel Renovation Brand Standards Alignment

**One-line description:** A hotel owner and a brand/franchisor each submit their real capital constraints, brand standard requirements, and renovation timeline before the PIP is finalized — AI aligns on a renovation scope that satisfies brand standards without the capital overspend that causes owners to exit flags.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both hotel owner and brand must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_property_and_brand` (string, required): Hotel property name/address and brand/franchisor name.
- `shared_property_context` (string, required): Property age, current condition, room count, market, and franchise agreement status.

### Brand Submits Privately
- `brand_pip_requirements` (object, required): Required improvements — rooms, public space, F&B, exterior, technology — and the standards each must meet.
- `brand_timeline_and_milestones` (object, required): Required completion dates, phasing options, what triggers brand standards violations during renovation.
- `brand_priority_ranking` (object, required): Which elements are non-negotiable vs. where flexibility exists — what the brand will and will not waive.
- `brand_concerns_about_this_owner` (array, required): Capital commitment, execution track record, exit risk, property's competitive position in market.
- `brand_what_they_will_not_waive` (array, required): Standards the brand will not modify regardless of cost — safety, accessibility, core brand identity elements.

### Hotel Owner Submits Privately
- `owner_capital_budget` (object, required): Available capital, debt capacity, what the renovation must return — the actual budget constraint, not the negotiating position.
- `owner_renovation_priorities` (object, required): What matters most to revenue performance — what you want to invest in vs. what the brand is requiring.
- `owner_operational_constraints` (object, required): Renovation during operation — occupancy, revenue impact, phasing requirements to keep the property open.
- `owner_concerns_about_the_pip` (array, required): Items you believe are cost-prohibitive, standards that don't fit the market, timeline that doesn't work.
- `owner_exit_risk_assessment` (object, required): At what capital level you would exit the brand — what makes the flag relationship economically unworkable.

## Outputs
- `pip_scope_and_prioritization` (object): Required items, phased items, and items where brand has agreed to modifications.
- `capital_plan` (object): Total renovation cost, phasing, financing requirements, return on investment.
- `renovation_timeline` (object): Phased completion schedule that maintains operations and meets brand milestones.
- `brand_standard_compliance_framework` (object): Which standards are being met, which are phased, which waivers are granted.
- `operational_impact_mitigation_plan` (object): How revenue impact is managed during renovation.
- `pip_agreement_framework` (object): Key terms for the PIP amendment or renovation agreement.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm brand's PIP requirements and owner's capital budget both present.
**Output:** Readiness confirmation.
**Quality Gate:** PIP scope and owner's capital constraint both present with sufficient specificity.

---

### Phase 1: Assess Capital and Standards Alignment
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare full PIP cost against owner's capital capacity — what is the gap? 2. Identify non-negotiable brand requirements. 3. Assess phasing options that maintain operations. 4. Evaluate exit risk — is this owner economically viable at full PIP cost?
**Output:** Capital gap assessment, non-negotiable requirements, phasing options, exit risk.
**Quality Gate:** Capital gap is a specific dollar amount per room — not a range.

---

### Phase 2: Build the Renovation Plan
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the renovation scope — required now, required in phase 2, modified or waived. 2. Build the capital plan with financing approach. 3. Design the phasing schedule that maintains acceptable occupancy. 4. Identify brand standard modifications the brand will accept.
**Output:** Renovation scope, capital plan, phasing schedule, brand modifications.
**Quality Gate:** Every phased item has a specific completion deadline. Every modification request is specific with a rationale.

---

### Phase 3: Define Compliance and Governance
**Entry Criteria:** Plan built.
**Actions:** 1. Define compliance milestones — what the brand inspects, when, what constitutes compliance. 2. Build the penalty and cure framework — what happens if milestones are missed. 3. Define the exit provisions if renovation cannot be completed. 4. Assemble the PIP agreement framework.
**Output:** Compliance milestones, penalty and cure framework, exit provisions, agreement framework.
**Quality Gate:** Cure periods are specific timeframes. Exit provisions name the financial consequences specifically.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — PIP scope, capital plan, renovation timeline, compliance milestones, brand modifications, agreement framework.
**Quality Gate:** Owner knows the true cost and timeline. Brand knows what will be completed and when.

---

## Exit Criteria
Done when: (1) renovation scope is prioritized, (2) capital plan is complete, (3) phasing schedule is defined, (4) brand modifications are documented, (5) compliance milestones are specific.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
