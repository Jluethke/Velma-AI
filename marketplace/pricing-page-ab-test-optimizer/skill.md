# Pricing Page A/B Test Optimizer

**One-line description:** Analyze a pricing page and generate psychology-backed A/B test variations targeting anchoring effects, tier optimization, and conversion lift.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `pricing_page_url` (string, optional) — URL of the live pricing page to analyze. If not provided, use `pricing_page_screenshot` or `pricing_page_description`.
- `pricing_page_screenshot` (string, optional) — Base64-encoded image or file path of pricing page screenshot.
- `pricing_page_description` (string, optional) — Text description of current pricing structure. Format: tier names separated by semicolons, prices in order, features per tier as comma-separated lists. Example: "Starter;$29;Feature A, Feature B | Pro;$99;Feature A, Feature B, Feature C".
- `current_tiers` (array of objects, optional) — Structured data: `[{"name": string, "price": number, "features": string[], "position": string}]`.
- `current_prices` (array of numbers, optional) — List of current price points in order.
- `competitor_prices` (array of numbers, optional) — Competitor price points for benchmarking.
- `customer_segment_data` (object, optional) — Known customer segments: `{"segment_name": {"size": number, "avg_willingness_to_pay": number, "feature_priorities": string[]}}`.
- `business_goal` (string, optional) — Primary objective: "maximize_conversion", "increase_average_order_value", "improve_tier_distribution", or "reduce_churn_to_higher_tiers". Default: "maximize_conversion".
- `constraints` (object, optional) — Business constraints: `{"min_price": number, "max_price": number, "min_tiers": number, "max_tiers": number, "locked_features": string[]}`.

---

## Outputs

- `current_state_analysis` (object) — Audit of existing pricing page:
  - `tiers` (array) — Current tier structure with names, prices, features, visual prominence.
  - `pricing_model` (string) — Identified model (per-seat, per-month, tiered, usage-based, hybrid).
  - `visual_notes` (string) — Description of visual design, emphasis, and CTA placement per tier.
  - `detected_psychology_principles` (array of objects) — Principles currently in use with specific evidence:
    - `principle` (string) — Name of principle (e.g., "charm pricing").
    - `evidence` (string) — Specific observation from the pricing page.
  - `gaps_and_issues` (array of strings) — Identified weaknesses or missing opportunities.

- `optimization_opportunities` (array of objects) — Extracted opportunities:
  - `opportunity_id` (string) — Unique identifier (e.g., "OPP-1").
  - `category` (string) — "anchoring", "tier_gap", "feature_alignment", "visual_hierarchy", or "psychology_gap".
  - `description` (string) — What is suboptimal and why it matters.
  - `impact_potential` (string) — "high", "medium", or "low".
  - `affected_metric` (string) — Which business metric this opportunity targets (conversion_rate, average_order_value, tier_distribution, customer_lifetime_value).

- `ab_test_variations` (array of objects) — Generated test variations:
  - `variation_id` (string) — Unique identifier (e.g., "V1", "V2").
  - `name` (string) — Descriptive name (e.g., "Decoy Tier with Anchoring").
  - `hypothesis` (string) — Testable prediction: "If we [change X], then [expected outcome] because [psychology mechanism]."
  - `changes` (array of objects) — Specific modifications:
    - `element` (string) — What changed (e.g., "price", "tier_name", "feature_list", "visual_prominence", "cta_text").
    - `from` (string) — Current value.
    - `to` (string) — Proposed value.
  - `psychology_mechanisms` (array of strings) — Principles leveraged (e.g., "anchoring", "decoy_effect", "social_proof").
  - `predicted_impact` (object) — Expected outcomes:
    - `metric` (string) — "conversion_rate", "average_order_value", "tier_distribution", or "customer_lifetime_value".
    - `direction` (string) — "increase" or "decrease".
    - `confidence` (string) — "high" (80%+ confidence), "medium" (50-79%), or "low" (<50%).
    - `estimated_lift` (string) — Expected magnitude (e.g., "+5-10%", "+15-25%", "+2-3%").
  - `risk_level` (string) — "low" (incremental change, minimal downside), "medium" (moderate change, manageable risk), or "high" (bold change, potential for negative impact).
  - `risk_mitigation` (string) — Specific strategy to reduce downside (e.g., "Test with 10% of traffic first", "Monitor churn daily", "Have rollback plan ready").
  - `implementation_notes` (string) — Practical guidance for deployment (technical requirements, timeline, dependencies).

