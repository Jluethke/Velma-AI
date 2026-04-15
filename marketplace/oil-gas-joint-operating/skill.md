# Oil & Gas Joint Operating Agreement

**One-line description:** The operator and non-operator each submit their real working interest expectations, cost commitments, and operational concerns before the JOA is executed — AI aligns on operating standards, cost allocation, and decision-making authority so the well gets drilled without a dispute at every AFE.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both operator and non-operator must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_well_or_project` (string, required): Well name or project description.
- `shared_working_interests` (string, required): Stated working interest percentages.

### Operator Submits Privately
- `operator_afo_and_cost_estimate` (object, required): AFE cost breakdown, drilling and completion plan, expected timeline.
- `operator_operating_standards` (object, required): Drilling program, completion design, HSE standards, vendors and contractors you intend to use.
- `operator_decision_making_authority` (object, required): What decisions you make as operator without non-operator consent, what requires approval, AFE thresholds.
- `operator_concerns_about_the_non_operator` (array, required): What worries you — cash call payment timing, second-guessing operational decisions, elections on subsequent operations?
- `operator_risk_assessment` (object, required): Geological risk, mechanical risk, completion risk — honest assessment of what could go wrong and the cost implications.

### Non-Operator Submits Privately
- `non_operator_financial_commitment` (object, required): Can you fund your working interest share of the AFE and ongoing operations? What is your cash call capacity?
- `non_operator_operational_standards` (object, required): What operating standards do you require — HSE, environmental, contractor standards, insurance requirements?
- `non_operator_decision_rights_required` (array, required): What decisions do you need to be consulted on or have approval rights for?
- `non_operator_concerns_about_the_operator` (array, required): What worries you — cost overruns, operational decisions you disagree with, non-consent elections, information access?
- `non_operator_exit_and_flexibility_requirements` (object, required): Non-consent rights, farmout rights, assignment rights — what flexibility do you need to manage your portfolio?

## Outputs
- `working_interest_and_cost_alignment` (object): Whether cost commitments and working interests are aligned, with cash call capacity assessment.
- `operating_standards_agreement` (object): The operating standards the operator will meet and how compliance is measured.
- `decision_authority_framework` (object): What the operator decides alone, what requires non-operator consent, AFE approval thresholds.
- `information_rights_and_reporting` (object): What the non-operator receives, how often, in what format.
- `non_consent_and_election_framework` (object): How elections on subsequent operations are handled, non-consent penalties, farmout provisions.
- `joa_term_sheet` (object): Key JOA terms for oil and gas counsel.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm operator's AFE and non-operator's financial capacity present.
**Output:** Readiness confirmation.
**Quality Gate:** Operator's cost estimate and non-operator's financial commitment both present.

---

### Phase 1: Assess Financial and Operational Alignment
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Check non-operator's cash call capacity against their WI share of the AFE — can they fund it? 2. Compare operating standards requirements — are there material differences? 3. Assess the operator's risk disclosure against the non-operator's tolerance. 4. Identify decision rights conflicts — what the operator will not share vs. what the non-operator insists on.
**Output:** Financial capacity confirmation, standards alignment, risk tolerance assessment, decision rights conflicts.
**Quality Gate:** Financial capacity is specific — "non-operator's WI share of AFE is $X; stated capacity is $Y; gap requires financing plan."

---

### Phase 2: Design the Operating Framework
**Entry Criteria:** Alignment assessed.
**Actions:** 1. Define the operating standards — HSE, environmental, contractor requirements, insurance minimums. 2. Build the decision authority framework — operator sole discretion, approval thresholds by cost, unanimous consent requirements. 3. Define information rights — well reports, production data, cost accounting, access to site. 4. Design the non-consent election process.
**Output:** Operating standards, decision authority, information rights, non-consent framework.
**Quality Gate:** Decision authority thresholds are specific dollar amounts. Information rights have specific delivery schedules.

---

### Phase 3: Define Elections and Exit
**Entry Criteria:** Framework designed.
**Actions:** 1. Define election rights for subsequent operations — drilling, workover, abandonment. 2. Build the non-consent penalty — what the consenting parties receive for carrying non-consent interest. 3. Define farmout and assignment rights — what flexibility the non-operator has to manage their interest. 4. Assemble the JOA term sheet.
**Output:** Election rights, non-consent penalty, farmout/assignment terms, JOA term sheet.
**Quality Gate:** Non-consent penalty is a specific multiple — "300% of costs before conversion." Not "industry standard."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Term sheet built.
**Actions:** 1. Present working interest and cost alignment. 2. Deliver operating standards agreement. 3. Deliver decision authority framework. 4. Deliver information rights and reporting. 5. Present election framework and JOA term sheet.
**Output:** Full synthesis — cost alignment, operating standards, decision authority, information rights, elections, JOA.
**Quality Gate:** Both parties can take this to oil and gas counsel and execute a JOA without starting from zero.

---

## Exit Criteria
Done when: (1) financial capacity confirmed, (2) operating standards are specific and enforceable, (3) decision authority thresholds are dollar amounts, (4) information rights have schedules, (5) non-consent penalty is specific.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
