# Risk Register Builder

**One-line description:** Transform a project scope document into a comprehensive risk register with probability, impact, mitigation strategies, and early warning indicators.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `scope_document` (string, required): The project scope document in plain text, markdown, or structured format. Must include: project objectives, key deliverables, constraints (technical, budget, timeline, resource), stakeholders, and success criteria.
- `project_type` (string, required): Category of project (e.g., software development, infrastructure, product launch, research). Used to select relevant risk categories.
- `risk_assessment_scale` (string, optional): Rating scale for probability and impact. Options: "Low/Medium/High" (default) or "1-5 numeric". Default: "Low/Medium/High".
- `historical_data` (object, optional): Past project data with structure: {similar_projects: [{name, risks_identified, risks_materialized, lessons_learned}]}. Used to inform probability assessments.
- `stakeholder_input` (string, optional): Additional risk concerns or domain expertise from stakeholders. Incorporated into brainstorming phase.
- `risk_appetite` (string, optional): Organization's risk tolerance (conservative, moderate, aggressive). Informs mitigation strategy selection and high-priority threshold. Default: "moderate".

---

## Outputs

- `risk_register` (object): Structured risk register with fields:
  - `risks` (array of objects): Each risk contains:
    - `risk_id` (string): Unique identifier (e.g., "RISK-001")
    - `description` (string): Clear, specific risk statement in format: "[Trigger] may cause [outcome] affecting [objective]"
    - `category` (string): Risk category (technical, schedule, budget, resource, stakeholder, external, quality)
    - `probability` (string or number): Probability rating per input scale
    - `probability_basis` (string): Evidence or assumption supporting probability rating
    - `impact` (object): Impact ratings by dimension:
      - `schedule` (string or number): Days/weeks of delay if risk occurs
      - `budget` (string or number): Cost overrun if risk occurs
      - `quality` (string or number): Severity of quality degradation
      - `scope` (string or number): Reduction in deliverables or objectives
    - `overall_impact` (string or number): Highest impact dimension
    - `priority_score` (number): Probability × Impact (numeric scale)
    - `priority_rank` (string): High/Medium/Low based on score and risk appetite threshold
    - `mitigation_strategy` (string): Description of mitigation approach (avoid, reduce, transfer, accept)
    - `mitigation_action` (string): Specific action to execute (e.g., "Hire API specialist by Week 2" not "improve documentation")
    - `mitigation_owner` (string): Named individual or specific role (not "team")
    - `mitigation_timeline` (string): Start date and target completion date
    - `mitigation_cost_effort` (string): Estimated cost or effort (e.g., "2 weeks, $15K")
    - `mitigation_success_criteria` (string): How to verify mitigation is effective
    - `early_warning_indicator` (object):
      - `indicator` (string): Observable, measurable signal (e.g., "code review defect density > 5 per 1000 LOC")
      - `threshold` (string): Condition that triggers action (e.g., "if defect density exceeds 5")
      - `monitoring_frequency` (string): How often to check (daily, weekly, per-milestone)
      - `monitoring_method` (string): How to measure (automated metric, manual checklist, review, etc.)
      - `response_trigger` (string): Action to take if threshold is exceeded
    - `status` (string): Current status (identified, mitigated, monitoring, closed)
  - `summary` (object):
    - `total_risks_identified` (number)
    - `high_priority_count` (number)
    - `medium_priority_count` (number)
    - `low_priority_count` (number)
    - `risks_with_mitigation` (number)
    - `risks_accepted` (number)
    - `register_date` (string): ISO 8601 timestamp
    - `next_review_date` (string): Recommended review date
    - `high_priority_threshold` (string): Score threshold for high priority based on risk appetite
- `gaps_and_refinements` (array of strings): Identified gaps in risk coverage or recommendations for improving the register.
- `register_markdown` (string): Human-readable markdown table with columns: Risk ID | Description | Category | Probability | Impact | Priority | Mitigation | Owner | EWI | Status.

---

## Execution Phases

### Phase 1: Extract and Analyze Project Scope

**Entry Criteria:**
- Scope document is provided and readable (plain text, markdown, or structured format).
- Project type is specified.

