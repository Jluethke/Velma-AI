# Home Renovation Project Planner

**One-line description:** Convert a renovation idea into a fully scoped, budgeted, and scheduled project plan with contractor selection, documented decision rationale, and post-project closeout procedures.

**Execution Pattern:** Phase Pipeline with conditional quality gates and loop-back recovery.

---

## Inputs

- `renovation_idea` (string, required): High-level description of what you want to renovate (e.g., "kitchen remodel with new appliances and countertops").
- `property_details` (object, required): Address, square footage, age, current condition, any known issues.
- `desired_outcomes` (string[], required): List of 3-5 specific goals (e.g., "increase home value", "improve functionality", "modernize aesthetics").
- `budget_ceiling` (number, required): Maximum total spend in dollars.
- `timeline_constraint` (string, required): When must the project be complete? (e.g., "before summer", "within 6 months", "ASAP").
- `contingency_philosophy` (string, optional, default: "15%"): Risk tolerance for cost overruns. Options: "conservative (20%)", "moderate (15%)", "aggressive (10%)", or custom percentage.
- `stakeholders` (string[], optional): Names/roles of people who must approve the plan.
- `known_constraints` (string[], optional): Existing limitations (e.g., "cannot disrupt main bathroom", "must use local contractors", "historic home restrictions").

---

## Outputs

- `scope_statement` (string): Written definition of project boundaries, must-haves, nice-to-haves, and exclusions.
- `site_inspection_report` (object): Pre-project findings with: structural issues, code violations, utility complications, estimated impact on budget/timeline, recommendations.
- `contractor_candidates` (object[]): List of 3-5 contractors with: name, license/insurance status, specialties, contact info, initial fit assessment.
- `evaluation_rubric` (object): Weighted criteria for contractor selection with: criterion name, weight (0-1), scoring scale, rationale.
- `bid_comparison_matrix` (object): Structured comparison of all bids with: contractor name, total price, timeline, key terms, score against rubric.
- `budget_breakdown` (object): Itemized budget with: category, estimated cost, contingency allocation, total.
- `project_timeline` (object): Gantt chart or phase schedule with: phase name, start date, end date, duration, buffer, dependencies, critical path.
- `decision_memo` (string): Written justification for contractor selection, key assumptions, identified risks, stakeholder sign-off.
- `project_contract` (string): Reference to signed contract or contract checklist.
- `change_order_template` (object): Template for mid-project scope changes with: description, cost impact, timeline impact, approval workflow.
- `kickoff_checklist` (string[]): Next steps to launch the project (e.g., "schedule pre-construction meeting", "obtain permits", "arrange site access").
- `communication_protocol` (object): Protocol for updates, issue reporting, and decision-making during construction.
- `closeout_checklist` (string[]): Post-project tasks (e.g., "final walkthrough", "punch list completion", "warranty documentation", "lien waivers").
- `contingency_tracking_log` (object[]): Record of contingency spend during execution with: date, description, amount, category.
- `lessons_learned_template` (object): Post-project reflection with: what went well, what could improve, budget variance analysis, timeline variance analysis.

---

## Execution Phases

### Phase 0: Pre-Project Site Inspection

**Entry Criteria:**
- Scope statement is finalized from Phase 1.
- Property access is arranged.
- Inspection timeline is scheduled.

**Actions:**
1. Conduct on-site inspection of all areas affected by renovation. Document: structural condition, visible damage, code compliance issues, utility locations and condition, accessibility constraints.
2. Identify hidden issues that could impact scope, budget, or timeline (e.g., asbestos, outdated wiring, foundation cracks, plumbing complications).
3. Photograph all findings and create a detailed inspection report.
4. Estimate cost and timeline impact of each issue discovered.
5. Revise scope statement and budget if major issues are found. If issues are significant, loop back to Phase 1 to adjust scope and re-evaluate contractors.

**Output:**
- `site_inspection_report`: Document with findings, photographs, cost/timeline impact estimates, and recommendations.
- `scope_revisions_needed`: Boolean (true if major issues require scope adjustment).
- `revised_budget_impact`: Number (estimated additional cost, or 0 if no impact).

