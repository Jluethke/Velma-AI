# Production Budget Alignment

**One-line description:** The producer and the studio or financier each submit their real creative vision and financial constraints before production begins — Claude aligns on a budget that makes the project viable, protects the creative intent, and gives both parties a realistic plan for what they are making.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both producer and financier must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_project_title` (string, required): Project title.
- `shared_budget_being_discussed` (string, required): Current budget estimate or range under discussion.

### Producer Submits Privately
- `producer_creative_vision_and_requirements` (object, required): What the project needs to look and feel like — locations, cast level, effects, production design — to deliver the intended audience experience.
- `producer_budget_as_built` (object, required): Current budget breakdown — above the line, below the line, post-production — and where the money is going.
- `producer_what_they_cannot_cut` (array, required): Elements critical to the project that cannot be reduced without fundamentally changing what is being made.
- `producer_where_they_have_flexibility` (array, required): Where the budget can flex without damaging the creative — alternative approaches, schedule changes, location substitutions.
- `producer_concerns_about_financier_requirements` (array, required): What do you worry the financier will demand that will compromise the project?

### Financier / Studio Submits Privately
- `financier_budget_ceiling` (object, required): The hard budget limit and what drives it — ROI model, comparable projects, distribution deal structure.
- `financier_financial_risks_they_see` (object, required): What in the current budget concerns you — over-budget categories, schedule risk, contingency adequacy?
- `financier_recoupment_and_return_model` (object, required): How this project makes money — distribution windows, revenue projections, what the project needs to gross to recoup.
- `financier_creative_priorities` (string, required): What elements of the creative are most important to the audience and the commercial model?
- `financier_what_they_will_not_fund` (array, required): Budget categories, creative choices, or risks they will not accept.

## Outputs
- `budget_gap_analysis` (object): Where the current budget exceeds the financier's ceiling and what is driving the gap.
- `creative_viability_assessment` (object): Whether the project as conceived can be made within the budget — and what changes are required.
- `value_engineering_plan` (array): Specific budget reductions that preserve creative intent — alternative approaches, schedule changes, below-the-line efficiencies.
- `financial_risk_register` (array): Budget risks that could cause overrun and the mitigation for each.
- `budget_agreement_framework` (object): The agreed budget structure — above the line, below the line, contingency — that both parties can commit to.
- `recoupment_alignment` (object): Whether the project's commercial model supports the budget at the agreed level.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm producer's budget and financier's ceiling present.
**Output:** Readiness confirmation.
**Quality Gate:** Producer's budget breakdown and financier's ceiling both present.

---

### Phase 1: Assess Budget Gap and Creative Risk
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Calculate the gap between current budget and financier's ceiling — which categories are over. 2. Identify the producer's non-negotiables and assess whether they fit within the ceiling. 3. Check the financier's recoupment model against the budget — does the commercial model support this spend? 4. Assess the financier's financial risks against the producer's budget — are the concerns valid?
**Output:** Budget gap by category, non-negotiable fit assessment, commercial model check, risk validation.
**Quality Gate:** Gap is specific by line item — "above-the-line talent is $2M over; post-production VFX is $800K over."

---

### Phase 2: Build the Value Engineering Plan
**Entry Criteria:** Gap assessed.
**Actions:** 1. For each over-budget category, identify specific reductions that preserve creative intent. 2. Evaluate the producer's stated flexibility areas against the financier's priorities — what can be cut without hurting the commercial or creative case? 3. Model the budget at reduced levels to confirm the ceiling is achievable. 4. Identify what creative compromises are unavoidable and whether they are acceptable.
**Output:** Value engineering options by category, budget model at reduced level, unavoidable compromises.
**Quality Gate:** Every value engineering option is specific — not "reduce VFX" but "reduce VFX by $400K by using practical effects for X scenes."

---

### Phase 3: Build the Budget Agreement
**Entry Criteria:** Engineering plan built.
**Actions:** 1. Build the agreed budget structure — revised above the line, below the line, contingency, and total. 2. Define the budget risk management framework — what happens when a category is over, what the contingency covers. 3. Align on the commercial model and recoupment expectations. 4. Define what producer decisions require financier approval during production.
**Output:** Agreed budget, risk management framework, commercial model alignment, approval authorities.
**Quality Gate:** Budget is specific to the line item level. Contingency percentage is specific. Approval authorities are named.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Budget agreed.
**Actions:** 1. Present budget gap analysis. 2. Deliver creative viability assessment. 3. Deliver value engineering plan. 4. Deliver budget agreement framework. 5. Present financial risk register and recoupment alignment.
**Output:** Full synthesis — gap, creative viability, value engineering, budget framework, risks, commercial model.
**Quality Gate:** Both parties have a specific budget they can sign off on and a shared understanding of what is in it.

---

## Exit Criteria
Done when: (1) budget gap is identified by category, (2) value engineering plan closes the gap specifically, (3) creative non-negotiables are resolved, (4) commercial model supports the budget, (5) risk register is complete.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
