# Household Operations Manual Creator

**One-line description:** Systematically document recurring household tasks, seasonal maintenance, vendor contacts, responsibility assignments, and cost tracking into a shared operations manual.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `household_members`: array of objects (required)
  - Each object: `{name: string, skills: string[], availability: string, preferences: string}`
  - Example: `[{name: "Alice", skills: ["plumbing", "electrical"], availability: "weekends", preferences: "outdoor tasks"}]`

- `property_details`: object (required)
  - `property_type`: string (house, apartment, condo, etc.)
  - `climate_zone`: string (tropical, temperate, cold, arid, etc.)
  - `square_footage`: number
  - `year_built`: number
  - `major_systems`: array of strings (HVAC, plumbing, electrical, roof, foundation, etc.)

- `existing_vendors`: array of objects (optional)
  - Each object: `{vendor_name: string, service_type: string, contact: string, cost_estimate: string}`
  - If not provided, Phase 3 will generate a vendor research template

- `manual_format_preference`: string (optional, default: "shared_cloud_document")
  - Options: "shared_cloud_document", "printed_binder", "wiki", "spreadsheet"
  - If not specified, defaults to shared cloud document for real-time updates and accessibility

- `review_frequency`: string (optional, default: "quarterly")
  - Options: "monthly", "quarterly", "semi-annual", "annual"
  - If not specified, defaults to quarterly review to balance maintenance currency with administrative burden

---

## Outputs

- `household_operations_manual`: structured document object
  - `title`: string
  - `last_updated`: string (ISO 8601 date)
  - `recurring_tasks`: array of objects
    - Each: `{task_name: string, frequency: string, owner: string, backup_owner: string, estimated_duration: string, notes: string}`
  - `seasonal_maintenance`: array of objects
    - Each: `{task_name: string, season: string, month_range: string, priority: string, owner: string, estimated_cost: string}`
  - `vendor_directory`: array of objects
    - Each: `{vendor_name: string, service_type: string, contact_info: string, response_time: string, cost_range: string, emergency: boolean, last_verified_date: string}`
  - `responsibility_matrix`: object
    - Keys: household member names
    - Values: array of assigned task names with backup assignments
  - `cost_summary`: object
    - `annual_vendor_budget`: number
    - `monthly_average_cost`: number
    - `cost_by_category`: object (service type → estimated annual cost)
  - `manual_location`: string (URL or file path)
  - `next_review_date`: string (ISO 8601 date)

- `completeness_report`: object
  - `total_recurring_tasks`: number
  - `total_seasonal_tasks`: number
  - `vendor_count`: number
  - `coverage_by_member`: object (member name → task count)
  - `identified_gaps`: array of strings
  - `cost_tracking_enabled`: boolean
  - `completion_tracking_enabled`: boolean
  - `validation_status`: string ("complete", "needs_review", "incomplete")

---

## Execution Phases

### Phase 1: Inventory Recurring Household Tasks

**Entry Criteria:**
- Household members are identified
- Property details are documented

**Actions:**

1. Conduct a household walkthrough (mental or physical) and list all recurring maintenance and operational tasks (cleaning, lawn care, appliance maintenance, etc.).
2. For each task, determine frequency using the standard definitions: daily, weekly, bi-weekly, monthly, quarterly, or annual.
3. Estimate time required per occurrence and document the basis for the estimate (e.g., "15 minutes based on last execution").
4. Note any special tools, skills, or conditions required for safe or effective execution.
5. Identify tasks that are currently being done ad-hoc and should be formalized by documenting current practice and establishing a regular schedule.
6. Categorize tasks by type: cleaning, maintenance, administrative, outdoor, pet care, etc.

**Output:**
- `recurring_tasks_draft`: array of task objects with name, frequency, duration, requirements, category

**Quality Gate:**
- At least 15 recurring tasks identified, verified by walkthrough checklist
- Every task has a defined frequency matching the standard definitions (daily, weekly, bi-weekly, monthly, quarterly, annual)
- No task description is vague; each specifies the exact action (e.g., "clean kitchen counters" not "clean")
- Task categories are consistent and non-overlapping

---

### Phase 2: Identify Seasonal Maintenance Activities

**Entry Criteria:**
- Property details (type, climate zone, major systems) are documented
- Recurring tasks list is complete from Phase 1

**Actions:**

