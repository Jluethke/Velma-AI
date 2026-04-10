# Side Hustle Financial Modeler

**One-line description:** Transform a side hustle idea into a comprehensive financial model with market validation, startup costs, break-even analysis, 12-month projections, and three-scenario planning (best/worst/likely case).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `idea_description` (string, required): Plain-English description of the side hustle concept, including what you're selling/offering and to whom.
- `target_market` (string, required): Who are your customers? (e.g., "freelance designers," "busy parents," "small businesses"). Must be specific (not "everyone").
- `revenue_model` (string, required): How do you make money? Must be quantified (e.g., "$50 per unit sold," "$15/hour consulting," "$99/month subscription"). Not "charge what the market will bear."
- `known_startup_costs` (object, optional): Any costs you already know (e.g., `{"equipment": 500, "software_license": 100}`). Defaults to empty; skill will elicit unknowns.
- `known_monthly_costs` (object, optional): Any recurring costs you know (e.g., `{"platform_fee": 30, "materials_per_unit": 5}`). Defaults to empty.
- `available_hours_per_week` (number, optional): How many hours/week can you dedicate to this side hustle? Defaults to 10. Used to validate feasibility of projected unit volume.
- `projection_months` (number, optional): How many months to project. Defaults to 12.
- `growth_assumption_base` (number, optional): Expected monthly unit growth rate for base case (0.0 to 1.0). Defaults to 0.10 (10%). Must be between 0.0 and 0.30.

---

## Outputs

- `idea_summary` (object): Validated idea with scope, target market, revenue model, and business type. Fields: {idea, target_market, revenue_model, business_type, constraints}.
- `market_validation` (object): Evidence of customer demand. Fields: {validation_method, findings, confidence_level (high/medium/low), risk_flag (true/false)}.
- `startup_costs_breakdown` (object): Itemized startup costs by category with totals. Fields: {equipment, software_licenses, inventory, branding, legal, marketing, contingency, total_startup_cost}.
- `monthly_costs_breakdown` (object): Fixed and variable monthly costs by category. Fields: {fixed_costs: {category: amount}, variable_cost_per_unit, estimated_monthly_units, total_monthly_cost}.
- `break_even_analysis` (object): Break-even units/month, break-even months, cash runway, and funding requirement. Fields: {unit_contribution_margin, break_even_units_per_month, break_even_revenue_per_month, break_even_months, cash_runway_months, funding_required, achievable}.
- `time_commitment_validation` (object): Cross-check of projected unit volume against available hours. Fields: {available_hours_per_week, hours_per_unit, projected_hours_needed_month_6, feasible, flag}.
- `base_case_projection` (array of objects): Month-by-month P&L (revenue, costs, net profit, cumulative cash).
- `best_case_projection` (array of objects): Optimistic scenario month-by-month P&L.
- `worst_case_projection` (array of objects): Pessimistic scenario month-by-month P&L.
- `scenario_comparison` (object): Side-by-side summary of all three scenarios. Fields: {base_case: {profitability_month, month_12_net_profit, cash_runway}, best_case: {...}, worst_case: {...}}.
- `sensitivity_analysis` (object): Key drivers and their impact on profitability. Fields: {price_sensitivity: {plus_10_percent, minus_10_percent}, volume_sensitivity: {plus_20_percent, minus_20_percent}, cost_sensitivity: {plus_15_percent, minus_15_percent}, top_3_drivers: []}.
- `assumption_log` (array of objects): All assumptions made during modeling. Fields: [{assumption, rationale, confidence_level (high/medium/low), validation_needed}].
- `critical_success_factors` (array of strings): What must go right for this side hustle to succeed.
- `recommendation` (object): Go/No-Go/Conditional with rationale and next steps. Fields: {decision, rationale, next_steps: []}.

---

## Execution Phases

### Phase 1: Idea Validation & Scope Definition

**Entry Criteria:**
- `idea_description`, `target_market`, and `revenue_model` are provided and meet specificity requirements.