**Quality Gate:** Inspection covers all project areas. All visible issues are documented with photographs. Cost and timeline impacts are estimated. If scope revisions are needed, they are documented and approved before proceeding.

**Error Handling:**
- **Failure Mode:** Major structural or code issues discovered that significantly increase cost/timeline. **Response:** Adjust — revise scope statement, re-estimate budget and timeline, and loop back to Phase 1 if contractor selection may be affected.
- **Failure Mode:** Inspection reveals issues that make project infeasible. **Response:** Abort — document findings and recommend project cancellation or major scope reduction.

---

### Phase 1: Scope Definition

**Entry Criteria:**
- Renovation idea is articulated (at least 2-3 sentences).
- Property details are available.
- Desired outcomes are listed.

**Actions:**
1. Write a scope statement that includes: rooms/areas affected, work categories (structural, cosmetic, systems), must-haves, nice-to-haves, and explicit exclusions.
2. Identify any known constraints (historic preservation, HOA rules, structural limitations) and document them.
3. Estimate rough scope complexity (simple, moderate, complex) based on work categories.
4. Create a decision tree for scope reduction if needed: prioritize must-haves vs. nice-to-haves with estimated cost/timeline for each.

**Output:**
- `scope_statement`: 200-400 word document with rooms, work categories, must-haves, nice-to-haves, exclusions.
- `scope_complexity`: "simple" | "moderate" | "complex".
- `constraints_list`: Array of identified limitations.
- `scope_reduction_tree`: Decision tree with must-haves (required cost/timeline) and nice-to-haves (optional cost/timeline).

**Quality Gate:** Scope is specific enough that a contractor can provide a preliminary estimate without follow-up questions. Exclusions are explicit (e.g., "does NOT include: electrical panel upgrade, roof replacement"). Scope reduction tree clearly identifies which items can be cut if budget/timeline constraints are exceeded.

**Error Handling:**
- **Failure Mode:** Scope is too vague to solicit bids. **Response:** Adjust — add specificity (e.g., "kitchen remodel" → "kitchen remodel with new cabinets, countertops, appliances, and flooring").
- **Failure Mode:** Scope exceeds budget or timeline. **Response:** Adjust — use scope reduction tree to prioritize must-haves and reduce nice-to-haves.

---

### Phase 2: Contractor Research and Evaluation Criteria

**Entry Criteria:**
- Scope statement is finalized.
- Budget ceiling and timeline constraint are defined.

**Actions:**
1. Research and identify 5-7 contractors qualified for the scope (via referrals, online reviews, licensing databases).
2. Verify licensing, insurance, and bonding for each candidate. Document verification date and source.
3. Develop a weighted evaluation rubric with 5-7 criteria (e.g., price 25%, experience 20%, timeline 15%, references 15%, communication 15%, warranty 10%). Assign weights based on project priorities.
4. Narrow candidate list to 3-5 contractors who meet minimum qualifications (verified licensing, insurance, relevant experience).

**Output:**
- `contractor_candidates`: Array with name, license status, specialties, contact, fit assessment, verification date.
- `evaluation_rubric`: Object with criteria, weights, scoring scale (1-5), and rationale for each.

**Quality Gate:** All candidates have verified licensing and insurance (verification documented). Rubric weights sum to 100% and reflect project priorities. At least 3 qualified candidates are ready for bidding.

**Error Handling:**
- **Failure Mode:** Fewer than 3 qualified candidates found. **Response:** Adjust — expand search radius, relax qualification criteria (e.g., accept contractors with less direct experience but strong references), or delay project to allow more time for research.
- **Failure Mode:** Candidates have conflicting availability. **Response:** Adjust — negotiate timeline with candidates or expand search to find contractors with matching availability.

---

### Phase 3: Bid Collection and Comparison

**Entry Criteria:**
- Contractor candidates are identified and qualified.
- Evaluation rubric is finalized.
- Scope statement is detailed enough for accurate bids.

