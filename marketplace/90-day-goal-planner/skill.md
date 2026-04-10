# 90-Day Goal Planner

**One-line description:** Convert an ambiguous goal into a concrete, executable 90-day action plan with milestones, task dependencies, resource allocation, and weekly checkpoints.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `goal_statement` (string, required): The raw, often ambiguous goal to be planned. Example: "Launch a new product line" or "Improve team productivity by 30%."
- `goal_context` (string, optional): Background on why this goal matters, constraints, or stakeholders involved. Include current state and desired state.
- `available_resources` (object, optional): Team size, budget, tools, or capacity constraints. Specify: {"team_members": [{"name": string, "hours_per_week": number, "skills": string[]}], "budget_usd": number, "tools": string[]}. Default: assume single-person execution with 40 hours/week and standard tools.
- `known_risks` (string[], optional): Anticipated obstacles, dependencies on external parties, or technical unknowns. Example: ["Vendor API integration delay", "Key team member may leave"].
- `planning_horizon` (string, optional): Confirm 90 days or specify alternative (e.g., "120 days"). Default: 90 days.

---

## Outputs

- `clarified_goal` (object): Goal statement with measurable success criteria, scope boundaries, and assumptions. Fields: {"original_statement": string, "smart_statement": string, "success_criteria": string[], "scope_in": string[], "scope_out": string[], "assumptions": string[]}.
- `key_result_areas` (object[]): 3-5 major outcome categories with descriptions and interdependencies. Fields: {"name": string, "description": string, "owner": string, "dependencies": string[], "effort_percent": number}.
- `milestones` (object[]): Three dated milestones (day 30, 60, 90) with completion criteria and KRA alignment. Fields: {"day": number, "date": string (YYYY-MM-DD), "kra_deliverables": {KRA_name: string}, "acceptance_criteria": string[], "critical_path_kras": string[]}.
- `weekly_tasks` (object[]): 13 weeks of tasks, each with owner, deliverable, effort estimate, and KRA tag. Fields: {"week": number, "task_id": string, "description": string, "owner": string, "deliverable": string, "effort_estimate_hours": number, "kra": string, "priority": string (P0/P1/P2), "predecessor_tasks": string[]}.
- `dependency_graph` (object): Task dependencies, critical path, and parallelizable task groups. Fields: {"tasks": string[], "edges": [string, string][], "critical_path": string[], "critical_path_duration_days": number, "parallelizable_groups": string[][], "slack_time_per_task": {task_id: number}}.
- `resource_plan` (object): Weekly resource allocation, bottlenecks, and contingency buffer distribution. Fields: {"weekly_allocation": [{"week": number, "total_effort_hours": number, "available_capacity_hours": number, "utilization_percent": number, "tasks": string[], "contingency_hours": number}], "bottleneck_weeks": number[], "contingency_distribution": {KRA_name: number}, "total_contingency_hours": number}.
- `checkpoint_template` (object): Weekly review structure, metrics, escalation criteria, and re-planning triggers. Fields: {"meeting_cadence": string, "attendees": string[], "duration_minutes": number, "metrics": [{"kra": string, "metric_name": string, "unit": string, "targets_by_week": {week: number}}], "escalation_criteria": string[], "replan_triggers": string[], "template_questions": string[]}.
- `risk_register` (object[]): Identified risks with probability, impact, mitigation, and owner. Fields: {"risk_id": string, "description": string, "probability": string (Low/Medium/High), "impact": string (Low/Medium/High), "mitigation_strategy": string, "owner": string, "contingency_hours": number}.
- `action_plan_document` (string): Complete 90-day plan in markdown format, ready for distribution and execution.

---

## Execution Phases

### Phase 1: Clarify and Validate the Goal

**Entry Criteria:**
- Goal statement is provided (any level of ambiguity is acceptable).
- Goal context or constraints are available (optional but helpful).

**Actions:**