1. Map property systems and components to seasonal maintenance windows based on climate zone and best practices using the seasonal maintenance reference table.
2. For each major system (HVAC, plumbing, roof, exterior, etc.), list seasonal tasks with specific actions:
   - Spring: cleaning gutters (remove debris, inspect for damage), HVAC inspection (filter change, coil cleaning), exterior inspection (caulking, paint, siding)
   - Summer: lawn treatment (fertilizer, weed control), pool maintenance (filter cleaning, chemical balance), deck sealing (pressure wash, apply sealant)
   - Fall: leaf cleanup (rake, compost), furnace inspection (filter change, ductwork check), weatherproofing (caulk windows, insulate pipes)
   - Winter: snow removal (shovel, salt application), pipe insulation (wrap exposed pipes), heating system checks (thermostat test, vent inspection)
3. Prioritize by criticality using this scale: "critical" (prevents safety hazard or major damage), "high" (prevents moderate damage or system failure), "medium" (extends equipment life), "low" (cosmetic or convenience).
4. Estimate cost and duration for each task, noting whether it requires professional vendors or household execution.
5. Identify tasks that require professional vendors by assessing household skill level and equipment availability.

**Output:**
- `seasonal_maintenance_draft`: array of seasonal task objects with season, priority level, owner type (household/vendor), estimated cost, specific actions

**Quality Gate:**
- All four seasons have at least 3 tasks, verified by seasonal checklist
- Critical and high-priority tasks (safety, damage prevention) are clearly marked and account for at least 50% of seasonal tasks
- Cost estimates are provided for all vendor tasks and are based on local market research or prior quotes
- Every task description specifies the exact action to be taken (e.g., "replace HVAC filter and inspect coil" not "HVAC maintenance")

---

### Phase 3: Compile Vendor and Service Provider Contacts

**Entry Criteria:**
- Seasonal maintenance list identifies vendor tasks from Phase 2
- Existing vendor relationships are documented (if available)

**Actions:**

1. Review seasonal maintenance tasks and recurring tasks that require professional services (plumbing, electrical, HVAC, pest control, landscaping, etc.) and create a list of required service categories.
2. For each service category, identify current vendors or research recommended vendors using referrals, online reviews, and local recommendations.
3. Collect contact information for each vendor: phone, email, website, hours of operation, and verify information is current by calling or emailing to confirm.
4. Document service scope (what services are included), response time (routine vs. emergency), and cost estimates based on quotes or prior invoices.
5. Categorize vendors by urgency: emergency (24/7 availability required) vs. routine (scheduled during business hours).
6. Note any service agreements, warranties, preferred scheduling windows, and contract terms.
7. Create a vendor performance tracking template for each vendor to record reliability, cost, and quality ratings after each service.

**Output:**
- `vendor_directory_draft`: array of vendor objects with contact, service scope, response time, cost, emergency flag, last verified date, performance tracking template

**Quality Gate:**
- At least one vendor per major service category (plumbing, electrical, HVAC, heating, cooling, pest control, landscaping, appliance repair, or equivalent based on property type), verified by service category checklist
- Emergency contacts are clearly marked and include 24/7 availability confirmation
- All contact information is current and verified within the past 30 days by direct contact
- Cost estimates are based on actual quotes or prior invoices, not estimates
- Vendor performance tracking template is provided for each vendor

---

### Phase 4: Assign Responsibilities to Household Members

**Entry Criteria:**
- Recurring tasks list is complete from Phase 1
- Seasonal maintenance list is complete from Phase 2
- Household members and their skills/availability are documented

**Actions:**

1. Review all tasks (recurring + seasonal) and categorize by skill level required: basic (no special training), intermediate (some training or experience), advanced (specialized training), professional-only (requires licensed contractor).
2. For each household member, create a skills inventory documenting current skills, availability (hours per week), and learning interests.
3. Match household member skills and availability to tasks, assigning primary owner and backup owner for each task to ensure coverage during absences.
4. Calculate workload for each member in hours per month and aim for equitable distribution: no member should exceed 40% of total household task hours.
5. Identify skill gaps: tasks that no household member can perform (these go to vendors) and tasks where training would enable household execution.
6. Document training needs and create a plan to build household self-sufficiency (e.g., "Alice to attend HVAC basics workshop in Q2").
7. Create a communication protocol specifying who notifies whom if a task is delayed, completed early, or reveals a problem (e.g., "notify manual owner within 24 hours of discovering issue").

