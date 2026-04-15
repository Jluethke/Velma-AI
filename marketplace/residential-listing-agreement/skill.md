# Residential Listing Agreement

**One-line description:** The seller and the listing agent each submit their real pricing views, timeline needs, and expectations for the relationship — AI aligns on a listing price, marketing plan, and agent agreement that gives the seller realistic expectations and the agent a workable engagement.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both seller and agent must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_property_address` (string, required): Property address.
- `shared_target_list_price` (string, required): Seller's desired list price or range.

### Seller Submits Privately
- `seller_financial_requirements` (object, required): Net proceeds needed, mortgage payoff, what you need to walk away with to make the move work financially.
- `seller_timeline` (string, required): When you need to close — driven by new home purchase, relocation, financial need, or flexibility.
- `seller_concerns_about_the_market` (array, required): What worries you — price, time on market, condition of home, buyer pool, competing listings?
- `seller_what_they_expect_from_the_agent` (array, required): Communication frequency, marketing approach, showings, negotiation style — what you need from this relationship.
- `seller_what_they_will_not_do` (array, required): Price reductions you will refuse, repairs you will not make, access restrictions — what your limits are.

### Listing Agent Submits Privately
- `agent_cma_and_pricing_opinion` (object, required): Comparative market analysis — what the home is worth at current conditions, recommended list price, expected sale price range.
- `agent_marketing_plan` (object, required): How you will market this home — professional photography, staging, MLS, digital, open houses, buyer agent outreach.
- `agent_timeline_assessment` (string, required): At the proposed price, how long do you expect this to take? What does the absorption rate say?
- `agent_concerns_about_the_listing` (object, required): What will make this hard — overpricing, condition issues, location, seller restrictions, competing inventory?
- `agent_commission_and_terms` (object, required): Commission rate, listing term, exclusive right to sell, cancelation provisions.

## Outputs
- `pricing_alignment_assessment` (object): Where seller's pricing expectations and market reality align — with the honest gap if there is one.
- `listing_price_recommendation` (object): Recommended list price with the rationale, sale price expectation, and days-on-market estimate.
- `marketing_plan` (object): Specific marketing activities, timeline, budget, what the agent commits to do.
- `seller_net_proceeds_projection` (object): Estimated net after commission, closing costs, and any concessions at the expected sale price.
- `agent_agreement_terms` (object): Commission, listing term, cancelation terms, seller obligations.
- `expectations_alignment` (object): Where seller expectations match market reality and where they need to be recalibrated before listing.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm seller's financial requirements and agent's CMA present.
**Output:** Readiness confirmation.
**Quality Gate:** Seller's net proceeds need and agent's pricing opinion both present.

---

### Phase 1: Assess Pricing and Expectations
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare seller's desired price against agent's CMA — is the seller's expectation realistic? 2. Check whether the seller's net proceeds requirement is achievable at the market price. 3. Identify what concerns will make this listing difficult — condition, timeline, restrictions. 4. Assess whether the agent's marketing plan matches what the seller expects.
**Output:** Price reality check, net proceeds feasibility, listing challenges, marketing alignment.
**Quality Gate:** Price gap is specific — "seller wants $X; CMA supports $Y; at $X the home will sit; at $Y seller nets $Z, which covers proceeds requirement."

---

### Phase 2: Build the Listing Strategy
**Entry Criteria:** Assessment done.
**Actions:** 1. Set the list price strategy — right-price to sell, high-to-low if seller insists. 2. Build the marketing plan — specific activities, timeline, budget, what the agent commits in writing. 3. Define the price reduction plan — at what days-on-market triggers a price review conversation. 4. Build the net proceeds projection at expected sale price.
**Output:** List price strategy, marketing plan, price review triggers, net proceeds projection.
**Quality Gate:** Marketing plan has specific activities with timing. Net proceeds projection shows line-by-line costs.

---

### Phase 3: Set Expectations and Terms
**Entry Criteria:** Strategy built.
**Actions:** 1. Define the agent agreement terms — commission, listing term, exclusivity, cancelation. 2. Align seller's expectations on timeline and price — if they will not reduce, they need to understand the consequence. 3. Define showing and access requirements — what the seller must do to allow the home to be shown effectively. 4. Define the communication plan — how often, what format, what requires a call vs. a text.
**Output:** Agent agreement terms, expectation alignment, showing requirements, communication plan.
**Quality Gate:** Every expectation recalibration is explicit — not "the market may be challenging" but "at your required price, median days on market is X and we may need to reduce."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Terms set.
**Actions:** 1. Present pricing alignment assessment. 2. Deliver list price recommendation. 3. Deliver marketing plan. 4. Deliver net proceeds projection. 5. Present agent agreement terms and expectations alignment.
**Output:** Full synthesis — pricing, marketing plan, net proceeds, agent terms, expectations.
**Quality Gate:** Seller knows the realistic price, what the agent will do, and what they will walk away with.

---

## Exit Criteria
Done when: (1) price expectation is aligned with market reality, (2) net proceeds feasibility confirmed, (3) marketing plan has specific commitments, (4) price review triggers defined, (5) agent agreement terms are specific.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
