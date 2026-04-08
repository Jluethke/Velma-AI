# Event Planner

**One-line description:** Plan and execute an event end-to-end, from scope definition through guest management, venue selection, vendor coordination, budget tracking, and day-of execution.

**Execution Pattern:** Phase Pipeline with conditional branching

---

## Inputs

**Event Definition:**
- `event_type` (string, required): Type of event (conference, wedding, corporate retreat, product launch, etc.)
- `target_date` (string, required): Preferred event date (ISO 8601 format: YYYY-MM-DD)
- `date_flexibility` (string, optional): How flexible the date is (fixed, ±1 week, ±2 weeks, flexible). Default: "fixed"
- `expected_guest_count` (number, required): Target number of attendees

**Budget and Constraints:**
- `budget_ceiling` (number, required): Maximum budget in USD
- `budget_contingency_percent` (number, optional): Contingency buffer as percentage of budget. Default: 10
- `location_preference` (string, optional): Geographic area or specific location requirement

**Stakeholders and Requirements:**
- `key_stakeholders` (array of objects, optional): Decision-makers with format {name, role, approval_authority}. Example: [{"name": "Jane Doe", "role": "Event Sponsor", "approval_authority": "budget"}]
- `dietary_restrictions_expected` (boolean, optional): Whether to plan for dietary needs. Default: true
- `accessibility_requirements` (string, optional): ADA compliance, mobility access, sensory accommodations needed
- `known_edge_cases` (array of strings, optional): Specific constraints or risks (e.g., "venue has limited parking", "client is very budget-conscious")

---

## Outputs

- `event_brief` (object): Event scope document with fields: event_type, target_date, guest_count, budget_ceiling, objectives (array), constraints (array), success_criteria (array), stakeholder_map (array)
- `guest_list` (array of objects): Master guest list with fields: name, email, phone, RSVP_status (invited/accepted/declined/no_response), dietary_restrictions, plus_ones_count, final_headcount
- `venue_shortlist` (array of objects): 3-5 venue options with fields: name, capacity, cost_total, cost_per_person, amenities (array), availability_dates, accessibility_features, pros (array), cons (array), score (0-100)
- `venue_selected` (object): Final venue choice with fields: name, address, capacity, cost_total, contract_signed_date, floor_plan_url, parking_spaces, setup_timeline_hours, emergency_contacts (array)
- `vendor_list` (array of objects): All vendors with fields: category, name, contact_person, phone, email, quote_amount, contract_signed_date, scope_of_work, arrival_time, setup_time_minutes, backup_vendor_name
- `event_timeline` (object): Master timeline with fields: milestones (array with {task, owner, due_date, dependencies}), critical_path (array), decision_points (array), buffer_days
- `budget_tracker` (object): Budget spreadsheet with fields: line_items (array with {category, budgeted_amount, actual_amount, variance_percent, status}), total_budgeted, total_actual, contingency_remaining, variance_percent
- `day_of_runsheet` (string): Detailed minute-by-minute schedule with sections: timeline (time, activity, owner, vendor_involved), vendor_arrival_schedule, venue_logistics, emergency_contact_list, contingency_procedures (with specific triggers and responses), role_assignments
- `team_briefing` (object): Team preparation with fields: briefing_date, attendees (array), runsheet_summary, role_assignments (array with {role, person, responsibilities}), emergency_protocols (array), vendor_contact_list
- `debrief_report` (object): Post-event analysis with fields: feedback_summary (satisfaction_score_avg, response_rate_percent, key_themes), team_notes (what_went_well, challenges, improvements), vendor_ratings (array with {vendor_name, rating_1_to_5, notes}), budget_reconciliation (final_cost, variance_from_budget_percent), attendance_actual_vs_forecast, lessons_learned (array), recommendations_for_next_event (array)

---

## Execution Phases

### PHASE 0: PRE-PLANNING ALIGNMENT (NEW)

**Entry Criteria:**
- Event type, target date, and budget ceiling are provided
- At least one key stakeholder is identified

**Actions:**
1. Schedule 30-minute stakeholder alignment meeting with decision-makers
2. Confirm event type, date flexibility, and budget realism: Is the budget sufficient for the scope? Are dates flexible if needed?
3. Clarify decision-making authority: Who approves budget changes? Who selects venue? Who is final decision-maker?
4. Identify and document any known constraints or risks (e.g., "venue must have parking", "client is budget-conscious", "speaker availability is limited")
5. Establish communication plan: How will stakeholders, vendors, and team stay informed? (email, Slack, weekly calls, etc.)
6. Create a risk register: List potential issues (venue unavailability, vendor cancellation, budget overrun, low RSVP rate) with mitigation strategies and owners