- `recommendation_priority` (array of objects) — Variations ranked by expected impact and feasibility:
  - `rank` (number) — Priority order (1 = highest).
  - `variation_id` (string) — ID of the variation.
  - `rationale` (string) — Why this variation ranks at this priority (e.g., "High impact on AOV + low risk + quick to implement").

- `success_metrics` (array of objects) — How to measure test success:
  - `metric_name` (string) — Name of metric (e.g., "Conversion Rate", "Average Order Value").
  - `baseline` (number or string) — Current performance (e.g., 2.5%, $150).
  - `target` (number or string) — Success threshold (e.g., 2.75%, $165).
  - `measurement_method` (string) — How to collect data (e.g., "Track via Google Analytics, segment by pricing page variant").
  - `test_duration` (string) — Recommended duration (e.g., "2 weeks or until 1000 conversions per variant").

---

## Execution Phases

### Phase 1: Audit Current Pricing Page

**Entry Criteria:**
- At least one of `pricing_page_url`, `pricing_page_screenshot`, `pricing_page_description`, or `current_tiers` is provided.

**Actions:**
1. Retrieve or parse the pricing page from the provided input.
2. Document the current state with the following structure:
   - Tier names, prices, and feature lists (in order of presentation).
   - Visual hierarchy: identify which tier is emphasized (color, size, position, badges like "Most Popular").
   - Call-to-action text and placement per tier (e.g., "Start Free Trial", "Contact Sales").
   - Any visible pricing psychology tactics (e.g., "Most Popular" badge, strikethrough prices, limited-time offers, urgency language).
3. Identify the pricing model: per-seat, per-month, tiered, usage-based, hybrid, or custom.
4. Note any unusual or domain-specific pricing elements (e.g., annual discount, volume pricing, add-ons).

**Output:**
- `current_state_analysis.tiers` (array of tier objects with: name, price, features, visual_prominence, cta_text).
- `current_state_analysis.pricing_model` (string).
- `current_state_analysis.visual_notes` (string, minimum 50 characters) — Description of visual design, emphasis, and CTA placement. Example: "Middle tier 'Pro' is highlighted in blue with 'Most Popular' badge. Positioned center. CTA is green 'Start Free Trial' button. Top tier 'Enterprise' has gray background, positioned right, CTA is 'Contact Sales' link."

**Quality Gate:**
- All tiers are documented with name, price, and feature list (minimum 1 feature per tier).
- Visual hierarchy is explicitly noted with at least: which tier is highlighted, color scheme, size/prominence, and CTA placement per tier.
- Pricing model is identified and matches one of the standard categories.
- No ambiguity about current pricing structure (a third party could reconstruct the pricing page from this output).

---

### Phase 2: Identify Pricing Psychology Principles in Use

**Entry Criteria:**
- Current state analysis is complete.

**Actions:**
1. Review the current pricing page against the following checklist of pricing psychology principles:
   - **Charm Pricing:** Prices ending in .99, .95, or .97 (e.g., $29.99 vs. $30).
   - **Anchoring:** A high reference price or tier that makes others seem cheaper.
   - **Decoy Effect:** A middle tier designed to make the highest tier more attractive.
   - **Social Proof:** "Most Popular", "Trusted by X customers", star ratings, testimonials.
   - **Scarcity/Urgency:** "Limited seats", "Offer expires", countdown timers.
   - **Price Bundling:** Grouping features to increase perceived value.
   - **Tiered Pricing:** Multiple options to serve different segments.
   - **Free Tier/Trial:** Lower barrier to entry.
   - **Prestige Pricing:** Higher price signals quality or exclusivity.
2. For each principle detected, record specific evidence from the pricing page (e.g., "Charm pricing: all prices end in .99").
3. For each principle NOT detected, note it as a missing opportunity.

**Output:**
- `current_state_analysis.detected_psychology_principles` (array of objects with principle name and evidence).
- `current_state_analysis.gaps_and_issues` (array of strings listing missing principles and other weaknesses).

**Quality Gate:**
- At least 8 principles are evaluated (all in the checklist).
- Each detected principle has specific, quoted evidence from the pricing page.
- At least 2 missing principles are explicitly listed as opportunities.
- No principle is marked as "detected" without evidence.

