# Acquisition LOI

**One-line description:** Seller and buyer each submit their real valuation expectations, deal structure preferences, and post-close plans before a letter of intent — AI quantifies the gap and drafts opening term sheet language.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both seller and buyer must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company being acquired.
- `shared_deal_type` (string, required): e.g., "Full acquisition," "Majority stake," "Asset purchase."

### Seller Submits Privately
- `seller_valuation_expectation` (object, required): Your valuation expectation and what justifies it. What multiple are you expecting and why?
- `seller_non_negotiables` (array, required): What terms are non-negotiable for you?
- `seller_concerns_about_buyer` (array, required): What are you worried about with this buyer?
- `seller_post_close_expectations` (object, required): What do you expect post-close? Role, earnout, transition period, involvement?
- `seller_what_they_need_to_feel_good_about_the_deal` (string, required): Beyond the number — what else do you need to feel good about this?

### Buyer Submits Privately
- `buyer_valuation_view` (object, required): Your valuation view and the methodology behind it.
- `buyer_deal_structure_preference` (object, required): Cash at close, earnout, equity rollover — what structure do you prefer and why?
- `buyer_due_diligence_concerns` (array, required): What are your biggest concerns from diligence or initial conversations?
- `buyer_post_close_plans` (object, required): What happens to the company, team, and seller post-close?
- `buyer_non_negotiables` (array, required): What deal terms are non-negotiable?

## Outputs
- `valuation_gap` (object): The gap between seller's expectation and buyer's view, with bridging options (earnout, equity rollover, structure changes).
- `structure_alignment` (object): Where deal structure preferences are compatible.
- `deal_breaker_map` (array): Non-negotiable conflicts on both sides.
- `post_close_alignment` (object): Whether seller's post-close expectations and buyer's post-close plans are compatible.
- `loi_term_sheet_draft` (object): Opening term sheet language covering price, structure, earnout (if applicable), representations, exclusivity period.
- `negotiation_priorities` (array): The 3-5 items to resolve before LOI execution.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm valuation fields and non-negotiables present from both sides.
**Output:** Readiness confirmation.
**Quality Gate:** Valuation and non-negotiables present from both sides.

---

### Phase 1: Quantify the Valuation Gap
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Extract seller's valuation expectation and methodology. 2. Extract buyer's valuation view and methodology. 3. Calculate the gap — absolute dollar difference and multiple difference. 4. Assess whether the gap is bridgeable with structure (earnout, rollover) or requires a fundamental reset.
**Output:** Valuation gap with specific numbers, bridging options.
**Quality Gate:** Gap is stated in dollars and multiples, not percentages only.

---

### Phase 2: Map Structure and Post-Close Compatibility
**Entry Criteria:** Valuation gap quantified.
**Actions:** 1. Compare deal structure preferences — are they compatible? 2. Compare seller's post-close expectations to buyer's post-close plans. This is often the hidden dealbreaker in founder acquisitions. 3. Identify non-negotiable conflicts on both sides. 4. Note buyer's diligence concerns and whether they affect valuation.
**Output:** Structure compatibility, post-close conflict map, non-negotiable conflicts, diligence impact.
**Quality Gate:** Post-close conflict is named if seller expects continued involvement the buyer doesn't plan to offer.

---

### Phase 3: Draft the Term Sheet
**Entry Criteria:** Compatibility mapped.
**Actions:** 1. Draft enterprise value range based on bridging the gap. 2. Draft deal structure with options: all-cash vs. cash + earnout vs. cash + rollover. 3. Draft earnout terms if applicable: metrics, timeline, caps. 4. Draft exclusivity period. 5. Note representations and warranties approach. 6. List items for further diligence before LOI.
**Output:** Term sheet draft with valuation range, structure options, earnout terms, exclusivity, diligence list.
**Quality Gate:** Term sheet is specific enough for lawyers to use as a starting point.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Term sheet drafted.
**Actions:** 1. Present valuation gap with bridging options. 2. Present structure alignment. 3. Name dealbreaker conflicts. 4. Present post-close compatibility. 5. Deliver term sheet draft. 6. List negotiation priorities.
**Output:** Full synthesis — valuation gap, structure, dealbreakers, post-close, term sheet, priorities.
**Quality Gate:** Both sides know what the path to LOI looks like and what needs to be resolved.

---

## Exit Criteria
Done when: (1) valuation gap in dollars and multiples, (2) bridging options presented, (3) dealbreaker conflicts named, (4) post-close compatibility assessed, (5) term sheet covers price, structure, and earnout.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Seller expects to remain as CEO; buyer plans to replace leadership at close | Name this as a potential dealbreaker. Many founder acquisitions fail at this point. |
| Phase 3 | Valuation gap is unbridgeable with structure alone | State clearly: "A gap of this size cannot be bridged with structure. Either the valuation expectation or the valuation methodology needs to change before an LOI is viable." |

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