**Output:** Stakeholder alignment document with decision-making authority, communication plan, and risk register

**Quality Gate:** All decision-makers have confirmed their approval authority. Communication plan specifies frequency and channels. Risk register has at least 5 identified risks with owners and mitigation strategies.

---

### PHASE 1: DEFINE EVENT SCOPE

**Entry Criteria:**
- Stakeholder alignment is complete
- Event type, target date, guest count, and budget ceiling are confirmed

**Actions:**
1. Synthesize event brief: document event type, date, location preference, guest count, budget, and key constraints
2. Define success criteria: What does "successful" look like? Use SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound). Examples: "On-time start (within 5 minutes)", "Guest satisfaction ≥4/5 average", "On-budget (within ±5%)", "Attendance within ±10% of forecast"
3. Identify hard constraints: Is date fixed or flexible? Is location fixed or flexible? Is budget immovable?
4. Map stakeholder roles: Who approves budget? Who makes venue decision? Who is point-of-contact for vendors? Who is day-of event lead?
5. Document assumptions: What are we assuming about guest count, budget, date, or scope? Flag assumptions that need validation

**Output:** Event brief document (one page) with objectives, constraints, success criteria (SMART), stakeholder map, and assumptions

**Quality Gate:** Brief is one page or less. Every constraint is explicitly stated (fixed or flexible). Success criteria are SMART and measurable. Stakeholder roles are assigned and confirmed. Assumptions are documented.

---

### PHASE 2: BUILD GUEST LIST AND MANAGE INVITATIONS

**Entry Criteria:**
- Event brief is finalized
- Stakeholders have provided initial invitee list

**Actions:**
1. Compile master guest list from stakeholder input: name, email, phone, relationship to event, category (VIP, speaker, attendee, vendor, staff)
2. Set up RSVP tracking system (Eventbrite, Google Forms, Airtable, or spreadsheet) with fields: name, email, RSVP status, dietary restrictions, accessibility needs, plus-ones
3. Create and send invitation (email or formal invite) with RSVP deadline (typically 2-3 weeks before event) and clear instructions for dietary/accessibility needs
4. Set up automated reminders: 1 week before RSVP deadline, send reminder to non-responders
5. Track RSVPs in real-time: update spreadsheet daily, monitor response rate
6. At RSVP deadline, conduct manual follow-up calls to key stakeholders and VIPs who have not responded
7. Finalize headcount 2 weeks before event; confirm final count with all vendors (catering, AV, rentals)
8. Create final guest list with dietary restrictions and accessibility needs clearly flagged

**Output:** Master guest list (array) with RSVP status, dietary restrictions, accessibility needs, plus-one count, final headcount, and RSVP response rate

**Quality Gate:** RSVP response rate is ≥70% by 2 weeks before event (or ≥80% if event is internal/corporate). All dietary and accessibility needs are documented. Final headcount is locked 2 weeks prior and confirmed with vendors. No guest has missing contact information.

---

### PHASE 3: SELECT AND SECURE VENUE

**Entry Criteria:**
- Event brief is finalized
- Guest count is estimated (within ±10%)
- Budget ceiling is confirmed
- Accessibility requirements are documented

**Actions:**
1. Define venue criteria: capacity (guest count + 10% buffer), layout (theater, classroom, cocktail, banquet, etc.), required amenities (AV, catering kitchen, parking, restrooms, WiFi), accessibility features (wheelchair access, accessible restrooms, accessible parking, elevators), cost per person or flat rate, location preference
2. Research venues: use online platforms (Eventbrite, The Knot, local CVBs, Google Maps) and direct outreach. Aim for 5-8 initial options
3. Evaluate shortlist: visit or video tour top 3-5 venues. Score each on: capacity (meets headcount + 10%), cost (within budget), amenities (all required features present), availability (date available), accessibility (meets requirements), logistics (parking, load-in, setup time)
4. Negotiate: request detailed proposals, ask about package deals, confirm hidden costs (setup fees, AV rental, catering minimums, parking fees, breakdown time)
5. Decision gate: Does the best venue fit budget and date? If not, adjust date (within flexibility), reduce guest count, or expand search
6. Secure venue: sign contract, confirm date and time, document cancellation policy (what happens if we cancel? what if venue cancels?), get floor plan and setup timeline, confirm emergency procedures
7. Confirm accessibility: walk through venue with accessibility checklist; confirm ADA compliance; document any accommodations needed