---

### Phase 3: Extract Anchoring and Tier Optimization Opportunities

**Entry Criteria:**
- Current state analysis and psychology principles are documented.
- Optional: `competitor_prices` and `customer_segment_data` are available.

**Actions:**
1. Analyze anchoring effectiveness:
   - Identify the highest-priced tier. Is it positioned as an anchor (reference point) or as a viable option?
   - Compare the anchor price to competitor prices (if available). Is it competitive or extreme?
   - Assess whether the anchor price is justified by features or feels arbitrary.
2. Analyze tier distribution and gaps:
   - Calculate price ratios between consecutive tiers (e.g., $29 to $99 = 3.4x).
   - Identify price gaps: ratios >3x suggest a gap; ratios <1.5x suggest tiers are too similar.
   - Note which tier likely has the highest adoption (if known from customer data or industry patterns).
3. Analyze feature-to-price alignment:
   - For each tier, list the unique features (features not in lower tiers).
   - Assess whether high-value features are positioned in the right tier (not too low, not too high).
   - Identify features that could be moved to unlock higher-tier adoption.
4. Identify underutilized tiers:
   - Which tier has the lowest adoption or appeal? Why? (e.g., "Middle tier has same features as lower tier but costs 3x more").
   - Could repositioning, renaming, or feature rebalancing improve it?
5. If customer segment data is provided, compare each segment's willingness-to-pay and feature priorities to tier pricing and features:
   - Does each segment have a tier that matches their budget and needs?
   - Are any segments underserved (no tier in their price range or with their feature priorities)?

**Output:**
- `optimization_opportunities` (array of at least 3 objects, each with: opportunity_id, category, description, impact_potential, affected_metric).

**Quality Gate:**
- At least 3 opportunities are identified.
- Each opportunity is specific and actionable (not vague like "improve pricing"). Example: "Tier 2 ($99) has same features as Tier 1 ($29), making it unattractive. Recommend moving Feature X to Tier 2 to justify the price increase."
- Each opportunity is categorized (anchoring, tier_gap, feature_alignment, visual_hierarchy, or psychology_gap).
- Each opportunity specifies which business metric it targets (conversion_rate, average_order_value, tier_distribution, customer_lifetime_value).
- Opportunities are ranked by impact_potential (high, medium, low).

---

### Phase 4: Generate A/B Test Variation Hypotheses

**Entry Criteria:**
- Optimization opportunities are identified.
- `business_goal` is defined (or default to "maximize_conversion").

**Actions:**
1. For each high-impact opportunity, design 1-2 A/B test variations that address it.
2. For each variation, define:
   - **Hypothesis:** Use the template: "If we [change X], then [expected outcome] because [psychology mechanism]." Example: "If we add a 'Decoy' tier priced at $79 (between $29 and $199), then more customers will choose the $199 tier because the decoy makes it seem like better value (decoy effect)."
   - **Changes:** List specific, concrete modifications (price, tier name, features, visual treatment, copy). Each change should be a single element (not bundled).
   - **Psychology Mechanisms:** List which principles are leveraged (anchoring, decoy_effect, social_proof, charm_pricing, scarcity, bundling, prestige_pricing, free_tier).
   - **Predicted Impact:** Specify which metric improves (conversion_rate, average_order_value, tier_distribution, customer_lifetime_value), direction (increase/decrease), confidence level (high/medium/low), and estimated lift (e.g., "+5-10%").
3. Ensure variations are diverse: aim for a mix of anchoring, decoy, feature rebalancing, visual, and copy changes. No more than 2 variations should target the same psychology mechanism.
4. Generate 3-5 variations total to keep testing manageable.
5. Assign each variation a unique ID (V1, V2, etc.) and a descriptive name.

**Output:**
- `ab_test_variations` (array of 3-5 variation objects with hypothesis, changes, mechanisms, predicted_impact).

**Quality Gate:**
- Each variation has a clear, testable hypothesis using the "If...then...because" template.
- Each variation changes at least 1 element and at most 4 elements (to isolate impact).
- Predicted impacts are tied to specific metrics and psychology mechanisms.
- Variations are diverse: at least 2 different psychology mechanisms are represented across all variations.
- No two variations are identical or near-identical in approach.
- All variations address at least one identified opportunity.