**Actions:**
1. Parse the idea description and extract: product/service type, unique value proposition, target customer segment.
2. Validate the revenue model: confirm it is quantified (price per unit, hourly rate, or subscription amount). If not, request a specific price point.
3. Validate the target market: confirm it is specific (not "everyone"). If too broad, request a narrower segment.
4. Identify the business type (product, service, digital, physical, hybrid) to inform cost assumptions.
5. Document any implicit constraints (e.g., "I can only work 10 hours/week," "I have $2,000 to invest").
6. Flag any red flags: idea is too similar to existing products, market is saturated, or revenue model is unrealistic for the market.

**Output:**
- `idea_summary`: {idea, target_market, revenue_model, business_type, constraints, red_flags}

**Quality Gate:**
- Idea description is specific (not "make money online" or "sell stuff"). Verified by: idea includes product/service type AND target customer AND value proposition.
- Revenue model is quantified (price per unit or per time period is specified as a number). Verified by: revenue_model contains a dollar amount or hourly rate.
- Target market is defined (not "everyone"). Verified by: target_market is a specific customer segment (e.g., "busy parents with kids under 5", not "parents").

---

### Phase 2: Market Validation

**Entry Criteria:**
- `idea_summary` is complete.

**Actions:**
1. Assess the validation method: has the user conducted customer interviews, surveys, pre-sales, or waitlist signups? Or is this a new idea with no validation yet?
2. If validation exists: document the findings (e.g., "5 customers pre-ordered at $50; 20 people signed up for waitlist"). Assign confidence level (high/medium/low).
3. If no validation exists: recommend a validation method for the business type (e.g., for product: "conduct 5 customer interviews; ask: would you buy this at $50?"; for service: "post on relevant forums/communities and gauge interest").
4. Flag risk: if confidence is low or no validation has been done, mark risk_flag = true and note in recommendation.
5. Document the assumption: "Assume customer demand exists at the proposed price point." Confidence level = confidence from validation (or "low" if no validation done).

**Output:**
- `market_validation`: {validation_method, findings, confidence_level, risk_flag, recommendation_if_unvalidated}