**Output:** Venue shortlist (3-5 options with scores 0-100) and final venue selection (object with contract, floor plan, logistics, emergency contacts)

**Quality Gate:** Selected venue has capacity for final headcount + 10%. Cost per person is within budget (≤budget_ceiling / headcount). Contract is signed and includes cancellation policy. Floor plan and setup timeline are documented. Accessibility features are confirmed to meet requirements. Venue has provided emergency contact and emergency procedures.

---

### PHASE 4: COORDINATE VENDORS

**Entry Criteria:**
- Venue is secured
- Final guest count is known (or estimated within ±5%)
- Budget allocation per vendor category is defined

**Actions:**
1. Identify vendor categories needed: catering (food/beverage), AV (sound, projection, lighting), photography/video, florist, entertainment, transportation, rentals (tables, chairs, linens), signage, etc. Prioritize by criticality (catering and AV are critical)
2. For each category, research 3-5 vendors. Request proposals with: scope of work, cost, availability on event date, setup/breakdown time, cancellation policy, references
3. Evaluate vendors: score on quality (references, portfolio), cost (within budget allocation), responsiveness (reply time, communication), flexibility (can they accommodate last-minute changes?)
4. Identify backup vendors: For each critical vendor (catering, AV, photography), pre-vet a backup vendor and document their contact info and availability
5. Negotiate: bundle discounts, confirm final headcount pricing (when is final count due?), clarify what is included vs. extra charges, confirm cancellation policy
6. Book vendors: sign contracts, confirm date/time/location, get detailed scope of work, confirm emergency contact and contingency procedures
7. Create vendor coordination spreadsheet: vendor name, category, contact person, phone, email, arrival time, setup time, breakdown time, cost, key deliverables, backup vendor contact
8. Schedule pre-event calls (1 week before) with each vendor to confirm details, address questions, and review contingency procedures

**Output:** Vendor list (array) with quotes, contracts, contact info, backup vendors, and coordination schedule

**Quality Gate:** All critical vendors are booked (catering, AV, photography). Contracts are signed and include scope of work and cancellation policy. Backup vendors are identified for critical categories. Vendor arrival times are staggered to avoid conflicts (minimum 30 minutes between arrivals). Total vendor cost is within budget. All vendors have confirmed final headcount and setup requirements.

---

### PHASE 5: CREATE TIMELINE AND CRITICAL PATH

**Entry Criteria:**
- Venue is secured
- All vendors are booked
- Event date is fixed

**Actions:**
1. Map vendor lead times: when must catering final count be confirmed? When must AV be tested? When must signage be printed? (Use reference section for typical lead times)
2. Identify key milestones: invitations sent (date), RSVP deadline (date), final headcount (date), vendor confirmations (date), setup day (date), event day (date), breakdown (date)
3. Work backward from event date to create critical path: which tasks have zero slack? Which can slip by a few days? Document dependencies (e.g., "final headcount must be confirmed before catering final count")
4. Create master timeline (Gantt chart or spreadsheet) with: task, owner, start date, due date, dependencies, status, notes
5. Identify decision points: when must budget be finalized? When must venue layout be locked? When must team be briefed? When must contingency procedures be tested?
6. Build in buffer time: add 1-2 days before event for final checks and contingency. Add 1 day after event for vendor breakdown and initial feedback
7. Share timeline with stakeholders and vendors; confirm all dates are achievable

**Output:** Event timeline (object) with milestones (array), critical path (array), decision points (array), and buffer days

**Quality Gate:** Timeline is realistic and accounts for vendor lead times. Critical path is identified and documented. All tasks have owners and due dates. Timeline is shared with stakeholders and vendors, and all confirm achievability. Buffer time is built in before and after event.

---

### PHASE 6: TRACK BUDGET AND MANAGE COSTS

**Entry Criteria:**
- All vendors are booked and quoted
- Budget ceiling is confirmed
- Contingency percentage is defined