---

### Phase 5: Validate Variations Against Best Practices and Constraints

**Entry Criteria:**
- A/B test variations are generated.
- `constraints` (if provided) are known.

**Actions:**
1. For each variation, validate against pricing psychology best practices:
   - **Price Coherence:** Do prices feel logical and justified? Avoid prices that seem random. Example: $29, $99, $199 is coherent; $29, $87, $201 is not.
   - **Tier Clarity:** Can a customer quickly understand which tier is for them? Tier names should be benefit-driven ("Starter", "Professional", "Enterprise") not generic ("Plan A", "Plan B").
   - **Feature Justification:** Does each tier's feature set justify its price relative to others? Use the rule: each tier should have 2-4 unique features not in lower tiers.
   - **Anchor Strength:** If using anchoring, is the anchor price credible and not extreme? Anchor should be 2-3x the mid-tier price, not 10x.
   - **Decoy Viability:** If using a decoy tier, is it positioned to make the intended tier more attractive without cannibalizing it? Decoy should be inferior to the target tier on at least one important dimension.
2. Check against business constraints (if provided):
   - Does the variation respect `min_price`, `max_price`, `min_tiers`, `max_tiers`?
   - Are any `locked_features` (features that must remain in specific tiers) preserved?
   - If a constraint is violated, flag it and either adjust the variation or remove it.
3. Assess risk for each variation:
   - **Low Risk:** Incremental change (e.g., charm pricing, visual emphasis, copy change). Minimal downside.
   - **Medium Risk:** Moderate change (e.g., feature rebalancing, price adjustment within 10%). Manageable risk.
   - **High Risk:** Bold change (e.g., adding/removing a tier, price increase >20%). Potential for negative impact (churn, confusion, lost sales).
4. For each variation, draft risk mitigation strategy:
   - Low-risk variations: "Monitor conversion rate daily; no special mitigation needed."
   - Medium-risk variations: "Test with 25% of traffic first; monitor tier distribution and churn."
   - High-risk variations: "Test with 10% of traffic first; have rollback plan ready; monitor churn and customer support volume daily."
5. Add implementation notes:
   - What technical or operational changes are needed? (e.g., "Update pricing page HTML", "Notify sales team of new tier names")
   - How long will the test run? (e.g., "2 weeks or until 1000 conversions per variant")
   - Are there any dependencies or prerequisites? (e.g., "Requires analytics tracking update")

**Output:**
- Update `ab_test_variations` with `risk_level`, `risk_mitigation`, and `implementation_notes` for each variation.
- Flag any variations that fail validation (e.g., violate constraints) with a note explaining the violation and recommended action.

**Quality Gate:**
- All variations are checked against all 5 best practices (price coherence, tier clarity, feature justification, anchor strength, decoy viability).
- Risk levels are justified with specific reasoning (not arbitrary).
- Risk mitigation strategies are concrete and actionable (not vague like "monitor closely").
- Implementation notes specify technical requirements, timeline, and dependencies.
- Constraints are respected, or violations are explicitly noted with justification (e.g., "Violates max_price constraint but expected ROI justifies exception").
- At least one variation is low-risk (to ensure a safe baseline test).

---

### Phase 6: Produce Recommendation Report

**Entry Criteria:**
- All variations are validated.
- Success metrics are defined.

**Actions:**
1. Rank variations by expected impact and feasibility:
   - High impact + low risk = Rank 1 (highest priority).
   - High impact + medium risk = Rank 2.
   - Medium impact + low risk = Rank 2.
   - High impact + high risk = Rank 3 (consider testing in parallel with lower-risk options).
   - Medium impact + medium risk = Rank 3.
   - Low impact or high risk + low impact = Rank 4 (lower priority).
   - For each ranking, provide specific rationale (e.g., "High impact on AOV + low risk + quick to implement").
2. Define success metrics for each variation:
   - Primary metric (the metric most directly affected by the variation).
   - Baseline (current performance, e.g., "2.5% conversion rate").
   - Target (success threshold, e.g., "2.75% conversion rate", representing a 10% lift).
   - Measurement method (e.g., "Track via Google Analytics, segment by pricing page variant").
   - Test duration (e.g., "2 weeks or until 1000 conversions per variant").
