# SWOT Action Planner

Transform SWOT analysis inputs into a prioritized, trackable action plan by cross-referencing strengths, weaknesses, opportunities, and threats using the TOWS matrix, scoring strategies by impact, feasibility, and urgency, and producing a structured action plan with owners, timelines, and success metrics.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Gather SWOT inputs (strengths, weaknesses, opportunities, threats)
REASON  --> Cross-reference: SO strategies, WO strategies, ST strategies, WT strategies
PLAN    --> Prioritize actions by impact x feasibility x urgency
ACT     --> Output: prioritized action plan with owners, timelines, success metrics
     \                                                              /
      +--- Execution results or SWOT changes --- loop to OBSERVE ---+
```

## Inputs

- `swot_inputs`: object -- Strengths, Weaknesses, Opportunities, and Threats lists. Each item should be specific and actionable (not vague)
- `business_context`: object -- Company stage, industry, size, current strategy, and key objectives
- `resource_constraints`: object -- Budget, team capacity, timeline constraints, and risk tolerance
- `strategic_goals`: array -- Top-level goals that the SWOT-derived actions should support (revenue target, market position, etc.)

## Outputs

- `swot_matrix`: object -- Validated SWOT with quality assessment and gap identification
- `tows_strategies`: object -- Cross-referenced strategies: SO (maxi-maxi), WO (mini-maxi), ST (maxi-mini), WT (mini-mini) with specific strategy per combination
- `prioritized_actions`: array -- All strategies scored and ranked by impact x feasibility x urgency
- `action_plan`: object -- Top 5-7 actions with owner, timeline, steps, success metrics, and budget

---

## Execution

### OBSERVE: Gather and Validate SWOT Inputs

**Entry criteria:** SWOT inputs are provided with at least 2 items per category.

**Actions:**

1. **Validate SWOT quality:**
   ```
   Per item, check:
   - Is it specific? "Strong team" is vague. "3 senior ML engineers
     with 10+ years experience" is specific.
   - Is it evidence-based? "We think the market is growing" vs
     "Market growing 25% YoY per [source]"
   - Is it correctly categorized? Strengths/Weaknesses are INTERNAL.
     Opportunities/Threats are EXTERNAL.
   - Is it actionable? Can a strategy be built around it?
   ```

2. **Assess SWOT balance:**
   ```
   Healthy SWOT:
   - 3-6 items per category (not 1, not 15)
   - Internal (S+W) balanced with External (O+T)
   - Not all positive or all negative
   - Multiple dimensions covered (product, team, market, finance, operations)
   
   Common biases to check:
   - Strengths overweighted (optimism bias)
   - Threats underweighted (confirmation bias)
   - Weaknesses framed as external (blame shifting)
   - Opportunities confused with goals
   ```

3. **Identify SWOT gaps:**
   ```
   Missing dimensions to probe:
   - Financial position (strength or weakness?)
   - Team and talent (strength or weakness?)
   - Technology/product (strength or weakness?)
   - Customer relationships (strength or weakness?)
   - Market trends (opportunity or threat?)
   - Regulatory environment (opportunity or threat?)
   - Competitive dynamics (opportunity or threat?)
   ```

4. **Label each item with a unique ID** (S1, S2, W1, W2, O1, O2, T1, T2) for cross-referencing.

5. **Load previous SWOT if available:**
   - Which items are new?
   - Which items were previously identified and addressed (or not)?
   - Has the competitive situation changed?

**Output:** Validated, labeled SWOT matrix with quality assessment, gap notes, and comparison to prior SWOT (if available).

**Quality gate:** Each category has at least 2 specific, evidence-based items. Items are correctly categorized (internal vs external). No critical dimensions are missing.

---

### REASON: TOWS Cross-Reference Analysis

**Entry criteria:** Validated SWOT matrix is complete.

**Actions:**

1. **Build TOWS matrix by crossing each quadrant pair:**

   ```
   SO Strategies (Strengths x Opportunities) -- MAXI-MAXI:
     "How can we USE our strengths to CAPTURE these opportunities?"
     These are aggressive, growth-oriented strategies.
     For each S-O pair with strong connection, define a strategy.
   
   WO Strategies (Weaknesses x Opportunities) -- MINI-MAXI:
     "How can we FIX our weaknesses to CAPTURE these opportunities?"
     These are improvement strategies.
     For each W-O pair with strong connection, define a strategy.
   
   ST Strategies (Strengths x Threats) -- MAXI-MINI:
     "How can we USE our strengths to COUNTER these threats?"
     These are defensive strategies leveraging advantages.
     For each S-T pair with strong connection, define a strategy.
   
   WT Strategies (Weaknesses x Threats) -- MINI-MINI:
     "How can we MINIMIZE our weaknesses to AVOID these threats?"
     These are survival/protection strategies.
     For each W-T pair with strong connection, define a strategy.
   ```

2. **For each cross-reference, determine connection strength:**
   ```
   Strong: direct, actionable relationship (e.g., "our data science
     team [S] can build the AI product [O] the market wants")
   Moderate: indirect but meaningful relationship
   Weak: tangential connection, not worth a strategy
   None: no meaningful connection
   
   Only generate strategies for Strong and Moderate connections.
   Expect 8-15 strategies total (not every S-O combination matters).
   ```

3. **For each strategy, define:**
   ```
   - Which S/W/O/T items it crosses (IDs)
   - Strategy type: SO, WO, ST, or WT
   - Strategy statement: 1-2 sentences describing the approach
   - Key assumption: what must be true for this to work
   - Risk: what could go wrong
   ```

**Output:** TOWS matrix with 8-15 strategies, each linked to specific SWOT items, with assumptions and risks noted.

**Quality gate:** All four quadrants (SO, WO, ST, WT) have at least 2 strategies each. Each strategy has a clear link to specific SWOT items. No strategy is generic ("improve marketing") -- all are specific to the cross-referenced items.

---

### PLAN: Prioritize by Impact x Feasibility x Urgency

**Entry criteria:** TOWS strategies are complete.

**Actions:**

1. **Score each strategy on three dimensions (1-10):**

   ```
   IMPACT: How much does this move the needle on strategic goals?
     10: Game-changing (opens new market, 2x revenue potential)
     7-9: High impact (significant revenue, market position, or risk reduction)
     4-6: Moderate impact (meaningful improvement)
     1-3: Low impact (marginal improvement)
   
   FEASIBILITY: How achievable is this with current resources?
     10: Can do immediately with existing team and budget
     7-9: Achievable with minor additional resources
     4-6: Requires significant but available investment
     1-3: Requires major new capabilities, hiring, or capital
   
   URGENCY: How time-sensitive is the window?
     10: Must act this quarter or opportunity/threat window closes
     7-9: Should act this half (6 months)
     4-6: Important but not time-critical (12 months)
     1-3: Can wait, window is long
   ```

2. **Compute composite score:**
   ```
   Score = Impact * Feasibility * Urgency
   Max possible = 1000 (10 * 10 * 10)
   
   Alternative weighting (if strategic goals favor one dimension):
   Score = (Impact * W_i) * (Feasibility * W_f) * (Urgency * W_u)
   where W_i + W_f + W_u = 3 (normalized)
   
   Default: equal weights (W_i = W_f = W_u = 1)
   Growth mode: W_i = 1.5, W_f = 0.8, W_u = 0.7 (favor impact)
   Survival mode: W_u = 1.5, W_f = 1.0, W_i = 0.5 (favor urgency)
   ```

3. **Rank and tier:**
   ```
   Tier 1 -- DO NOW (top 3-5):  Score > 300, execute this quarter
   Tier 2 -- PLAN (next 3-5):   Score 150-300, plan for next quarter
   Tier 3 -- LATER (remaining):  Score < 150, revisit next planning cycle
   ```

4. **Resource allocation check:**
   ```
   For Tier 1 actions:
   - Total budget required vs available budget
   - Total team capacity required vs available
   - Dependencies between actions (sequence matters)
   - If over-allocated: drop lowest-scoring Tier 1 to Tier 2
   ```

5. **Validate strategic balance:**
   ```
   Check that Tier 1 includes:
   - At least 1 offensive strategy (SO or WO)
   - At least 1 defensive strategy (ST or WT)
   - Not all from the same quadrant
   
   If unbalanced: force-promote highest-scoring strategy from
   underrepresented quadrant into Tier 1
   ```

**Output:** All strategies ranked by composite score, tiered into DO NOW / PLAN / LATER, with resource allocation validated and strategic balance checked.

**Quality gate:** Scoring is justified (not arbitrary). Tier 1 fits within resource constraints. Strategic balance is maintained (mix of offensive and defensive).

---

### ACT: Generate Action Plan

**Entry criteria:** Prioritized, tiered strategy list is ready.

**Actions:**

1. **For each Tier 1 strategy, build a full action card:**
   ```
   ACTION: [Strategy name]
   Type: [SO / WO / ST / WT]
   SWOT Items: [S1 x O2, etc.]
   
   Owner: [specific person or role]
   Timeline: [start date - end date]
   Budget: [$amount]
   
   Steps:
     Week 1-2: [specific action]
     Week 3-4: [specific action]
     Week 5-8: [specific action]
     Week 9-12: [specific action]
   
   Success Metrics:
     - [Quantitative metric with target]
     - [Quantitative metric with target]
     - [Qualitative milestone]
   
   Dependencies:
     - [What must happen first]
     - [What this enables]
   
   Risks:
     - [What could go wrong and mitigation]
   
   Kill Criteria:
     - [Condition under which to abandon this action]
   ```

2. **Create Tier 2 planning briefs:**
   ```
   For each Tier 2 strategy: 1-paragraph brief with:
   - What it is and why it matters
   - What needs to happen before it can start
   - Estimated timeline and budget
   - Trigger: what event would promote it to Tier 1
   ```

3. **Build the summary dashboard:**
   ```
   SWOT ACTION PLAN -- [Quarter/Period]
   
   Tier 1 Actions:          [count]
   Total Budget:            $[amount]
   Key Strategic Themes:    [2-3 themes across actions]
   
   Offensive Actions:       [count] (SO + WO)
   Defensive Actions:       [count] (ST + WT)
   
   Review Cadence:          [monthly/quarterly]
   Next SWOT Refresh:       [date]
   ```

4. **Set up tracking cadence:**
   ```
   Monthly: Review progress on each Tier 1 action
     - Are milestones being hit?
     - Are success metrics trending in the right direction?
     - Any blockers or resource conflicts?
     - Should any Tier 2 items be promoted?
   
   Quarterly: Full SWOT refresh
     - Did any strengths erode or strengthen?
     - Were weaknesses addressed?
     - Are opportunities still open?
     - Did new threats emerge?
     - Re-run TOWS with updated inputs
   ```

**Output:** Complete action plan with Tier 1 action cards, Tier 2 briefs, summary dashboard, and tracking cadence.

**Quality gate:** Every Tier 1 action has an owner, timeline, budget, specific steps, and measurable success metrics. Tier 2 actions have trigger conditions for promotion. Review cadence is set.

---

**Loop condition:** After ACT, loop back to OBSERVE when:
- A quarterly SWOT refresh is due (new data available)
- A major event changes the SWOT landscape (competitor move, market shift, internal change)
- A Tier 1 action is completed or killed (resources freed for Tier 2 promotion)
- Monthly review reveals that priorities need rebalancing

## Exit Criteria

The skill is DONE when:
- SWOT is validated with quality assessment and gap check
- TOWS cross-reference produces strategies for all four quadrants (SO, WO, ST, WT)
- All strategies are scored and tiered (DO NOW / PLAN / LATER)
- Tier 1 actions have complete action cards with owners, timelines, steps, and success metrics
- Strategic balance is confirmed (mix of offensive and defensive)
- Review and refresh cadence is established

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | SWOT inputs are vague ("good team", "bad market") | **Adjust** -- ask clarifying questions, request specific evidence for each item |
| OBSERVE | One category has <2 items | **Adjust** -- probe for missing items using the dimension checklist, flag if genuinely thin |
| OBSERVE | Items are miscategorized (external in internal) | **Adjust** -- re-categorize with explanation, note correction |
| REASON | Too many strategies generated (>20) | **Adjust** -- filter to Strong connections only, merge overlapping strategies |
| REASON | One TOWS quadrant has no strategies | **Adjust** -- force at least 1 strategy by examining weakest connections; if truly none, document why |
| PLAN | All high-scoring strategies exceed budget | **Adjust** -- break strategies into smaller, funded increments; identify minimum viable version |
| PLAN | Team can't agree on scoring | **Escalate** -- present 2-3 scoring scenarios with different weightings, let decision-maker choose |
| ACT | No clear owner for an action | **Escalate** -- action without owner will not execute; flag as blocker |
| ACT | User rejects final output | **Targeted revision** -- ask which strategy, action item, or scoring fell short and rerun only that phase. Do not re-run the full SWOT analysis. |

## State Persistence

Between runs, this skill saves:
- **SWOT history**: previous SWOT analyses with timestamps (track evolution)
- **Strategy outcomes**: which strategies were executed, results achieved, lessons learned
- **Action status**: Tier 1 actions with progress tracking (pending, in-progress, completed, killed)
- **Scoring calibration**: historical accuracy of impact/feasibility/urgency scores vs actual outcomes
- **SWOT item lifecycle**: items that persist across multiple SWOTs (chronic weaknesses, ongoing threats)

---

## Reference

### TOWS Matrix Framework

```
                    INTERNAL
                    Strengths (S)         Weaknesses (W)
              +---------------------+---------------------+
  EXTERNAL    |                     |                     |
  Opportu-    |  SO Strategies      |  WO Strategies      |
  nities (O)  |  (Maxi-Maxi)        |  (Mini-Maxi)        |
              |  USE strengths to   |  FIX weaknesses to  |
              |  CAPTURE             |  CAPTURE             |
              |  opportunities      |  opportunities      |
              +---------------------+---------------------+
  Threats (T) |                     |                     |
              |  ST Strategies      |  WT Strategies      |
              |  (Maxi-Mini)        |  (Mini-Mini)        |
              |  USE strengths to   |  MINIMIZE weaknesses|
              |  COUNTER threats    |  to AVOID threats   |
              |                     |                     |
              +---------------------+---------------------+

SO = Aggressive/Growth strategies (best case -- leverage advantage)
WO = Improvement strategies (invest to capture)
ST = Defensive strategies (protect with strengths)
WT = Survival strategies (minimize exposure, protect downside)
```

### Common SWOT Mistakes

```
1. VAGUE ITEMS:
   Bad:  "Good team"
   Good: "3 senior ML engineers with 10+ years experience each,
         capable of building production AI systems"
   
   Bad:  "Market is competitive"
   Good: "3 competitors with >$50M funding each entered our
         segment in the last 12 months"

2. MISCLASSIFICATION:
   "Our customers don't want to pay more" is a THREAT (external),
   not a WEAKNESS (internal).
   
   "AI is disrupting our industry" is an OPPORTUNITY and a THREAT
   (can be both -- add to both categories).
   
   "We need to hire more engineers" is a WEAKNESS (internal gap),
   not a THREAT.

3. WISH-LISTING:
   Opportunities are EXTERNAL conditions, not things you want to do.
   
   Bad:  "Opportunity: build a mobile app"
   Good: "Opportunity: 60% of our users access via mobile,
         but we have no mobile-optimized experience"

4. IGNORING INTERACTIONS:
   SWOT items interact. A weakness that compounds a threat is
   more dangerous than either alone. The TOWS matrix captures this.

5. STATIC THINKING:
   SWOT is a snapshot. Refresh quarterly at minimum.
   Today's strength can become tomorrow's weakness (tech debt).
   Today's threat can become tomorrow's opportunity (regulation).
```

### Prioritization Scoring Guide

```
IMPACT Scoring:

Score 10: Directly achieves a top strategic goal
  Example: "Launch enterprise product" when #1 goal is revenue diversification
  
Score 7-8: Significantly advances a strategic goal
  Example: "Reduce CAC 30%" when goal is profitability
  
Score 4-6: Meaningful but incremental improvement
  Example: "Improve onboarding flow" -- helps retention but not transformative
  
Score 1-3: Marginal improvement, nice-to-have
  Example: "Update brand colors" -- no strategic impact

FEASIBILITY Scoring:

Score 10: Can start tomorrow with existing resources
  Example: "Launch marketing campaign" when content and budget exist
  
Score 7-8: Achievable with minor reallocation
  Example: "Build feature X" when engineering has capacity next sprint
  
Score 4-6: Requires significant but available investment
  Example: "Hire sales team" -- budget available but takes 3 months to hire
  
Score 1-3: Requires major new capabilities
  Example: "Enter Chinese market" -- need new team, legal, localization

URGENCY Scoring:

Score 10: Window closes this quarter
  Example: "Apply for grant" with deadline next month
  
Score 7-8: Should act within 6 months
  Example: "Counter competitor launch" before they gain share
  
Score 4-6: Important but 12-month horizon
  Example: "Build partnership program" -- valuable but not time-critical
  
Score 1-3: Long-term, no time pressure
  Example: "International expansion" -- opportunity persists
```

### Action Plan Template

```
ACTION: [Name]
Type: [SO/WO/ST/WT]  |  SWOT: [Item IDs]
Owner: [Name/Role]   |  Budget: $[Amount]
Timeline: [Start] to [End]

STEPS:
  [ ] Week 1-2: ________________________________
  [ ] Week 3-4: ________________________________
  [ ] Week 5-8: ________________________________
  [ ] Week 9-12: _______________________________

SUCCESS METRICS:
  1. [Metric]: Target [value] by [date]
  2. [Metric]: Target [value] by [date]

DEPENDENCIES:
  - Requires: ________________________________
  - Enables: _________________________________

RISK & MITIGATION:
  Risk: ______________________________________
  Mitigation: ________________________________

KILL CRITERIA:
  Abandon if: ________________________________
  by [date]

STATUS: [ ] Not Started  [ ] In Progress  [ ] Complete  [ ] Killed
```

### SWOT Refresh Protocol

```
QUARTERLY REFRESH:
1. Review each existing item: still accurate? More/less important?
2. Add new items from the last 90 days
3. Remove items that are no longer relevant
4. Check if addressed weaknesses should be promoted to strengths
5. Check if captured opportunities should be removed
6. Check if countered threats are neutralized or evolved

TRIGGER-BASED REFRESH:
- Major competitor move (new product, pricing change, acquisition)
- Internal event (key hire, key departure, product launch, funding)
- Market event (regulation change, economic shift, technology disruption)
- Strategy failure (killed action, missed target, lost deal pattern)

ANNUAL DEEP REFRESH:
- Start from scratch (don't just update -- reassess from blank slate)
- Include perspectives from: leadership, IC contributors, customers, partners
- Benchmark against 12-months-ago SWOT: what did we predict correctly?
```

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
