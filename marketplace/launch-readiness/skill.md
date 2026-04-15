# Launch Readiness

**One-line description:** Product and marketing each submit their real readiness status and risks before a launch decision — AI produces a go/no-go assessment, names what is being accepted as a known risk, and builds the contingency plan before it is needed.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both product and marketing must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_launch_name` (string, required): What is being launched.
- `shared_target_launch_date` (string, required): Target launch date.

### Product / Launch Owner Submits Privately
- `product_feature_readiness` (object, required): Status of each feature or component in the launch — complete, in testing, at risk.
- `product_known_gaps_at_launch` (array, required): What will not be ready or fully functional on launch day?
- `product_what_is_not_ready` (array, required): Specific functionality, integrations, or fixes that will not be complete.
- `product_launch_risks` (array, required): What could go wrong after launch? What are the most likely failure modes?
- `product_support_readiness` (string, required): Is support/CS trained and equipped to handle launch day volume?

### Marketing / GTM Lead Submits Privately
- `marketing_campaign_readiness` (object, required): Status of launch campaign — assets, emails, ads, PR, events — complete vs. pending.
- `marketing_what_they_need_from_product` (array, required): What does marketing still need from product to launch — screenshots, demos, documentation, feature confirmation?
- `marketing_assets_and_messaging_status` (object, required): What messaging and assets are ready vs. pending approval or completion?
- `marketing_concerns_about_product_readiness` (array, required): What concerns do you have about whether the product will be ready for the customers you are sending to it?
- `marketing_consequences_of_delay` (object, required): What is the business and relationship cost of delaying the launch — commitments made, events planned, partner dependencies?

## Outputs
- `launch_readiness_assessment` (object): Honest product and marketing readiness status by area.
- `go_no_go_recommendation` (object): Recommendation to launch, delay, or launch with accepted risk — with the specific rationale.
- `risk_acceptance_register` (array): Known gaps and risks that are being accepted, with owner and mitigation plan.
- `launch_checklist` (array): Everything that must be complete before launch day with owner and status.
- `contingency_plan` (object): What to do if the most likely failure modes occur — who is responsible and what the response is.
- `post_launch_monitoring_plan` (object): What to watch in the first 48 hours and who is on alert.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm product feature status and marketing readiness present.
**Output:** Readiness confirmation.
**Quality Gate:** Product readiness status and marketing campaign status both present.

---

### Phase 1: Assess True Readiness
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Build a combined readiness picture — every product feature and marketing asset with current status. 2. Identify marketing's concerns about product readiness against product's own assessment — where do they diverge? 3. Check what marketing still needs from product against product's timeline — can it be delivered before launch? 4. Assess support readiness against expected launch volume.
**Output:** Combined readiness assessment, marketing-product concern alignment, pending deliverable timeline, support readiness.
**Quality Gate:** Every component has a status — ready, pending with date, or at risk.

---

### Phase 2: Assess Risk of Launching vs. Delaying
**Entry Criteria:** Readiness assessed.
**Actions:** 1. Assess the risk of launching with known gaps — what customer experience is affected, how many customers, and what the reputational or retention risk is. 2. Assess the cost of delay — marketing consequences, customer commitments, partner dependencies, competitive timing. 3. Identify which gaps are acceptable launch risks vs. which would cause the launch to fail. 4. Determine whether a partial launch or phased approach reduces risk without incurring delay cost.
**Output:** Launch-with-gaps risk, delay cost, acceptable vs. unacceptable gap assessment, phased launch option.
**Quality Gate:** Risk assessment is specific — "3 of 12 enterprise customers would see the known gap on day 1, creating a support escalation risk" not "some customers may be affected."

---

### Phase 3: Build the Go/No-Go and Contingency
**Entry Criteria:** Risk assessed.
**Actions:** 1. Make the go/no-go recommendation with the specific rationale. 2. If go: build the risk acceptance register — what is being launched with, who owns each risk, and what the mitigation is. 3. Build the launch checklist with owners and deadlines. 4. Build the contingency plan for the top three failure modes. 5. Define the post-launch monitoring plan.
**Output:** Go/no-go recommendation, risk acceptance register, launch checklist, contingency plan, monitoring plan.
**Quality Gate:** Every accepted risk has an owner and a mitigation. Contingency plan names specific actions, not "escalate to the team."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plan built.
**Actions:** 1. Present launch readiness assessment. 2. Present risk analysis. 3. Deliver go/no-go recommendation. 4. Deliver launch checklist and risk acceptance register. 5. Deliver contingency and monitoring plan.
**Output:** Full synthesis — readiness, risk, go/no-go, checklist, contingency, monitoring.
**Quality Gate:** Leadership can make a launch decision with full knowledge of what is ready, what is not, and what happens if it goes wrong.

---

## Exit Criteria
Done when: (1) every component has a readiness status, (2) gap risks assessed with specifics, (3) delay cost assessed, (4) go/no-go recommendation with rationale, (5) contingency plan for top failure modes.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
