# Stakeholder Communication Plan Generator

**One-line description:** Systematically identify stakeholder groups, analyze their needs, design tailored messages and channels, establish communication cadence, create reusable templates, assess communication risks, and generate an integrated, monitored stakeholder communication plan for consistent, targeted engagement.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_scope` (string, required) -- High-level description of the project, its goals, and expected duration.
- `organizational_structure` (string or object, required) -- Description or diagram of relevant organizational units, reporting lines, and key roles.
- `project_charter` (string, optional) -- Project charter, business case, or strategic context document.
- `project_timeline` (object, optional) -- Key milestones, phases, and critical dates. Structure: `{"phases": [{"name": string, "start_date": string, "end_date": string}]}`
- `risk_register` (array, optional) -- Known risks or concerns that may affect stakeholder communication. Structure: `[{"risk": string, "impact": string, "stakeholders_affected": [string]}]`
- `organizational_communication_norms` (string, optional) -- Existing communication practices, preferred channels, formality levels.
- `brand_guidelines` (string, optional) -- Tone, style, visual guidelines for communications.
- `cultural_context` (object, optional) -- Regional, linguistic, or cultural considerations. Structure: `{"regions": [string], "languages": [string], "cultural_norms": [string]}`

---

## Outputs

- `stakeholder_inventory` (array) -- Catalog of all identified stakeholders. Structure: `[{"name": string, "role": string, "department": string, "group_id": string}]`
- `stakeholder_analysis_matrix` (array) -- Analysis of each stakeholder group with interests, concerns, influence, and communication needs. Structure: `[{"group_id": string, "group_name": string, "influence_level": "high|medium|low", "interest_level": "high|medium|low", "key_interests": [string], "key_concerns": [string], "communication_needs": [string]}]`
- `message_framework` (object) -- Tailored messaging strategy per stakeholder group. Structure: `{"groups": [{"group_id": string, "key_themes": [string], "talking_points": [string], "tone": string, "technical_level": "high|medium|low"}]}`
- `channel_matrix` (array) -- Recommended communication channels per stakeholder group. Structure: `[{"group_id": string, "primary_channel": string, "secondary_channels": [string], "rationale": string}]`
- `communication_schedule` (object) -- Cadence and timing of communications. Structure: `{"schedule": [{"group_id": string, "frequency": string, "timing": string, "key_dates": [string]}]}`
- `template_library` (object) -- Reusable communication templates. Structure: `{"templates": [{"type": string, "group_id": string, "template_content": string}]}`
- `communication_risk_assessment` (object) -- Identified communication risks and mitigation strategies. Structure: `{"risks": [{"risk_id": string, "failure_mode": string, "affected_groups": [string], "likelihood": "high|medium|low", "impact": "high|medium|low", "mitigation_strategy": string, "contingency_action": string}]}`
- `crisis_communication_protocol` (object) -- Rapid-response templates and escalation paths for urgent issues. Structure: `{"escalation_paths": [{"trigger": string, "responsible_party": string, "notification_timeline": string, "template_type": string}], "templates": [{"scenario": string, "template_content": string}]}`
- `engagement_tracking_dashboard_spec` (object) -- Specification for monitoring communication delivery and stakeholder engagement. Structure: `{"metrics": [{"metric_name": string, "measurement_method": string, "target_threshold": string, "review_frequency": string}], "tracking_fields": [string]}`
- `communication_plan_document` (string) -- Integrated, validated stakeholder communication plan ready for distribution.

---

## Execution Phases

### Phase 1: Identify Stakeholders

**Entry Criteria:**
- Project scope is defined.
- Organizational structure is available.
- Project charter or business case is provided (optional but recommended).

**Actions:**

1. Parse the project scope and organizational structure to identify all potential stakeholder groups (executives, team members, customers, vendors, regulators, affected departments, etc.).
2. For each identified group, record: name, representative roles, department/unit, and primary contact method if known.
3. Distinguish between direct stakeholders (directly involved or impacted) and indirect stakeholders (peripherally affected).
4. Flag any stakeholders mentioned in the project charter or risk register.
5. Consolidate the list, removing duplicates and grouping similar roles into stakeholder groups.
6. If cultural_context is provided, note regional or linguistic variations in stakeholder groups (e.g., separate groups for different regions or language speakers).

**Output:** `stakeholder_inventory` array with all identified groups.

**Quality Gate:** At least 5 distinct stakeholder groups are identified. Each group has a clear role and department. No individual is listed twice. If cultural_context is provided, regional or linguistic variations are documented.

---

### Phase 2: Analyze Stakeholder Needs and Interests

**Entry Criteria:**
- Stakeholder inventory is complete.
- Project timeline and risk register are available (optional).

**Actions:**

1. For each stakeholder group, infer or document their key interests relative to the project (e.g., executives care about ROI and timeline; end-users care about usability and training).
2. Identify concerns or potential objections each group may have (e.g., change resistance, resource constraints, competing priorities).
3. Assess influence level using the Power/Interest Grid: Can this group block, accelerate, or significantly shape the project? Assign High/Medium/Low based on documented criteria.
4. Assess interest level using the Power/Interest Grid: How directly does this group care about project outcomes? Assign High/Medium/Low based on documented criteria.
5. Document specific communication needs for each group (e.g., executives need monthly summaries; end-users need hands-on training). Needs must be observable and distinct, not generic.
6. Cross-reference with risk register: flag stakeholders affected by known risks and document their specific concerns.

**Output:** `stakeholder_analysis_matrix` with influence, interest, concerns, and communication needs per group.

**Quality Gate:** Every stakeholder group has documented interests and concerns. Influence and interest levels are assigned using Power/Interest Grid criteria. Communication needs are specific and observable (e.g., 'monthly executive summary email' not 'regular updates'). Risk-affected stakeholders are flagged with specific concerns.

---

### Phase 3: Design Tailored Messages

**Entry Criteria:**
- Stakeholder analysis matrix is complete.
- Project goals and key milestones are defined.
- Brand guidelines are available (optional).

**Actions:**

1. For each stakeholder group, define 3-5 key themes or messages that resonate with their interests (e.g., for executives: "On-time delivery, budget control, risk mitigation"; for end-users: "Minimal disruption, clear training, support availability").
2. Develop 2-3 talking points per theme that support the message with evidence or context.
3. Set tone and technical level appropriate to the group (e.g., executives: formal, high-level; technical teams: detailed, jargon-acceptable; end-users: clear, non-technical).
4. If cultural_context is provided, adapt messages for cultural norms and linguistic clarity (e.g., avoid idioms, adjust formality levels, consider translation requirements).
5. Document message variations for different scenarios (routine update, risk escalation, milestone achievement, change notification).

**Output:** `message_framework` with tailored messages, talking points, tone, and technical level per group.

**Quality Gate:** Every stakeholder group has 3-5 key themes. Each theme has 2-3 supporting talking points. Tone and technical level are documented and appropriate to audience expertise. If cultural_context is provided, cultural adaptations are documented. Message variations cover routine and scenario-specific communications.

---

### Phase 4: Select Communication Channels

**Entry Criteria:**
- Message framework is complete.
- Stakeholder analysis matrix is available.
- Organizational communication norms are documented (optional).

**Actions:**

1. For each stakeholder group, identify the optimal primary communication channel (email, town hall, one-on-one, dashboard, report, etc.) based on group size, urgency, preference, and message type.
2. Identify secondary channels for redundancy or different message types (e.g., email for routine updates, meetings for complex discussions).
3. Document the rationale for each channel choice, referencing stakeholder preferences, organizational norms, and message complexity.
4. Verify channel availability and accessibility for all stakeholders in the group (e.g., not all stakeholders may have dashboard access).
5. If cultural_context is provided, ensure channels are accessible across regions and languages (e.g., provide translations, accommodate time zones).

**Output:** `channel_matrix` with primary and secondary channels, rationale, and accessibility notes per group.

**Quality Gate:** Every stakeholder group has at least one assigned channel. Primary channel choice is justified with specific criteria (group size, urgency, preference). Secondary channels are identified for redundancy. Channel accessibility is verified. If cultural_context is provided, multi-region and multi-language accessibility is documented.

---

### Phase 5: Establish Communication Cadence and Risk Assessment

**Entry Criteria:**
- Channel matrix is complete.
- Project timeline is defined.
- Risk register is available (optional).

**Actions:**

1. For each stakeholder group, determine the appropriate communication frequency based on their influence level, interest level, and role (e.g., executives: monthly; core team: weekly; end-users: as-needed or pre-launch intensive).
2. Map communication events to project phases and key milestones (e.g., kickoff, phase completion, risk escalation, go-live).
3. Establish specific timing (e.g., "every Monday 10 AM" or "within 24 hours of milestone completion"). Use relative timing for uncertain project schedules.
4. Balance communication frequency against stakeholder fatigue and organizational norms.
5. Identify potential communication failures for each stakeholder group: message misunderstood, channel unavailable, stakeholder disengaged, cultural misalignment, language barrier, timing conflict.
6. For each identified failure mode, document likelihood (High/Medium/Low), impact (High/Medium/Low), mitigation strategy (preventive action), and contingency action (reactive response).
7. Identify which stakeholders are most at-risk of disengagement or miscommunication based on influence, interest, and cultural factors.

**Output:** `communication_schedule` with frequency, timing, and key dates per group. `communication_risk_assessment` with failure modes, mitigation strategies, and contingency actions.

**Quality Gate:** Every stakeholder group has a defined communication frequency. Schedule aligns with project timeline. No group is over-communicated or under-communicated relative to their role. Every identified failure mode has a documented mitigation strategy and contingency action. At-risk stakeholders are flagged.

---

### Phase 6: Create Reusable Templates and Crisis Protocol

**Entry Criteria:**
- Message framework, channel matrix, and communication schedule are complete.
- Brand guidelines are available (optional).
- Communication risk assessment is complete.

**Actions:**

1. For each primary channel type (email, meeting agenda, status report, dashboard, presentation), create a template that reflects the message framework and tone for each stakeholder group.
2. Include placeholders for project-specific data (dates, milestones, metrics, risks).
3. Ensure templates are consistent with brand guidelines (tone, formatting, visual style).
4. Create variations for different message types (routine update, risk alert, milestone celebration, change notification).
5. Document instructions for using each template (when to use, what to customize, approval process).
6. Organize templates by stakeholder group and channel for easy reference.
7. Develop crisis communication protocol: for each high-impact failure mode (project delay, budget overrun, scope change, stakeholder escalation), create a rapid-response template and define escalation path, responsible party, and notification timeline.
8. Define escalation triggers: what conditions trigger crisis communication? (e.g., delay > 2 weeks, budget variance > 10%, scope change affecting > 3 groups).

**Output:** `template_library` with templates for each channel and stakeholder group. `crisis_communication_protocol` with escalation paths, triggers, and rapid-response templates.

**Quality Gate:** At least one template exists for each primary channel. Templates include placeholders and customization guidance. Templates reflect the tailored messaging for each group. Crisis protocol covers high-impact failure modes. Escalation triggers are specific and measurable. Responsible parties are assigned for each escalation path.

---

### Phase 7: Design Engagement Tracking and Validate Plan

**Entry Criteria:**
- All outputs from Phases 1-6 are complete.

**Actions:**

1. Define engagement tracking metrics: communication delivery rate (% of stakeholders who received each communication), engagement rate (% who opened/attended/responded), sentiment (positive/neutral/negative feedback), and at-risk indicator (stakeholders with low engagement or negative sentiment).
2. Specify measurement methods for each metric (email open rates, meeting attendance, survey responses, feedback analysis).
3. Set target thresholds for each metric (e.g., delivery rate > 95%, engagement rate > 70%, sentiment > 60% positive).
4. Define review frequency (e.g., weekly for high-influence groups, monthly for others).
5. Specify tracking fields: stakeholder group, communication date, channel, message type, delivery status, engagement status, sentiment, notes.
6. Verify that every identified stakeholder group is represented in the analysis matrix, message framework, channel matrix, schedule, and templates.
7. Check for consistency: do messages align with stakeholder interests? Do channels match group preferences? Does cadence match influence and interest levels? Are crisis protocols aligned with identified risks?
8. Identify any gaps: stakeholders without assigned channels, groups without tailored messages, missing templates, unaddressed failure modes.
9. Validate that the communication plan covers all project phases and key milestones.
10. Compile all components into a single, integrated communication plan document with executive summary, stakeholder overview, detailed plans per group, template appendix, risk assessment, crisis protocol, and engagement tracking specification.
11. Add a responsibility matrix: who owns each communication task? Who approves messages? Who monitors engagement?

**Output:** `engagement_tracking_dashboard_spec` with metrics, measurement methods, and tracking fields. `communication_plan_document` (integrated, validated plan).

**Quality Gate:** All stakeholder groups are covered in all components. No contradictions between components. Engagement tracking metrics are measurable and aligned with communication objectives. Plan is actionable and ready for distribution. Responsibility is assigned for each communication task. Crisis protocol is integrated with risk assessment. Tracking specification enables mid-project refinement based on actual stakeholder response.

---

## Exit Criteria

The skill is complete when:

1. All stakeholder groups are identified, analyzed, and documented with influence and interest levels assigned using Power/Interest Grid criteria.
2. Tailored messages and channels are defined for each group, with documented rationale and cultural adaptations (if applicable).
3. Communication cadence is established and aligned with project timeline, with relative timing for uncertain schedules.
4. Communication risks are assessed with specific failure modes, mitigation strategies, and contingency actions documented.
5. Crisis communication protocol is defined with escalation triggers, responsible parties, and rapid-response templates.
6. Reusable templates are created for each channel and stakeholder group, with customization guidance.
7. Engagement tracking specification is defined with measurable metrics, target thresholds, and review frequency.
8. An integrated communication plan document is produced and validated, with no gaps in stakeholder coverage or contradictions between components.
9. A responsibility matrix is included assigning ownership for each communication task.
10. A person unfamiliar with the project can execute the communication plan using the templates, schedule, and responsibility matrix provided, and can track engagement using the specified metrics.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Organizational structure is unclear or unavailable | **Adjust** -- ask for an org chart or list of key departments; proceed with available information and flag gaps in stakeholder coverage |
| Phase 1 | Stakeholder list is incomplete or missing key groups | **Adjust** -- conduct a stakeholder brainstorm session; add missing groups and re-analyze. **Retry** if new groups significantly change influence/interest distribution |
| Phase 2 | Stakeholder interests are unclear or contradictory | **Adjust** -- conduct interviews or surveys with representative stakeholders; document assumptions and data sources |
| Phase 2 | Influence/interest assessment is subjective or inconsistent | **Adjust** -- use Power/Interest Grid with explicit criteria (e.g., 'High Influence = can block project'); document assessment rationale for each group |
| Phase 3 | Messages conflict with organizational strategy or brand guidelines | **Adjust** -- align messages with strategic communications team; revise and re-validate. **Abort** if conflict cannot be resolved without changing project scope |
| Phase 4 | Preferred channels are unavailable or unsupported | **Adjust** -- identify alternative channels; document constraints and workarounds. **Retry** with different channel combinations if primary options fail |
| Phase 5 | Communication frequency creates overhead or fatigue | **Adjust** -- reduce frequency for lower-influence groups; consolidate messages where possible. **Retry** with adjusted cadence after Phase 7 engagement tracking |
| Phase 5 | Project timeline is uncertain or subject to change | **Adjust** -- use relative timing (e.g., "within 1 week of milestone") instead of fixed dates. **Retry** with updated timeline when available |
| Phase 5 | Risk assessment identifies critical failure modes with no viable mitigation | **Adjust** -- escalate to project sponsor; consider communication plan contingencies or project scope changes. **Abort** if critical risks cannot be mitigated |
| Phase 6 | Templates are too generic or too specific | **Adjust** -- create tiered templates (basic, detailed, executive) for flexibility. **Retry** with different template structures |
| Phase 6 | Crisis protocol triggers are ambiguous or difficult to detect | **Adjust** -- define triggers with specific, measurable conditions (e.g., 'delay > 2 weeks' not 'significant delay'). **Retry** with refined trigger definitions |
| Phase 7 | Plan is too large or complex to execute | **Adjust** -- prioritize high-influence stakeholders; phase in lower-priority groups. **Retry** with phased rollout approach |
| Phase 7 | Engagement tracking metrics are difficult to measure or collect | **Adjust** -- simplify metrics to those easily captured by existing tools (email open rates, meeting attendance); document data collection process |
| Phase 7 | Responsibility matrix reveals gaps or conflicts in ownership | **Adjust** -- clarify roles and escalation paths with project sponsor and communications lead; update matrix. **Retry** after clarification |

---

## Reference Section

### Stakeholder Analysis Framework

**Power/Interest Grid:**
- **High Influence + High Interest (Manage Closely):** Manage closely; frequent, detailed communication; involve in decisions; monitor satisfaction regularly.
- **High Influence + Low Interest (Keep Satisfied):** Keep satisfied; regular updates; monitor for changes in interest; escalate if interest increases.
- **Low Influence + High Interest (Keep Informed):** Keep informed; responsive communication; address concerns; involve in feedback loops.
- **Low Influence + Low Interest (Monitor):** Monitor; minimal communication; escalate if influence or interest increases.

**Influence Assessment Criteria:**
- High: Can block project, control budget, approve scope, or significantly shape outcomes.
- Medium: Can influence decisions, provide resources, or affect timeline.
- Low: Affected by project but limited decision-making power.

**Interest Assessment Criteria:**
- High: Directly impacted by project outcomes, actively involved, or has strategic interest.
- Medium: Moderately affected or involved in specific phases.
- Low: Peripherally affected or involved in limited capacity.

### Communication Channel Selection Criteria

- **Email:** Routine updates, documentation, asynchronous communication, broad distribution, formal record-keeping.
- **Meetings (1-on-1, small group, town hall):** Complex discussions, feedback, relationship building, urgent issues, decision-making.
- **Reports/Dashboards:** Metrics, progress tracking, executive summaries, data-driven decisions, self-service access.
- **Presentations:** Major announcements, training, stakeholder alignment, formal reviews, visual communication.
- **Informal (chat, hallway conversations):** Relationship maintenance, early feedback, quick clarifications, trust-building.

### Message Tailoring Checklist

- [ ] Message addresses stakeholder's primary interest or concern.
- [ ] Technical level matches audience expertise (high/medium/low).
- [ ] Tone aligns with organizational culture and stakeholder expectations.
- [ ] Key talking points are supported by evidence or context.
- [ ] Call to action (if any) is clear and achievable.
- [ ] Message is concise and avoids jargon unless appropriate.
- [ ] Message is culturally appropriate and linguistically clear (if applicable).
- [ ] Message acknowledges stakeholder concerns or objections.

### Communication Risk Assessment Template

**Failure Mode:** [Specific communication failure, e.g., "Message misunderstood by technical team"]
**Affected Stakeholders:** [Groups most at risk]
**Likelihood:** High/Medium/Low [Based on historical data or assessment]
**Impact:** High/Medium/Low [Effect on project if failure occurs]
**Mitigation Strategy:** [Preventive action, e.g., "Use technical review before sending to technical team"]
**Contingency Action:** [Reactive response, e.g., "Schedule clarification meeting within 24 hours"]
**Owner:** [Responsible party]

### Crisis Communication Protocol Template

**Trigger:** [Specific, measurable condition, e.g., "Project delay > 2 weeks"]
**Escalation Path:** [Who notifies whom, in what order]
**Notification Timeline:** [How quickly stakeholders must be notified, e.g., "Within 4 hours of trigger"]
**Responsible Party:** [Who owns the crisis communication]
**Template Type:** [Which rapid-response template to use]
**Approval Authority:** [Who approves the message before sending]

### Engagement Tracking Metrics

**Delivery Rate:** % of stakeholders who received the communication (target: > 95%)
- Measurement: Email delivery logs, meeting attendance records, dashboard access logs
- Review Frequency: Weekly for high-influence groups, monthly for others

**Engagement Rate:** % of stakeholders who opened/attended/responded to communication (target: > 70%)
- Measurement: Email open rates, meeting attendance, survey response rates, feedback submissions
- Review Frequency: Weekly for high-influence groups, monthly for others

**Sentiment:** % of feedback that is positive/neutral/negative (target: > 60% positive)
- Measurement: Feedback surveys, sentiment analysis of responses, stakeholder interviews
- Review Frequency: Monthly or after major communications

**At-Risk Indicator:** Stakeholders with low engagement or negative sentiment (target: < 10% at-risk)
- Measurement: Engagement rate < 50%, sentiment < 40% positive, or explicit disengagement signals
- Review Frequency: Weekly; escalate immediately if at-risk indicator triggered

### Communication Plan Review Checklist

- [ ] All stakeholder groups are identified and analyzed.
- [ ] Influence and interest levels are assigned using Power/Interest Grid criteria.
- [ ] Messages are tailored to each group's interests and concerns.
- [ ] Channels are appropriate for message type and group preferences.
- [ ] Cadence is realistic and sustainable.
- [ ] Communication risks are assessed with mitigation and contingency strategies.
- [ ] Crisis protocol is defined with specific triggers and escalation paths.
- [ ] Templates are complete and easy to use.
- [ ] Engagement tracking metrics are defined and measurable.
- [ ] Responsibility is assigned for each communication task.
- [ ] Plan covers all project phases and key milestones.
- [ ] Plan is approved by project sponsor and communications lead.
- [ ] Cultural and linguistic considerations are addressed (if applicable).
- [ ] Plan includes mechanism for mid-project refinement based on engagement data.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.