**Actions:**
1. Parse the scope document to extract and document: project objectives (what success looks like), key deliverables (what will be produced), constraints (technical, budget, timeline, resource), stakeholders (who is affected), and success criteria (how to measure success).
2. Identify the project timeline: start date, key milestones (with dates), end date, and critical path dependencies.
3. Identify the budget envelope: total budget, allocation by phase or component, and contingency reserve (if any).
4. Note any dependencies on external parties, assumptions about availability or behavior, or known constraints that may influence risk.
5. Flag any ambiguities or missing information in the scope. Create a list of clarification questions if critical elements are missing.

**Output:**
- Structured scope summary with: objectives, deliverables, constraints (technical, budget, timeline, resource), stakeholders, success criteria, timeline with milestones, budget envelope.
- List of clarification questions (if any).

**Quality Gate:**
- Scope summary includes all seven elements: objectives, deliverables, constraints, stakeholders, success criteria, timeline with dates, budget with amounts.
- Timeline is quantified (start date, milestone dates, end date) or clearly bounded (e.g., "Q3 2024").
- Budget is quantified (total amount) or clearly bounded (e.g., "<$500K").
- If clarification questions exist, they are documented and marked for follow-up before proceeding to Phase 2.

---

### Phase 2: Identify Risk Categories and Brainstorm Risks

**Entry Criteria:**
- Scope analysis is complete (all seven elements documented).
- Project type is known.

**Actions:**
1. Select applicable risk categories based on project type. Use this standard list:
   - **Technical:** Technology choices, integration complexity, skill gaps, unproven approaches, performance, security, compliance.
   - **Schedule:** Timeline pressure, dependency delays, resource availability, estimation errors, scope creep.
   - **Budget:** Cost overruns, resource costs, contingency insufficiency, vendor cost changes.
   - **Resource:** Key person dependencies, skill gaps, team availability, turnover, onboarding delays.
   - **Stakeholder:** Misaligned expectations, changing requirements, governance delays, communication gaps.
   - **External:** Vendor/partner delays, regulatory changes, market shifts, third-party dependencies.
   - **Quality:** Testing gaps, defect escape, performance issues, user acceptance risk.
   - For domain-specific projects, add 1-2 domain categories (e.g., "Regulatory" for healthcare, "Market" for product launches).
2. Brainstorm potential risks within each category using scope elements as triggers:
   - For each constraint (timeline, budget, resource, technical), ask: "What could prevent us from meeting this constraint?"
   - For each dependency, ask: "What if this dependency fails or delays?"
   - For each assumption in the scope, ask: "What if this assumption is wrong?"
   - If historical_data is provided, map historical risks to current project categories and ask: "Are these risks present in our project?"
   - If stakeholder_input is provided, incorporate stakeholder concerns into brainstorming.
3. Document each risk as a specific statement using the format: "[Trigger] may cause [outcome] affecting [objective]." Example: "Lack of API documentation may cause integration delays affecting Q3 launch."
4. Remove exact duplicates and consolidate overlapping risks (e.g., "team skill gap" and "lack of expertise" are the same risk).
5. Verify that at least 2 risks are identified per category; if fewer, prompt for deeper brainstorming.

**Output:**
- Unfiltered list of identified risks (target: 20-50 for medium projects), each with: risk ID (temp), category, description, trigger, outcome, affected objective.
- Count of risks by category.

**Quality Gate:**
- Each risk is specific and actionable (not vague like "technical risk"; must include trigger and outcome).
- Risks span all applicable categories (minimum 2 risks per category).
- All scope constraints are mapped to at least one risk.
- All external dependencies are mapped to at least one risk.
- Duplicates and overlaps are consolidated.

---

### Phase 3: Assess Probability and Impact

**Entry Criteria:**
- Risk list is complete and specific (all quality gate criteria met).
- Assessment scale is defined (Low/Medium/High or 1-5).

**Actions:**
1. For each risk, assess **probability** (likelihood of occurrence):
   - If historical_data is provided, use historical frequency as primary basis (e.g., "similar projects experienced this 40% of the time" = Medium or 3/5).
   - Apply expert judgment based on project context (e.g., "new technology" increases probability; "proven approach" decreases probability).
   - Document the basis for each assessment: "Historical (X% of similar projects)", "Expert judgment (reason)", or "Assumption (reason)".
   - Probability ratings must be justified; do not assign ratings without documented basis.