1. Parse the goal statement and identify all implied outcomes, constraints, and success signals.
2. Rewrite the goal in SMART format: Specific, Measurable, Achievable, Relevant, Time-bound. For 90-day goals, focus on "Measurable" and "Achievable in 90 days."
3. Define scope boundaries: create three lists: what is IN scope, what is OUT of scope, what is a "nice to have" (defer to future phases).
4. List assumptions: about resources, team capability, external dependencies, market conditions. For each assumption, note how you will validate it.
5. Identify success criteria: write 3-5 measurable outcomes. Each criterion must be verifiable by a specific metric or deliverable (e.g., "Product passes QA with zero critical bugs" not "Product is good").

**Output:**
- `clarified_goal`: object with fields: `original_statement`, `smart_statement`, `success_criteria` (array of measurable statements), `scope_in` (array), `scope_out` (array), `assumptions` (array with validation method for each).

**Quality Gate:**
- Success criteria are measurable: each criterion includes a metric, threshold, or deliverable (verified by: does it contain a number, a specific artifact, or a testable condition?).
- Scope is bounded: IN scope has 3-7 items, OUT scope has 2-5 items, Nice-to-Have has 1-3 items (verified by: can a reader distinguish what is included?).
- Assumptions are explicit and testable: each assumption has a validation method (verified by: is there a way to confirm or refute it?).
- A reader unfamiliar with the original goal understands what done looks like: verified by: can the reader state the goal in their own words and identify success?

---

### Phase 2: Identify Key Result Areas and Outcomes

**Entry Criteria:**
- Clarified goal with success criteria is complete.

**Actions:**