**Actions:**
1. Send scope statement and bid request to all candidates. Request itemized bids with: labor, materials, permits, timeline, warranty, payment schedule, change order process.
2. Set a bid deadline (7-10 days typical). Specify that bids must be received by [specific date/time].
3. Collect all bids and verify completeness: all line items present, timeline included, terms clear, change order process described.
4. If a bid is incomplete or unclear, send a clarification request with a 3-day response deadline. If contractor does not respond within 3 days, remove from consideration.
5. Create a bid comparison matrix: list each contractor, their total price, timeline, key terms, and notes. Ensure all bids are comparable (same scope).

**Output:**
- `bid_comparison_matrix`: Structured table with contractor, price, timeline, key terms, completeness status.
- `bids_complete`: Boolean (true if all bids are complete and comparable).
- `bid_clarifications`: Array of clarification requests sent and responses received.

**Quality Gate:** All bids are itemized, include timeline and warranty terms, and are comparable (same scope). If bids vary significantly in scope, document the differences and request revised bids with identical scope.

**Error Handling:**
- **Failure Mode:** Bids are incomplete or vague. **Response:** Retry — send clarification request to contractor with 3-day deadline. If no response, remove from consideration.
- **Failure Mode:** Bids vary significantly in scope (e.g., one includes permits, another doesn't). **Response:** Adjust — request revised bids with identical scope, or document scope differences in the matrix and adjust comparison accordingly.
- **Failure Mode:** Bids are significantly higher than budget. **Response:** Adjust — use scope reduction tree to identify cost-cutting options, negotiate with contractors, or request budget increase from stakeholders.

---

### Phase 4: Contractor Evaluation and Selection

**Entry Criteria:**
- Bid comparison matrix is complete.
- Evaluation rubric is finalized.
- All candidates have verified references available.

**Actions:**
1. Score each contractor against the evaluation rubric (1-5 per criterion, multiply by weight). Document scoring rationale.
2. Check references: contact 2-3 past clients per contractor. Ask about: quality of work, timeline adherence, communication responsiveness, budget accuracy, issue resolution, and any concerns.
3. Rank contractors by weighted score and reference feedback.
4. If top-ranked contractor has any of these red flags from references, move to next-ranked candidate: missed deadlines on 2+ projects, quality issues requiring rework, unresponsive communication, budget overruns exceeding 20%.
5. Document the evaluation results, reference feedback, and rationale for selection.
6. Present selection to stakeholders for approval.

**Output:**
- `evaluation_results`: Scored matrix with each contractor's total weighted score and ranking.
- `reference_feedback`: Summary of reference calls (strengths, concerns, recommendation for each contractor).
- `selected_contractor`: Name, contact, and detailed rationale for selection.
- `stakeholder_approval_status`: Boolean (true if stakeholders approve selection).

**Quality Gate:** Top-ranked contractor has no critical red flags from references (defined as: missed deadlines on 2+ projects, quality issues requiring rework, unresponsive communication, or budget overruns exceeding 20%). Evaluation is documented and defensible. Stakeholders approve selection in writing.

**Error Handling:**
- **Failure Mode:** Top-ranked contractor has critical red flags from references. **Response:** Adjust — move to next-ranked contractor and re-evaluate. If all candidates have red flags, loop back to Phase 2 to identify additional contractors.
- **Failure Mode:** Stakeholders disagree with selection. **Response:** Adjust — review evaluation rubric with stakeholders, re-weight criteria if needed, re-score and re-select. Document stakeholder feedback and revised rationale.

---

### Phase 5: Budget Breakdown

**Entry Criteria:**
- Selected contractor bid is finalized.
- Budget ceiling is defined.
- Contingency philosophy is chosen.
- Site inspection report is available (from Phase 0).

**Actions:**
1. Extract line items from the selected contractor's bid: labor, materials, permits, other costs.
2. Add any cost impacts identified in site inspection report (Phase 0).
3. Calculate contingency amount based on philosophy (10%, 15%, or 20% of subtotal).
4. Create a budget spreadsheet with: category, estimated cost, contingency allocation, subtotal, total.
5. Compare total to budget ceiling. If over budget, use scope reduction tree from Phase 1 to identify cost-cutting options: remove nice-to-haves, negotiate with contractor, or request budget increase from stakeholders. Document decision.
6. Document all assumptions (e.g., "assumes no structural surprises", "permits estimated at $X", "contingency allocated for [specific risks]").

**Output:**
- `budget_breakdown`: Itemized spreadsheet with categories, costs, contingency, total.
- `budget_status`: "within budget" | "over budget by $X" | "contingency applied".
- `budget_assumptions`: Array of documented assumptions.
- `scope_reduction_applied`: Boolean (true if scope was reduced to meet budget).
- `contingency_allocation_detail`: Object describing what contingency is allocated for (e.g., "structural issues: $X", "permit delays: $Y").

**Quality Gate:** Total budget (including contingency) is clear and either within ceiling or has stakeholder approval for overage. Contingency is explicitly allocated to specific risk categories, not hidden. All assumptions are documented.

**Error Handling:**
- **Failure Mode:** Total exceeds budget ceiling and stakeholders will not approve increase. **Response:** Adjust — use scope reduction tree to identify cost-cutting options, negotiate contractor price, or recommend project delay to allow additional savings.

---

### Phase 6: Timeline and Scheduling

**Entry Criteria:**
- Selected contractor's timeline estimate is available.
- Timeline constraint is defined.
- Project phases are understood.

**Actions:**
1. Extract timeline from contractor bid: duration per phase, start/end dates, dependencies.
2. Identify project phases (e.g., permits, demolition, rough-in, finishing, inspection, closeout).
3. Add buffer time: 15-25% padding per phase based on complexity and contingency philosophy. Document buffer rationale for each phase.
4. Identify critical path (longest sequence of dependent tasks).
5. Map timeline against constraint (e.g., "must complete by June 1"). If timeline exceeds constraint, negotiate with contractor for acceleration, reduce scope, or request timeline extension from stakeholders. Document decision.
6. Document seasonal factors (e.g., "exterior work only in dry season") and dependencies (e.g., "electrical rough-in must precede drywall").

**Output:**
- `project_timeline`: Gantt chart or phase schedule with start, end, duration, buffer, dependencies.
- `critical_path`: Sequence of phases that determines overall project duration.
- `timeline_status`: "meets constraint" | "exceeds constraint by X days" | "buffer applied".
- `seasonal_factors`: Array of environmental or scheduling constraints.
- `buffer_rationale`: Object describing buffer allocation per phase and rationale.

**Quality Gate:** Timeline is realistic (includes buffer), meets or exceeds constraint with stakeholder approval, and critical path is identified. All phase dependencies are documented. Buffer allocation is justified.

**Error Handling:**
- **Failure Mode:** Timeline exceeds constraint. **Response:** Adjust — negotiate with contractor for acceleration (may increase cost), reduce scope, or request timeline extension from stakeholders. Document decision and cost/scope impacts.

---

### Phase 7: Decision Documentation

**Entry Criteria:**
- Contractor is selected.
- Budget is finalized.
- Timeline is approved.
- All stakeholders are identified.

**Actions:**
1. Write a decision memo (1-2 pages) that includes:
   - Selected contractor name and detailed rationale (why chosen over others, reference feedback summary).
   - Total project cost, budget breakdown by category, contingency amount and allocation.
   - Project timeline, critical path, completion date, buffer allocation.
   - Key assumptions (e.g., "assumes no structural surprises", "permits estimated at $X").
   - Identified risks (e.g., "weather delays possible", "permit approval uncertain") and mitigation strategies for each.
   - Scope reduction decisions (if any) and rationale.
   - Stakeholder sign-off section with names, titles, and signature lines.
2. Distribute memo to all stakeholders for review (allow 3-5 business days).
3. Obtain written approval from all stakeholders before proceeding to contract. Approval may be email confirmation or signed document.

**Output:**
- `decision_memo`: Written document with contractor selection rationale, budget, timeline, assumptions, risks, mitigation strategies, and sign-off section.
- `stakeholder_approvals`: Array of stakeholder names, titles, approval date, and approval method (email/signature).
- `approval_status`: Boolean (true if all stakeholders have approved).

**Quality Gate:** Decision memo is clear, complete, and signed by all stakeholders. No ambiguity about contractor selection, budget, or timeline. All stakeholder approvals are documented with date and method.

**Error Handling:**
- **Failure Mode:** Stakeholders withhold approval or request changes. **Response:** Adjust — identify specific concerns, revise plan if needed (e.g., adjust budget, timeline, or contractor selection), and re-present for approval.

---

### Phase 8: Contract Finalization and Kickoff

**Entry Criteria:**
- Decision memo is signed by all stakeholders.
- Selected contractor is ready to proceed.
- Budget and timeline are finalized.

**Actions:**
1. Prepare or review contract with selected contractor. Ensure it includes: scope, budget, timeline, payment schedule, warranty, change order process (with template), insurance/bonding, dispute resolution, communication protocol.
2. Have contract reviewed by legal counsel if budget exceeds $50,000 or complexity is high.
3. Obtain signatures from contractor and homeowner. Ensure both parties receive a signed copy.
4. Create a project kickoff checklist: schedule pre-construction meeting, arrange site access, confirm permits, establish communication protocol, set inspection schedule, distribute change order template.
5. Create a communication protocol document that specifies: weekly check-in schedule (day/time), issue escalation path (who to contact for different issue types), payment schedule alignment, change order approval process, and contact information for all parties.
6. Distribute contract, kickoff checklist, and communication protocol to all stakeholders.
7. Schedule pre-construction meeting with contractor, homeowner, and key stakeholders to review contract, timeline, communication protocol, and expectations.

**Output:**
- `project_contract`: Signed contract or contract checklist.
- `change_order_template`: Template for mid-project scope changes with fields: description, cost impact, timeline impact, approval workflow, approval sign-off.
- `kickoff_checklist`: Array of next steps with assigned owner and due date (e.g., "[Owner] schedule pre-construction meeting by [date]").
- `communication_protocol`: Document specifying weekly check-in schedule, escalation path, payment schedule, change order process, and contact information.
- `contingency_tracking_log_initialized`: Empty log ready to track contingency spend during execution.
- `contract_signed`: Boolean (true if contract is signed by all parties).

**Quality Gate:** Contract is signed by all parties. Kickoff checklist is clear and assigned to specific owners with due dates. Communication protocol is documented and agreed upon by all parties. Pre-construction meeting is scheduled.

**Error Handling:**
- **Failure Mode:** Contractor refuses to sign contract or requests major changes. **Response:** Adjust — negotiate terms or loop back to Phase 4 to select alternate contractor.
- **Failure Mode:** Stakeholders have concerns about contract terms. **Response:** Adjust — address concerns with contractor and revise contract if needed.

---

### Phase 9: Project Execution and Change Management

**Entry Criteria:**
- Contract is signed.
- Pre-construction meeting is completed.
- Communication protocol is established.

**Actions:**
1. Execute project according to timeline and contract terms.
2. Conduct weekly check-ins per communication protocol. Document: progress, issues, change requests, budget/timeline impacts.
3. If scope changes are requested, use change order template to document: description, cost impact, timeline impact, and obtain written approval from all required parties before work proceeds.
4. Track contingency spending: record date, description, amount, and category for each contingency item used. Update contingency tracking log weekly.
5. Schedule inspections at key milestones (per contract) to verify quality and compliance.
6. Address issues promptly per escalation path in communication protocol.
7. Retain final payment (typically 5-10% of contract) until project is complete and punch list is cleared.

**Output:**
- `weekly_progress_reports`: Array of weekly status updates with progress, issues, change requests, budget/timeline impacts.
- `change_orders_issued`: Array of approved change orders with cost/timeline impacts.
- `contingency_tracking_log`: Updated log of contingency spend by category.
- `inspection_reports`: Array of milestone inspection reports with findings and sign-off.
- `issues_log`: Array of issues identified, escalation path used, and resolution.

**Quality Gate:** Weekly check-ins occur per schedule. All change orders are documented and approved before work proceeds. Contingency tracking is current. Inspections are completed at key milestones. Issues are resolved promptly.

**Error Handling:**
- **Failure Mode:** Contractor misses milestone deadline. **Response:** Adjust — review critical path, identify acceleration options, and adjust timeline if needed. If delay is significant, invoke penalty clause per contract.
- **Failure Mode:** Quality issues discovered at inspection. **Response:** Adjust — document issue, require contractor to remediate, and withhold payment until resolved.
- **Failure Mode:** Contingency is exhausted before project completion. **Response:** Adjust — identify additional funding or reduce remaining scope with stakeholder approval.

---

### Phase 10: Project Closeout

**Entry Criteria:**
- All construction work is complete.
- All inspections are passed.
- Punch list is cleared.

**Actions:**
1. Conduct final walkthrough with contractor and homeowner. Verify all work is complete and meets contract specifications.
2. Create and complete punch list: document any minor items remaining (e.g., touch-up paint, final cleaning). Contractor must complete punch list items within [X days per contract].
3. Verify all permits are closed and final inspections are passed.
4. Collect warranty documentation from contractor: coverage period, covered items, claim process, contact information.
5. Obtain lien waivers from contractor and all subcontractors. Lien waiver confirms that contractor and subs have been paid in full and waive right to file liens.
6. Process final payment to contractor (typically 5-10% retained from contract) after punch list is complete and lien waivers are received.
7. Complete lessons learned reflection: document what went well, what could improve, budget variance analysis (actual vs. estimated), timeline variance analysis (actual vs. estimated).
8. Archive all project documentation: contract, change orders, invoices, inspection reports, warranties, lien waivers, photos, lessons learned.

**Output:**
- `final_walkthrough_report`: Document confirming all work is complete and meets specifications.
- `punch_list`: Array of minor items remaining with contractor responsibility and deadline.
- `punch_list_completion_status`: Boolean (true if all punch list items are complete).
- `warranty_documentation`: Object with coverage period, covered items, claim process, contact information.
- `lien_waivers`: Array of signed lien waivers from contractor and subcontractors.
- `final_payment_processed`: Boolean (true if final payment is released).
- `lessons_learned`: Object with sections: what went well, what could improve, budget variance analysis, timeline variance analysis, recommendations for future projects.
- `project_archive_location`: String (location where all project documentation is stored).
- `project_status`: "complete" (when all closeout tasks are done).

**Quality Gate:** Final walkthrough confirms all work is complete. Punch list is cleared. Permits are closed. Warranty documentation is collected. Lien waivers are signed. Final payment is processed. Lessons learned are documented. All project documentation is archived.

**Error Handling:**
- **Failure Mode:** Contractor refuses to complete punch list items. **Response:** Adjust — invoke contract dispute resolution process or withhold final payment until items are complete.
- **Failure Mode:** Lien waivers are not provided. **Response:** Adjust — withhold final payment until lien waivers are received. Consult legal counsel if contractor refuses.

---

## Exit Criteria

The skill is complete when:
1. Scope statement is written and approved by stakeholders (documented in Phase 1).
2. Site inspection is completed and findings are documented (Phase 0).
3. Contractor is selected based on documented evaluation (Phase 4).
4. Budget is itemized and within (or approved to exceed) ceiling (Phase 5).
5. Timeline is realistic, includes buffer, and meets (or approved to exceed) constraint (Phase 6).
6. Decision memo is signed by all stakeholders (Phase 7).
7. Contract is signed by contractor and homeowner (Phase 8).
8. Kickoff checklist is prepared and assigned with due dates (Phase 8).
9. Communication protocol is established and agreed upon (Phase 8).
10. Change order template is distributed (Phase 8).
11. Project execution is complete with weekly tracking (Phase 9).
12. Final walkthrough is completed and punch list is cleared (Phase 10).
13. Warranty documentation and lien waivers are collected (Phase 10).
14. Lessons learned are documented (Phase 10).
15. All outputs are documented and archived (Phase 10).

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 0: Site Inspection | Major structural or code issues discovered | **Adjust** — revise scope statement, re-estimate budget and timeline, loop back to Phase 1 if contractor selection affected |
| Phase 0: Site Inspection | Issues make project infeasible | **Abort** — document findings and recommend project cancellation or major scope reduction |
| Phase 1: Scope Definition | Scope is too vague to solicit bids | **Adjust** — add specificity (e.g., "kitchen remodel" → "kitchen remodel with new cabinets, countertops, appliances, and flooring") |
| Phase 1: Scope Definition | Scope exceeds budget or timeline | **Adjust** — use scope reduction tree to prioritize must-haves and reduce nice-to-haves |
| Phase 2: Contractor Research | Fewer than 3 qualified candidates found | **Adjust** — expand search radius, relax qualification criteria, or delay project |
| Phase 3: Bid Collection | Bids are incomplete or incomparable | **Retry** — send clarification request with 3-day deadline; remove non-responsive contractors |
| Phase 3: Bid Collection | Bids are significantly higher than budget | **Adjust** — use scope reduction tree to identify cost-cutting options, negotiate with contractors, or increase budget |
| Phase 4: Contractor Evaluation | Top candidate has critical red flags from references | **Adjust** — move to next-ranked candidate; if all have red flags, loop back to Phase 2 |
| Phase 4: Contractor Evaluation | Stakeholders disagree with selection | **Adjust** — re-weight evaluation rubric and re-score with stakeholder input |
| Phase 5: Budget Breakdown | Total exceeds budget ceiling | **Adjust** — use scope reduction tree to identify cost-cutting options, negotiate contractor price, or request budget increase |
| Phase 6: Timeline | Project duration exceeds constraint | **Adjust** — negotiate acceleration (may increase cost), reduce scope, or extend timeline |
| Phase 7: Decision Documentation | Stakeholders withhold approval | **Adjust** — identify concerns and revise plan (budget, timeline, or contractor selection) |
| Phase 8: Contract Finalization | Contractor refuses to sign or requests major changes | **Adjust** — negotiate terms or loop back to Phase 4 to select alternate contractor |
| Phase 9: Project Execution | Contractor misses milestone deadline | **Adjust** — review critical path, identify acceleration options, invoke penalty clause if significant |
| Phase 9: Project Execution | Quality issues discovered at inspection | **Adjust** — document issue, require contractor remediation, withhold payment until resolved |
| Phase 9: Project Execution | Contingency is exhausted before completion | **Adjust** — identify additional funding or reduce remaining scope with stakeholder approval |
| Phase 10: Project Closeout | Contractor refuses to complete punch list items | **Adjust** — invoke contract dispute resolution or withhold final payment |
| Phase 10: Project Closeout | Lien waivers not provided | **Adjust** — withhold final payment until received; consult legal counsel if contractor refuses |

---

## Reference Section

### Contractor Evaluation Rubric Template

| Criterion | Weight | Scale | Rationale |
|---|---|---|---|
| Price | 25% | 1-5 (5 = lowest) | Cost is primary driver |
| Experience | 20% | 1-5 (5 = most relevant) | Specialized experience reduces risk |
| Timeline | 15% | 1-5 (5 = fastest) | Must meet project deadline |
| References | 15% | 1-5 (5 = excellent feedback) | Past performance predicts future |
| Communication | 15% | 1-5 (5 = responsive) | Clear communication prevents issues |
| Warranty | 10% | 1-5 (5 = comprehensive) | Protection against defects |

### Budget Contingency Guidelines

- **Conservative (20%):** Use for complex projects, historic homes, or first-time renovators. Provides buffer for unknowns.
- **Moderate (15%):** Standard for most residential renovations. Balances risk and cost.
- **Aggressive (10%):** Use for simple projects with experienced contractor and clear scope. Assumes minimal surprises.

### Timeline Buffer Guidelines

- **Simple projects (e.g., paint, flooring):** 10-15% buffer.
- **Moderate projects (e.g., kitchen, bathroom):** 15-20% buffer.
- **Complex projects (e.g., structural, multi-room):** 20-25% buffer.

### Key Assumptions to Document

- Permits will be obtained without delays.
- No structural surprises discovered during work.
- Contractor availability matches proposed timeline.
- Homeowner can provide site access as needed.
- Utility disconnections/reconnections are straightforward.
- No code violations or non-compliance issues in existing structure.

### Risk Mitigation Strategies

- **Permit delays:** Start permit process early; identify expedited options.
- **Structural surprises:** Budget contingency; schedule pre-construction inspection (Phase 0).
- **Contractor delays:** Include penalty clauses in contract; establish clear communication protocol.
- **Cost overruns:** Use change order process; require written approval before work.
- **Quality issues:** Schedule inspections at key milestones; retain final payment until completion.
- **Scope creep:** Use change order template; require written approval for all changes.

### Change Order Template

**Change Order Request**

Project: [Project Name]
Date: [Date]
Requested by: [Name]

**Description of Change:**
[Detailed description of scope change]

**Reason for Change:**
[Why change is needed]

**Cost Impact:**
Additional Cost: $[Amount]
Cost Savings (if applicable): $[Amount]
Net Cost Impact: $[Amount]

**Timeline Impact:**
Additional Days: [Number]
Acceleration (if applicable): [Number] days
Net Timeline Impact: [Number] days

**Approval Workflow:**
1. Contractor submits change order request
2. Homeowner reviews and approves/rejects
3. If approved, contractor executes change
4. Homeowner verifies completion and approves payment

**Approvals:**
- Homeowner: _________________ Date: _______
- Contractor: _________________ Date: _______

### Communication Protocol Template

**Weekly Check-In Schedule:**
- Day: [Day of week]
- Time: [Time]
- Duration: [Duration]
- Attendees: Contractor, Homeowner, [Other stakeholders]
- Location/Format: [In-person, phone, video]

**Issue Escalation Path:**
- Minor issues (e.g., scheduling, minor quality concerns): Contact [Contractor contact name/number]
- Significant issues (e.g., budget impact, timeline impact): Contact [Contractor manager name/number]
- Critical issues (e.g., safety, contract violation): Contact [Contractor owner/legal contact]

**Payment Schedule Alignment:**
- Payment due: [Schedule per contract]
- Payment method: [Check, ACH, etc.]
- Contact for payment questions: [Name/number]

**Change Order Process:**
- Change requests submitted via change order template
- Homeowner approval required before work proceeds
- Approved changes documented in change order log

**Contact Information:**
- Homeowner: [Name, phone, email]
- Contractor: [Name, phone, email]
- Contractor Manager: [Name, phone, email]
- Project Manager (if applicable): [Name, phone, email]

### Contingency Tracking Log Template

| Date | Description | Category | Amount | Remaining Contingency | Approval |
|---|---|---|---|---|---|
| [Date] | [Description of contingency use] | [Category: structural, permit, timeline, other] | $[Amount] | $[Remaining] | [Approved by] |

### Lessons Learned Template

**Project:** [Project Name]
**Completion Date:** [Date]
**Contractor:** [Name]

**What Went Well:**
- [Item 1]
- [Item 2]
- [Item 3]

**What Could Improve:**
- [Item 1]
- [Item 2]
- [Item 3]

**Budget Variance Analysis:**
- Estimated Budget: $[Amount]
- Actual Budget: $[Amount]
- Variance: $[Amount] ([Percentage]%)
- Reasons for variance: [Explanation]

**Timeline Variance Analysis:**
- Estimated Duration: [Days]
- Actual Duration: [Days]
- Variance: [Days] ([Percentage]%)
- Reasons for variance: [Explanation]

**Recommendations for Future Projects:**
- [Recommendation 1]
- [Recommendation 2]
- [Recommendation 3]

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.