2. For each risk, assess **impact** across four dimensions:
   - **Schedule:** Estimate days or weeks of delay if risk occurs. Rate as Low (<5 days), Medium (5-15 days), High (>15 days) OR use numeric scale 1-5.
   - **Budget:** Estimate cost overrun if risk occurs. Rate as Low (<5% of budget), Medium (5-15%), High (>15%) OR use numeric scale 1-5.
   - **Quality:** Estimate severity of quality degradation. Rate as Low (minor defects, user workaround available), Medium (moderate defects, user impact), High (critical defects, system unusable) OR use numeric scale 1-5.
   - **Scope:** Estimate reduction in deliverables. Rate as Low (<10% of scope), Medium (10-25%), High (>25%) OR use numeric scale 1-5.
   - Overall impact = highest rating across all four dimensions.
3. Risks with Low probability AND Low impact across all four dimensions may be moved to a "watch list" (monitored but not actively mitigated).
4. Verify consistency: Similar risks (same category, similar trigger) should have similar probability and impact ratings. If ratings differ, document the reason.

**Output:**
- Risk list with: probability rating, probability basis, impact ratings (schedule, budget, quality, scope), overall impact, consistency notes.

**Quality Gate:**
- Every probability rating has documented basis (historical data, expert judgment, or assumption).
- Every impact rating is justified (e.g., "schedule impact: 3 weeks based on critical path analysis").
- Similar risks have consistent ratings (within 1 level of each other); differences are documented.
- High-impact risks are clearly identified (overall impact = High).
- Watch list is documented (if any).

---

### Phase 4: Calculate Priority and Rank Risks

**Entry Criteria:**
- Probability and impact assessments are complete and justified.

**Actions:**
1. Calculate priority score for each risk:
   - If using Low/Medium/High scale: Convert to numeric (Low=1, Medium=2, High=3) and multiply: Priority Score = Probability × Impact. Range: 1-9.
   - If using 1-5 scale: Priority Score = Probability × Impact. Range: 1-25.
2. Sort risks by priority score (highest first).
3. Assign permanent risk IDs (RISK-001, RISK-002, etc.) in priority order.
4. Determine the high-priority threshold based on risk_appetite:
   - **Conservative:** High priority = score ≥ 4 (on 1-9 scale) or ≥ 12 (on 1-25 scale).
   - **Moderate:** High priority = score ≥ 6 (on 1-9 scale) or ≥ 15 (on 1-25 scale).
   - **Aggressive:** High priority = score ≥ 8 (on 1-9 scale) or ≥ 20 (on 1-25 scale).
5. Classify each risk as High, Medium, or Low priority based on threshold.
6. Create a risk heat map (optional): Plot risks on a 2D grid (Probability vs. Impact) for visualization.
7. Count risks by priority level.

**Output:**
- Ranked risk list with: risk ID, priority score, priority rank (High/Medium/Low).
- Count of high/medium/low priority risks.
- High-priority threshold value (documented for audit trail).
- Risk heat map (if applicable).

**Quality Gate:**
- High-priority risks are clearly separated from medium/low (no ambiguity in classification).
- Risk ranking is defensible (priority scores are calculated consistently).
- At least 1 and at most 15 risks are classified as High priority (if >15, consider consolidation; if 0, consider risk appetite or assessment bias).
- Risk IDs are assigned in priority order.

---

### Phase 5: Develop Mitigation Strategies

**Entry Criteria:**
- Risks are ranked by priority.
- High-priority risks are identified.

**Actions:**
1. For each high-priority risk (and medium-priority risks if resources allow), develop a mitigation strategy:
   - **Avoid:** Eliminate the risk by changing project approach. Example: "Use proven technology instead of experimental."
   - **Reduce:** Lower probability or impact through controls, training, or process improvements. Example: "Hire API specialist to reduce skill gap; add integration testing to reduce quality risk."
   - **Transfer:** Shift risk to third party via contract, SLA, or insurance. Example: "Vendor SLA for 99.9% uptime; outsource high-risk component."
   - **Accept:** Acknowledge risk and plan contingency. Example: "Budget 10% reserve for cost overrun; develop fallback plan if vendor fails."
2. For each mitigation strategy, define:
   - **Mitigation Action:** Specific, imperative action (not vague). Example: "Hire API specialist by Week 2" (not "improve documentation").
   - **Owner:** Named individual or specific role (not "team"). Example: "John Smith, Tech Lead" (not "development team").
   - **Timeline:** Start date and target completion date. Example: "Start Week 1, complete by Week 4."
   - **Cost/Effort:** Rough estimate of resources required. Example: "2 weeks, $15K" or "40 hours."
   - **Success Criteria:** How to verify mitigation is effective. Example: "API documentation is complete and reviewed by 2 external developers; integration tests pass 100%."
