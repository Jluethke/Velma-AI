# Idea Validator

**One-line description:** Systematically validate a business idea through customer problem validation, market sizing, competitive analysis, and unique value proposition assessment to produce a go/no-go recommendation.

**Execution Pattern:** Phase Pipeline (7 sequential phases)

---

## Inputs

- `business_idea` (string, required): Raw business idea description including the problem being solved, proposed solution, and target customer segment.
- `research_depth` (string, optional): Level of research detail — "quick" (1-2 hours), "standard" (4-8 hours), or "deep" (2+ days). Default: "standard". Determines timeline for customer interviews and data collection.
- `market_context` (string, optional): Industry, geography, or regulatory context relevant to the idea.
- `competitive_landscape_known` (boolean, optional): Whether the user has prior knowledge of competitors. Default: false.

## Outputs

- `idea_statement` (object): Structured definition of the idea with problem, solution, target customer, and initial assumptions.
- `customer_validation_report` (object): Summary of customer interviews validating problem acuity, current solutions, and willingness to pay.
- `market_analysis` (object): TAM, SAM, SOM estimates with data sources, confidence levels, and market maturity assessment.
- `competitor_analysis` (object): Competitor matrix with 3-5 key competitors, feature comparison, pricing, and positioning.
- `uvp_assessment` (object): Unique value proposition statement, differentiation factors, defensibility score (1-10), and business model viability.
- `validation_report` (object): Synthesis of all findings with scoring rubric results, risk assessment, and founder-market fit evaluation.
- `recommendation` (object): Go/no-go decision with rationale, key risks, pivot decision tree (if No-Go), and recommended next steps.

---

## Execution Phases

### Phase 1: Idea Definition and Clarification

**Entry Criteria:**
- Business idea description is provided.
- Idea contains at least a problem statement and proposed solution.

**Actions:**
1. Parse the business idea and extract: problem being solved, proposed solution, target customer, and initial value proposition.
2. Identify and document implicit assumptions (e.g., "customers will pay for this," "this solves a real pain point").
3. Define the scope: is this B2B, B2C, or B2B2C? What is the primary revenue model (subscription, one-time, freemium, marketplace)?
4. Clarify the target customer: who is the primary user? Who is the buyer (if different)? What is their current solution?
5. Specify the target customer segment with demographic, firmographic, or behavioral criteria (not vague: "businesses" → "mid-market SaaS companies with 50-500 employees in North America").

**Output:**
- `idea_statement`: Structured object with fields: problem_statement, proposed_solution, target_customer (with specific segment criteria), revenue_model, scope (B2B/B2C/B2B2C), key_assumptions (array with each assumption explicitly stated).

**Quality Gate:**
- All 6 fields (problem_statement, proposed_solution, target_customer, revenue_model, scope, key_assumptions) are populated with 2+ sentences each.
- Target customer is defined by role, industry, company size, or demographic—not vague (verified by: can you name 3 specific companies or personas that fit?).
- All assumptions are explicit and testable (not hidden).

---

### Phase 2: Customer Problem Validation

**Entry Criteria:**
- Idea statement is complete with specific target customer segment.
- Research depth is selected (quick, standard, or deep).

**Actions:**
1. Conduct 5-10 customer interviews (or 3-5 for "quick" depth) with target customers. Use structured interview guide covering: (a) Do you experience the problem described? (b) How acute is the problem (1-10 scale)? (c) What is your current solution or workaround? (d) How much time/money does the problem cost you annually? (e) Would you pay for a solution? If so, what price range?
2. Document interview findings: customer segment, problem acuity score, current solution, estimated annual cost of problem, willingness to pay (yes/no/maybe), and key quotes.
3. Synthesize findings: what percentage of interviewed customers confirmed the problem? What is the average acuity score? What is the average willingness to pay?
4. Identify any pivots: did customers describe a different problem or customer segment that is more acute?
5. Flag any red flags: if <50% of customers confirm the problem, or acuity score is <6/10, recommend reconsidering the idea or pivoting the customer segment.

