# Developer Entitlement Alignment

**One-line description:** A real estate developer and a planning department each submit their real project requirements, community concerns, and approval standards before the entitlement process begins — AI identifies what needs to be resolved for approval and what the project must commit to for the community to support it.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both developer and planning department must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_project_and_jurisdiction` (string, required): Project name/address and planning jurisdiction.
- `shared_project_description` (string, required): Project type, scale, uses, and zoning context.

### Developer Submits Privately
- `developer_project_design` (object, required): What you want to build — uses, density, height, parking, design, phasing.
- `developer_financial_requirements` (object, required): What the project must achieve financially — return threshold, cost basis, what concessions are affordable and which kill the deal.
- `developer_entitlement_strategy` (object, required): What approvals you need, which are discretionary, what community benefits you are willing to offer.
- `developer_community_concerns_assessment` (object, required): What you expect the community to oppose and your response to each concern.
- `developer_deal_breakers` (array, required): Conditions that make the project economically unviable — density reductions, affordable housing percentages, public benefit requirements.

### Planning Department Submits Privately
- `planning_approval_standards` (object, required): What the project must demonstrate for approval — general plan consistency, zoning compliance, CEQA requirements, design standards.
- `community_concerns_and_priorities` (object, required): What the neighborhood and community have raised — traffic, density, affordability, design, infrastructure, displacement.
- `planning_department_position` (object, required): Where staff believes the project needs modification and what they can support.
- `political_and_policy_context` (object, required): Council priorities, housing mandates, community opposition intensity, what will get through the approval process.
- `planning_what_they_need_from_developer` (array, required): Conditions, community benefits, design modifications, environmental mitigations they will require.

## Outputs
- `approval_path_assessment` (object): What approvals are needed and what the realistic path to approval looks like.
- `project_modification_framework` (object): Changes required for staff support and probable commission/council approval.
- `community_benefit_structure` (object): What community benefits the project should offer — affordable units, public space, infrastructure, community facilities.
- `environmental_and_infrastructure_requirements` (object): CEQA requirements, infrastructure obligations, mitigation measures.
- `entitlement_timeline` (object): Realistic timeline from application through approval including community engagement milestones.
- `development_agreement_framework` (object): Key terms for any development agreement or conditions of approval.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm developer's project design and planning department's approval standards both present.
**Output:** Readiness confirmation.
**Quality Gate:** Project design and approval standards both present with sufficient detail to assess path to approval.

---

### Phase 1: Assess Approvability
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Evaluate project against approval standards — what is consistent, what needs modification? 2. Assess community concerns against what the project can address. 3. Evaluate political context — what will get approved and what won't? 4. Identify deal-breaker conditions.
**Output:** Approvability assessment, modification requirements, community concern map, political feasibility.
**Quality Gate:** Every modification requirement is specific — not "reduce density" but a specific density target and why it is required.

---

### Phase 2: Design the Approval Strategy
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the project modifications needed for staff support. 2. Build the community benefits package — what the project offers and why. 3. Define the environmental mitigation measures. 4. Establish the community engagement plan.
**Output:** Modification package, community benefits, environmental mitigations, engagement plan.
**Quality Gate:** Community benefits are specific commitments — named units, named spaces, named contributions — not vague offers.

---

### Phase 3: Build the Entitlement Timeline
**Entry Criteria:** Strategy designed.
**Actions:** 1. Define the application and review milestones — CEQA, design review, planning commission, council. 2. Build the community engagement calendar. 3. Define the conditions of approval framework. 4. Assemble the development agreement framework if applicable.
**Output:** Entitlement timeline, engagement calendar, conditions framework, development agreement framework.
**Quality Gate:** Timeline is realistic — every milestone has a specific timeframe and identifies who controls it.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Framework built.
**Output:** Full synthesis — approvability assessment, required modifications, community benefits, environmental requirements, timeline, conditions framework.
**Quality Gate:** Developer knows what the project must commit to and what is still negotiable. Planning knows what the developer can and cannot accept.

---

## Exit Criteria
Done when: (1) approval path is defined, (2) required modifications are specific, (3) community benefits are named, (4) environmental requirements are identified, (5) entitlement timeline is realistic.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
