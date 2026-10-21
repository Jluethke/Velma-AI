# Pricing Optimizer

**One-line description:** Process business_goal, competitor_prices, constraints to produce ab_test_variations, current_state_analysis, optimization_opportunities.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `business_goal` (string, required): Input for business goal.
- `competitor_prices` (string, required): Input for competitor prices.
- `constraints` (string, required): Input for constraints.
- `current_prices` (string, required): Input for current prices.
- `current_tiers` (string, required): Input for current tiers.
- `customer_segment_data` (string, required): Input for customer segment data.
- `pricing_page_description` (string, required): Input for pricing page description.
- `pricing_page_screenshot` (string, required): Input for pricing page screenshot.
- `pricing_page_url` (string, required): Input for pricing page url.

---

## Outputs

- `ab_test_variations` (object): Ab Test Variations.
- `current_state_analysis` (object): Current State Analysis.
- `optimization_opportunities` (object): Optimization Opportunities.
- `recommendation_priority` (object): Recommendation Priority.
- `success_metrics` (object): Success Metrics.

---

## Worked Example

### Entry Criteria

All required inputs are provided and validated.

### Actions

## Phase 1: Analyze

Examine the provided inputs and extract key information.

### Quality Gate

All inputs parsed. No missing required fields.

### Actions

## Phase 2: Process

Apply domain logic to transform inputs into structured outputs.

### Quality Gate

All outputs populated. No empty required fields.

### Output

Return the structured result containing `ab_test_variations`, `current_state_analysis`, `optimization_opportunities`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