3. Verify feasibility for each mitigation:
   - Cost must be <X% of project budget (specify threshold based on risk appetite; e.g., 5% for conservative, 10% for moderate).
   - Timeline must not conflict with critical path (mitigation must complete before risk could occur).
   - Owner must have authority and incentive to execute (not a generic "team").
4. For risks that cannot be mitigated (infeasible or too costly), document the acceptance decision and contingency plan.

**Output:**
- Mitigation strategy for each high-priority risk: strategy type (avoid/reduce/transfer/accept), action, owner, timeline, cost/effort, success criteria.
- Contingency plans for accepted risks.
- Feasibility assessment (cost, timeline, authority).

**Quality Gate:**
- Every high-priority risk has a mitigation strategy or explicit acceptance with documented contingency.
- Every mitigation strategy has: specific action (not vague), named owner (not "team"), timeline (start and end dates), cost/effort estimate, and success criteria.
- Mitigation timelines do not conflict with project critical path.
- Mitigation cost is within acceptable threshold (documented).
- Accepted risks have documented contingency plans (fallback, reserve, escalation path).

---

### Phase 6: Define Early Warning Indicators

**Entry Criteria:**
- Mitigation strategies are defined.
- High-priority risks are identified.

**Actions:**
1. For each risk (especially high-priority), define **early warning indicators (EWIs)**:
   - An EWI is an observable, measurable signal that a risk is beginning to materialize.
   - EWI must appear **before** the risk fully occurs, allowing time for response (lead time: minimum 1 week for schedule risks, 2 weeks for budget risks, 1 month for resource risks).
   - Example: For "schedule delay risk," an EWI might be "task completion rate drops below 80% of planned" (appears 2-3 weeks before actual delay).
2. For each EWI, specify:
   - **Indicator:** The specific metric or observation. Must be measurable and objective. Example: "code review defect density > 5 per 1000 LOC" (not "code quality is declining").
   - **Threshold:** The condition that triggers action. Example: "if defect density exceeds 5."
   - **Monitoring Frequency:** How often to check. Options: daily, weekly, per-milestone, per-deliverable. Choose frequency based on risk lead time and project cadence.
   - **Monitoring Method:** How to measure. Options: automated metric (from tool), manual checklist, stakeholder review, status report. Prefer automated methods to reduce overhead.
   - **Response Trigger:** What action to take if threshold is exceeded. Example: "escalate to project manager; activate mitigation plan; adjust schedule."
3. Ensure EWIs are:
   - **Measurable:** Can be quantified or objectively observed (not subjective like "team morale is low").
   - **Timely:** Appear early enough to allow corrective action (minimum lead time documented).
   - **Actionable:** Lead to a clear response (not just "flag for review").
   - **Feasible:** Can be monitored with available tools and effort (<X hours/week, where X is acceptable overhead).
4. Consolidate EWIs: If multiple risks share the same indicator, monitor once and apply to all risks.

**Output:**
- Early warning indicator for each risk: indicator (measurable), threshold, monitoring frequency, monitoring method, response trigger, lead time.
- Monitoring plan: who monitors, how often, how to escalate, tools/data sources.
- Consolidated EWI list (if multiple risks share indicators).

**Quality Gate:**
- Every high-priority risk has at least one EWI.
- Every EWI is specific and measurable (not subjective).
- Every EWI has documented lead time (minimum 1 week).
- Monitoring is feasible within project overhead budget (total monitoring effort <X hours/week).
- Response triggers are defined and actionable (not vague like "monitor closely").
- Monitoring methods use existing project tools/metrics where possible (to minimize new overhead).

---

### Phase 7: Compile and Validate Risk Register

**Entry Criteria:**
- All risks are assessed, prioritized, mitigated, and have EWIs.

**Actions:**
1. Compile all risk data into a structured risk register:
   - Create a table or JSON object with columns: Risk ID, Description, Category, Probability, Impact (schedule/budget/quality/scope), Priority Score, Priority Rank, Mitigation Strategy, Mitigation Action, Owner, Timeline, Cost/Effort, EWI, Monitoring Frequency, Status.
   - Ensure consistent formatting: probability/impact use same scale throughout, dates are ISO 8601, costs are in same currency.
   - Verify that every risk has all required fields (no blanks except optional fields).
