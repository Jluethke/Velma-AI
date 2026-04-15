# PE Management Incentive Plan

**One-line description:** PE firm and portfolio CEO each submit their real incentive requirements and motivational needs — AI models the economics, assesses threshold fairness, and produces an MIP that retains management through the exit.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both PE firm and portfolio CEO must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Portfolio company name.
- `shared_investment_thesis` (string, required): What is the PE firm's value creation thesis for this investment?

### PE Firm / Operating Partner Submits Privately
- `pe_return_thresholds` (object, required): Hurdle rates, preferred return, and the return levels at which management participates.
- `pe_vesting_structure` (object, required): Proposed vesting schedule — time-based, performance-based, or hybrid.
- `pe_pool_size` (object, required): Total pool size as a percentage of equity value.
- `pe_governance_requirements` (array, required): Leaver provisions, clawback, good leaver/bad leaver definitions.
- `pe_concerns_about_management_expectations` (array, required): What about management's expectations for the MIP worries you?

### Portfolio Company CEO Submits Privately
- `ceo_what_they_need_to_be_motivated` (string, required): What does the MIP need to look like for you to feel genuinely motivated to stay and drive performance?
- `ceo_timing_and_liquidity_concerns` (object, required): What concerns do you have about vesting timeline or the ability to realize value?
- `ceo_threshold_fairness_concerns` (array, required): Are the thresholds realistic given the current business trajectory? What feels fair vs. unachievable?
- `ceo_team_allocation_needs` (object, required): How much of the pool needs to go to the broader leadership team to be effective?
- `ceo_what_would_make_them_leave` (array, required): What MIP design would cause you to look for other opportunities?

## Outputs
- `economics_alignment` (object): Whether the pool size and thresholds create meaningful upside for management at the PE firm's target return.
- `incentive_structure_options` (array): 2-3 MIP designs with economics modeled at different return scenarios.
- `threshold_fairness_assessment` (object): Whether the thresholds are achievable given business trajectory.
- `vesting_and_acceleration_terms` (object): Recommended vesting schedule and acceleration triggers.
- `team_pool_allocation` (object): Recommended pool allocation between CEO and leadership team.
- `mip_term_sheet_draft` (string): Key MIP terms — pool, thresholds, vesting, leaver provisions, allocation.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm return thresholds and CEO's motivational requirements present.
**Output:** Readiness confirmation.
**Quality Gate:** PE's return thresholds and CEO's minimum requirements both present.

---

### Phase 1: Model the Economics
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Model management's economic participation at multiple exit scenarios — 1x, 2x, 3x, and 5x returns. 2. Assess whether the thresholds give management meaningful upside at the base case exit scenario or only in the stretch scenario. 3. Check whether the pool size creates meaningful value for the CEO and team given the expected hold period. 4. Identify what the CEO would receive at each scenario and whether it is motivating vs. de-motivating.
**Output:** Economic model at multiple exit scenarios, threshold participation assessment, CEO payout at each scenario.
**Quality Gate:** Model shows management's actual dollar payout at each scenario — not just percentages.

---

### Phase 2: Assess Threshold Fairness
**Entry Criteria:** Economics modeled.
**Actions:** 1. Assess the business trajectory against the return thresholds — are the thresholds achievable in the expected hold period given current performance? 2. Evaluate whether the CEO's threshold fairness concerns are valid given the investment underwriting. 3. Compare the proposed MIP against market norms for this type of investment and management team seniority. 4. Identify design elements that would make the plan more motivating without changing the PE firm's economics materially.
**Output:** Threshold achievability assessment, CEO concern validity, market comparison, design improvement options.
**Quality Gate:** Threshold assessment is based on current business projections — not the investment base case if conditions have changed.

---

### Phase 3: Build the MIP Structure
**Entry Criteria:** Fairness assessed.
**Actions:** 1. Design 2-3 MIP structures that address both sides' core requirements — different threshold levels, pool sizes, or participation mechanics. 2. For each structure, model the CEO payout and PE firm economics at 2x, 3x, and 5x. 3. Recommend the structure with the best balance of motivational power and PE firm economics. 4. Draft MIP terms — pool, thresholds, vesting, acceleration, leaver provisions, and team allocation.
**Output:** MIP structure options with economic models, recommendation, MIP term sheet draft.
**Quality Gate:** Recommendation is specific. Every structure is economically modeled, not just described.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** MIP structured.
**Actions:** 1. Present economics alignment at multiple exit scenarios. 2. Present threshold fairness assessment. 3. Deliver incentive structure options. 4. Deliver MIP term sheet draft. 5. State team pool allocation.
**Output:** Full synthesis — economics, threshold assessment, structure options, term sheet, allocation.
**Quality Gate:** CEO understands what they are earning at each exit scenario. PE firm has a plan that aligns management with the value creation thesis.

---

## Exit Criteria
Done when: (1) management payout modeled in dollars at each exit scenario, (2) threshold achievability assessed against current trajectory, (3) two or three MIP structures with economic models, (4) recommendation with rationale, (5) MIP term sheet covering pool, thresholds, vesting, and leaver provisions.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