**Actions:**
1. Create budget spreadsheet with line items: venue, catering, AV, photography, florist, rentals, signage, contingency, miscellaneous. Include budgeted amount for each (from vendor quotes)
2. Calculate total budgeted cost; compare to budget ceiling. If over, adjust scope (reduce guest count, simplify catering, etc.) or negotiate with vendors
3. Reserve contingency: set aside 10-15% of total budget as contingency reserve for unexpected costs. Track contingency spending separately
4. As invoices arrive, log actual cost and update variance (actual vs. budgeted). Flag any line item that exceeds budget by >5%; escalate to stakeholders
5. Track remaining budget and contingency balance weekly. Update forecast if trends suggest final cost will exceed budget
6. Final reconciliation (Phase 9): collect all invoices, confirm final costs, settle any outstanding payments, calculate final variance

**Output:** Budget tracker (object) with line items (array), budgeted amounts, actual costs, variance percent, contingency remaining, and total variance

**Quality Gate:** Total budgeted cost is ≤ budget ceiling. Contingency is 10-15% of total. All invoices are logged within 2 days of receipt. Final cost is within ±5% of budget (or within contingency if overrun). Contingency spending is tracked separately.

---

### PHASE 7: CREATE DAY-OF RUNSHEET

**Entry Criteria:**
- Timeline is finalized
- All vendors are confirmed
- Final guest count is locked
- Venue logistics are documented
- Team roles are assigned

**Actions:**
1. Create minute-by-minute schedule: doors open (time), welcome remarks (time, speaker), agenda items (times), breaks (times), meals (times), entertainment (times), closing remarks (time), breakdown (time)
2. For each time block, document: who is responsible (role), what is happening (activity), which vendors are involved, what could go wrong (risk), contingency response
3. Create vendor arrival schedule: when does each vendor arrive? Where do they set up? Who is the point-of-contact? Confirm all vendors have confirmed arrival times
4. Document venue logistics: parking location and capacity, load-in location and hours, setup areas, restroom locations, emergency exits, AV booth location, WiFi access, emergency procedures
5. Create emergency contact list: venue manager, all vendors (with backup), key staff, medical/security, stakeholders, local hospital, police, fire
6. Identify contingency procedures: for each major risk (catering late, AV fails, speaker cancels, weather bad, attendance 20% higher/lower), document specific trigger and response. Examples:
   - "If catering arrives >30 minutes late: activate contingency (have snacks ready, adjust timeline, communicate with guests)"
   - "If AV fails: switch to backup projector or audio-only format; notify MC"
   - "If attendance is 20% higher: activate overflow space, request extra catering from backup vendor"
7. Assign roles: who is MC? Who manages vendors? Who handles guest check-in? Who is backup for each role? Who is day-of event lead?
8. Create one-page quick-reference runsheet for day-of team (summary of timeline, vendor contacts, emergency procedures, role assignments)
9. Walk through event from guest perspective: arrival, check-in, navigation, restrooms, food service, exit. Identify friction points and fix before event day

**Output:** Day-of runsheet (detailed document) with minute-by-minute schedule, vendor details, venue logistics, emergency contacts, contingency procedures (with specific triggers and responses), role assignments, and one-page quick-reference summary

**Quality Gate:** Runsheet is detailed enough that a substitute could execute the event. All vendor arrival times are confirmed and staggered. Emergency contacts are current (verified within 1 week of event). Contingency procedures are specific (not vague) and include trigger conditions and response steps. Role assignments are clear and confirmed with team members. Guest experience checklist is completed and friction points are addressed.

---

### PHASE 8: BRIEF TEAM AND EXECUTE EVENT

**Entry Criteria:**
- Runsheet is finalized
- All vendors are confirmed
- Team members are assigned and briefed
- Contingency procedures are documented
- Backup vendors are on standby

**Actions:**
1. Schedule pre-event team briefing (1-2 days before event): review runsheet, clarify roles, walk through venue if possible, review contingency procedures, confirm emergency contacts
2. Distribute runsheet, emergency contact list, and role assignments to all team members. Confirm receipt and understanding
3. Confirm vendor arrival times and setup: send reminder emails 48 hours before event with arrival time, location, parking, and point-of-contact
4. Day-of: arrive early (2-3 hours before guests). Walk through venue, test AV, confirm catering setup, check signage, confirm parking is available
5. Execute event per runsheet: manage timing, coordinate vendors, handle issues as they arise, keep team aligned via radio/phone
6. Monitor guest experience: check in with attendees, address concerns, adjust as needed. Use guest experience checklist to identify friction points
7. Manage vendor coordination: confirm vendors are on schedule, resolve any delays or issues, activate contingency procedures if needed
8. Manage breakdown: coordinate vendor breakdown, collect feedback from team and guests (if time permits), ensure venue is left clean