**Output:**
- `customer_validation_report`: Object with fields: interviews_conducted (number), target_segment_interviewed (description), problem_confirmation_rate (%), average_acuity_score (1-10), current_solutions (array of workarounds), average_willingness_to_pay (currency range), key_quotes (array of 3-5 customer quotes), red_flags (array), pivot_recommendations (if applicable), data_sources.

**Quality Gate:**
- Minimum 3 customer interviews completed (5+ for standard/deep depth).
- Problem confirmation rate ≥ 50% (if <50%, flag as red flag and recommend pivot or No-Go).
- Average acuity score ≥ 6/10 (if <6, problem is not acute enough; recommend pivot).
- Willingness to pay is documented with specific price ranges, not vague ("some customers would pay" → "3 of 5 customers would pay $100-500/month").

---

### Phase 3: Market Size Estimation and Maturity Assessment

**Entry Criteria:**
- Customer validation report is complete.
- Problem confirmation rate ≥ 50% and acuity score ≥ 6/10 (or explicit decision to proceed despite red flags).

**Actions:**
1. Estimate Total Addressable Market (TAM): the total revenue opportunity if the solution captured 100% of the target market. Use top-down (industry reports, analyst data) or bottom-up (unit economics) methods. Document method, data sources, and assumptions.
2. Estimate Serviceable Addressable Market (SAM): the portion of TAM the business can realistically reach given geographic, product, or channel constraints.
3. Estimate Serviceable Obtainable Market (SOM): realistic market capture in year 1-3 based on competitive intensity and go-to-market strategy.
4. Assess market maturity: is the market emerging (early adoption, <5% penetration), growth (5-30% penetration, rapid expansion), mature (>30% penetration, stable), or declining? Document evidence (analyst reports, adoption trends, customer feedback).
5. Evaluate market timing: is the market ready for the proposed solution now, or are there prerequisites (technology maturity, regulatory changes, customer behavior shifts)? Identify any market catalysts (e.g., regulatory change, technology breakthrough) that could accelerate adoption.
6. Document all data sources, assumptions, and confidence levels (high/medium/low).

**Output:**
- `market_analysis`: Object with fields: TAM (value, currency, method, confidence), SAM (value, currency, method, confidence), SOM (value, currency, method, confidence), market_maturity (emerging/growth/mature/declining with evidence), market_timing_assessment (ready_now/prerequisites_exist/not_ready with explanation), growth_trend (CAGR % if available), data_sources (array), key_assumptions (array).

**Quality Gate:**
- TAM is ≥ $50M (or explicitly justified if smaller, e.g., "niche market with strong unit economics").
- All estimates are backed by at least one data source or clearly documented calculation (not guesses).
- Confidence levels are realistic and varied (not all "high").
- Market maturity is assessed with specific evidence (analyst reports, adoption %, customer feedback), not assumptions.
- Market timing assessment is explicit: if prerequisites exist, specify what they are and how to validate them.

---

### Phase 4: Competitive Analysis

**Entry Criteria:**
- Market analysis is complete.
- Target customer and market segment are defined.

**Actions:**
1. Identify 3-5 direct competitors (solutions addressing the same problem for the same customer).
2. Identify 2-3 indirect competitors (alternative solutions or workarounds the customer currently uses).
3. For each competitor, document: company name, founding year, funding (if known), key features, pricing model, target customer, market positioning, estimated market share (if available), strengths, and weaknesses.
4. Create a feature/price matrix comparing the proposed idea to competitors. Use specific features (not vague: "better UX" → "native mobile app, offline mode, real-time sync").
5. Assess market concentration: is the market dominated by one player (>50% share), concentrated (top 3 have >70% share), or fragmented (<50% top 3 share)?
6. Identify any white space: customer needs not addressed by existing solutions (based on customer interviews and competitor analysis).
7. Assess competitive response risk: how quickly could competitors copy the proposed solution? What barriers exist (patents, switching costs, network effects, brand)?

**Output:**
- `competitor_analysis`: Object with fields: direct_competitors (array of competitor objects with: name, founding_year, funding, key_features, pricing, target_customer, market_share_estimate, strengths, weaknesses), indirect_competitors (array), feature_comparison_matrix (table with rows=competitors, columns=features), market_concentration_assessment (dominated/concentrated/fragmented with top 3 share %), white_space_identified (array of unmet needs), competitive_response_risk (low/medium/high with explanation), data_sources.