**Output:**
- `responsibility_matrix_draft`: object mapping member names to assigned tasks with backup assignments and workload hours
- `skill_gaps`: array of tasks requiring professional vendors or training, with recommended training resources
- `communication_protocol`: object specifying notification procedures, escalation paths, and update frequency

**Quality Gate:**
- Every task has a primary owner and backup owner, verified by responsibility matrix checklist
- Workload is balanced: no member exceeds 40% of total task hours, verified by workload calculation
- Backup owners are assigned for all critical tasks (safety, damage prevention), verified by critical task list
- Skill gaps are identified and addressed: each gap has either a vendor assignment or a training plan
- Communication protocol is documented and specifies response times (e.g., "notify within 24 hours")

---

### Phase 5: Organize and Structure the Manual

**Entry Criteria:**
- All four prior phases are complete with draft outputs
- Manual format preference is specified

**Actions:**

1. Choose manual structure based on format preference and create a template:
   - **Shared cloud document**: Google Doc or Notion with sections, tables, and shared access; enable comment and version history features
   - **Printed binder**: PDF with table of contents, tabs, and printable checklists; include page numbers and cross-references
   - **Wiki**: Markdown pages with cross-links and search capability; include navigation menu and search index
   - **Spreadsheet**: Excel/Sheets with tabs for tasks, vendors, schedules, costs; include formulas for workload calculation and cost tracking
2. Organize content into sections with consistent heading hierarchy (H1 for main sections, H2 for subsections, H3 for details):
   - Cover page with household name, last updated date, emergency contacts, manual owner name
   - Table of contents with page numbers or links
   - "How to Use This Manual" section with update instructions and communication protocol
   - Recurring tasks section organized by frequency (daily, weekly, monthly, quarterly, annual) with checklists
   - Seasonal maintenance calendar with visual timeline (table or calendar view) showing month, task, owner, priority
   - Vendor directory organized by service type with contact info, response times, cost ranges, emergency flags
   - Responsibility matrix showing who owns what, with backup assignments
   - Cost summary showing annual budget, monthly average, and cost by category
   - Task completion tracking section (spreadsheet tab or linked document) for monitoring execution
   - Lessons learned section for documenting improvements to task descriptions and time estimates
   - Emergency procedures and contacts (separate from routine vendor directory)
3. Add visual elements with specific design rules: color coding by member (assign one color per member consistently), icons for priority (use standard symbols: ⚠️ critical, ⭐ high, ◆ medium, ○ low), calendar view for seasonal tasks with month labels.
4. Create a master checklist for each household member showing their assigned tasks, frequency, and estimated duration.
5. Include a "How to Update This Manual" section with specific instructions: who can edit, what format to use, how to notify other members of changes, and when to schedule the next review.

**Output:**
- `manual_draft`: complete structured document (as markdown, HTML, or document object) with all sections, consistent formatting, and visual hierarchy
- `manual_location`: file path or URL where manual will be stored
- `tracking_system_setup`: instructions for setting up task completion tracking (spreadsheet, app, or calendar integration)

**Quality Gate:**
- Manual is organized logically with consistent heading hierarchy (H1 main sections, H2 subsections, H3 details), verified by outline review
- All tasks from prior phases appear in the manual: recurring tasks, seasonal maintenance, vendor directory, responsibility matrix, cost summary
- Checklists are actionable and specific: each checklist item is a concrete action (e.g., "Replace HVAC filter" not "Maintain HVAC")
- Visual hierarchy is clear: heading levels are consistent, color coding is applied uniformly, icons are used consistently
- Manual is accessible in the chosen format and can be opened/edited by all household members

---

### Phase 6: Validate Completeness and Clarity

**Entry Criteria:**
- Manual draft is complete and structured from Phase 5

**Actions:**