2. Generate a summary:
   - Total risks identified.
   - Count by priority level (high/medium/low).
   - Count of risks with mitigation vs. accepted.
   - High-priority threshold (score value and risk appetite).
   - Next review date (recommend quarterly for projects >6 months, per-milestone for shorter projects).
3. Create a human-readable markdown version for stakeholder communication:
   - Format as a table with columns: Risk ID | Description | Category | Probability | Impact | Priority | Mitigation | Owner | EWI | Status.
   - Include summary statistics at the top.
   - Include next review date and contact for questions.
4. Validate the register:
   - Cross-check against original scope: Are all major risk areas covered? (e.g., if scope mentions "new technology," is there a technical risk? If timeline is aggressive, is there a schedule risk?)
   - Review with project team and stakeholders (if stakeholder_input provided): Are assessments reasonable? Are any critical risks missing? Are mitigation strategies feasible?
   - Verify that mitigation strategies do not introduce new risks (e.g., hiring a contractor to reduce schedule risk may introduce vendor risk).
   - Verify that all high-priority risks have mitigation or explicit acceptance.
5. Document any gaps or refinements needed:
   - Risks identified during validation that were not in original brainstorm.
   - Mitigation strategies flagged as infeasible and requiring revision.
   - Stakeholder concerns not yet addressed.

**Output:**
- Structured risk register (JSON/table format) with all required fields.
- Summary statistics (total risks, count by priority, count with mitigation, next review date).
- Markdown version for documentation and stakeholder communication.
- List of gaps and refinements (if any).

**Quality Gate:**
- Risk register is complete: every risk has all required fields (risk ID, description, category, probability, impact, priority, mitigation, owner, timeline, EWI, status).
- Risk register is internally consistent: probability/impact scales are uniform, dates are valid, owners are named individuals or roles.
- All high-priority risks have mitigation strategy or explicit acceptance with contingency plan.
- All high-priority risks have EWI with monitoring frequency and method.
- Register is validated by project team (documented: who reviewed, date, feedback).
- No critical risks are missing (scope coverage verified).
- Mitigation strategies do not introduce new risks (cross-check completed).
- Register is ready for stakeholder review and project execution.

---

## Exit Criteria