**Output:** Event executed on schedule. Team briefing notes. Vendor coordination log. Guest feedback (if collected). Incident log (any issues that occurred and how they were resolved).

**Quality Gate:** Event starts within 5 minutes of scheduled time. All vendors are present and performing. No critical issues are unresolved. Guest satisfaction is measured (if survey conducted) and score is ≥4/5 average. Venue is left clean and breakdown is complete within scheduled time.

---

### PHASE 9: POST-EVENT DEBRIEF AND CLOSEOUT

**Entry Criteria:**
- Event is complete
- All vendors have been paid or invoiced
- Photos/videos are collected

**Actions:**
1. Collect feedback: send post-event survey to attendees within 24 hours (higher response rate). Ask: overall satisfaction (1-5 scale), specific elements (food, AV, speakers, logistics), what went well, what to improve, additional comments
2. Debrief with team: within 1 week, conduct debrief meeting. Ask: what went well? What was challenging? What would you do differently? What did we learn?
3. Debrief with stakeholders: review event against success criteria. Did we meet objectives? Were we on-budget? Was attendance as forecast? What feedback did we receive?
4. Vendor performance review: rate each vendor on quality (1-5 scale), responsiveness, professionalism, adherence to scope. Document for future events. Note any vendors to avoid or recommend
5. Final budget reconciliation: collect all invoices, confirm final costs, calculate final variance (actual vs. budgeted), close out budget. Document any unexpected costs or savings
6. Attendance analysis: compare actual attendance to forecast. If variance >10%, analyze why (RSVP accuracy, no-shows, walk-ins)
7. Archive: save photos, videos, feedback, timeline, budget, debrief notes, vendor ratings, and lessons learned in shared folder for future reference
8. Thank you notes: send to vendors, speakers, volunteers, key stakeholders within 48 hours
9. Error handling for Phase 9: If feedback is overwhelmingly negative (satisfaction <3/5 average), conduct root cause analysis and create action plan for next event. If budget variance >10%, analyze causes and identify cost-saving opportunities

**Output:** Debrief report (object) with feedback summary (satisfaction score, response rate, key themes), team notes (what went well, challenges, improvements), vendor ratings (array), budget reconciliation (final cost, variance), attendance analysis (actual vs. forecast), lessons learned (array), and recommendations for next event (array)

**Quality Gate:** Feedback is collected from ≥50% of attendees (or ≥70% if internal event). Satisfaction score is ≥4/5 average (or documented if lower with root cause analysis). Vendor performance is rated. Final budget is reconciled and variance is documented. Lessons learned are documented for next event. All artifacts are archived. Thank you notes are sent within 48 hours.

---

## Exit Criteria

