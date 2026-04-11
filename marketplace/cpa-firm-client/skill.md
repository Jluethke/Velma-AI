# CPA Firm Client Engagement

**One-line description:** A CPA firm and a business client each submit their real tax situation, financial goals, and service expectations before the engagement begins — Claude aligns on a tax and accounting relationship that minimizes tax burden and produces reliable financial reporting without the missed deadlines and surprise bills that define bad CPA relationships.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both CPA firm and client must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_client_and_firm` (string, required): Client business name and CPA firm name.
- `shared_services_scope` (string, required): Tax preparation, bookkeeping, CFO services, audit, or combination.

### CPA Firm Submits Privately
- `firm_initial_assessment` (object, required): Your read on this client's situation — complexity, risk areas, quality of existing records, estimated hours.
- `firm_fees_and_engagement_structure` (object, required): Fee structure — fixed, hourly, or value-based — and what is included vs. billed additionally.
- `firm_capacity_and_staffing` (object, required): Who handles this client, partner involvement, turnaround times during busy season.
- `firm_concerns_about_this_client` (array, required): Poor recordkeeping, unrealistic fee expectations, aggressive tax positions, prior year issues.
- `firm_what_they_will_not_do` (array, required): Tax positions you will not take, client types you will not serve, services outside your expertise.

### Client Submits Privately
- `client_financial_situation` (object, required): Business structure, revenue, complexity, what has changed this year — the real picture including issues you have not mentioned.
- `client_tax_and_financial_goals` (object, required): Tax minimization priorities, financial statement needs, planning goals — what you actually need from this relationship.
- `client_prior_year_issues` (array, required): Problems with prior accountants — missed deadlines, surprise fees, errors, aggressive positions that created risk.
- `client_recordkeeping_reality` (object, required): Honest assessment of your books — how organized you are, what systems you use, what is missing.
- `client_concerns_about_cpa_relationships` (array, required): What you are worried about — fees, responsiveness, being handed off to junior staff, not getting planning advice.

## Outputs
- `service_scope_and_deliverables` (object): What is included in the engagement — services, deliverables, deadlines.
- `fee_structure_and_billing_transparency` (object): Full fee disclosure — what is fixed, what is hourly, what triggers additional billing.
- `tax_planning_opportunities` (object): Key opportunities based on the client's situation — entity structure, timing, deductions, credits.
- `recordkeeping_and_process_requirements` (object): What the client must provide and when to enable timely and accurate work.
- `deadline_and_deliverable_calendar` (object): All tax and reporting deadlines, extension strategy, when the client receives what.
- `engagement_letter_framework` (object): Key terms for the engagement letter.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm firm's assessment and client's financial situation and goals both present.
**Output:** Readiness confirmation.
**Quality Gate:** Firm's fee structure and client's financial situation and recordkeeping reality both present.

---

### Phase 1: Assess Scope and Complexity
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Evaluate client's financial complexity against firm's capacity. 2. Identify undisclosed issues that affect scope and fees. 3. Assess recordkeeping quality against what is required. 4. Identify immediate tax planning opportunities.
**Output:** Complexity assessment, undisclosed issue flags, recordkeeping gap, planning opportunities.
**Quality Gate:** Every fee risk is specific — named situation and named additional billing trigger.

---

### Phase 2: Define the Engagement
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the scope and deliverables — what is included, what is not. 2. Build the fee structure with full transparency. 3. Define the client data requirements — what to provide and when. 4. Establish the deadline and deliverable calendar.
**Output:** Scope definition, fee structure, data requirements, deadline calendar.
**Quality Gate:** Every deliverable has a named person responsible and a specific due date. Every additional billing trigger is named.

---

### Phase 3: Define Planning and Communication
**Entry Criteria:** Engagement defined.
**Actions:** 1. Build the tax planning agenda — key issues to address before year-end, timing strategies, structure review. 2. Define the communication cadence — how often, for what, in what form. 3. Define the extension strategy — when to extend, what it costs, what it enables. 4. Assemble the engagement letter framework.
**Output:** Planning agenda, communication plan, extension strategy, engagement letter framework.
**Quality Gate:** Planning agenda has specific actions with specific deadlines and specific tax impact estimates.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — scope, fees, planning opportunities, data requirements, deadlines, communication plan, engagement letter framework.
**Quality Gate:** Client knows what they are paying and when things are due. Firm knows the full complexity and what will trigger additional fees.

---

## Exit Criteria
Done when: (1) scope and deliverables are defined, (2) fee structure is fully transparent, (3) planning opportunities are identified, (4) deadline calendar is complete, (5) data requirements are specific.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
