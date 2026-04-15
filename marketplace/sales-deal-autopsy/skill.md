# Sales Deal Autopsy

**One-line description:** Sales rep and buyer each submit their honest account of a deal — AI reveals the real reason it went the way it did and the gap between what the rep thought was happening and what actually was.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both sales rep and buyer must submit before synthesis runs. This flow works for lost deals, won deals, and stalled deals.

---

## Inputs

### Shared (visible to both before submitting)
- `shared_company_name` (string, required): Buyer's company name.
- `shared_deal_description` (string, required): One sentence on what was being sold.
- `shared_outcome` (string, required): "Lost to competitor," "Lost to no-decision," "Won," or "Stalled."

### Sales Rep Submits Privately
- `rep_deal_narrative` (string, required): Your account of how this deal progressed. Key moments, conversations, and turning points as you saw them.
- `rep_loss_hypothesis` (string, required): What do you think was the real reason for the outcome? Be honest — not what you'd say in a CRM note.
- `rep_what_would_have_changed_it` (string, required): If you could replay it, what would you do differently?
- `rep_relationship_read` (object, required): How did you read the buyer's engagement? Who was the real champion? Who was blocking? What was the internal dynamic?

### Buyer Submits Privately
- `buyer_real_reason` (string, required): What was the actual reason for the decision? Not the polite version — the real one.
- `buyer_decision_process` (object, required): How did the decision actually get made? Who was involved? What criteria mattered most? What was the internal conversation?
- `buyer_what_was_missing` (string, required): What would the winning solution have needed to have that this one didn't?
- `buyer_what_almost_changed_their_mind` (string, optional): Was there a moment where you were closer to yes (or no) than the rep knew? What was it?

## Outputs
- `real_loss_reason` (string): The actual reason for the outcome, stated directly — not the CRM-sanitized version.
- `rep_perception_gap` (object): Where the rep's read of the deal diverged from what was actually happening inside the buyer's organization.
- `decision_process_map` (object): How the decision was actually made — who mattered, what criteria drove it, what the internal narrative was.
- `what_actually_mattered` (array): The factors that genuinely drove the decision, ranked by impact.
- `what_could_have_changed_it` (string): The specific thing that, if different, would have changed the outcome. If nothing would have changed it, say so.
- `sales_process_diagnosis` (object): What this deal reveals about the rep's process — what worked, what didn't, what patterns to watch.
- `next_opportunity_strategy` (object): If a future opportunity exists, what approach would be more effective given what was learned.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both rep and buyer have submitted.

**Actions:**
1. Confirm `buyer_real_reason` and `rep_loss_hypothesis` are present — the core comparison.
2. Note the shared outcome — won deals and lost deals have different synthesis structures.
3. Flag if `buyer_what_almost_changed_their_mind` is populated — this is high-value signal.

**Output:** Readiness confirmation.

**Quality Gate:** `buyer_real_reason` and `rep_loss_hypothesis` both present.

---

### Phase 1: Compare the Narratives
**Entry Criteria:** Both submissions confirmed.

**Actions:**
1. Compare the rep's deal narrative to the buyer's account of the decision process. Map where they align and where they diverge.
2. Compare the rep's loss hypothesis to the buyer's real reason. Quantify the gap.
3. Identify key moments the rep didn't know about: internal conversations, competing priorities, objections that were never voiced.
4. Extract what the buyer says almost changed their mind.

**Output:** Narrative comparison, hypothesis vs. reality gap, unknown key moments.

**Quality Gate:** Gap between rep hypothesis and real reason is stated plainly. Unknown moments are extracted.

---

### Phase 2: Map the Real Decision Process
**Entry Criteria:** Narrative comparison complete.

**Actions:**
1. Build a map of how the decision was actually made: who was involved, what criteria drove it, what the internal champion (or opponent) said.
2. Identify the gap between who the rep thought mattered and who actually mattered.
3. Extract the real decision criteria ranked by the buyer's own account.
4. Compare to what the rep was selling against.

**Output:** Decision process map with actual influencers, criteria ranking, rep's misreads.

**Quality Gate:** Decision process is mapped with specific people and moments, not generalities.

---

### Phase 3: Diagnose the Sales Process
**Entry Criteria:** Decision process mapped.

**Actions:**
1. Identify where in the process the deal was actually won or lost — often far earlier than the rep thought.
2. Name what the rep did well that actually mattered to the buyer.
3. Name what the rep did that didn't matter or hurt.
4. Identify the structural factors (timing, budget cycle, internal politics) vs. the controllable factors.
5. If controllable factors contributed to the outcome, name specific process changes.

**Output:** Process diagnosis with specific strengths, gaps, controllable vs. structural factors.

**Quality Gate:** Diagnosis is specific. "Better discovery" is not a diagnosis. "The rep didn't identify the procurement committee's involvement until week 6" is.

---

### Phase 4: Deliver the Autopsy Report
**Entry Criteria:** Diagnosis complete.

**Actions:**
1. Open with the real loss reason — stated plainly.
2. Present the perception gap: what the rep thought was happening vs. what was actually happening.
3. Present the decision process map.
4. Present what actually mattered to the buyer.
5. Name what could have changed it — and if nothing would have, say that clearly (sometimes the deal was never real).
6. Deliver the process diagnosis.
7. Deliver the next opportunity strategy if applicable.

**Output:** Full autopsy — real reason, perception gap, decision map, what mattered, what could have changed it, diagnosis, next opportunity strategy.

**Quality Gate:** The rep learns something they didn't know. Nothing is softened to protect feelings. If the deal was never winnable, that's stated clearly.

---

## Exit Criteria
Done when: (1) real reason stated directly, (2) perception gap quantified with specific examples, (3) decision process mapped with actual influencers, (4) what actually mattered ranked by buyer's account, (5) controllable vs. structural factors distinguished, (6) process diagnosis has specific actionable items.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Buyer says the deal was lost to price but the rep's narrative suggests deeper issues | Probe both accounts. "Lost to price" is often a polite explanation for a more complex reality. |
| Phase 3 | Rep's perception gap is very large | This is valuable, not a failure. A large perception gap reveals a systematic discovery or qualification problem worth addressing. |
| Phase 4 | Deal was clearly never winnable (wrong ICP, wrong timing, wrong champion) | Say so directly. This is useful information — it means the rep should have disqualified earlier, which is a coaching point, not a failure. |

## State Persistence
- Deal history (track win/loss patterns over time)
- Perception gap trend (is the gap improving or consistent?)
- Decision process patterns by industry or buyer type

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
