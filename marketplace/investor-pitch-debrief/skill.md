# Investor Pitch Debrief

**One-line description:** Founder and investor each submit their real read after a pitch meeting — AI maps where the interest is genuine, what the real concerns are, and whether a deal is actually forming.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both founder and investor must submit before synthesis runs. Neither sees the other's input until the synthesis is shared.

---

## Inputs

### Shared (visible to both before submitting)
- `shared_company_name` (string, required): Company name.
- `shared_stage` (string, required): Pre-seed / seed / Series A / Series B / etc.
- `shared_round_size` (string, required): Target raise amount, e.g., "$2M."

### Founder Submits Privately
- `pitch_summary` (string, required): What did you present? Key points you made about traction, market, team, and vision.
- `ask` (object, required): Amount raising, use of funds, valuation expectation (if any).
- `use_of_funds` (object, required): How do you plan to use the capital? What milestones does it get you to?
- `traction` (object, required): Current metrics — revenue, users, growth rate, notable customers, whatever is most relevant.
- `concerns_about_the_meeting` (array, optional): What questions made you uncomfortable? What do you think the investor's real hesitation is?
- `ideal_investor_value` (object, optional): Beyond capital, what do you want from this investor? Network, expertise, intros, board support?

### Investor Submits Privately
- `interest_level` (string, required): Your honest read — "strong yes," "interested but need more info," "unlikely," or "passing." Be direct.
- `thesis_fit` (object, required): Does this company fit your thesis? Stage, sector, business model, team type?
- `investor_concerns` (array, required): What are your real concerns? Not what you said in the room — what you actually think.
- `information_gaps` (array, required): What would you need to see to move forward? What's missing?
- `terms_thinking` (object, optional): If you're interested, what terms are you thinking about? Valuation range, structure, pro-rata rights?
- `value_add` (object, optional): What specific value would you actually bring beyond capital? Be honest about what you can and can't deliver.

## Outputs
- `interest_alignment` (object): Whether the investor's stated interest matches the founder's read of the meeting, and what the gap means.
- `concern_map` (array): The investor's real concerns, surfaced directly, with context on how addressable each one is.
- `information_gaps` (array): Specific things the investor needs before moving forward — actionable for the founder.
- `terms_starting_point` (object): If interest is genuine, a starting point for terms conversation based on what both sides shared.
- `next_meeting_agenda` (object): A specific agenda for the next conversation, if one is warranted.
- `pass_risk_assessment` (object): If interest is "unlikely" or "passing," an honest assessment of whether this is a fit problem, a timing problem, or a specific addressable concern.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both founder and investor have submitted their Fabric session.

**Actions:**
1. Confirm interest_level (investor) and concerns_about_the_meeting (founder) are present.
2. Confirm investor_concerns is present — this is the most valuable output field and its absence significantly limits the synthesis.
3. Flag any absent required fields.

**Output:** Readiness confirmation or missing fields.

**Quality Gate:** interest_level and investor_concerns are both present. Without these, the synthesis value is significantly reduced.

---

### Phase 1: Assess the Real Interest Level
**Entry Criteria:** Both submissions confirmed sufficient.

**Actions:**
1. Extract the investor's honest interest level and thesis fit assessment.
2. Compare to the founder's read of the meeting. Is the founder over-reading or under-reading the investor's interest?
3. Note what the investor emphasized vs. what the founder thought landed well.
4. Identify the gap between what the investor said in the room and what they submitted privately — this gap is often the most valuable finding.

**Output:** Interest level assessment with founder-investor perception gap.

**Quality Gate:** Interest level is categorized clearly (strong / interested / unlikely / passing). Perception gap is quantified.

---

### Phase 2: Map the Real Concerns
**Entry Criteria:** Interest level assessed.

**Actions:**
1. Extract the investor's actual concerns from their private submission.
2. Categorize each concern:
   - **Addressable:** Something the founder can demonstrate, provide data for, or resolve.
   - **Structural:** A fundamental aspect of the business or market that the founder can't change (but might be able to reframe).
   - **Thesis mismatch:** This investor doesn't invest in this type of company — no amount of addressing concerns will change this.
3. Map concerns to the founder's stated concerns about the meeting. Did the founder correctly identify what the investor was worried about?
4. Extract the information gaps: what specific things would move the investor from "interested" to "yes"?

**Output:** Concern map with categories, addressability ratings, and information gap list.

**Quality Gate:** Every investor concern is categorized. Thesis mismatch concerns are named directly — don't let the founder waste time on a structural no.

---

### Phase 3: Build the Next-Step Recommendation
**Entry Criteria:** Concern map and information gaps complete.

**Actions:**
1. If interest is strong:
   - Draft next meeting agenda focused on the investor's specific information gaps.
   - Draft terms starting point based on what both sides shared.
2. If interested but needs more info:
   - Build a "diligence package" list — specific documents, metrics, or introductions that address each information gap.
   - Draft a follow-up email structure for the founder.
3. If unlikely or passing:
   - Distinguish: is this a fit problem (this investor isn't right for this company) or an addressable problem (specific concerns the founder could resolve)?
   - If thesis mismatch: recommend not pursuing further and explain why.
   - If addressable: outline what would need to change.
4. Assess pass risk: is there a risk the investor passes while still being polite? (The "we'll stay in touch" that means no.)

**Output:** Next-step recommendation with specific actions, terms starting point (if warranted), pass risk assessment.

**Quality Gate:** The founder knows exactly what to do after reading this. "Stay in touch" situations are named as what they are.

---

### Phase 4: Deliver the Debrief
**Entry Criteria:** Next-step recommendation complete.

**Actions:**
1. Open with the interest alignment — founder's read vs. investor's actual interest level.
2. Present the concern map. Be direct about which concerns are structural vs. addressable.
3. Present the information gap list as a specific action list for the founder.
4. Deliver the next-step recommendation with the agenda or diligence package.
5. If the investor is a pass, say so clearly. Don't bury it.
6. Close with one sentence: what the founder should do in the next 48 hours.

**Output:** Full debrief — interest alignment, concern map, information gaps, terms starting point, next-step recommendation, 48-hour action.

**Quality Gate:** The founder can make a clear decision about how much time to invest in this relationship. The investor's real view is represented accurately.

---

## Exit Criteria
Done when: (1) interest level gap between founder and investor is quantified, (2) every investor concern is categorized and rated for addressability, (3) information gap list is specific and actionable, (4) next-step recommendation is concrete (either an agenda or a clear pass rationale), (5) 48-hour action is identified.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Investor submitted "interested" but concerns list is long and fundamental | Interpret the signal honestly: a long list of fundamental concerns with "interested" language is usually a soft pass. Name this pattern. |
| Phase 2 | All concerns are thesis mismatches | Recommend not pursuing. This is not the right investor for this company at this stage. Be direct. |
| Phase 3 | Investor is interested but terms thinking is far from founder's expectations | Surface the gap now. A 3x valuation difference doesn't get better through more meetings — it needs a direct conversation. |
| Phase 4 | Founder clearly over-pitched and investor's concerns are about credibility | This is hard to say but needs to be said. Frame as "the investor's concerns suggest the pitch overclaimed in specific areas" and identify what was overclaimed. |

## State Persistence
- Investor relationship history (track meetings, reads, and outcomes)
- Concern pattern tracking (which concerns come up repeatedly across investors)
- Fundraising narrative evolution (how the pitch improves based on investor feedback)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