**Quality Gate:**
- At least 3 competitors are identified and documented with specific features and pricing (not vague).
- Feature matrix is specific: each feature is observable and verifiable (not "better UX" but "native mobile app, offline mode, real-time sync").
- Weaknesses of competitors are based on observable facts or customer feedback, not assumptions (e.g., "3 of 5 customers cited poor mobile experience" not "mobile experience is probably bad").
- White space is tied to customer pain points from Phase 2 interviews.

---

### Phase 5: Unique Value Proposition and Business Model Assessment

**Entry Criteria:**
- Competitor analysis is complete.
- Idea statement is clear.

**Actions:**
1. Articulate the unique value proposition: what does the proposed solution do better, faster, cheaper, or differently than competitors? State in customer-centric language (what problem it solves), not feature-centric ("we have AI").
2. Identify the top 3 differentiation factors (e.g., technology, business model, customer service, price, speed to market, network effects).
3. Assess defensibility: can competitors easily copy this UVP? Identify specific barriers (patents, network effects, switching costs, brand, data, exclusive partnerships). Score defensibility on 1-10 scale: 1-3 (weak, easily copied), 4-6 (moderate, some defensibility), 7-10 (strong, defensible for 18+ months).
4. Evaluate the strength of the UVP against customer pain points: does it address the top 1-2 problems the target customer faces (from Phase 2 interviews)?
5. Assess business model viability: estimate unit economics (customer acquisition cost, customer lifetime value, gross margin). Is the business model sustainable (LTV > 3x CAC)? Document assumptions and confidence level.
6. Identify any business model risks: are there unit economics that could break the model (e.g., CAC > LTV, negative gross margin)?

**Output:**
- `uvp_assessment`: Object with fields: uvp_statement (customer-centric, 1-2 sentences), differentiation_factors (array of 3 with explanation), defensibility_assessment (narrative explaining barriers), barrier_types (array: patents, network_effects, switching_costs, brand, data, exclusive_partnerships), customer_pain_alignment (which top 1-2 problems from Phase 2 does UVP address?), defensibility_score (1-10 with justification), business_model_viability (sustainable/at_risk/unsustainable with unit economics), unit_economics (CAC estimate, LTV estimate, gross_margin_estimate, LTV_to_CAC_ratio, confidence_level), business_model_risks (array), rationale.

**Quality Gate:**
- UVP is stated in customer-centric language (what problem it solves), not feature-centric (verified by: does it mention customer benefit, not product feature?).
- Defensibility score is justified by specific barriers, not optimism (e.g., "score 8: patent protection for 18+ months + network effects" not "score 8: we're first to market").
- At least one differentiation factor is defensible for 18+ months (verified by: can you name the specific barrier?).
- Unit economics are estimated with clear assumptions (e.g., "CAC = $500 based on $5k/month marketing budget ÷ 10 customers/month").
- LTV to CAC ratio is calculated and assessed (sustainable if >3x).

---

### Phase 6: Founder-Market Fit and Risk Assessment

**Entry Criteria:**
- UVP and business model assessment are complete.

**Actions:**
1. Evaluate team capability: does the founding team have domain expertise, execution track record, and fundraising ability? Score on 1-10 scale: 1-3 (weak, no relevant experience), 4-6 (moderate, some relevant experience), 7-10 (strong, deep domain expertise and execution track record).
2. Assess founder passion and commitment: is the team passionate about solving this problem? Are they willing to commit 6+ months to validation and MVP development?
3. Identify team gaps: what skills or expertise is missing? Can they be acquired (hiring, advisors, partnerships)?
4. Synthesize findings into founder-market fit score (1-10): strong fit if team has domain expertise + execution track record + passion + can acquire missing skills.
5. Identify top 3 risks: market adoption, competitive response, execution, regulatory, technology, funding, team, unit economics. For each, assess severity (low/medium/high) and mitigation strategy.
6. Identify top 3 opportunities: market growth, partnership potential, adjacent markets, network effects, team network.

