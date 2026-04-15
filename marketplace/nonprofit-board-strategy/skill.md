# Nonprofit Board Strategy Alignment

**One-line description:** The executive director and the board chair each submit their real concerns, strategic priorities, and governance expectations — AI produces a strategic alignment that lets leadership lead and the board govern without either party undermining the other.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both ED and board chair must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_organization_name` (string, required): Nonprofit name.
- `shared_planning_period` (string, required): Strategic planning period or issue being addressed.

### Executive Director Submits Privately
- `ed_strategic_priorities` (object, required): What the organization most needs to do in the next 12–24 months.
- `ed_what_they_need_from_the_board` (array, required): Funding, fundraising, connections, expertise, decision authority — what the ED needs to lead effectively.
- `ed_what_the_board_is_doing_that_hinders_leadership` (array, required): Where the board is micromanaging, second-guessing, or creating decision-making friction.
- `ed_concerns_about_organizational_health` (array, required): Financial sustainability, program effectiveness, team capacity, public trust — what keeps you up at night.
- `ed_what_they_would_not_say_in_a_full_board_meeting` (string, required): The real concern behind the agenda — what the ED needs but is unlikely to say in front of the full board.

### Board Chair Submits Privately
- `chair_what_the_board_is_worried_about` (array, required): The governance and strategic concerns the board is holding — financial risk, leadership effectiveness, mission drift, compliance.
- `chair_what_the_board_needs_from_the_ed` (array, required): Reporting, transparency, execution accountability, financial discipline — what the board requires to fulfill its fiduciary role.
- `chair_where_they_feel_the_ed_is_not_meeting_expectations` (array, required): Honest assessment of where performance or communication is falling short.
- `chair_what_the_board_is_willing_to_do_differently` (array, required): What governance changes the board is open to — fewer touch points, more trust, clearer role delineation.
- `chair_concerns_about_organizational_direction` (array, required): Strategy, sustainability, or culture concerns the board is watching.

## Outputs
- `strategic_alignment_assessment` (object): Where ED and board agree on direction and where there are genuine differences.
- `role_clarity_framework` (object): What decisions belong to the board vs. the ED — a specific delineation, not a platitude.
- `ed_accountability_structure` (object): How the ED is measured and supported — goals, reporting cadence, evaluation process.
- `board_effectiveness_plan` (object): What the board commits to doing — fundraising, introductions, governance discipline, less micromanagement.
- `communication_and_governance_plan` (object): How board-ED communication works — format, frequency, what is escalated vs. managed by the ED.
- `critical_issue_plan` (array): How the organization addresses the concerns both parties identified.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm ED's priorities and board's concerns present.
**Output:** Readiness confirmation.
**Quality Gate:** ED's strategic priorities and board chair's governance concerns both present.

---

### Phase 1: Assess Alignment and Friction Points
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare ED's strategic priorities against board's strategic concerns — are they building the same organization? 2. Identify the role clarity gaps — where the board is acting like management and where the ED is avoiding board accountability. 3. Assess the unsaid things both parties submitted — what is the real tension underneath the agenda? 4. Identify the organizational health issues both parties are worried about.
**Output:** Strategic alignment map, role clarity gaps, underlying tension analysis, shared health concerns.
**Quality Gate:** Role clarity gaps are specific — "board chair is approving individual hires under $50K; this is the ED's authority" not "board is too involved in operations."

---

### Phase 2: Design the Governance Framework
**Entry Criteria:** Alignment assessed.
**Actions:** 1. Write the role delineation — specific examples of what belongs to the board vs. the ED, including contested decisions. 2. Define the ED accountability structure — annual goals, quarterly reporting, annual review process. 3. Define what the board commits to — fundraising goals, use of networks, governance discipline. 4. Build the communication plan — board meeting cadence, between-meeting reporting, what the ED escalates vs. handles.
**Output:** Role delineation, ED accountability structure, board commitments, communication plan.
**Quality Gate:** Role delineation has specific examples. ED accountability has measurable goals. Board commitments have specific asks, not "support the mission."

---

### Phase 3: Address Critical Issues
**Entry Criteria:** Framework built.
**Actions:** 1. Build the plan for each critical organizational issue identified — financial sustainability, program effectiveness, team capacity. 2. Assign ownership — what is the board's responsibility and what is the ED's. 3. Define the timeline and milestones for addressing each issue. 4. Define escalation — what would cause the board to intervene in ED operations and what that process looks like.
**Output:** Critical issue plans with owners, timelines, escalation criteria.
**Quality Gate:** Every critical issue has an owner, an action, and a timeline. Escalation criteria are specific — not "if things get bad" but named thresholds.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Issues addressed.
**Actions:** 1. Present strategic alignment assessment. 2. Deliver role clarity framework. 3. Deliver ED accountability structure and board commitments. 4. Deliver communication and governance plan. 5. Present critical issue plans.
**Output:** Full synthesis — alignment, role clarity, accountability, board commitments, governance plan, critical issues.
**Quality Gate:** ED and board chair can present this framework to the full board with confidence that it reflects what was actually agreed.

---

## Exit Criteria
Done when: (1) strategic direction is aligned or disagreements are named, (2) role delineation has specific examples, (3) ED accountability is measurable, (4) board commitments are specific, (5) critical issues have plans with owners.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
