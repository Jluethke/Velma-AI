# Pharma Licensing Deal

**One-line description:** The licensor and licensee each submit their real asset valuation, development assumptions, and deal structure preferences — AI aligns on deal economics, milestone structure, and risk allocation so the asset gets developed and both parties make money if it works.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both licensor and licensee must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_asset_name` (string, required): Drug candidate or technology being licensed.
- `shared_stage_of_development` (string, required): Current development stage (preclinical, Phase 1, Phase 2, etc.).

### Licensor Submits Privately
- `licensor_asset_valuation` (object, required): How you value the asset — NPV, comparable deals, probability-adjusted projections.
- `licensor_what_rights_they_are_offering` (object, required): Geographic rights, field of use, exclusivity, sublicensing — what is on the table.
- `licensor_deal_structure_requirements` (object, required): Upfront payment, milestones, royalty rates — what the deal must look like to be acceptable.
- `licensor_what_they_are_retaining` (array, required): Rights they are not licensing — territories, indications, manufacturing.
- `licensor_concerns_about_the_licensee` (array, required): Capability to develop, financial commitment, diligence requirements, what happens if they do not develop the asset?

### Licensee Submits Privately
- `licensee_development_plan_and_cost` (object, required): What it costs to develop this asset to the next major milestone and what the timeline looks like.
- `licensee_commercial_valuation` (object, required): What you believe this asset is worth at peak sales and how you model the NPV.
- `licensee_deal_economics_they_can_support` (object, required): What upfront, milestones, and royalty rate the economics can support given your development cost model.
- `licensee_rights_they_need` (object, required): Territory, exclusivity, sublicensing rights, manufacturing rights — what you need to develop and commercialize.
- `licensee_diligence_requirements_and_concerns` (array, required): What you need to see in data packages, what IP concerns exist, what regulatory history matters.

## Outputs
- `deal_economics_alignment` (object): Whether licensor's requirements and licensee's capacity can produce a deal, with the range where agreement is possible.
- `milestone_structure` (object): Development, regulatory, and commercial milestones with payment amounts tied to each.
- `royalty_and_commercial_terms` (object): Royalty rate, tiered structure, stacking provisions, minimum annual royalties.
- `rights_and_territory_package` (object): What is licensed, what is retained, what has conditions.
- `diligence_and_development_obligations` (object): What data the licensee gets, diligence commitments to develop, what triggers rights reversion.
- `term_sheet_framework` (object): Key deal terms ready for legal and business development teams.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm licensor's valuation and licensee's economics present.
**Output:** Readiness confirmation.
**Quality Gate:** Licensor's deal requirements and licensee's capacity both present.

---

### Phase 1: Assess Deal Economics
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare licensor's deal requirements (upfront, milestones, royalties) against licensee's economic model — is there a deal? 2. Identify the valuation gap — are the parties modeling the same asset on the same assumptions? 3. Assess the rights package — what the licensee needs vs. what the licensor is offering. 4. Evaluate diligence concerns against what data and IP the licensor can provide.
**Output:** Economics viability, valuation gap analysis, rights alignment, diligence coverage.
**Quality Gate:** Economics gap is specific — "licensor requires $50M upfront; licensee model supports $15M upfront and $30M in milestones; total deal value is aligned but structure differs."

---

### Phase 2: Design the Deal Structure
**Entry Criteria:** Economics assessed.
**Actions:** 1. Structure the upfront and milestone payments — development milestones, regulatory milestones, commercial milestones tied to actual development cost inflections. 2. Design the royalty structure — base rate, tiers, stacking provisions, territory-specific adjustments. 3. Define the diligence obligations — what the licensee commits to do and when, what triggers reversion. 4. Define the rights package with carve-outs.
**Output:** Milestone structure, royalty design, diligence obligations, rights package.
**Quality Gate:** Every milestone is specific — "IND filing, $5M; Phase 2 initiation, $15M; NDA filing, $30M." Diligence obligations have specific timelines.

---

### Phase 3: Build the Term Sheet
**Entry Criteria:** Structure designed.
**Actions:** 1. Define IP ownership during and after the agreement. 2. Build the sublicensing framework — rights, flow-through payments. 3. Define termination — what triggers it, what happens to IP and data. 4. Assemble the term sheet with all key commercial terms.
**Output:** IP provisions, sublicensing framework, termination structure, term sheet.
**Quality Gate:** Term sheet is specific enough to hand to pharma counsel. IP ownership is clear for all development scenarios.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Term sheet built.
**Actions:** 1. Present deal economics alignment. 2. Deliver milestone structure. 3. Deliver royalty and commercial terms. 4. Deliver rights package and diligence obligations. 5. Present term sheet framework.
**Output:** Full synthesis — economics, milestones, royalties, rights, diligence, term sheet.
**Quality Gate:** Both parties can brief their BD and legal teams from this synthesis.

---

## Exit Criteria
Done when: (1) deal economics are viable or gap is named, (2) milestone structure is specific, (3) royalty structure has tiers and stacking provisions, (4) diligence obligations have timelines, (5) term sheet is complete.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