1. Review the manual against the original workflow inputs: verify it covers all recurring tasks, seasonal maintenance, vendors, responsibility assignments, cost tracking, and communication protocol.
2. Conduct a walkthrough with household members: ask each to review their assigned tasks and confirm accuracy, feasibility, and clarity. Use a validation checklist.
3. Identify gaps: tasks that are missing, unclear assignments, outdated vendor info, or unrealistic time estimates. Document each gap with location and suggested fix.
4. Clarify ambiguous instructions: rewrite any task description that could be misunderstood by testing it with a household member unfamiliar with the task.
5. Verify vendor contact information is current by calling or emailing each vendor to confirm phone, email, hours, and cost estimates. Update last_verified_date.
6. Check for internal consistency: no conflicting assignments, no duplicate tasks, no tasks assigned to members without required skills.
7. Compile feedback and revisions: create a change log documenting all feedback and how it was addressed.
8. Obtain sign-off from all household members confirming they have reviewed and approved their assignments.

**Output:**
- `validation_report`: object with gaps identified, feedback from members, revisions made, and sign-off confirmations
- `manual_final`: validated, approved manual ready for distribution with all revisions applied
- `completeness_report`: summary of task counts, coverage, cost tracking status, and validation status
- `change_log`: detailed record of all feedback and revisions made during validation

**Quality Gate:**
- All household members have reviewed and approved their assignments, verified by sign-off documentation
- No gaps or ambiguities remain: every task description is clear enough for a household member unfamiliar with it to execute without additional clarification
- Vendor information is verified as current within the past 30 days, with last_verified_date documented
- Manual is internally consistent: no conflicting assignments, no duplicate tasks, all assigned members have required skills
- Validation status is "complete" and documented in completeness_report

---

### Phase 7: Distribute and Establish Update Cadence

**Entry Criteria:**
- Manual is validated and approved from Phase 6
- Manual location (URL or file path) is determined

**Actions:**

1. Distribute the manual to all household members via the chosen format (shared link, printed copy, wiki access, spreadsheet, etc.) and verify receipt by requesting acknowledgment.
2. Ensure all members know where to find the manual, how to access it, and how to request updates using the communication protocol.
3. Schedule a household meeting to review the manual together, answer questions, and confirm understanding. Document attendance and any questions raised.
4. Establish an update cadence by setting a recurring review date (monthly, quarterly, semi-annual, or annual based on review_frequency input) and creating calendar reminders for all members.
5. Designate a manual owner/editor responsible for updates, version control, and coordinating the review process. Document their name and contact info in the manual.
6. Create a simple change log template to track updates: date, what changed, who updated it, reason for change, and approval from manual owner.
7. Set up task completion tracking system (spreadsheet, app, or calendar integration) to monitor whether tasks are being completed on schedule. Review completion data quarterly to identify unrealistic assignments or skill gaps.
8. Establish a lessons learned process: create a template for household members to document issues encountered during tasks (e.g., "furnace filter is hard to access, allow 30 min instead of 15") and schedule quarterly reviews to incorporate improvements into task descriptions.

**Output:**
- `distribution_confirmation`: list of household members who have received and acknowledged the manual with dates
- `next_review_date`: ISO 8601 date of the next scheduled review
- `manual_owner`: name and contact info of the designated editor/maintainer
- `update_log`: initial entry documenting creation date, version 1.0, and manual owner
- `tracking_system_status`: confirmation that task completion tracking is set up and accessible
- `lessons_learned_template`: template for documenting task improvements and scheduled review dates

**Quality Gate:**
- All household members have confirmed receipt and understanding, verified by acknowledgment documentation
- Review date is scheduled and reminders are set for all members (calendar invites or notifications)
- Manual owner is assigned, has edit access, and has confirmed acceptance of the role
- Manual is accessible to all members in the chosen format and can be opened/edited without technical issues
- Task completion tracking system is set up and household members know how to use it
- Lessons learned template is available and household members understand the process

---

## Exit Criteria

The skill is DONE when:

