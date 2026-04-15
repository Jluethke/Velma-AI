# Strategy Offsite Prep

**One-line description:** CEO and each leadership team member each submit what they really want from the offsite and what they think is being avoided — AI builds an agenda that addresses the real issues, not the comfortable ones.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both facilitator and leadership team member must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_company_name` (string, required): Company name.
- `shared_offsite_topic` (string, required): What is the offsite focused on? e.g., "FY2026 strategy," "Post-merger integration," "Leadership team reset."

### Facilitator / CEO Submits Privately
- `facilitator_objectives` (array, required): What do you need this offsite to accomplish? What decisions must come out of it?
- `facilitator_concerns_about_team_dynamics` (array, required): What interpersonal or team dynamics are you worried will surface or be avoided?
- `facilitator_topics_to_avoid` (array, required): What topics are you planning not to put on the agenda, and why?
- `facilitator_what_must_be_decided` (array, required): What decisions cannot leave this offsite unresolved?

### Leadership Team Member Submits Privately
- `member_real_priorities` (array, required): What do you actually want to resolve at this offsite? Not what's on the agenda — what you really need.
- `member_concerns_they_wont_raise` (array, required): What concerns do you have that you're unlikely to raise in the room?
- `member_what_they_want_from_the_offsite` (string, required): What would make this offsite worth your time?
- `member_what_they_think_is_being_avoided` (array, required): What important topics do you think the agenda will dodge?
- `member_what_would_make_it_worthwhile` (string, required): What outcome would make you feel this offsite was genuinely valuable?

## Outputs
- `priority_alignment` (object): Where facilitator objectives and member priorities align and diverge.
- `avoided_topics_map` (array): Topics the facilitator is avoiding vs. topics the member thinks are being avoided — and why they matter.
- `offsite_agenda` (object): Full agenda with sessions, owners, time allocations, and decision points.
- `pre_read_requirements` (array): What must be prepared and distributed before the offsite to make sessions productive.
- `decision_log_template` (object): Template for capturing decisions, owners, and follow-ups during the offsite.
- `psychological_safety_assessment` (object): Where the room is likely to be candid vs. where it will perform — and how to address it.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm objectives and member real priorities present.
**Output:** Readiness confirmation.
**Quality Gate:** Facilitator objectives and member priorities both present.

---

### Phase 1: Map the Priority and Avoidance Gap
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare facilitator objectives against member real priorities — what's shared, what's missing from the agenda. 2. Cross-reference facilitator's topics to avoid against member's sense of what's being dodged. 3. Identify the gap between what the room will discuss and what it actually needs to resolve. 4. Assess whether the facilitator's must-decide list matches what the member believes is on the table.
**Output:** Priority alignment, avoidance gap, must-decide alignment check.
**Quality Gate:** Avoided topics are named explicitly — not categorized as "sensitive areas."

---

### Phase 2: Assess Psychological Safety
**Entry Criteria:** Gaps mapped.
**Actions:** 1. Identify topics the member flagged as concerns they won't raise — these represent psychological safety failures. 2. Assess which facilitator concerns about team dynamics are likely to suppress candor. 3. Identify structural conditions (hierarchies, past conflicts, unresolved tensions) that will constrain what's said. 4. Recommend facilitation adjustments that create the conditions for the real conversation.
**Output:** Psychological safety assessment, suppression risks, facilitation adjustments.
**Quality Gate:** Every concern the member won't raise has a recommended structural workaround — anonymous input, pre-work, small group sessions, or direct facilitator framing.

---

### Phase 3: Build the Agenda
**Entry Criteria:** Safety assessed.
**Actions:** 1. Build a session-by-session agenda that includes the real issues, not just the comfortable ones. 2. For each session: define the decision or output required, the pre-read needed, the time allocation, and the facilitation approach. 3. Build the pre-read package list. 4. Draft the decision log template.
**Output:** Full agenda, pre-read list, decision log template.
**Quality Gate:** Every must-decide item has a session. Every avoided topic that matters is addressed — either included with a facilitation plan or explicitly excluded with a rationale.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agenda built.
**Actions:** 1. Present priority alignment and gaps. 2. Present avoided topics map. 3. Deliver full offsite agenda. 4. Deliver pre-read requirements. 5. Deliver psychological safety assessment with facilitation adjustments.
**Output:** Full synthesis — priority alignment, avoided topics, agenda, pre-reads, psychological safety assessment.
**Quality Gate:** Facilitator can walk into the offsite with an agenda that addresses what the room actually needs, not what's comfortable.

---

## Exit Criteria
Done when: (1) priority and avoidance gaps explicitly named, (2) psychological safety risks addressed with structural workarounds, (3) full agenda with session-level decisions and time allocations, (4) pre-read list and decision log template ready.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