1. Decompose the goal into 3-5 major outcome categories (KRAs). These are the "pillars" of the goal. Example: for "launch a product," KRAs might be: Product Development, Go-to-Market, Customer Acquisition, Operations Setup, Team Readiness.
2. For each KRA, write a brief description of what success looks like in that area and how it contributes to the overall goal.
3. Identify dependencies: which KRAs must be completed before others can start? Which can run in parallel? Create a dependency list: KRA X blocks KRA Y.
4. Assign a primary owner to each KRA (even if it's the same person wearing different hats). Assess owner readiness: does the owner have the required skills? If not, plan for training or reassignment.
5. Estimate the effort distribution: what percentage of total effort goes to each KRA? Percentages must sum to 100%.

**Output:**
- `key_result_areas`: array of objects, each with: `name`, `description`, `owner`, `owner_readiness_assessment` (string: "Ready", "Needs Training", "Needs Reassignment"), `dependencies` (array of KRA names), `effort_percent`.

**Quality Gate:**
- Each KRA has a clear owner and a readiness assessment: verified by: is there a name and a readiness status for each KRA?
- Dependencies are acyclic: verified by: can you order the KRAs in a sequence where each KRA's dependencies come before it?
- Effort percentages sum to 100%: verified by: sum(effort_percent) == 100.
- Each KRA is independently measurable: verified by: can you measure progress on this KRA without measuring other KRAs?
- Owner readiness is addressed: verified by: for any "Needs Training" or "Needs Reassignment" KRA, is there a mitigation plan in Phase 2 output?

---

### Phase 3: Define Milestones at 30, 60, and 90 Days

**Entry Criteria:**
- Key result areas are defined with dependencies and effort distribution.

**Actions:**

1. For each KRA, define what "done" looks like at day 30, day 60, and day 90. These are the milestone deliverables. Use the effort distribution from Phase 2 to guide allocation: day 30 should represent 30-35% of total effort, day 60 should represent 60-70%, day 90 should represent 100%.
2. For each milestone, write acceptance criteria: how will you verify it's complete? Each criterion must be testable (e.g., "Code review passed" not "looks good").
3. Identify which KRAs are on the critical path (must be done on time or the whole plan slips). Mark these in the milestone output.
4. Build in a 10-15% contingency buffer: calculate total effort across all KRAs, reserve 10-15% as contingency. Assign contingency to specific KRAs or weeks (preferably before critical-path tasks).
5. Create a milestone summary: for each of the three milestones, write a one-sentence summary of what is achieved (e.g., "Day 30: Core product features coded and unit tested").

**Output:**
- `milestones`: array of three objects (day 30, 60, 90), each with: `day`, `date` (YYYY-MM-DD), `summary` (one-sentence description), `kra_deliverables` (map of KRA name to deliverable string), `acceptance_criteria` (array of testable statements), `critical_path_kras` (array), `contingency_hours_allocated` (number).

**Quality Gate:**
- Each milestone has deliverables from all KRAs or explicit justification for why a KRA is not due yet: verified by: does the milestone output include all KRAs or a note explaining why a KRA is deferred?
- Acceptance criteria are testable: verified by: does each criterion include a specific artifact, metric, or verification method (not "looks good")?
- Effort is distributed across phases: verified by: is day 30 effort 30-35% of total, day 60 effort 60-70%, day 90 effort 100%?
- Critical path is identified: verified by: are critical-path KRAs marked in the output?
- Contingency is allocated: verified by: is contingency_hours_allocated > 0 and <= 15% of total effort?

---

### Phase 4: Break Milestones into Weekly Tasks

**Entry Criteria:**
- Three milestones are defined with deliverables and acceptance criteria.

**Actions:**

1. For each milestone, work backward from the deliverable to identify the tasks required to produce it. Use a work-breakdown structure (WBS): decompose each deliverable into sub-deliverables, then into tasks.
2. Break each task into 1-3 day chunks. If a task is larger than 5 days of effort, split it further. If a task is smaller than 2 hours, combine it with related tasks.
3. Assign each task to a week (1-13) and to an owner. Ensure the owner has capacity (from available_resources input).
4. For each task, define: description (imperative verb + object, e.g., "Code login feature"), deliverable (specific artifact), estimated effort (in hours, using 3-point estimation if uncertain: (optimistic + 4*likely + pessimistic)/6), and which KRA it belongs to.
5. Identify any tasks that are prerequisites for other tasks (these become dependencies in Phase 5). Mark these as "predecessor_tasks".
6. Assign a priority: P0 (critical path, must be done on time), P1 (important, some flexibility), P2 (nice to have, can be deferred if needed).

**Output:**
- `weekly_tasks`: array of objects, each with: `week` (1-13), `task_id` (string, e.g., "T001"), `description` (imperative verb + object), `owner` (string), `deliverable` (specific artifact), `effort_estimate_hours` (number), `kra` (string), `priority` (P0/P1/P2), `predecessor_tasks` (array of task IDs).

**Quality Gate:**
- No task is larger than 5 days of effort (40 hours): verified by: max(effort_estimate_hours) <= 40.
- Every task has a deliverable: verified by: is deliverable field non-empty and specific (not "work on X")?
- Effort estimates are realistic: verified by: do estimates match team experience or benchmarks? (Note: this is subjective; flag estimates >40 hours for review.)
- Every deliverable from Phase 3 is covered by at least one task: verified by: can you trace each milestone deliverable to one or more tasks?
- Tasks are assigned to weeks in order: verified by: for each task, are all predecessor_tasks assigned to earlier weeks?
- Task descriptions use imperative verbs: verified by: does each description start with a verb (Code, Design, Test, Review, etc.)?

---

### Phase 5: Map Dependencies and Identify Critical Path

**Entry Criteria:**
- Weekly task list is complete with predecessors identified.

**Actions:**

1. Build a dependency graph: for each task, list all tasks that must be done before it can start. Create edges: [predecessor_task_id, task_id].
2. Perform a topological sort: order tasks so that all predecessors come before successors. If a cycle is detected, abort (plan is infeasible).
3. Calculate the critical path: the longest chain of dependent tasks from start to end. Use forward-pass and backward-pass scheduling: for each task, calculate earliest start (ES), earliest finish (EF), latest start (LS), latest finish (LF). Slack = LS - ES. Critical path tasks have slack = 0.
4. Identify parallelizable tasks: tasks with no dependencies on each other can run simultaneously. Group them: parallelizable_groups = [[T001, T002], [T003, T004, T005], ...].
5. Highlight any tasks with high risk or uncertainty; these are candidates for early execution or contingency planning. Flag tasks with effort_estimate > 30 hours or tasks on the critical path.

**Output:**
- `dependency_graph`: object with: `tasks` (array of task IDs in topological order), `edges` (array of [predecessor_id, successor_id] pairs), `critical_path` (array of task IDs in order), `critical_path_duration_days` (number, calculated as sum of effort_estimate_hours / 8 hours per day for critical-path tasks), `parallelizable_groups` (array of arrays of task IDs), `slack_time_per_task` (map of task_id to slack_days).

**Quality Gate:**
- No circular dependencies: verified by: does topological sort succeed without detecting a cycle?
- Critical path duration is <= 90 days: verified by: critical_path_duration_days <= 90. If not, plan is infeasible; return to Phase 4 or 3.
- Parallelizable groups are identified correctly: verified by: for each group, do all tasks have no dependencies on each other?
- Slack time is calculated for all non-critical tasks: verified by: does slack_time_per_task include all tasks? Are critical-path tasks marked with slack = 0?
- High-risk tasks are flagged: verified by: are tasks with effort > 30 hours or on critical path noted for review?

---

### Phase 6: Assign Resources and Build Contingency

**Entry Criteria:**
- Dependency graph and critical path are defined.
- Available resources are known (from input or assumed).

**Actions:**

1. For each week (1-13), sum the effort required across all tasks assigned to that week. Calculate utilization: (total_effort_hours / available_capacity_hours) * 100%.
2. Compare weekly effort to available capacity. If utilization > 100% in any week, flag as a bottleneck. For bottleneck weeks, either defer non-critical tasks, add resources, or extend the timeline.
3. For each KRA, reserve a 10-15% contingency buffer. Calculate: contingency_hours = KRA_effort * 0.125 (midpoint of 10-15%). Distribute contingency across weeks, preferably before critical-path tasks.
4. Identify resource bottlenecks: are there weeks where one person is over-allocated? Can tasks be parallelized or reassigned? Document mitigation: defer, add resources, or accept risk.
5. Create a resource allocation matrix: for each week, list tasks, owners, effort, and contingency. Verify no person is over-allocated (sum of their tasks <= their available hours).

**Output:**
- `resource_plan`: object with: `weekly_allocation` (array of 13 objects, one per week, with: `week`, `total_effort_hours`, `available_capacity_hours`, `utilization_percent`, `tasks` (array of task IDs), `contingency_hours`, `bottleneck_flag` (boolean)), `bottleneck_weeks` (array of week numbers where utilization > 100%), `contingency_distribution` (map of KRA_name to contingency_hours), `total_contingency_hours` (number), `mitigation_plan` (string describing how bottlenecks are resolved).

**Quality Gate:**
- No week exceeds available capacity without explicit mitigation: verified by: for each bottleneck week, is there a documented mitigation (defer, add resources, extend timeline)?
- Contingency is distributed across all KRAs: verified by: does contingency_distribution include all KRAs? Is total_contingency_hours between 10-15% of total effort?
- Bottleneck weeks are identified and have a mitigation plan: verified by: are bottleneck_weeks listed? Is mitigation_plan non-empty?
- Total effort (including contingency) is realistic given team experience: verified by: does the plan match team velocity or benchmarks? (Flag for review if uncertain.)
- No person is over-allocated in any week: verified by: for each person, sum their task hours per week <= their available hours.

---

### Phase 7: Define Weekly Checkpoints and Escalation Criteria

**Entry Criteria:**
- Resource plan is complete.

**Actions:**

1. Design a weekly checkpoint meeting: specify day, time, duration (recommend 30-60 minutes), and attendees (goal owner, KRA owners, team leads).
2. Define metrics to track each week: for each KRA, identify 1-2 leading indicators (predictive of success) and 1 lagging indicator (confirmatory). Examples: for product development, leading indicator = "% of features coded", lagging indicator = "QA pass rate".
3. Set targets for each metric at each checkpoint (weeks 1-13). Targets should be evenly distributed (not all progress in week 13). Use the milestone deliverables from Phase 3 to guide targets.
4. Define escalation criteria: specific, measurable conditions that trigger a discussion or decision. Examples: "If a critical-path task is >20% behind schedule (effort remaining > 1.2 * effort estimate)", "If a KRA owner reports a blocker that cannot be resolved in <1 day", "If a risk materializes (from risk register)".
5. Define re-planning triggers: when is it time to revise the plan? Examples: "If two consecutive weeks miss targets by >10%", "If a major dependency fails", "If scope changes (new requirement or removed requirement)". For each trigger, specify the re-planning process: who decides, how long does it take, what is communicated.
6. Create a checkpoint template: a simple form or checklist that the team fills out each week. Include: completed tasks, blockers, decisions needed, metric status, and confidence in next week's targets.

**Output:**
- `checkpoint_template`: object with: `meeting_cadence` (string, e.g., "Weekly, Mondays 10am, 45 minutes"), `attendees` (array of roles, e.g., ["Goal Owner", "KRA Owners", "Team Leads"]), `duration_minutes` (number), `metrics` (array of objects, each with: `kra`, `metric_name`, `unit`, `leading_or_lagging` (string), `targets_by_week` (map of week number to target value)), `escalation_criteria` (array of specific, measurable conditions), `replan_triggers` (array of specific conditions with re-planning process), `template_questions` (array of questions to answer each week, e.g., "What did we complete this week?", "What blockers do we face?", "Are we on track for the next milestone?", "What decisions are needed?").

**Quality Gate:**
- Metrics are measurable and tied to KRAs: verified by: does each metric have a unit and a calculation method? Is it tied to a KRA?
- Targets are realistic and evenly distributed: verified by: do targets increase gradually from week 1 to 13? Are they aligned with milestone deliverables?
- Escalation criteria are specific and measurable: verified by: does each criterion include a metric, threshold, and a condition (e.g., ">20%", "cannot be resolved in <1 day")? Not "if something feels off".
- Re-planning triggers are clear and actionable: verified by: for each trigger, is there a process (who decides, timeline, communication)?
- Checkpoint template can be completed in <30 minutes: verified by: are there <10 questions? Can each be answered in 2-3 minutes?

---

### Phase 8: Assemble and Validate the 90-Day Plan

**Entry Criteria:**
- All prior phases are complete: goal, KRAs, milestones, tasks, dependencies, resources, checkpoints.

**Actions:**

1. Compile all outputs into a single plan document with sections: Executive Summary, Goal & Success Criteria, Key Result Areas, Milestones, Weekly Task Schedule, Dependency Graph & Critical Path, Resource Plan, Risk Register, Checkpoint Structure, Scope Creep Management, and Appendices.
2. Add a one-page executive summary: goal, three milestones with dates, critical path duration, key risks, and success metrics. This is the "elevator pitch" for stakeholders.
3. Create a visual timeline: a Gantt chart or swimlane diagram showing tasks, dependencies, milestones, and critical path. Include a legend.
4. Build a risk register: for each known risk (from input) and risks identified during planning, document: risk ID, description, probability (Low/Medium/High), impact (Low/Medium/High), mitigation strategy, owner, and contingency hours allocated. Prioritize risks by probability * impact.
5. Add a scope creep management section: define a change-control process. How are new requests evaluated? What is the cost (in time or resources) of adding a task mid-plan? Who approves scope changes? Include a change log template.
6. Add a communication plan: specify who needs to know what, and when. Include: status reports (weekly to stakeholders), escalation paths (who to contact for blockers), and decision-making authority (who approves scope changes, timeline extensions, etc.).
7. Validate the plan: does it address the original goal? Are all steps from the workflow represented? Is it realistic? Checklist: (a) every task is traceable to a milestone and a KRA, (b) every milestone is traceable to the goal, (c) critical path <= 90 days, (d) effort <= available capacity, (e) contingency is built in, (f) risks are identified and mitigated.
8. Obtain stakeholder sign-off: circulate the plan to goal owner, team leads, and any external dependencies. Document feedback and adjustments. Require explicit approval (sign-off) before execution begins.

**Output:**
- `risk_register`: array of objects, each with: `risk_id` (string, e.g., "R001"), `description` (string), `probability` (Low/Medium/High), `impact` (Low/Medium/High), `priority_score` (number, 1-9 based on probability and impact), `mitigation_strategy` (string), `owner` (string), `contingency_hours` (number).
- `action_plan_document`: string (markdown format) containing the complete 90-day plan with all sections listed above. Include a table of contents, page breaks, and formatting suitable for printing or PDF conversion. The document should be self-contained and executable by a team member unfamiliar with the goal.

**Quality Gate:**
- Plan is internally consistent: verified by: are there contradictions between sections? (E.g., a task assigned to week 5 but its predecessor is in week 6.) Do all numbers add up (effort, contingency, etc.)?
- Every task in the weekly schedule is traceable to a milestone and a KRA: verified by: can you follow a task -> milestone -> KRA -> goal chain for each task?
- Every milestone is traceable to the goal: verified by: do the three milestones, when combined, achieve the goal's success criteria?
- Stakeholders have reviewed and approved the plan: verified by: is there a sign-off section with names, dates, and approvals?
- A team member unfamiliar with the goal could execute the plan from this document alone: verified by: does the document include all necessary context (goal, KRAs, tasks, dependencies, resources, checkpoints, risks, scope creep process)? Is it clear enough for a new team member to start work?
- Risk register is complete: verified by: are all known risks from input included? Are risks identified during planning added? Is each risk assigned a mitigation strategy and owner?

---

## Exit Criteria

The skill is DONE when:

1. A clarified goal with measurable success criteria is documented: verified by: does clarified_goal include 3-5 success criteria, each with a metric or deliverable?
2. Three milestones (day 30, 60, 90) are defined with deliverables and acceptance criteria: verified by: do milestones include specific deliverables for each KRA and testable acceptance criteria?
3. A weekly task schedule (13 weeks) is complete, with effort estimates and owners: verified by: does weekly_tasks include all 13 weeks, with tasks assigned to owners and effort estimated?
4. Dependencies are mapped and the critical path is identified: verified by: does dependency_graph include a critical path with duration <= 90 days?
5. Resource allocation is realistic and bottlenecks are addressed: verified by: does resource_plan show utilization <= 100% for all weeks (or documented mitigation for bottlenecks)?
6. A checkpoint structure with metrics and escalation criteria is in place: verified by: does checkpoint_template include metrics for each KRA, targets for each week, and escalation criteria?
7. A risk register with mitigation strategies is documented: verified by: does risk_register include all known risks with probability, impact, mitigation, and owner?
8. A complete 90-day action plan document is assembled and stakeholder-approved: verified by: is action_plan_document complete, internally consistent, and signed off by stakeholders?
9. The plan is realistic: verified by: critical path <= 90 days, effort <= available capacity, contingency is built in (10-15% of total effort).

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Goal is too vague to clarify (e.g., "be better") | **Adjust** -- ask for specific context: What is the current state (measurable)? What is the desired state (measurable)? What is the gap? What does success look like in 90 days? |
| Phase 1 | Goal is too large for 90 days (e.g., "build a company") | **Adjust** -- scope down to a 90-day milestone of a larger goal, or extend timeline. Document what is deferred to future phases. |
| Phase 2 | Cannot identify 3-5 KRAs (too few or too many) | **Adjust** -- if too few (<3), the goal may be simple (consider a checklist instead of a 90-day plan). If too many (>5), group related KRAs or reduce scope. |
| Phase 3 | Milestones are unevenly distributed (e.g., 80% of work in week 12) | **Adjust** -- redistribute tasks across phases or extend timeline. Ensure day 30 is 30-35%, day 60 is 60-70%, day 90 is 100%. |
| Phase 4 | Tasks are too large (>40 hours) or too small (<2 hours) | **Adjust** -- re-estimate or re-scope. Combine small tasks or split large ones. Use 3-point estimation for uncertain tasks. |
| Phase 5 | Critical path > 90 days | **Abort** -- plan is infeasible. Return to Phase 3 or 4 and reduce scope, parallelize tasks, or extend timeline. |
| Phase 6 | Resource bottleneck cannot be resolved (over-allocated every week) | **Adjust** -- add resources (hire, contract, or borrow from other projects), defer non-critical (P2) tasks, or extend timeline. Document trade-offs and obtain stakeholder approval. |
| Phase 7 | Metrics are unmeasurable or targets are unrealistic | **Adjust** -- redefine metrics to be SMART (Specific, Measurable, Achievable, Relevant, Time-bound). Adjust targets based on team feedback and historical data. |
| Phase 8 | Stakeholders reject the plan | **Adjust** -- document feedback, identify conflicts (e.g., scope, timeline, resources), and revise. Repeat stakeholder review until approved. If conflicts cannot be resolved, escalate to decision-maker. |
| Phase 8 | User rejects final output | **Targeted revision** -- ask which goal milestone, task estimate, or KRA fell short and rerun only that phase. Do not regenerate the full 90-day plan. |

---

## Reference Section: Domain Knowledge & Decision Criteria

### Critical Path Method (CPM)

The critical path is the longest chain of dependent tasks. Any delay on the critical path delays the entire project. Non-critical tasks have "slack" and can be delayed without affecting the end date. Use this to prioritize: focus on critical-path tasks first. Monitor critical-path tasks weekly; if any are behind, escalate immediately.

### Effort Estimation

For new or uncertain work, use 3-point estimation: Estimate = (Optimistic + 4*Most Likely + Pessimistic) / 6. This accounts for uncertainty. Add 10-15% contingency for unknowns. For familiar work, use historical data (team velocity, past project actuals).

### Milestone Criteria

A good milestone is:
- **Specific**: not "make progress," but "complete feature X and pass QA."
- **Measurable**: you can verify it's done (e.g., code review passed, customer feedback collected, test results documented).
- **Achievable**: realistic given resources and dependencies.
- **Relevant**: directly supports the goal.
- **Time-bound**: has a specific date (day 30, 60, or 90).

### Resource Allocation

If a person is allocated to multiple tasks in a week, account for context-switching overhead (~10-20% of their time). Avoid over-allocating the same person to critical-path tasks. Use a resource matrix to visualize allocation and identify bottlenecks.

### Contingency Planning

Reserve 10-15% of effort as contingency. Distribute it across phases and KRAs, not all at the end. Identify which risks the contingency covers (e.g., "if customer feedback requires rework", "if vendor delays"). Assign contingency ownership: who decides when to use it?

### Checkpoint Metrics

Track leading indicators (predictive) and lagging indicators (confirmatory). Example: for a product launch, leading indicators are "% of features coded" and "customer feedback score"; lagging indicator is "revenue." Update metrics weekly and compare to targets. If a metric is off-target, investigate and adjust the plan.

### Re-Planning Triggers

Common triggers:
- Two consecutive weeks miss targets by >10%.
- A critical-path task is delayed by >5 days.
- A major risk materializes (e.g., key team member leaves, vendor fails).
- Scope changes (new requirement or removed requirement).
- External dependency fails (e.g., vendor delay, stakeholder unavailable).

When re-planning, update the plan document, communicate changes to stakeholders, and re-baseline the schedule.

### Scope Creep Management

Define a change-control process: (1) New request is submitted with description and justification. (2) Impact is assessed: effort required, timeline impact, resource impact. (3) Decision-maker (goal owner or sponsor) approves or rejects. (4) If approved, plan is updated and stakeholders are notified. (5) Change is logged in a change log. This prevents uncontrolled scope expansion.

### Communication Plan

Define who needs to know what, and when:
- **Weekly status**: team and goal owner (metrics, blockers, decisions).
- **Bi-weekly escalation**: sponsor and stakeholders (risks, scope changes, timeline impacts).
- **Monthly review**: executive sponsor (progress, ROI, strategic alignment).
- **Escalation path**: if a blocker cannot be resolved by the team, who is contacted? What is the SLA for response?

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.