1. **Completeness:** The household operations manual includes all recurring tasks, seasonal maintenance, vendor contacts, responsibility assignments, cost summary, and communication protocol from the original workflow description. Verified by completeness_report showing all sections populated.
2. **Clarity:** Every task, assignment, and contact is written clearly enough that a household member unfamiliar with the task could execute it without additional clarification. Verified by household member walkthrough and sign-off.
3. **Validation:** All household members have reviewed and approved their assigned tasks; vendor information is verified as current within the past 30 days. Verified by sign-off documentation and last_verified_date entries.
4. **Distribution:** The manual is accessible to all household members in the chosen format and all members have confirmed receipt. Verified by distribution_confirmation list.
5. **Maintenance:** A review date is scheduled, a designated owner is assigned, and task completion tracking is set up. Verified by next_review_date, manual_owner assignment, and tracking_system_status.
6. **Testability:** A household member could pick up the manual, find their assigned task for today, and complete it without additional clarification. Verified by task description clarity and household member feedback.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Household members cannot agree on what tasks are recurring | **Adjust** -- facilitate a household meeting to discuss and document current practices; use a voting system if consensus is difficult; document the agreed-upon task list and have all members sign off |
| Phase 1 | More than 50 recurring tasks identified (overwhelming) | **Adjust** -- group similar tasks (e.g., "all cleaning" into subcategories: kitchen, bathroom, bedroom, common areas); consider splitting into primary task list (essential) and secondary task list (nice-to-have); prioritize primary tasks for initial manual |
| Phase 2 | Seasonal maintenance tasks are unknown (no prior records) | **Adjust** -- provide a property-type-specific checklist based on climate zone; recommend consulting a property inspector or contractor for a maintenance audit; use the reference section seasonal maintenance windows as a starting template |
| Phase 3 | Household has no existing vendor relationships | **Adjust** -- provide a vendor research template with instructions for getting referrals from neighbors, online reviews, and local business directories; note that some vendors can be identified during Phase 2 when maintenance needs are documented |
| Phase 3 | Vendor information becomes outdated between reviews | **Adjust** -- establish a quarterly vendor verification process where manual owner calls or emails each vendor to confirm contact info and cost estimates; update last_verified_date for each vendor |
| Phase 4 | Household members have conflicting availability or skills | **Adjust** -- identify tasks that can be done together (shared responsibility); offer training opportunities for skill gaps; consider hiring for skill gaps that cannot be trained; allow members to swap assignments if workload is unbalanced |
| Phase 4 | Workload is severely imbalanced (one member >50% of hours) | **Adjust** -- redistribute tasks; consider rotating seasonal tasks annually to spread workload; allow members to swap assignments; identify tasks that could be eliminated, combined, or outsourced to vendors |
| Phase 5 | Manual becomes too long (>20 pages printed or >10,000 words) | **Adjust** -- split into a primary manual (recurring + responsibility + cost summary) and a reference guide (seasonal + vendors + lessons learned); use a wiki or cloud doc for easy navigation and search; create member-specific checklists instead of including all tasks for all members |
| Phase 6 | Household members identify major gaps during validation | **Retry** -- return to Phase 1 or 2 to capture missing tasks; revise responsibility assignments if needed; re-validate with household members before proceeding to Phase 7 |
| Phase 6 | Vendor information is outdated or incorrect during validation | **Adjust** -- update vendor directory with current information; note that vendors should be re-verified annually during scheduled reviews; flag vendors with outdated info for immediate contact |
| Phase 7 | Household members do not engage with the manual after distribution | **Adjust** -- simplify format (reduce to essential tasks only); create a visual calendar or checklist; schedule a follow-up meeting to address concerns; consider switching to a different format (e.g., from printed to shared cloud doc); identify barriers to adoption and address them |
| Phase 7 | Task completion tracking reveals tasks are consistently incomplete | **Adjust** -- review time estimates and adjust if unrealistic; reassign tasks to members with more availability; identify skill gaps and provide training; consider outsourcing to vendors if household cannot execute |
| Phase 7 | User rejects final output | **Targeted revision** -- ask which manual section, task assignment, or vendor entry fell short and regenerate only that section. Do not rebuild the full manual. |

---

## Reference Section

### Domain Knowledge: Household Operations

**Task Frequency Definitions:**
- **Daily:** Tasks performed every day (e.g., dishes, pet feeding, checking mail)
- **Weekly:** Tasks performed once per week (e.g., laundry, vacuuming, grocery shopping)
- **Bi-weekly:** Tasks performed every two weeks (e.g., deep cleaning, lawn mowing)
- **Monthly:** Tasks performed once per month (e.g., bill review, filter changes, appliance cleaning)
- **Quarterly:** Tasks performed four times per year (e.g., HVAC maintenance, gutter inspection)
- **Annual:** Tasks performed once per year (e.g., gutter cleaning, furnace inspection, property inspection)