The event planning workflow is DONE when:
- Event has been executed on or within 5 minutes of the target date
- All vendors have been coordinated, performed, and paid (or invoiced)
- Guest feedback has been collected from ≥50% of attendees with satisfaction score ≥4/5 average (or documented if lower)
- Final budget is reconciled and variance is within ±5% of target (or within contingency reserve)
- Debrief is complete with documented lessons learned and recommendations for next event
- All artifacts (photos, videos, feedback, budget, timeline, debrief notes) are archived in shared folder
- Thank you notes have been sent to vendors, speakers, and key stakeholders within 48 hours

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| PHASE 0 | Stakeholders cannot agree on event scope or budget | **Adjust** -- facilitate decision-making meeting; document trade-offs (e.g., reduce guest count to fit budget); escalate to executive sponsor if needed. |
| PHASE 1 | Budget ceiling is unrealistic for scope | **Adjust** -- reduce guest count, simplify event type, or increase budget. Document trade-offs with stakeholders. |
| PHASE 2 | RSVP rate is <70% by deadline (or <80% for internal event) | **Adjust** -- extend RSVP deadline by 1 week, send personal follow-up calls to key stakeholders, reduce guest list if needed. |
| PHASE 3 | No venues available on target date | **Adjust** -- shift event date by ±1-2 weeks, expand geographic search, or consider alternative venue types (outdoor, non-traditional). |
| PHASE 3 | Selected venue cost exceeds budget | **Adjust** -- negotiate package deal, reduce guest count, or select alternative venue. |
| PHASE 4 | Critical vendor (catering, AV) cancels | **Retry** -- immediately contact backup vendor (pre-vetted in Phase 4). If no backup available, escalate to stakeholders and consider event postponement. |
| PHASE 4 | Vendor quote is significantly higher than expected (>10% over budget allocation) | **Adjust** -- negotiate, request itemized breakdown, or replace with alternative vendor. |
| PHASE 5 | Critical path reveals timeline is too tight | **Adjust** -- extend event date, reduce scope, or add resources (hire event coordinator). |
| PHASE 6 | Actual costs exceed budget by >10% | **Adjust** -- cut non-essential items, negotiate with vendors, or request budget increase from stakeholders. |
| PHASE 7 | Runsheet is too complex or unclear | **Adjust** -- simplify, create separate runsheets for different roles (MC, vendors, staff), or add visual diagrams. |
| PHASE 8 | Vendor arrives late or setup takes longer than planned | **Retry** -- activate contingency procedure, adjust timeline, or have backup vendor on standby. |
| PHASE 8 | Unexpected attendance is 20%+ higher than expected | **Adjust** -- activate contingency (extra catering, standing room, overflow space), communicate with guests, manage expectations. |
| PHASE 8 | AV or critical equipment fails during event | **Retry** -- have backup equipment on-site. If unavailable, pivot to alternative format (e.g., no video, audio-only). |
| PHASE 9 | Feedback is overwhelmingly negative (satisfaction <3/5 average) | **Adjust** -- conduct root cause analysis, identify specific failures, and create action plan for next event. |
| PHASE 9 | Budget variance is >10% | **Adjust** -- analyze causes (vendor overages, unexpected costs, scope creep), document lessons learned, and identify cost-saving opportunities for next event. |

---

## Reference Section: Domain Knowledge and Decision Criteria

### Venue Selection Criteria
- **Capacity:** Plan for 110% of expected headcount (accounts for walk-ins, plus-ones)
- **Cost per person:** Typically 30-50% of total event budget (varies by event type)
- **Setup time:** Allow 2-3 hours for setup before guests arrive
- **Parking:** Minimum 1 space per 3 attendees (or public transit access)
- **Accessibility:** Ensure ADA compliance, wheelchair access, accessible restrooms, accessible parking, elevators if multi-floor
- **Catering kitchen:** If in-house catering, verify kitchen capacity and equipment
- **AV infrastructure:** Check for built-in AV, power outlets, internet bandwidth (≥10 Mbps for streaming)
- **WiFi:** Confirm WiFi is available and bandwidth is sufficient for attendee load

### Vendor Lead Times (typical)
- **Catering:** 4-8 weeks (final headcount 2 weeks before)
- **Photography:** 6-12 weeks
- **AV/Rentals:** 4-6 weeks
- **Florist:** 2-4 weeks
- **Entertainment:** 8-12 weeks
- **Signage/Printing:** 2-3 weeks

### Budget Allocation (typical for corporate event, 100 guests)
- Venue: 25-35%
- Catering: 35-45%
- AV/Production: 10-15%
- Photography/Video: 5-10%
- Rentals/Decor: 5-10%
- Contingency: 10-15%

### RSVP Best Practices
- Send invitations 4-6 weeks before event
- Set RSVP deadline 2-3 weeks before event
- Send reminder at 1 week before deadline
- Collect dietary restrictions and accessibility needs in RSVP form
- Lock final headcount 2 weeks before event
- Target RSVP response rate: ≥70% (or ≥80% for internal/corporate events)

### Day-of Contingency Procedures
- **Catering delay (>30 min):** Have snacks/beverages ready; adjust timeline; communicate with guests
- **AV failure:** Have backup projector, laptop, or switch to audio-only format
- **Speaker cancellation:** Have backup speaker or extend Q&A/networking time
- **Weather (outdoor):** Have tent/indoor backup; communicate plan to guests
- **Attendance variance (±20%):** Have extra catering on standby; prepare overflow space
- **Medical emergency:** Know location of nearest hospital; have first aid kit; designate staff member to assist

### Post-Event Best Practices
- Send thank-you notes within 48 hours
- Share photos/videos within 1 week
- Collect feedback within 24 hours (higher response rate)
- Debrief with team within 1 week (while fresh)
- Archive all materials for future reference
- Rate vendors for future events
- Target feedback response rate: ≥50% (or ≥70% for internal events)
- Target satisfaction score: ≥4/5 average

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.