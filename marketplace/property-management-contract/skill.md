# Property Management Contract

**One-line description:** The property owner and the property manager each submit their real expectations, management philosophy, and financial requirements — Claude aligns on a management agreement that gives the owner appropriate oversight and the manager the authority to operate the property without a phone call for every decision.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both owner and manager must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_property_description` (string, required): Property type, size, and location.
- `shared_owner_and_manager` (string, required): Owner and property management company names.

### Property Owner Submits Privately
- `owner_financial_expectations` (object, required): Net operating income target, occupancy expectations, capital expenditure budget, what you need the property to produce.
- `owner_oversight_requirements` (object, required): What decisions require owner approval — lease terms above X, repairs above Y, vendor contracts, capital expenditures.
- `owner_past_management_problems` (array, required): What went wrong with prior managers — maintenance deferred, vacancies mismanaged, financial reporting poor, communication failures.
- `owner_concerns_about_this_manager` (array, required): What worries you about delegating — fee structure, vendor relationships, tenant selection, responsiveness?
- `owner_what_they_will_not_tolerate` (array, required): Decisions the manager makes without calling you first, maintenance neglected, tenants that don't fit your standards.

### Property Manager Submits Privately
- `manager_management_approach` (object, required): How you manage — leasing strategy, maintenance philosophy, tenant communication, vendor relationships.
- `manager_fee_structure` (object, required): Management fee, leasing commission, maintenance markup, other fees — full cost disclosure.
- `manager_authority_requirements` (object, required): What decisions you need to make without owner approval to operate effectively — emergency repairs, lease renewals, vendor selection.
- `manager_concerns_about_the_owner` (array, required): What owner behaviors make properties harder to manage — slow decisions, deferred maintenance budgets, unrealistic expectations.
- `manager_reporting_and_communication` (object, required): What you provide — financial reports, occupancy reports, maintenance updates, how often.

## Outputs
- `management_scope_and_authority` (object): What the manager handles, what requires owner approval, and the specific dollar thresholds.
- `fee_structure_and_economics` (object): Total management cost with all fees — what the owner is actually paying.
- `performance_standards` (object): Occupancy, rent collection, maintenance response, financial reporting — what the manager is accountable for.
- `communication_and_reporting_plan` (object): Frequency, format, what triggers an immediate call.
- `management_agreement_framework` (object): Key terms for legal drafting — term, fees, authority, termination.
- `owner_obligations` (object): What the owner must provide — maintenance budget, decision response times, capital commitment.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm owner's expectations and manager's fee structure present.
**Output:** Readiness confirmation.
**Quality Gate:** Owner's financial expectations and manager's approach both present.

---

### Phase 1: Assess Expectations and Authority Alignment
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare owner's financial expectations against what the property can realistically produce. 2. Identify authority conflicts — what the manager needs vs. what the owner will not delegate. 3. Assess prior management problems — are the issues structural (budget, property condition) or managerial? 4. Check the owner's decision response time requirements against the manager's operational needs.
**Output:** Expectations reality check, authority conflicts, problem root cause, operational feasibility.
**Quality Gate:** Authority conflicts are specific — "owner requires approval on all repairs over $250; manager needs $750 authority for routine maintenance."

---

### Phase 2: Design the Management Structure
**Entry Criteria:** Alignment assessed.
**Actions:** 1. Define the authority thresholds — emergency repairs, routine maintenance, lease terms, vendor contracts. 2. Build the performance standards — occupancy rate, rent collection rate, maintenance response time, financial reporting. 3. Define the fee structure in total — all management and leasing fees, what is and is not included. 4. Build the owner obligation list — budget, response times, capital commitment.
**Output:** Authority thresholds, performance standards, total fee structure, owner obligations.
**Quality Gate:** Every threshold is a specific dollar amount. Performance standards have specific targets and measurement methods.

---

### Phase 3: Build the Agreement
**Entry Criteria:** Structure designed.
**Actions:** 1. Define the agreement term and termination — length, notice period, what triggers immediate termination. 2. Build the reporting schedule — what reports, when, in what format. 3. Define the transition plan — what happens when the agreement ends. 4. Assemble the management agreement framework.
**Output:** Term and termination, reporting schedule, transition plan, agreement framework.
**Quality Gate:** Termination triggers are named — not "material breach" but specific failures.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — authority, fees, performance standards, communication, obligations, agreement.
**Quality Gate:** Owner knows the cost, the authority they retain, and the performance standards. Manager knows what they control and what they are accountable for.

---

## Exit Criteria
Done when: (1) authority thresholds are specific dollar amounts, (2) total fee cost is disclosed, (3) performance standards are measurable, (4) owner obligations are specific, (5) termination terms are defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
