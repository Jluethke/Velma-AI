# Small Business Exit Planning

**One-line description:** The owner and their exit advisor each submit their real goals, timeline, and the business's actual saleability — Claude produces an exit strategy that matches what the owner wants with what the market will pay, and builds the preparation roadmap to close the gap.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both owner and advisor must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_business_name` (string, required): Business name.
- `shared_target_exit_timeline` (string, required): When the owner wants to exit.

### Business Owner Submits Privately
- `owner_exit_goals` (object, required): What does a successful exit look like — price, timing, what happens to employees and customers, personal financial needs from the transaction?
- `owner_view_of_business_value` (object, required): What do you think the business is worth and why? What have you heard from others?
- `owner_what_they_know_will_be_problems` (array, required): What will a buyer find that you are not proud of — customer concentration, owner-dependency, weak financials, deferred maintenance?
- `owner_what_must_be_true_post_exit` (array, required): Legacy requirements — what happens to employees, what the brand stands for, whether the owner stays involved.
- `owner_emotions_about_exit` (string, required): How do you actually feel about selling? Ready, ambivalent, dreading it? This affects how you negotiate.

### Advisor / Broker Submits Privately
- `advisor_market_valuation_range` (object, required): What is this business worth in the current market — range, multiples, comparable transactions?
- `advisor_saleability_assessment` (object, required): How sellable is this business — who are the buyers, how deep is the market, what are the obstacles to sale?
- `advisor_value_gap_analysis` (array, required): What is depressing value that the owner could fix before going to market?
- `advisor_recommended_exit_path` (object, required): Strategic sale, financial buyer, management buyout, ESOP — what fits this owner's goals and this business's profile?
- `advisor_realistic_timeline` (string, required): How long does this actually take — prep, market, diligence, close?

## Outputs
- `exit_readiness_assessment` (object): Where the business stands today vs. where it needs to be for the target exit.
- `value_gap_and_enhancement_plan` (array): Specific actions that increase sale value before going to market — with estimated value impact and time to implement.
- `exit_path_recommendation` (object): Which exit path fits the owner's goals, timeline, and business profile — with the trade-offs.
- `buyer_universe` (object): Who the likely buyers are — strategic, financial, management — and what each values most.
- `exit_preparation_roadmap` (object): The specific steps, in sequence, from today to close — what to fix, what to document, when to engage a broker.
- `personal_financial_planning_flags` (array): Tax, estate, and reinvestment considerations the owner needs to address with their CPA and attorney before signing.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm owner's goals and advisor's market assessment present.
**Output:** Readiness confirmation.
**Quality Gate:** Owner's exit goals and advisor's valuation range both present.

---

### Phase 1: Assess Exit Readiness and Expectations
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare owner's valuation expectation against advisor's market range — is the expectation realistic? 2. Assess the value gap items — what is depressing value and how fixable is each item? 3. Evaluate how the owner's legacy requirements affect the buyer universe and deal structure. 4. Assess whether the owner's emotional readiness matches the timeline — someone ambivalent about selling rarely closes.
**Output:** Expectation alignment, value gap severity, legacy constraint impact, emotional readiness assessment.
**Quality Gate:** Expectation gap is specific — "owner expects $2.5M, market supports $1.6M–$1.9M based on 4x EBITDA with current owner dependency discount."

---

### Phase 2: Design the Exit Path
**Entry Criteria:** Readiness assessed.
**Actions:** 1. Evaluate each exit path against the owner's goals — strategic sale, financial buyer, MBO, ESOP — and what each realistically produces. 2. Identify the value enhancement actions that move the business up the range — and the timeline impact of each. 3. Build the buyer universe — who is most likely to pay the most and why. 4. Assess whether the timeline is realistic with vs. without value enhancement work.
**Output:** Exit path recommendation with trade-offs, value enhancement plan, buyer universe, timeline with/without prep.
**Quality Gate:** Exit path recommendation is specific — "financial buyer at 3.5x EBITDA in 18 months vs. strategic buyer at 5x EBITDA in 30 months with 12 months of prep." Not "consider multiple options."

---

### Phase 3: Build the Roadmap
**Entry Criteria:** Path designed.
**Actions:** 1. Build the preparation roadmap — what to fix, what to document, what to professionalize, and in what sequence. 2. Define the go-to-market timeline — when to engage buyers, how, and what the process looks like. 3. Flag personal financial planning issues — tax treatment, estate planning, proceeds reinvestment — that need professional attention before signing. 4. Define what success looks like at each milestone.
**Output:** Preparation roadmap, go-to-market timeline, personal planning flags, milestone definitions.
**Quality Gate:** Roadmap has specific actions with owners and timing. Not "improve financials" — "hire part-time CFO to produce clean GAAP statements by Q3."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Roadmap built.
**Actions:** 1. Present exit readiness assessment. 2. Deliver value gap and enhancement plan. 3. Deliver exit path recommendation. 4. Deliver exit preparation roadmap. 5. Present personal financial planning flags.
**Output:** Full synthesis — readiness, value gap, exit path, roadmap, personal planning.
**Quality Gate:** Owner knows what the business is worth today, what it could be worth with prep, what the path is, and what they need to do in the next 90 days.

---

## Exit Criteria
Done when: (1) expectation gap is specific, (2) value enhancement plan has specific actions and estimated impact, (3) exit path is specific with trade-offs, (4) roadmap has sequenced actions, (5) personal planning flags identified.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