The skill is complete when:
1. **Scope Analysis Complete:** Scope summary includes objectives, deliverables, constraints, stakeholders, success criteria, timeline with dates, and budget with amounts. Clarification questions (if any) are documented.
2. **Risk Identification Complete:** All risks identified in brainstorming are captured in the register. At least 2 risks per category. All scope constraints and external dependencies are mapped to risks.
3. **Risk Assessment Complete:** Every risk has probability (with documented basis), impact (by dimension), and priority score. Assessments are justified and consistent.
4. **Mitigation Complete:** Every high-priority risk has mitigation strategy (avoid/reduce/transfer/accept) with specific action, named owner, timeline, cost estimate, and success criteria. Medium-priority risks have mitigation if resources allow. Accepted risks have contingency plans.
5. **EWI Complete:** Every high-priority risk has early warning indicator with measurable threshold, monitoring frequency, monitoring method, and response trigger. Lead time is documented.
6. **Register Compiled:** Risk register is structured (JSON or table), complete (all fields populated), and internally consistent (uniform scales, valid dates, named owners).
7. **Register Validated:** Project team has reviewed register and confirmed: assessments are reasonable, critical risks are captured, mitigation strategies are feasible, no new risks are introduced. Validation is documented (who reviewed, date, feedback).
8. **Stakeholder Acceptance:** Stakeholders have reviewed markdown version and either approved register or documented gaps for follow-up.
9. **Review Schedule Set:** Next review date is scheduled (quarterly for projects >6 months, per-milestone for shorter projects) and communicated to stakeholders.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Scope document is incomplete or ambiguous (missing objectives, deliverables, timeline, or budget) | **Adjust** -- Document clarification questions and request missing information. Proceed with available scope; flag risks related to scope ambiguity (e.g., "Ambiguous requirements may cause rework affecting schedule"). Mark register as "draft pending scope clarification." |
| Phase 1 | Project type is not specified or unclear | **Adjust** -- Ask user to categorize project (software, infrastructure, product, research, operations, etc.). If type remains unclear, use generic risk categories (technical, schedule, budget, resource, stakeholder, external, quality) and note that domain-specific categories may be missing. |
| Phase 2 | Brainstorming yields <10 risks | **Adjust** -- Risks may be under-identified. Prompt user to use risk checklist by category (provided in Reference Section). Ask: "For each constraint (timeline, budget, resource, technical), what could prevent us from meeting it?" Repeat brainstorming. If still <10 risks, document assumption that project is low-risk and proceed. |
| Phase 2 | Brainstorming yields >100 risks | **Adjust** -- Consolidate overlapping risks (e.g., "team skill gap" and "lack of expertise" are one risk). Deprioritize low-impact items to "watch list." If risks span >3 independent domains, consider splitting into sub-projects. Target: 20-50 risks for final register. |
| Phase 3 | Probability/impact assessments are inconsistent or unjustified (e.g., two similar risks have very different ratings) | **Adjust** -- Request basis for each assessment. Apply consistency rules: similar risks (same category, similar trigger) must have ratings within 1 level of each other. If basis is missing, document as "assumption" and note for review. |
| Phase 3 | No historical data available for probability assessment | **Adjust** -- Use expert judgment and document assumptions. Note in register: "Probability assessments are assumption-based and should be reviewed as project progresses." Plan to update assessments after first milestone based on actual experience. |
| Phase 5 | Mitigation strategy is infeasible (too costly, too late, or owner lacks authority) | **Adjust** -- Revise strategy: reduce scope (e.g., mitigate only highest-impact dimension), extend timeline (if possible), or accept risk with contingency plan. Document trade-off decision and rationale. |
| Phase 6 | EWI is not measurable or monitoring is too costly (>X hours/week) | **Adjust** -- Simplify EWI to use available metrics or observations from existing project tools. Accept that some risks have less precise monitoring. Document monitoring method and overhead. |
| Phase 7 | Stakeholder validation reveals missing critical risks | **Retry** -- Return to Phase 2, add missing risks, re-assess probability/impact (Phase 3), develop mitigation (Phase 5), define EWIs (Phase 6), and re-compile register (Phase 7). Update register and re-validate. |
| Phase 7 | Risk register exceeds 50 risks | **Adjust** -- Consolidate low-priority risks into "watch list" (monitored but not actively mitigated). Focus detailed mitigation on top 20-30 risks. Document watch list separately. |
| Phase 7 | Project team or stakeholders reject register as incomplete or unrealistic | **Adjust** -- Document feedback and specific concerns. Identify which risks are disputed and why. Revise assessments or mitigation strategies based on feedback. Re-validate and re-present. If disagreement persists, escalate to project sponsor for decision. |
| Phase 7 | User rejects final output | **Targeted revision** -- ask which risk entry, probability/impact score, or mitigation strategy fell short and rerun only that section. Do not rebuild the full risk register. |

---

## Reference Section

### Risk Categories and Examples

**Technical Risks:**
- Unproven technology or architecture.
- Integration complexity with third-party systems.
- Skill gaps in team (e.g., new programming language, framework).
- Performance or scalability concerns.
- Security vulnerabilities or compliance gaps.
- Data migration or legacy system integration.

**Schedule Risks:**
- Aggressive timeline relative to scope.
- Dependency on external deliverables or approvals.
- Resource availability constraints.
- Estimation errors or scope creep.
- Key person unavailability or turnover.
- Milestone dependencies or critical path delays.

**Budget Risks:**
- Cost overruns due to scope creep or estimation errors.
- Resource cost inflation.
- Contingency insufficiency.
- Vendor or contractor cost changes.
- Unplanned rework or defect fixes.

**Resource Risks:**
- Key person dependencies (single point of failure).
- Team skill gaps.
- Resource availability or turnover.
- Onboarding delays for new team members.
- Competing priorities for shared resources.

**Stakeholder Risks:**
- Misaligned expectations or requirements.
- Changing priorities or scope.
- Governance or approval delays.
- Communication gaps or stakeholder disengagement.
- Conflicting stakeholder interests.

**External Risks:**
- Vendor or partner delays or failures.
- Regulatory or compliance changes.
- Market shifts or competitive threats.
- Third-party dependency failures.
- Supply chain disruptions.

**Quality Risks:**
- Insufficient testing or QA resources.
- Defect escape or late-stage defect discovery.
- Performance or usability issues.
- User acceptance or adoption risk.
- Maintenance or support gaps.

### Probability and Impact Scale

**Low/Medium/High Scale:**
- **Low:** Unlikely to occur (<30% probability); minimal impact if it does (<5% of budget, <5 days schedule, minor quality issue).
- **Medium:** Possible (30-70% probability); moderate impact (5-15% of budget, 5-15 days schedule, moderate quality issue).
- **High:** Likely or certain (>70% probability); significant impact (>15% of budget, >15 days schedule, critical quality issue).

