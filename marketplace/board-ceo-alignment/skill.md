# Board-CEO Alignment

**One-line description:** CEO and board member each submit their honest assessment before a board meeting or 1:1 — AI surfaces the confidence gaps and unspoken concerns so the performance becomes a real conversation.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both CEO and board member must submit before synthesis runs. Neither sees the other's input until the synthesis is shared.

---

## Inputs

### Shared (visible to both before submitting)
- `shared_company_name` (string, required): Company name.
- `shared_period` (string, required): e.g., "Q1 2026 board meeting" or "Monthly 1:1."
- `shared_agenda_topic` (string, required): The primary thing being discussed.

### CEO Submits Privately
- `ceo_assessment` (object, required): Honest assessment of company performance — what's going well, what's not, and the real reasons why.
- `ceo_needs_from_board` (array, required): What specific support, resources, introductions, or decisions do you actually need from the board right now?
- `ceo_concerns` (array, required): What are you most worried about? Include things you might not say in the board meeting.
- `ceo_undisclosed` (string, optional): Is there anything you're not planning to bring up in the meeting that you think the board should know? Why aren't you bringing it up?

### Board Member Submits Privately
- `board_assessment` (object, required): Your honest read on company performance and CEO effectiveness. What do you actually think?
- `board_concerns` (array, required): What concerns you most? What are you watching closely?
- `board_expectations` (object, required): What do you expect from the CEO in the next 90 days? What would make you more confident?
- `board_confidence_level` (string, required): Your honest confidence in the current trajectory — "high," "moderate," "low," or "concerned." Be direct.

## Outputs
- `alignment_map` (object): Where CEO and board agree on performance and trajectory.
- `confidence_gap` (object): The gap between the board's confidence level and what the CEO believes the board thinks — often the most important finding.
- `unspoken_concerns` (array): Things either side isn't planning to raise in the meeting, surfaced for both to consider.
- `support_needs` (object): What the CEO actually needs from the board vs. what the board thinks the CEO needs.
- `board_meeting_agenda` (object): A structured agenda for the actual meeting based on what both sides submitted.
- `relationship_health` (string): An honest read on the CEO-board relationship dynamic and any early warning signals.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both CEO and board member have submitted.

**Actions:**
1. Confirm `ceo_assessment`, `board_assessment`, and `board_confidence_level` are present.
2. Flag if `ceo_undisclosed` is populated — this is high-signal information.

**Output:** Readiness confirmation.

**Quality Gate:** Both assessments and board confidence level present.

---

### Phase 1: Compare the Assessments
**Entry Criteria:** Both submissions confirmed sufficient.

**Actions:**
1. Compare CEO's self-assessment to board member's assessment of the CEO. Identify gaps.
2. Compare each side's read on company performance and root causes.
3. Extract the board's real confidence level and contrast with what the CEO believes the board thinks.
4. Note anything the CEO flagged as undisclosed — this becomes a key synthesis item.

**Output:** Assessment comparison, confidence gap, undisclosed items flagged.

**Quality Gate:** Confidence gap is stated directly. Undisclosed items are not buried.

---

### Phase 2: Surface the Real Concerns
**Entry Criteria:** Assessments compared.

**Actions:**
1. Extract both sides' concerns and categorize: operational / strategic / leadership / relationship.
2. Identify concerns on one side that the other side hasn't acknowledged.
3. Compare what the CEO needs from the board to what the board thinks the CEO needs — this gap is often large.
4. Assess the relationship health: is this a functional working relationship or are there signs of eroding trust?

**Output:** Concern map, support needs gap, relationship health read.

**Quality Gate:** Relationship health assessment is honest. If trust is eroding, it's named directly.

---

### Phase 3: Build the Meeting Agenda
**Entry Criteria:** Concerns surfaced.

**Actions:**
1. Build the meeting agenda based on both sides' real priorities — not the polished board deck agenda.
2. Flag items that need direct discussion and suggest framing.
3. Identify any item from `ceo_undisclosed` that should be added to the agenda.
4. Draft the opening framing for the meeting that sets a candid tone.

**Output:** Meeting agenda with priority items, framings, and opening tone guidance.

**Quality Gate:** Agenda addresses confidence gap and unspoken concerns. Nothing important is left off.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agenda built.

**Actions:**
1. Present alignment map.
2. Present confidence gap directly: "The board's confidence level is X. The CEO believes the board is at Y."
3. Surface unspoken concerns from both sides.
4. Present the support needs gap.
5. Deliver the meeting agenda.
6. Give the relationship health read.

**Output:** Full synthesis — alignment map, confidence gap, unspoken concerns, support needs, meeting agenda, relationship health.

**Quality Gate:** Confidence gap is stated with specifics. Nothing is softened to preserve the relationship performance.

---

## Exit Criteria
Done when: (1) confidence gap quantified, (2) unspoken concerns from both sides surfaced, (3) support needs gap identified, (4) meeting agenda built from real priorities, (5) relationship health assessment delivered.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Board confidence is "concerned" or "low" and CEO believes board is supportive | This is a critical misalignment. Flag it prominently and recommend addressing it directly before the formal meeting. |
| Phase 3 | CEO has flagged significant undisclosed information | Recommend the CEO consider whether this information should be disclosed. Note that undisclosed material concerns from a CEO to their board create governance risk. |

## State Persistence
- Alignment history by quarter
- Confidence trend tracking
- Support request fulfillment history

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