**Output:**
- `founder_market_fit_assessment`: Object with fields: team_capability_score (1-10 with breakdown by domain_expertise, execution_track_record, fundraising_ability), founder_passion_assessment (high/medium/low with evidence), team_gaps (array of missing skills), gap_acquisition_plan (array of how to acquire each skill), founder_market_fit_score (1-10), risk_assessment (array of top 3 risks with severity and mitigation), opportunity_assessment (array of top 3 opportunities).

**Quality Gate:**
- Team capability score is justified by specific evidence (e.g., "domain expertise score 8: founder spent 5 years at competitor, led product team").
- Team gaps are realistic and actionable (not "need a genius engineer" but "need iOS developer with 3+ years experience").
- Founder-market fit score is justified by combination of capability, passion, and gap acquisition plan.
- Risks are specific and actionable (not "market risk" but "customer acquisition cost may exceed $500/user, risking unit economics").

---

### Phase 7: Validation Synthesis and Go/No-Go Recommendation

**Entry Criteria:**
- All previous phases complete: idea definition, customer validation, market analysis, competitor analysis, UVP/business model assessment, founder-market fit assessment.

**Actions:**
1. Score the idea against a validation rubric (100 points total):
   - **Market Size (20 points):** TAM ≥ $50M (10 pts), SAM ≥ $10M (10 pts).
   - **Market Maturity & Timing (15 points):** Market is growth or mature (10 pts), market timing is favorable or prerequisites are clear (5 pts).
   - **Customer Problem Validation (15 points):** Problem confirmation rate ≥ 70% (10 pts), average acuity score ≥ 7/10 (5 pts).
   - **Competitive Position (15 points):** UVP defensibility score ≥ 7 (10 pts), white space identified (5 pts).
   - **Business Model Viability (15 points):** Unit economics sustainable (LTV > 3x CAC) (10 pts), gross margin ≥ 50% (5 pts).
   - **Founder-Market Fit (5 points):** Founder-market fit score ≥ 6 (5 pts).
2. Synthesize findings into a recommendation: Go (score ≥ 70), Conditional Go (score 50-69, with specific conditions), or No-Go (score < 50).
3. For Go recommendations: outline next steps (MVP scope, customer validation plan, funding strategy, timeline).
4. For Conditional Go: specify the conditions that must be met (e.g., "proceed if customer acquisition cost is < $300") and how to validate them within 2-4 weeks.
5. For No-Go: provide a pivot decision tree: (a) Expand to adjacent customer segment? (b) Change revenue model? (c) Reduce scope to MVP? (d) Shelve the idea? For each option, specify what would need to change for viability.
6. Document top 3 reasons for the recommendation (tied to rubric scores).

**Output:**
- `validation_report`: Object with fields: rubric_scores (breakdown by category with points earned and total), total_score (out of 100), recommendation_category (Go/Conditional_Go/No_Go), rationale (array of top 3 reasons tied to rubric scores), next_steps_if_go (array of actions with owners and timelines), conditions_if_conditional (array with validation milestones), pivot_decision_tree_if_no_go (object with options: expand_segment, change_revenue_model, reduce_scope, shelve_idea, with explanation for each), key_risks_to_monitor (array of top 3 risks with mitigation).

**Quality Gate:**
- Rubric scores are justified by evidence from earlier phases (e.g., "Market Size: 20/20 because TAM = $500M (analyst report), SAM = $50M (bottom-up calculation)").
- Recommendation is defensible to a skeptical audience (tied to rubric scores, not gut feel).
- Next steps are specific and actionable (not "do more research" but "interview 10 customers in target segment X by [date]").
- Conditions (if Conditional Go) are measurable and achievable within 2-4 weeks.
- Pivot decision tree (if No-Go) provides clear options with specific changes needed for each.

---

### Phase 8: Recommendation and Next Steps

**Entry Criteria:**
- Validation report is complete with recommendation.