3. Assemble the recommendation report with:
   - Executive summary (current state, key findings, top 1-2 recommendations).
   - Detailed analysis of current pricing (strengths, weaknesses, psychology principles in use).
   - Variation details (one section per variation) with hypothesis, changes, rationale, success metrics, and implementation guidance.
   - Implementation roadmap (which variations to test first, timeline, dependencies, resource requirements).
   - Caveats and assumptions (e.g., "Assumes customer segment data is accurate", "Decoy tier assumes feature parity with middle tier", "Test assumes no major product changes during test period").
4. Add post-test guidance:
   - How to interpret results (e.g., "Variation wins if primary metric meets target AND secondary metrics don't regress").
   - How to scale winning variation (e.g., "Roll out to 100% of traffic over 1 week").
   - How to iterate (e.g., "Use winning variation as baseline for next round of optimization").

**Output:**
- `recommendation_priority` (array of objects with rank, variation_id, and rationale).
- `success_metrics` (array of metric objects with metric_name, baseline, target, measurement_method, test_duration).
- Full recommendation report (as structured output or markdown, minimum 500 characters).

**Quality Gate:**
- Variations are ranked with clear, specific justification (not subjective).
- Success metrics are specific and measurable (not vague like "improve conversion"). Each metric has a baseline and target.
- Report is actionable: a product manager could implement it without further clarification.
- All identified opportunities are addressed by at least one variation.
- At least 3 caveats or assumptions are documented.
- Post-test guidance is included (how to interpret, scale, and iterate).

---

## Exit Criteria

The skill is complete when:
1. Current pricing page is fully audited and documented with tier structure, visual hierarchy, and CTA placement.
2. At least 8 pricing psychology principles are evaluated (all in the reference checklist).
3. At least 3 optimization opportunities are identified, each with specific description and impact potential.
4. 3-5 distinct A/B test variations are generated, each with a clear hypothesis, changes, psychology mechanisms, and predicted impact.
5. All variations are validated against best practices and constraints, with risk levels and mitigation strategies assigned.
6. Variations are ranked by priority with specific rationale.
7. Success metrics are defined for each variation with baseline, target, measurement method, and test duration.
8. A recommendation report is produced that includes: current state analysis, variation details, implementation roadmap, and post-test guidance.
9. A reader unfamiliar with the original pricing page could understand the current state, the proposed changes, why each change is expected to improve the business goal, and how to implement and measure success.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Pricing page is not accessible or description is too vague (missing tier names, prices, or features) | **Adjust** — Ask for more detail: "Please provide tier names, prices, features per tier, and visual design (which tier is highlighted, colors, CTA text)." Proceed with structured input if available. |
| Phase 1 | Pricing page has no clear tiers (e.g., custom pricing only, no standard plans) | **Adjust** — Document the current model and generate variations for introducing tiered pricing as an option. Note in report: "Current model is custom pricing; variations assume introduction of standard tiers." |
| Phase 2 | No psychology principles are detected in current pricing | **Adjust** — This is an opportunity, not a failure. Note that the current pricing is "psychology-neutral" and generate variations that introduce tactics. Prioritize variations that add social proof, charm pricing, or anchoring. |
| Phase 3 | Competitor data or customer segment data is unavailable | **Adjust** — Proceed with internal analysis only. Note assumptions in the report (e.g., "Assumes middle tier is the most popular based on typical SaaS patterns"). Recommend conducting competitive research or customer research before finalizing recommendations. |
| Phase 4 | Generated variations are too similar or all target the same psychology mechanism | **Adjust** — Regenerate to ensure diversity. Aim for mix of anchoring, decoy, feature rebalancing, visual, and copy changes. Ensure at least 2 different psychology mechanisms are represented. |
| Phase 5 | A variation violates a hard constraint (e.g., min_price or max_price) | **Abort** — Remove the variation or adjust it to comply with constraints. Flag in the report with explanation (e.g., "V3 violates max_price constraint; recommend removing or adjusting price down by $X"). |
| Phase 5 | All variations are high-risk | **Adjust** — Add at least one low-risk, incremental variation (e.g., charm pricing, visual emphasis, copy change, or feature reordering). Ensure at least 1 variation is low-risk to provide a safe baseline test. |
| Phase 6 | Cannot define measurable success metrics (e.g., conversion rate is not tracked) | **Adjust** — Use proxy metrics (e.g., "Tier selection rate" if conversion rate is not tracked, or "Customer support inquiries about pricing" as a proxy for confusion). Document the limitation in the report and recommend implementing proper tracking before test. |
| Phase 6 | Variations are ranked but no clear winner emerges (e.g., multiple variations have same priority) | **Adjust** — Break ties using secondary criteria: (1) implementation ease, (2) speed to test, (3) reversibility (easier to rollback). Document the tiebreaker logic in the report. |
| Phase 6 | User rejects final output | **Targeted revision** -- ask which variation, psychology principle, or success metric fell short and rerun only that section. Do not regenerate all variations. |

