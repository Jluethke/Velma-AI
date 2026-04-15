# Pricing Strategy Alignment

**One-line description:** Product and finance each submit their real pricing constraints — competitive pressure, margin requirements, customer sensitivity — AI models the tradeoffs and produces a strategy both sides can defend to the board.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both product/revenue and finance leads must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_product_name` (string, required): Product or SKU being priced.
- `shared_current_pricing` (string, required): Current price and model.

### Product/Revenue Lead Submits Privately
- `product_market_positioning` (object, required): How is this product positioned vs. competitors? Premium, value, or parity?
- `product_competitive_pressure` (object, required): What pricing pressure exists from competitors? What are customers threatening?
- `product_proposed_pricing_direction` (object, required): What pricing change are you proposing and why?
- `product_customer_sensitivity_read` (object, required): How price-sensitive is the customer base? What would a price increase do to conversion or churn?
- `product_concerns_about_constraints` (array, required): What margin or revenue requirements worry you?

### Finance Lead Submits Privately
- `finance_margin_requirements` (object, required): What margin % does this product need to hit? What's the floor?
- `finance_revenue_targets` (object, required): What revenue contribution is expected from this product?
- `finance_concerns_about_proposal` (array, required): What about the product team's direction concerns you?
- `finance_flexibility` (object, required): Where is there flexibility in the margin or structure requirements?
- `finance_what_would_make_it_work` (string, required): What would need to be true for you to support the product team's direction?

## Outputs
- `margin_viability_assessment` (object): Whether the proposed pricing direction is viable given margin requirements.
- `competitive_position_check` (object): Whether the proposed pricing maintains the intended market position.
- `pricing_model_options` (array): 2-3 pricing model options — price point, packaging, or model changes — with revenue and margin implications.
- `revenue_impact_model` (object): Modeled impact of each option on revenue and margin.
- `negotiated_pricing_strategy` (object): A recommended pricing strategy both sides can commit to.
- `implementation_risks` (array): Customer reaction, competitive response, margin exposure risks.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm margin requirements and proposed pricing direction present.
**Output:** Readiness confirmation.
**Quality Gate:** Margin floor and pricing direction both present.

---

### Phase 1: Assess Margin Viability
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Check proposed pricing direction against margin floor. Is it viable at all? 2. Identify the gap if not viable. 3. Assess customer sensitivity against the proposed change. 4. Check competitive positioning implications.
**Output:** Margin viability, sensitivity assessment, competitive position check.
**Quality Gate:** Margin viability stated in specific numbers.

---

### Phase 2: Build Pricing Options
**Entry Criteria:** Viability assessed.
**Actions:** 1. Design 2-3 options that bridge product's competitive needs and finance's margin requirements. 2. For each option, model revenue and margin impact. 3. Assess implementation complexity and timing.
**Output:** 3 pricing options with revenue/margin models.
**Quality Gate:** Each option is viable on both dimensions (competitive position and margin).

---

### Phase 3: Recommend
**Entry Criteria:** Options built.
**Actions:** 1. Recommend the option that best serves both sides given the company context. 2. Draft implementation risks. 3. Draft the board-level rationale.
**Output:** Recommendation, implementation risks, board rationale.
**Quality Gate:** Recommendation is specific. Board rationale is defensible.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Recommendation made.
**Actions:** 1. Present margin viability. 2. Present competitive position check. 3. Deliver pricing options with models. 4. Deliver recommendation. 5. List implementation risks.
**Output:** Full synthesis — viability, competitive check, options, recommendation, risks.
**Quality Gate:** Both sides can present this to the board with confidence.

---

## Exit Criteria
Done when: (1) margin viability stated with numbers, (2) 3 pricing options with revenue/margin models, (3) recommendation with board rationale, (4) implementation risks named.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