**1-5 Numeric Scale:**
- **1:** Very unlikely (<10% probability); negligible impact (<1% of budget, <1 day schedule).
- **2:** Unlikely (10-30% probability); minor impact (1-5% of budget, 1-5 days schedule).
- **3:** Possible (30-70% probability); moderate impact (5-15% of budget, 5-15 days schedule).
- **4:** Likely (70-90% probability); significant impact (15-25% of budget, 15-30 days schedule).
- **5:** Very likely or certain (>90% probability); severe impact (>25% of budget, >30 days schedule).

### Early Warning Indicator Examples

- **Schedule Risk:** Task completion rate drops below 80% of planned; milestone slip of >5 days; critical path activity is behind schedule.
- **Budget Risk:** Actual spend exceeds planned by >10%; vendor quotes exceed budget by >15%; unplanned expenses identified.
- **Quality Risk:** Defect density exceeds threshold (e.g., >5 per 1000 LOC); code review findings increase; test pass rate drops below 95%.
- **Resource Risk:** Key team member announces departure; skill gap assessment reveals gaps; training completion rate <80%; resource utilization >90%.
- **Stakeholder Risk:** Stakeholder meeting attendance drops; change request frequency increases; approval cycle extends beyond baseline; stakeholder satisfaction survey score drops.
- **External Risk:** Vendor communication delays (no response >2 days); regulatory guidance changes; third-party status updates indicate delays; market competitor announces similar product.
- **Technical Risk:** Proof-of-concept fails; integration test failures increase; performance benchmark misses target; security scan identifies vulnerabilities.

### Risk Mitigation Strategies

**Avoid:**
- Change project approach to eliminate risk source.
- Example: Use proven technology instead of experimental; outsource high-risk component instead of building in-house.
- Cost: Often high (rework, timeline impact); benefit: eliminates risk entirely.

**Reduce:**
- Lower probability: Add controls, training, or process improvements. Example: Hire specialist to reduce skill gap; add code review to reduce quality risk.
- Lower impact: Add redundancy, testing, or fallback plans. Example: Add integration testing to reduce quality impact; hire backup resource to reduce key person risk.
- Cost: Moderate (training, tools, process); benefit: reduces but does not eliminate risk.

**Transfer:**
- Shift risk to third party via contract, SLA, or insurance.
- Example: Vendor SLA for uptime; outsource component with penalty for delays; purchase insurance for liability.
- Cost: Moderate (vendor fees, insurance premiums); benefit: third party bears risk.

**Accept:**
- Acknowledge risk and plan contingency.
- Example: Budget reserve for cost overrun; fallback plan if vendor fails; escalation path if issue occurs.
- Cost: Low upfront (reserve, planning); high if risk occurs (contingency activation).
- Use for: Low-probability or low-impact risks; risks that cannot be mitigated; risks where mitigation cost exceeds impact.

### Risk Register Review Cadence

- **Quarterly:** Standard review for projects >6 months. Assess realized risks, update assessments, identify emerging risks.
- **Per-Milestone:** Review after each major milestone (e.g., design complete, development complete, testing complete). Assess realized risks and adjust mitigation for remaining phases.
- **Triggered:** Review if major scope change, resource change, external event, or threshold breach occurs. Update register and communicate changes.
- **Weekly:** For high-risk projects or during high-risk phases (e.g., integration, launch). Monitor EWIs, escalate threshold breaches, adjust mitigation.

### Risk Interdependency Analysis (Optional)

Some risks may trigger or amplify other risks. Mapping these dependencies helps prioritize mitigation:
- **Trigger:** Risk A causes Risk B. Example: "Schedule delay" triggers "budget overrun" (overtime costs).
- **Amplify:** Risk A increases probability or impact of Risk B. Example: "Key person departure" amplifies "schedule delay" (reduced capacity).
- **Mitigate:** Mitigation of Risk A reduces Risk B. Example: "Hire specialist" mitigates both "skill gap" and "schedule delay."

For high-risk projects, create a risk dependency matrix: rows and columns are risks, cells indicate trigger/amplify/mitigate relationships. Use to identify high-impact mitigation strategies that address multiple risks.

---

**Version:** 2.0  
**Last Updated:** 2024  
**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.