**Seasonal Maintenance Windows (Northern Hemisphere):**
- **Spring (Mar-May):** Exterior inspection, gutter cleaning, HVAC tune-up, lawn treatment, deck/patio prep, window caulking, paint touch-up
- **Summer (Jun-Aug):** Lawn care, pool/spa maintenance, exterior sealing, pest control, landscape maintenance, roof inspection, siding cleaning
- **Fall (Sep-Nov):** Leaf cleanup, furnace inspection, weatherproofing, gutter cleaning, winterization, pipe insulation, chimney cleaning
- **Winter (Dec-Feb):** Snow removal, pipe insulation, heating system checks, interior deep cleaning, appliance maintenance, foundation inspection

**Vendor Categories:**
- **Emergency (24/7):** Plumbing, electrical, HVAC, gas, water damage, roof leaks
- **Routine (scheduled):** Landscaping, pest control, cleaning, appliance repair, roof inspection, chimney cleaning
- **Specialized:** Pool maintenance, septic service, foundation repair, well service, solar panel maintenance

**Responsibility Assignment Best Practices:**
- Assign primary owner + backup owner for all critical tasks (safety, damage prevention)
- Balance workload: aim for 30-40 hours per household member per month
- Match skills to tasks: do not assign electrical work to someone without training
- Consider availability: do not assign time-sensitive tasks to members with inflexible schedules
- Rotate seasonal tasks annually to build household skills and prevent burnout
- Document training needs and plan skill-building activities
- Review assignments quarterly and adjust based on completion data and member feedback

**Cost Tracking Best Practices:**
- Maintain a spreadsheet or app tracking all vendor invoices and household supply costs
- Categorize costs by service type (plumbing, electrical, HVAC, etc.) to identify spending patterns
- Review costs quarterly to identify opportunities for savings (vendor switching, bundling services, DIY alternatives)
- Budget for seasonal costs: create a seasonal budget forecast based on vendor estimates
- Track actual costs vs. estimates to improve future planning

**Task Completion Tracking Best Practices:**
- Use a shared spreadsheet, app, or calendar to track task completion
- Record completion date, who completed it, any issues encountered, and time spent
- Review completion data quarterly to identify tasks that are consistently incomplete or taking longer than estimated
- Adjust time estimates and assignments based on actual completion data
- Use completion data to identify skill gaps and training needs

**Lessons Learned Process:**
- Create a template for household members to document issues encountered during tasks
- Include fields for: task name, issue encountered, recommended fix, estimated time impact, date submitted
- Schedule quarterly reviews to incorporate improvements into task descriptions and time estimates
- Update the manual with improvements and notify all members of changes
- Track lessons learned over time to identify systemic issues (e.g., "furnace filter location is difficult to access")

**Manual Maintenance:**
- Review and update on the scheduled cadence (monthly, quarterly, semi-annual, or annual)
- Verify vendor information annually by contacting each vendor
- Add new tasks as they emerge (e.g., new appliance, new household member)
- Remove tasks that are no longer relevant
- Adjust assignments if household composition changes
- Track completion rates to identify bottlenecks or unrealistic assignments
- Incorporate lessons learned and cost tracking insights into task descriptions and estimates

### Checklist: Household Operations Manual Completeness

- [ ] All recurring daily, weekly, bi-weekly, monthly, quarterly, and annual tasks are listed
- [ ] Each task has a primary owner and backup owner
- [ ] Each task has an estimated duration based on actual execution or research
- [ ] Seasonal maintenance tasks are mapped to months/quarters with specific actions
- [ ] All major property systems have maintenance tasks assigned
- [ ] Vendor directory includes at least one contact per service category
- [ ] Emergency contacts are clearly marked and accessible
- [ ] Responsibility matrix is balanced across household members (no member >40% of hours)
- [ ] All task descriptions are specific and actionable (not vague)
- [ ] Cost estimates are provided for vendor services and based on quotes or prior invoices
- [ ] Cost summary shows annual budget, monthly average, and cost by category
- [ ] Communication protocol is documented with notification procedures and response times
- [ ] Manual is organized logically with consistent heading hierarchy and visual elements
- [ ] All household members have reviewed and approved the manual
- [ ] Vendor information is verified as current within the past 30 days
- [ ] Task completion tracking system is set up and accessible
- [ ] Lessons learned template is available and process is documented
- [ ] Review date is scheduled and reminders are set
- [ ] Manual owner/editor is designated with name and contact info
- [ ] Manual is accessible to all members in the chosen format

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.