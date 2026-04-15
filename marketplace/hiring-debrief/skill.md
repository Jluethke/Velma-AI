# Hiring Debrief

**One-line description:** Hiring manager and candidate each submit their honest read after an interview — AI maps the real mutual interest, surfaces the unspoken concerns, and says what it would actually take to close.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both hiring manager and candidate must submit before synthesis runs.

---

## Inputs

### Shared (visible to both before submitting)
- `shared_role` (string, required): Job title.
- `shared_company` (string, required): Company name.
- `shared_interview_stage` (string, required): e.g., "First round," "Final round," "Post-panel debrief."

### Hiring Manager Submits Privately
- `manager_assessment` (object, required): Honest assessment of the candidate. Strengths, gaps, and the specific evidence behind each.
- `manager_concerns` (array, required): Your real concerns — not what you'd say to HR, what you actually think.
- `manager_lean` (string, required): "Strong yes," "leaning yes," "undecided," "leaning no," or "no." Be direct.
- `manager_what_would_close_it` (string, required): If you're not a strong yes — what would make you one? What specific thing are you waiting to see?

### Candidate Submits Privately
- `candidate_impression` (object, required): Your honest impression of the role, team, and company from what you've seen.
- `candidate_concerns` (array, required): What concerns you about this role or company? The things you haven't said out loud.
- `candidate_interest_level` (string, required): "Very interested," "interested but have questions," "considering it," or "unlikely to accept." Be honest.
- `candidate_what_they_need_to_say_yes` (string, required): What specific things — compensation, clarity, culture, growth, flexibility — would you need to accept an offer?

## Outputs
- `mutual_interest_map` (object): The real interest level on both sides and whether it's matched.
- `manager_concern_vs_candidate_reality` (array): The manager's unvoiced concerns, with context on how the candidate's actual background or answers address or confirm them.
- `candidate_concerns_vs_role_reality` (array): The candidate's unvoiced concerns, with whether they're likely valid based on what the manager shared.
- `close_gap` (object): The specific gap between what each side needs to move forward, and whether it's bridgeable.
- `next_step_recommendation` (string): Whether to move forward, what the next step should be, and what to address directly.
- `offer_strategy` (object): If moving toward an offer — what terms and framing would be most likely to get a yes based on what the candidate actually needs.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both hiring manager and candidate have submitted.

**Actions:**
1. Confirm `manager_lean` and `candidate_interest_level` are present — these are the mutual interest baseline.
2. Confirm `manager_what_would_close_it` and `candidate_what_they_need_to_say_yes` are present.

**Output:** Readiness confirmation.

**Quality Gate:** All four core fields present.

---

### Phase 1: Map the Mutual Interest
**Entry Criteria:** Both submissions confirmed.

**Actions:**
1. Extract and compare interest levels on both sides.
2. Identify the mutual interest state: strong on both sides / strong on one side / weak on both / mismatched.
3. Mismatched interest is the most important finding — a manager who is a strong yes pursuing a candidate who is unlikely to accept wastes both sides' time.

**Output:** Mutual interest map with misalignment flag if present.

**Quality Gate:** Interest levels are stated directly. Mismatches are flagged prominently.

---

### Phase 2: Surface the Unvoiced Concerns
**Entry Criteria:** Mutual interest mapped.

**Actions:**
1. Extract the manager's real concerns and assess how addressable they are given the candidate's background.
2. Extract the candidate's unvoiced concerns and assess whether they're likely valid based on what the manager shared.
3. Identify concerns on both sides that could be resolved in a direct conversation but weren't raised in the interview.
4. Flag any concern that is a likely dealbreaker if not addressed.

**Output:** Concern maps for both sides with addressability ratings and dealbreaker flags.

**Quality Gate:** Every concern is assessed for addressability. Dealbreakers are named.

---

### Phase 3: Build the Close Strategy
**Entry Criteria:** Concerns surfaced.

**Actions:**
1. Identify the close gap: what each side needs to move forward and whether those needs are compatible.
2. If interest is mutual and concerns are addressable: draft an offer strategy based on what the candidate said they need to say yes.
3. If there's a meaningful concern on either side: draft the specific conversation that needs to happen before next steps.
4. If interest is not mutual: recommend stopping and explain why continuing wastes both sides' time.

**Output:** Close gap assessment, next step recommendation, offer strategy (if applicable).

**Quality Gate:** Offer strategy reflects what the candidate actually said they need — not generic market data.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Close strategy built.

**Actions:**
1. Open with the mutual interest map.
2. Present the manager's concerns with context.
3. Present the candidate's concerns with context.
4. Present the close gap.
5. Deliver the next step recommendation clearly.
6. Deliver the offer strategy if applicable.

**Output:** Full synthesis — mutual interest, concerns, close gap, next step, offer strategy.

**Quality Gate:** Both sides understand what the other actually thinks. The recommendation is specific and actionable.

---

## Exit Criteria
Done when: (1) mutual interest mapped on both sides, (2) unvoiced concerns surfaced with addressability ratings, (3) dealbreakers identified, (4) close gap assessed, (5) next step recommendation is specific, (6) offer strategy addresses candidate's stated needs.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Manager is strong yes, candidate is unlikely to accept | Flag this as a mismatched interest situation. Recommend the company have a direct conversation with the candidate before investing further. |
| Phase 3 | Candidate's needs (compensation, flexibility) are outside what the company can offer | Name the gap explicitly. Proceeding without addressing this is likely to result in an offer decline. |

## State Persistence
- Hiring history (track candidate journey and outcomes)
- Concern pattern tracking (recurring concerns by role type)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