---

## Reference: Pricing Psychology Principles

### Anchoring
- A high reference price makes lower prices seem more attractive.
- Example: "Was $299, now $99" or a premium tier at $999 makes $99 tier seem like a bargain.
- Best for: Increasing perceived value of mid-tier options.

### Decoy Effect (Asymmetric Dominance)
- A third option (decoy) is designed to be inferior to one option but similar to it, making that option more attractive.
- Example: Tier A ($29, basic), Tier B ($99, premium), Tier C ($79, almost as good as B but cheaper) — Tier C makes Tier B look like better value.
- Best for: Shifting customers from lower to higher tiers without raising prices.

### Charm Pricing
- Prices ending in .99, .95, or .97 feel cheaper than round numbers.
- Example: $29.99 feels significantly cheaper than $30, even though the difference is $0.01.
- Best for: Increasing conversion on price-sensitive segments.

### Social Proof
- "Most Popular", "Trusted by 10,000+ companies", star ratings, testimonials.
- Reduces decision anxiety and signals that the choice is validated by others.
- Best for: Guiding customers toward the intended tier.

### Scarcity and Urgency
- "Limited seats available", "Offer expires in 3 days", countdown timers.
- Creates fear of missing out (FOMO) and accelerates decision-making.
- Best for: Increasing conversion rate in the short term (use cautiously to avoid eroding trust).

### Price Bundling
- Grouping features together and pricing the bundle lower than the sum of parts.
- Increases perceived value and simplifies choice.
- Best for: Justifying higher prices and reducing feature-by-feature comparison.

### Prestige Pricing
- Higher prices signal quality, exclusivity, or premium positioning.
- Works when brand and product quality support the premium positioning.
- Best for: Luxury or high-end products; can backfire if not credible.

### Free Tier or Trial
- Removes barrier to entry and allows customers to experience value before paying.
- Best for: Reducing adoption friction and building trust.

---

## Reference: Tier Design Heuristics

1. **The Rule of Three:** Three tiers is the sweet spot. Two feels limiting; four or more creates decision paralysis.
2. **The Goldilocks Principle:** Price the middle tier to be the most attractive (best value for features). Price the top tier as a premium option for power users. Price the bottom tier as an entry point.
3. **Feature Progression:** Features should scale logically across tiers. Avoid putting a high-value feature in a low tier (it cannibalizes higher tiers) or a low-value feature in a high tier (it feels like a ripoff).
4. **Price Ratios:** Typical ratios between tiers are 2-3x. Example: $29, $79, $199 (roughly 2.7x jumps). Larger jumps (>3x) can create gaps; smaller jumps (<1.5x) can feel arbitrary.
5. **Anchor Tier:** The highest tier should be priced to anchor perception, not necessarily to be popular. It can be a "prestige" option that few buy but many use as a reference point. Anchor should be 2-3x the mid-tier price.
6. **Tier Naming:** Use clear, benefit-driven names ("Starter", "Professional", "Enterprise") rather than generic names ("Plan A", "Plan B") or confusing names ("Silver", "Gold" — which is better?).

---

## State Persistence (Optional)

If this skill is run multiple times on the same pricing page, consider tracking:
- **Test History:** Which variations were tested, when, and with what results. Use this to avoid redundant tests and to build a knowledge base of what works for this product.
- **Winning Variations:** If a variation was tested and won, document the winner and use it as the baseline for the next round of optimization.
- **Customer Feedback:** If available, track qualitative feedback on pricing (e.g., "Customers found the middle tier confusing"). Use this to inform future variations.
- **Iteration Log:** Document the sequence of pricing changes over time to identify patterns and avoid reverting to previously tested (and failed) approaches.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.