**Quality Gate:**
- Validation method is documented (even if it's "no validation done yet"). Verified by: validation_method field is not empty.
- Confidence level is assigned (high/medium/low). Verified by: confidence_level field is one of the three values.
- Risk flag is set if confidence is low or no validation exists. Verified by: risk_flag = true when confidence_level = "low" or validation_method = "none".

---

### Phase 3: Startup Costs Identification

**Entry Criteria:**
- `idea_summary` and `market_validation` are complete.
- `known_startup_costs` (if provided) are available.

**Actions:**
1. For the business type identified in Phase 1, enumerate typical startup cost categories: equipment/tools, software/licenses, initial inventory, branding/website, legal/registration, marketing launch, contingency (10% buffer).
2. For each category, estimate the cost based on the idea scope. Use industry benchmarks from the Reference Section if available.
3. If `known_startup_costs` are provided, use them; otherwise, apply reasonable defaults for the business type.
4. Sum all costs and flag any category that exceeds 30% of total startup investment (concentration risk).
5. Document the assumption: "Startup costs estimated using [benchmark/user input/industry average]." Confidence level = high (if user provided) or medium (if estimated).

**Output:**
- `startup_costs_breakdown`: {equipment, software_licenses, inventory, branding, legal, marketing, contingency, total_startup_cost, concentration_risk_flags}

**Quality Gate:**
- All major cost categories are represented (no "other: TBD"). Verified by: every category has a numeric value, not null or "TBD".
- Total startup cost is realistic for the business type. Verified by: total_startup_cost falls within the benchmark range for the business_type (e.g., $500-$5,000 for product-based).
- Concentration risk is flagged if any category exceeds 30% of total. Verified by: concentration_risk_flags array is populated if any category > 30% of total.

---

### Phase 4: Monthly Operating Costs & Revenue Model Refinement

**Entry Criteria:**
- `idea_summary`, `market_validation`, and `startup_costs_breakdown` are complete.
- `known_monthly_costs` (if provided) are available.

**Actions:**
1. Separate monthly costs into fixed (rent, software subscriptions, insurance) and variable (COGS, payment processing fees, shipping).
2. For each variable cost, calculate the per-unit cost based on the revenue model (e.g., if selling a $50 product with $15 COGS, variable cost per unit is $15).
3. Verify unit economics: confirm that variable cost per unit < price per unit. If not, the business model is not viable; abort and recommend increasing price or reducing COGS.
4. Estimate the monthly unit volume for the base case. Use a conservative assumption (e.g., 5-10 units/month for a new side hustle) unless the user provides data or market validation supports higher volume.
5. Calculate total monthly operating cost = fixed costs + (variable cost per unit × estimated units).
6. If `known_monthly_costs` are provided, use them; otherwise, apply defaults from the Reference Section.
7. Document assumptions: "Estimated monthly units = X (conservative assumption for new side hustle)" and "Variable cost per unit = $Y (based on [COGS/supplier quotes/industry average])."

**Output:**
- `monthly_costs_breakdown`: {fixed_costs: {category: amount, ...}, variable_cost_per_unit, estimated_monthly_units, total_monthly_cost}
- `revenue_model_refined`: {price_per_unit, estimated_monthly_units, monthly_revenue, unit_contribution_margin}

**Quality Gate:**
- Fixed and variable costs are separated. Verified by: fixed_costs is an object with categories, and variable_cost_per_unit is a numeric value.
- Variable cost per unit is less than price per unit (positive unit margin). Verified by: unit_contribution_margin = price_per_unit - variable_cost_per_unit > 0.
- Monthly revenue estimate is realistic (not 1,000 units/month for a brand-new side hustle). Verified by: estimated_monthly_units is <= 50 for month 1 (or justified by market validation).

---

### Phase 5: Break-Even Analysis & Funding Requirement

**Entry Criteria:**
- `startup_costs_breakdown`, `monthly_costs_breakdown`, and `revenue_model_refined` are complete.

**Actions:**
1. Calculate unit contribution margin: price per unit − variable cost per unit.
2. Calculate break-even units per month: fixed monthly costs ÷ unit contribution margin. Round up to nearest whole unit.
3. Calculate break-even revenue per month: break-even units × price per unit.
4. Calculate break-even months: total startup cost ÷ (monthly revenue − total monthly operating cost). If monthly profit is negative or zero, note "break-even not achievable with current assumptions."
5. Calculate cash runway: total startup cost ÷ monthly loss (if monthly profit is negative). This shows how many months you can sustain losses before cash is depleted.
6. Calculate funding requirement: if break-even is beyond month 6 AND cash runway is less than break-even months, calculate the additional capital needed = (monthly loss × (break-even months - 6)). This is the amount of external funding (loan, investment, or savings) needed to sustain the business until profitability.
7. Document assumptions: "Break-even analysis assumes [growth rate, cost structure, unit volume] remain constant."

**Output:**
- `break_even_analysis`: {unit_contribution_margin, break_even_units_per_month, break_even_revenue_per_month, break_even_months, cash_runway_months, funding_required, achievable}

**Quality Gate:**
- Break-even units per month is achievable (less than 50% of realistic monthly capacity). Verified by: break_even_units_per_month <= 50 for month 1, or justified by market validation.
- Break-even timeline is within 24 months (or noted as "long-term investment"). Verified by: break_even_months <= 24 OR achievable = false with explanation.
- Cash runway is documented if break-even is not immediately achievable. Verified by: cash_runway_months is a numeric value if monthly profit is negative.
- Funding requirement is calculated if break-even > 6 months. Verified by: funding_required is a numeric value (or 0 if not needed).

---

### Phase 6: Scenario Projections (Base, Best, Worst)

**Entry Criteria:**
- All prior phases are complete.
- `projection_months` (default 12) is set.
- `growth_assumption_base` (default 0.10, must be 0.0-0.30) is set.

**Actions:**

**6a. Base Case (Likely Scenario):**
1. Start with month 1 units = estimated_monthly_units from Phase 4.
2. Apply monthly growth rate (`growth_assumption_base`) to units each month: units_month_n = units_month_(n-1) × (1 + growth_assumption_base). Cap growth at 30% per month (industry benchmark for sustainable growth).
3. Calculate monthly revenue = units_month_n × price_per_unit.
4. Calculate monthly operating costs = fixed costs + (variable cost per unit × units_month_n).
5. Calculate net profit/loss = monthly revenue − monthly operating costs.
6. Track cumulative cash: month 1 cumulative = −startup_cost + month 1 net profit; month n cumulative = month_(n-1) cumulative + month_n net profit.
7. Identify the month profitability is achieved (cumulative cash turns positive). If not achieved within projection_months, note "profitability not achieved within projection period."

**6b. Best Case (Optimistic Scenario):**
1. Assume 20-30% monthly growth (higher than base case). Rationale: successful marketing, word-of-mouth, or viral traction.
2. Assume cost efficiencies: variable cost per unit decreases 2-3% per month (economies of scale), OR fixed costs are 10% lower (e.g., negotiated better rates).
3. Generate month-by-month projection using same structure as base case.
4. Document assumptions: "Best case assumes 25% monthly growth and 2% monthly COGS reduction due to [specific reason]."

**6c. Worst Case (Pessimistic Scenario):**
1. Assume 0-5% monthly growth or flat units. Rationale: slower adoption, increased competition, or market saturation.
2. Assume cost pressures: variable cost per unit increases 1-2% per month (supplier price increases, inflation), OR fixed costs are 20% higher (e.g., unexpected overhead).
3. Generate month-by-month projection using same structure as base case.
4. Note the cash runway: how many months until cash is depleted? If cumulative cash goes negative, flag the month when cash runs out.
5. Document assumptions: "Worst case assumes 2% monthly growth and 1.5% monthly COGS increase due to [specific reason]."

**Output:**
- `base_case_projection`: [{month, units, revenue, fixed_costs, variable_costs, total_costs, net_profit, cumulative_cash}, ...] for projection_months rows.
- `best_case_projection`: [{month, units, revenue, fixed_costs, variable_costs, total_costs, net_profit, cumulative_cash}, ...] for projection_months rows.
- `worst_case_projection`: [{month, units, revenue, fixed_costs, variable_costs, total_costs, net_profit, cumulative_cash}, ...] for projection_months rows.

**Quality Gate:**
- All three projections span the full projection period (12 months default). Verified by: each projection array has projection_months entries.
- Cumulative cash is tracked correctly (month 1 includes −startup_cost). Verified by: month 1 cumulative_cash = −startup_cost + month 1 net_profit.
- Best case shows profitability within projection period (or noted as "long-term"). Verified by: best_case_projection has at least one month with positive cumulative_cash.
- Worst case shows cash runway (how many months until cash depleted). Verified by: worst_case_projection notes the month when cumulative_cash becomes negative (if applicable).

---

### Phase 7: Scenario Synthesis, Sensitivity Analysis & Recommendation

**Entry Criteria:**
- All three scenario projections are complete.
- `available_hours_per_week` (default 10) is set.

**Actions:**
1. Create a scenario comparison table: for each scenario (base, best, worst), extract profitability month (when cumulative cash turns positive, or "not achieved"), 12-month net profit, and cash runway (months until cash depleted, or "N/A" if profitable).
2. Perform sensitivity analysis on the base case projection:
   - **Price sensitivity:** Calculate 12-month net profit if price per unit increases by +10% and decreases by −10%. Record the impact on profit.
   - **Volume sensitivity:** Calculate 12-month net profit if estimated monthly units increase by +20% and decrease by −20%. Record the impact on profit.
   - **Cost sensitivity:** Calculate 12-month net profit if variable cost per unit increases by +15% and decreases by −15%. Record the impact on profit.
   - Rank the three drivers by impact magnitude. Identify the top 3 most sensitive variables.
3. Validate time commitment: calculate hours per unit (total hours needed / total units produced). Multiply by projected units in month 6 to estimate hours needed in month 6. Compare to available_hours_per_week × 4.33 weeks. Flag if projected hours exceed available hours.
4. Document all assumptions made during modeling (growth rates, cost estimates, unit volumes, market validation confidence). For each assumption, assign a confidence level (high/medium/low) and note if validation is needed.
5. Identify critical success factors: what must go right for this side hustle to succeed? Examples: "must achieve 20 units/month by month 3," "must keep COGS below $10/unit," "must validate demand before launch," "must secure 5 paying customers in first month."
6. Generate recommendation: Go (pursue), No-Go (don't pursue), or Conditional (pursue if X is validated). Rationale must be based on: break-even timeline, cash runway, market validation confidence, time commitment feasibility, and sensitivity analysis.

**Output:**
- `scenario_comparison`: {base_case: {profitability_month, month_12_net_profit, cash_runway}, best_case: {...}, worst_case: {...}}
- `sensitivity_analysis`: {price_sensitivity: {plus_10_percent, minus_10_percent}, volume_sensitivity: {plus_20_percent, minus_20_percent}, cost_sensitivity: {plus_15_percent, minus_15_percent}, top_3_drivers: []}
- `time_commitment_validation`: {available_hours_per_week, hours_per_unit, projected_hours_needed_month_6, feasible, flag}
- `assumption_log`: [{assumption, rationale, confidence_level, validation_needed}, ...]
- `critical_success_factors`: ["factor 1", "factor 2", ...]
- `recommendation`: {decision, rationale, next_steps: []}

**Quality Gate:**
- Scenario comparison is clear and actionable (all three scenarios have profitability_month and cash_runway documented). Verified by: scenario_comparison has all six fields populated (not null or "TBD").
- Sensitivity analysis identifies at least 3 key drivers with specific impact values. Verified by: sensitivity_analysis has three drivers with numeric impact values, and top_3_drivers array is populated.
- Assumption log is complete; no assumption is left undocumented. Verified by: every numeric value in the model (growth rate, cost estimate, unit volume) has a corresponding entry in assumption_log.
- Time commitment validation is performed and feasibility is flagged. Verified by: time_commitment_validation.feasible is true/false, and flag is set if hours exceed available.
- Recommendation is justified by the financial model, not subjective. Verified by: recommendation.rationale cites specific metrics (break-even month, cash runway, sensitivity drivers, market validation confidence).

---

## Exit Criteria

The skill is complete when:
1. All seven phases have been executed in order.
2. All outputs are populated with specific, quantified data (not "TBD", "estimate", or null). Verified by: every output field contains a numeric value, string, or array (not placeholder text).
3. The financial model is internally consistent: base case projections match break-even analysis, scenario comparisons are accurate, and cumulative cash calculations are correct. Verified by: month 1 cumulative cash in base_case_projection = −startup_cost + month 1 net profit; break-even month matches the month when cumulative cash turns positive in base_case_projection.
4. A person unfamiliar with the side hustle idea could read the outputs and understand the financial viability. Verified by: idea_summary, market_validation, and recommendation are clear and specific (not vague).
5. The recommendation is actionable: Go/No-Go/Conditional with clear next steps. Verified by: recommendation.decision is one of the three values, rationale cites specific metrics, and next_steps array has at least 2 items.
6. All assumptions are documented with confidence levels. Verified by: assumption_log has at least 5 entries, each with confidence_level assigned.
7. Time commitment is validated against available hours. Verified by: time_commitment_validation.feasible is true/false, and flag is set if infeasible.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Idea description is too vague (e.g., "make money") | **Adjust** -- ask for specifics: what product/service, who buys it, how much do they pay? Reject input until idea_summary meets specificity gate. |
| Phase 1 | Revenue model is not quantified (e.g., "charge what the market will bear") | **Adjust** -- research comparable offerings and set a specific price point. Provide 3 pricing options (low/medium/high) with rationale. |
| Phase 1 | Target market is too broad (e.g., "everyone") | **Adjust** -- narrow the segment. Ask: who is your ideal customer? What problem do they have? Reject until target_market is specific. |
| Phase 2 | No market validation has been done | **Adjust** -- recommend a validation method for the business type. Flag risk_flag = true and note in recommendation that demand must be validated before launch. |
| Phase 2 | Market validation shows low confidence (e.g., 1 person expressed interest) | **Adjust** -- recommend additional validation (e.g., 5+ customer interviews, pre-sales, waitlist). Flag risk_flag = true. |
| Phase 3 | Startup costs are unknown and user has no estimates | **Adjust** -- provide industry benchmarks for the business type (e.g., "typical e-commerce startup: $500-$2,000"). Ask user to select low/medium/high estimate. |
| Phase 4 | Variable cost per unit exceeds price per unit (negative margin) | **Abort** -- the business model is not viable. Recommend increasing price or reducing COGS. Do not proceed to Phase 5. |
| Phase 4 | Estimated monthly units are unrealistic (e.g., 1,000 units/month for a brand-new side hustle) | **Adjust** -- cap at 50 units/month for month 1 unless market validation supports higher. Ask user to justify the estimate. |
| Phase 5 | Break-even is not achievable within 24 months | **Adjust** -- flag as "long-term investment" and note the cash runway. Recommend validating demand and unit economics before launch. |
| Phase 6 | Monthly growth assumption is unrealistic (e.g., 100% month-over-month) | **Adjust** -- cap growth at 30% per month for best case (industry benchmark for sustainable growth); use 10% for base case. Explain the cap in assumption_log. |
| Phase 6 | Worst case shows cash runway < 3 months | **Adjust** -- flag as high-risk in recommendation. Recommend securing funding or reducing startup costs before launch. |
| Phase 7 | Sensitivity analysis shows the business is fragile (profit is highly sensitive to one variable, e.g., 50%+ change in profit from ±10% change in price) | **Adjust** -- add a note in critical_success_factors and recommendation. Recommend validating or controlling that variable before launch. |
| Phase 7 | Time commitment validation shows projected hours exceed available hours | **Adjust** -- flag in time_commitment_validation.flag = true. Recommend either increasing available hours, reducing unit volume targets, or automating/outsourcing tasks. |
| Phase 7 | Recommendation is unclear or contradictory (e.g., break-even is 18 months but recommendation is "Go") | **Adjust** -- ensure recommendation.rationale explicitly addresses break-even timeline, cash runway, market validation confidence, and time commitment. Revise recommendation if needed. |
| Phase 7 | User rejects final output | **Targeted revision** -- ask which revenue projection, cost assumption, or break-even calculation fell short and rerun only that section. Do not regenerate the full financial model. |

---

## Reference Section: Domain Knowledge & Decision Criteria

### Business Type Cost Benchmarks

**Product-Based (e.g., handmade goods, reselling):**
- Startup: $500-$5,000 (inventory, packaging, basic website)
- Monthly fixed: $50-$200 (platform fees, storage)
- Variable: 30-50% of price (COGS, shipping, payment processing)

**Service-Based (e.g., consulting, freelancing):**
- Startup: $100-$1,000 (website, business registration, software)
- Monthly fixed: $20-$100 (software subscriptions, insurance)
- Variable: 0-20% of price (payment processing, subcontractor fees)

**Digital Product (e.g., courses, templates, software):**
- Startup: $500-$3,000 (platform, design, initial marketing)
- Monthly fixed: $50-$300 (hosting, platform fees)
- Variable: 5-15% of price (payment processing, customer support)

### Break-Even Interpretation

- **Break-even < 3 months:** Strong business model; pursue aggressively. Validate market demand and execute.
- **Break-even 3-12 months:** Viable; requires discipline and execution. Validate demand before launch; secure funding if cash runway is short.
- **Break-even 12-24 months:** Long-term investment; validate demand and unit economics before launch. Secure funding to sustain losses.
- **Break-even > 24 months:** High risk; reconsider pricing or cost structure. Validate demand and consider pivoting.

### Scenario Growth Assumptions

- **Base Case:** 10% monthly growth (conservative; assumes slow organic growth and word-of-mouth).
- **Best Case:** 20-30% monthly growth (assumes successful marketing, viral traction, or strong product-market fit). Capped at 30% per month (industry benchmark).
- **Worst Case:** 0-5% monthly growth or flat (assumes slow adoption, increased competition, or market saturation).

### Market Validation Methods by Business Type

**Product-Based:**
- Conduct 5-10 customer interviews: "Would you buy this at $X? Why or why not?"
- Pre-sales: Offer the product at a discount to early customers; measure conversion rate.
- Waitlist: Create a landing page and measure signups.

**Service-Based:**
- Post on relevant forums/communities (Reddit, LinkedIn, Facebook groups) and gauge interest.
- Offer a free or discounted service to 3-5 potential customers; measure satisfaction and willingness to pay.
- Conduct customer interviews: "Would you hire me for this service at $X/hour?"

**Digital Product:**
- Create a landing page and measure email signups.
- Conduct customer interviews: "Would you buy a course/template on this topic for $X?"
- Offer a beta version to 10-20 early users; measure engagement and feedback.

### Critical Success Factors Template

For any side hustle, identify:
1. **Demand validation:** Is there real customer demand at the proposed price? (Validate via interviews, pre-sales, or waitlist)
2. **Unit economics:** Can you deliver profitably at scale? (Verify: variable cost per unit < price per unit; contribution margin > 30%)
3. **Time commitment:** Can you execute with the hours available? (Validate: projected hours in month 6 <= available hours per week × 4.33)
4. **Competitive advantage:** Why will customers choose you? (Document: unique value proposition, differentiation)
5. **Market timing:** Is the market growing or saturated? (Research: market size, growth rate, competitor landscape)

### Sensitivity Analysis Interpretation

If a 10% change in variable X causes a 50%+ change in 12-month profit, that variable is a critical driver. Focus validation and risk mitigation on the top 3 drivers.

**Example:**
- Price sensitivity: +10% price → +$500 profit (5% impact); −10% price → −$500 profit (5% impact). Low sensitivity.
- Volume sensitivity: +20% volume → +$2,000 profit (20% impact); −20% volume → −$2,000 profit (20% impact). High sensitivity.
- Cost sensitivity: +15% costs → −$1,500 profit (15% impact); −15% costs → +$1,500 profit (15% impact). High sensitivity.

Top 3 drivers: volume, costs, price (in order of impact).

### Go/No-Go Decision Tree

**Go:** Pursue the side hustle if:
- Break-even is within 12 months, AND
- Cash runway is > 6 months (or funding is secured), AND
- Market validation confidence is high or medium, AND
- Time commitment is feasible (projected hours <= available hours), AND
- Unit economics are strong (contribution margin > 30%).

**Conditional:** Pursue if:
- Break-even is 12-24 months, AND
- Market validation confidence is medium, AND
- Time commitment is feasible, AND
- One or more critical success factors must be validated before launch (e.g., "validate demand with 10 customer interviews").

**No-Go:** Do not pursue if:
- Break-even is > 24 months, OR
- Cash runway is < 3 months and funding is not secured, OR
- Market validation confidence is low and no plan to validate, OR
- Time commitment is infeasible (projected hours >> available hours), OR
- Unit economics are weak (contribution margin < 20% or variable cost > price).

---

## State Persistence (Optional)

If running this skill multiple times for the same side hustle idea, consider tracking:
- **Assumption validation log:** Which assumptions have been validated? Which remain uncertain? Update after each validation.
- **Actual vs. projected:** Once the side hustle launches, compare actual results to projections. Update the model monthly.
- **Decision history:** What decisions were made based on this model? Did they lead to success or failure? Document learnings.
- **Model iterations:** Track versions of the model as assumptions change. Compare version 1 (pre-launch) to version 2 (post-launch) to measure accuracy.

This enables iterative refinement of the model and learning over time.