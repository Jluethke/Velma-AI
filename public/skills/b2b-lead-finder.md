# B2B Lead Finder

Identifies, scores, and prioritizes B2B sales leads against a defined Ideal Customer Profile, tracking history to prevent duplicate outreach and refining the ICP based on observed conversion patterns.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Read ICP definition, load exclusion list, retrieve past lead history from state
REASON  --> Score each candidate lead against weighted ICP criteria, flag duplicates and disqualifiers
PLAN    --> Rank leads by composite score, assign outreach approach per lead, plan contact sequence
ACT     --> Output validated lead list with scores, reasoning, and ICP refinement suggestions
         \                                                                                    /
          +--- If target_count not met, widen search parameters and loop back to OBSERVE ----+
```

## Inputs

- **icp_definition**: object -- Ideal Customer Profile containing:
  - `industry`: string[] -- Target industries (e.g., ["SaaS", "Fintech", "E-commerce"])
  - `employee_range`: {min: number, max: number} -- Company size bounds
  - `tech_stack`: string[] -- Required and preferred technologies
  - `team_requirements`: object -- Department size minimums (e.g., {engineering: 50})
  - `geography`: string[] -- Target regions
  - `budget_signals`: string[] -- Funding stage, ARR range, or other budget indicators
  - `pain_points`: string[] -- Problems the product solves
  - `deal_breakers`: string[] -- Hard disqualifiers
- **target_count**: integer -- Number of qualified leads to find (1-100)
- **exclusion_list**: string[] -- Company names or domains to exclude (existing customers, past contacts, competitors)

## Outputs

- **scored_lead_list**: array of objects -- Each containing:
  - `company_name`: string
  - `composite_score`: number (0-100)
  - `dimension_scores`: object (score per ICP dimension with reasoning)
  - `fit_tier`: string ("perfect" | "strong" | "moderate" | "weak")
  - `key_contacts`: array of {name, title, channel}
  - `outreach_approach`: string (recommended angle)
  - `flags`: string[] (any concerns or notes)
- **outreach_priorities**: array -- Ordered list with contact timing and channel recommendations
- **icp_refinement_suggestions**: array of strings -- Data-driven suggestions to evolve the ICP

## Execution

### OBSERVE: Gather Inputs and Context

**Entry criteria:** ICP definition provided with at least industry + employee_range + one other dimension. Target count is a positive integer.

**Actions:**
1. Parse ICP definition into weighted scoring dimensions. Assign default weights if not specified: Industry (25%), Company Size (20%), Tech Stack (25%), Team Size (15%), Budget Signal (15%).
2. Load exclusion list and normalize company names (lowercase, strip Inc/Corp/Ltd suffixes).
3. Load past lead history from state persistence -- extract previously contacted companies, their scores, and conversion outcomes.
4. Identify intent signals relevant to this ICP: job postings, technology adoption indicators, funding announcements, content engagement patterns.
5. Define search parameters: what data sources to scan, what filters to apply.

**Output:** Structured ICP scoring rubric with weights, normalized exclusion set, historical context summary.

**Quality gate:** ICP rubric has at least 3 weighted dimensions totaling 100%. Exclusion list loaded and deduplicated. If ICP is incomplete (fewer than 3 dimensions), prompt for additional criteria before proceeding.

### REASON: Score and Evaluate Candidates

**Entry criteria:** Scoring rubric is complete and validated. Candidate leads available for evaluation.

**Actions:**
1. For each candidate lead, score against every ICP dimension independently (0 to dimension weight max).
2. Apply dimension-specific scoring rules:
   - **Industry match**: Exact match = full points; adjacent industry = 60-80%; unrelated = 0.
   - **Company size**: Within range = full points; within 20% of bounds = 75%; outside = 25% if growth trajectory suggests they'll qualify within 12 months.
   - **Tech stack**: Required tech present = full points; in evaluation/staging = 75%; absent but related tech present = 25%.
   - **Team size**: Meets minimum = full points; within 80% = 75%.
   - **Budget signal**: Strong signal (matching funding stage or ARR range) = full points; partial signal = 50%.
3. Calculate composite score (sum of dimension scores).
4. Assign fit tier: 90-100 = perfect, 75-89 = strong, 60-74 = moderate, below 60 = weak.
5. Cross-reference against exclusion list -- mark any matches as DISQUALIFIED with reason.
6. Cross-reference against past lead history -- mark duplicates.
7. Flag any leads with mixed signals (e.g., perfect tech fit but deal-breaker present).

**Output:** Scored lead array with per-dimension breakdowns, fit tiers, duplicate/exclusion flags.

**Quality gate:** Every lead has a composite score and fit tier. No unscored dimensions. All exclusion list matches identified. If more than 50% of candidates score below 60, the search parameters may be too broad -- flag for OBSERVE loop-back.

### PLAN: Rank and Prioritize

**Entry criteria:** All candidate leads scored and validated. Duplicates and exclusions identified.

**Actions:**
1. Remove disqualified and duplicate leads from the working set.
2. Sort remaining leads by composite score (descending).
3. If remaining leads < target_count, prepare widened search parameters for OBSERVE loop-back (relax one non-critical ICP dimension by 20%).
4. For each lead in the top N (where N = target_count), determine outreach approach based on:
   - **Highest-scoring dimension** determines the angle (tech fit -> technical content, pain point match -> case study, budget signal -> ROI conversation).
   - **Available contact channels** determine the medium (LinkedIn presence -> LinkedIn, published email -> email, conference attendance -> event-based).
   - **Timing signals** determine urgency (recent funding -> approach within 2 weeks, job posting -> approach within 1 week, technology evaluation -> approach immediately).
5. Assign outreach priority order considering: score (40%), timing urgency (30%), contact accessibility (30%).
6. Generate ICP refinement suggestions by analyzing:
   - Scoring patterns across all candidates (which dimensions had the most variance?)
   - Historical conversion data (which dimensions correlate most with conversion?)
   - Near-miss leads (what single dimension change would qualify them?)

**Output:** Prioritized lead list with outreach approaches, ICP refinement suggestions.

**Quality gate:** Final lead count meets target_count (or loop-back triggered). Every lead has an outreach approach and priority rank. At least 1 ICP refinement suggestion generated.

### ACT: Deliver Results

**Entry criteria:** Prioritized lead list with outreach approaches finalized. ICP refinements identified.

**Actions:**
1. Format scored_lead_list with all required fields (company, score, dimensions, tier, contacts, approach, flags).
2. Format outreach_priorities as an ordered action list with recommended timing and channel per lead.
3. Format icp_refinement_suggestions with data-backed reasoning for each suggestion.
4. Update state persistence:
   - Add all output leads to past lead history with current timestamp.
   - Record ICP version increment if refinements are suggested.
   - Store scoring distribution statistics for trend analysis.
5. Generate summary statistics: total candidates evaluated, pass rate, average score, tier distribution.

**Output:** Complete output package (scored_lead_list, outreach_priorities, icp_refinement_suggestions) plus state update confirmation.

**Quality gate:** Output contains exactly target_count leads (or all qualified leads if fewer exist, with explanation). Every lead has all required fields populated. State persistence confirmed.

## Exit Criteria

The skill is DONE when:
1. scored_lead_list contains target_count leads (or all available qualified leads with a gap explanation).
2. Every lead has a composite score, dimension breakdown, fit tier, and outreach approach.
3. outreach_priorities are ordered and each entry has timing and channel recommendations.
4. At least one icp_refinement_suggestion is provided with supporting data.
5. Past lead history state has been updated with the new leads.
6. No duplicates exist between output leads and exclusion_list or past lead history.

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | ICP definition has fewer than 3 dimensions | **Adjust** -- prompt user for missing dimensions; if only 2 available, proceed with warning that scoring will be less discriminating |
| OBSERVE | Past lead history is corrupted or unavailable | **Skip** -- proceed without duplicate checking, warn that duplicates may occur |
| REASON | No candidates score above 60 (moderate fit) | **Adjust** -- loop back to OBSERVE with relaxed parameters (increase size range by 50%, add adjacent industries) |
| REASON | More than 30% of candidates are on exclusion list | **Escalate** -- market may be saturated, recommend ICP pivot |
| PLAN | Insufficient leads to meet target_count after 2 OBSERVE loops | **Abort** -- deliver available leads with explanation, recommend ICP broadening |
| ACT | State persistence fails | **Skip** -- deliver results anyway, warn that duplicate tracking may be affected next run |

## State Persistence

This skill maintains persistent state across executions:
- **past_leads**: Array of {company, score, date_contacted, conversion_outcome} -- grows with each execution
- **icp_versions**: Array of ICP snapshots with timestamps -- tracks how the ICP evolves
- **scoring_distributions**: Historical score distributions per execution -- enables trend analysis
- **conversion_feedback**: When provided, maps lead scores to actual conversion outcomes for ICP refinement

State is keyed by ICP identity (hash of industry + employee_range + primary tech requirement). Different ICPs maintain separate state.

## Reference

### ICP Scoring Framework

The weighted multi-dimension scoring model is based on the BANT+T framework extended for modern B2B:

| Dimension | Weight | Scoring Criteria | Data Sources |
|---|---|---|---|
| Industry | 25% | Exact match, adjacent, unrelated | Company profile, SIC/NAICS codes |
| Company Size | 20% | Within range, growth trajectory | Employee count, headcount growth rate |
| Tech Stack | 25% | Required tech present, in evaluation, absent | Job postings, GitHub activity, tech blog |
| Team Size | 15% | Meets minimums per department | LinkedIn headcount, org chart data |
| Budget Signal | 15% | Funding stage, ARR indicators, tech spend | Funding announcements, financial filings |

### Fit Tier Definitions

- **Perfect (90-100):** Matches all ICP dimensions. High confidence in qualification. Prioritize for immediate outreach.
- **Strong (75-89):** Matches most dimensions with minor gaps. Worth pursuing with tailored approach addressing gaps.
- **Moderate (60-74):** Matches core dimensions but has notable gaps. Include in outreach but with lower priority and adjusted messaging.
- **Weak (below 60):** Fails to match multiple dimensions. Do not include in outreach unless market is extremely constrained.

### Outreach Approach Selection Matrix

| Strongest Dimension | Recommended Angle | Example Hook |
|---|---|---|
| Tech Stack | Technical content, POC offer | "I noticed your team is running K8s at scale -- here's how [Company] reduced deployment incidents by 60%" |
| Pain Point | Case study, problem framing | "Companies in [industry] typically spend 40% of eng time on [pain point] -- here's what [similar company] did" |
| Budget Signal | ROI conversation, business case | "With your recent Series C, you're likely scaling infrastructure -- here's the unit economics of [solution]" |
| Team Size | Workflow/productivity angle | "Teams of 50+ engineers typically hit [specific bottleneck] -- we've seen 3x improvement in [metric]" |
| Industry | Vertical expertise, compliance | "We work with 12 companies in [industry] -- here are the 3 patterns we see in [specific challenge]" |

### ICP Refinement Signals

When suggesting ICP changes, look for these patterns:
1. **Consistent near-misses**: If many leads score 70-79, identify which single dimension upgrade would push them to 80+. Consider relaxing that dimension.
2. **Conversion correlation**: If leads that scored low on one dimension but converted anyway, that dimension may be over-weighted.
3. **Market exhaustion**: If the same search yields fewer new leads each cycle, the addressable market for this ICP may be saturated. Suggest adjacent expansions.
4. **Emerging segments**: If a cluster of high-scoring leads shares a characteristic not in the ICP, consider adding it.

### Duplicate Detection Rules

A lead is considered a duplicate if:
- Exact company name match (after normalization: lowercase, strip suffixes)
- Domain match (company.com variants)
- Same company contacted within the last 90 days (configurable cooldown period)
- Parent/subsidiary of an excluded company

Copyright 2024-present The Wayfinder Trust. All rights reserved.