**Actions:**
1. Write an executive summary (1 paragraph) with the go/no-go recommendation and top 3 reasons.
2. For Go recommendations: outline next steps (MVP scope, customer validation plan, funding strategy, timeline). Specify owner and deadline for each step. Recommend timeline based on research_depth: "quick" → 2-week MVP sprint, "standard" → 4-week MVP + customer validation, "deep" → 8-week MVP + pilot with 3-5 customers.
3. For Conditional Go: specify the conditions that must be met and design a 2-4 week validation sprint to test them. Specify owner and deadline for each validation milestone.
4. For No-Go: identify what would need to change for the idea to be viable (e.g., "expand to adjacent market," "reduce TAM requirement," "find a defensible differentiation"). Use the pivot decision tree to guide the founder.
5. Recommend a timeline for next steps (e.g., "conduct 10 customer interviews in 2 weeks").
6. Identify any dependencies or blockers (e.g., "need access to target customer list," "need technical co-founder").

**Output:**
- `recommendation`: Object with fields: decision (Go/Conditional_Go/No_Go), executive_summary (1 paragraph), rationale (array of top 3 reasons), next_steps (array of actions with owners, deadlines, and success criteria), conditions_if_conditional (array with validation milestones and success criteria), change_requirements_if_no_go (array with pivot options), dependencies_and_blockers (array), recommended_timeline (based on research_depth).

**Quality Gate:**
- Recommendation is clear and actionable (Go/Conditional Go/No-Go, not ambiguous).
- Next steps are specific (not "do more research" but "interview 10 customers in target segment X by [date]").
- Success criteria are measurable (not "validate the idea" but "get commitments from 3 customers to pilot MVP").
- Timeline is realistic given the research depth selected (quick → 2 weeks, standard → 4 weeks, deep → 8 weeks).
- Dependencies and blockers are identified so the founder knows what could derail the plan.

---

## Exit Criteria

The skill is complete when:
- All 8 phases have been executed in order.
- Customer validation (Phase 2) is complete with minimum 3 interviews (5+ for standard/deep).
- A recommendation (Go, Conditional Go, or No-Go) has been produced with clear rationale tied to rubric scores.
- Next steps are defined with specific owners, deadlines, and success criteria.
- All outputs are populated and internally consistent (e.g., market size supports the recommendation, UVP defensibility aligns with competitive analysis, unit economics support business model viability, founder-market fit score supports execution feasibility).
- A third party unfamiliar with the original idea could understand the business, the market, the competition, the unit economics, the team capability, and the recommendation from the outputs alone.
- For Conditional Go: validation milestones are specific and achievable within 2-4 weeks.
- For No-Go: pivot decision tree provides clear options for the founder to iterate or move on.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Idea is too vague (e.g., "an app for productivity") | **Adjust** -- Ask clarifying questions: What specific problem? Who is the customer? What is the current solution? Document assumptions explicitly. Do not proceed to Phase 2 until idea is specific. |
| Phase 2 | Unable to recruit 3+ customers for interviews | **Adjust** -- Expand target customer definition or use proxy interviews (e.g., interview adjacent customer segment, interview customer support reps who speak to target customers). Document the limitation and mark confidence as "low." |
| Phase 2 | Problem confirmation rate < 50% | **Adjust** -- Flag as red flag. Recommend pivoting the customer segment, redefining the problem, or reconsidering the idea. Do not proceed to Phase 3 without explicit decision to continue despite red flag. |
| Phase 2 | Average acuity score < 6/10 | **Adjust** -- Problem is not acute enough. Recommend pivoting to a different customer segment with higher acuity, or reconsidering the idea. |
| Phase 3 | Market data is unavailable or unreliable | **Adjust** -- Use bottom-up estimation (unit economics, customer count estimates) and mark confidence as "low." Recommend primary research (customer interviews) to validate. |
| Phase 3 | TAM is < $50M | **Adjust** -- Proceed with analysis but flag as "niche market." Explore adjacent markets or different customer segments that could expand TAM. Assess whether niche market can support sustainable unit economics. |
| Phase 4 | No direct competitors found | **Adjust** -- This may indicate a blue ocean opportunity or a market that doesn't exist. Investigate indirect competitors and customer workarounds. Recommend customer interviews to validate demand (should have been done in Phase 2). |
| Phase 5 | UVP is not defensible (score < 4) | **Adjust** -- Recommend pivoting the UVP, exploring adjacent markets with stronger differentiation, or reconsidering the idea. |
| Phase 5 | Unit economics are unsustainable (LTV < 3x CAC or negative gross margin) | **Adjust** -- Recommend changing the revenue model (e.g., higher price, lower CAC, different customer segment), reducing scope, or reconsidering the idea. |
| Phase 6 | Founder-market fit score < 4 | **Adjust** -- Recommend recruiting a co-founder with domain expertise, hiring key team members, or reconsidering the idea. |
| Phase 7 | Validation score is borderline (50-69) | **Adjust** -- Produce a "Conditional Go" recommendation with specific validation milestones (e.g., "proceed if 5 customers commit to pilot"). |
| Phase 8 | Next steps are unclear or too ambitious | **Adjust** -- Break next steps into smaller, 2-week sprints. Prioritize the highest-risk assumptions to validate first. |
| Phase 8 | User rejects final output | **Targeted revision** -- ask which validation score, assumption, or next step fell short and rerun only that phase. Do not restart the full validation. |

---

## Reference Section: Validation Rubric and Decision Criteria

### Scoring Rubric (100 points total)

**Market Size (20 points)**
- TAM ≥ $50M: 10 pts
- SAM ≥ $10M: 10 pts

**Market Maturity & Timing (15 points)**
- Market is growth or mature (not emerging or declining): 10 pts
- Market timing is favorable or prerequisites are clear and achievable: 5 pts

**Customer Problem Validation (15 points)**
- Problem confirmation rate ≥ 70% (from Phase 2 interviews): 10 pts
- Average acuity score ≥ 7/10 (problem is acute, not nice-to-have): 5 pts

**Competitive Position (15 points)**
- UVP defensibility score ≥ 7 (defensible for 18+ months): 10 pts
- White space identified (unmet customer needs not addressed by competitors): 5 pts

**Business Model Viability (15 points)**
- Unit economics sustainable (LTV > 3x CAC): 10 pts
- Gross margin ≥ 50% (or justified if lower): 5 pts

**Founder-Market Fit (5 points)**
- Founder-market fit score ≥ 6 (team has domain expertise, execution track record, and passion): 5 pts

### Decision Thresholds

- **Go (≥ 70 points):** Proceed with MVP development, customer validation, and fundraising. Idea has strong market opportunity, defensible UVP, sustainable unit economics, and capable team.
- **Conditional Go (50-69 points):** Proceed with specific validation milestones. Identify the highest-risk assumptions and design experiments to test them within 2-4 weeks before committing resources. Common conditions: "proceed if CAC < $300," "proceed if 5 customers commit to pilot," "proceed if market timing improves."
- **No-Go (< 50 points):** Shelve the idea or pivot significantly. Use the pivot decision tree to decide: expand to adjacent customer segment, change revenue model, reduce scope to MVP, or move on. Identify what would need to change (market size, defensibility, team capability, unit economics) for the idea to be viable.

### Pivot Decision Tree (for No-Go Recommendations)

If recommendation is No-Go, evaluate each pivot option:

1. **Expand to adjacent customer segment:** Is there a different customer segment with higher acuity, larger TAM, or better unit economics? Requires re-running Phase 2 (customer validation) with new segment.
2. **Change revenue model:** Could a different pricing model (e.g., higher price, freemium, marketplace) improve unit economics or defensibility? Requires re-running Phase 5 (business model assessment).
3. **Reduce scope to MVP:** Could a narrower MVP (fewer features, smaller market) be viable? Requires re-running Phase 3 (market sizing) and Phase 5 (business model assessment).
4. **Shelve the idea:** If none of the above pivots are viable, recommend moving on to the next idea.

### Domain Knowledge: Customer Interview Framework

For all recommendations, conduct customer interviews to validate assumptions (Phase 2):

1. **Problem validation:** Does the customer experience the problem described? How acute is it (1-10 scale)? What is the current solution or workaround? How much time/money does the problem cost annually?
2. **Solution validation:** Would the customer use the proposed solution? What features are must-haves vs. nice-to-haves? What would cause them to switch from the current solution?
3. **Pricing validation:** What would the customer pay? What is the ROI threshold? What is the payback period they would accept?
4. **Competitive validation:** Why would the customer switch from the current solution? What would the competitor need to do to retain them?

Target 5-10 customer interviews per segment before making a final go/no-go decision (minimum 3 for "quick" depth, 5+ for "standard" and "deep" depth).

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.