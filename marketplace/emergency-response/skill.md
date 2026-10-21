# Emergency Response

Something just went wrong. This flow triages the situation, pulls the right
diagnostic data depending on what happened, locates the nearest resources,
estimates the cost impact, and builds a communication plan so the right
people know what is going on. It adapts to three categories: vehicle
incidents, home incidents, and personal/medical situations.

```
SITUATION -> [TRIAGE] -> [DIAGNOSE] -> [RESOURCES] -> [COST] -> [COMMUNICATE] -> RESOLVED
```

## Inputs

| Field      | Type    | Required | Description                               |
|------------|---------|----------|-------------------------------------------|
| situation  | string  | yes      | Plain language: "car won't start", "water leak in basement", "power out" |
| severity   | string  | no       | CRITICAL, HIGH, MEDIUM, LOW. Auto-assessed if not provided |
| location   | string  | no       | Current location for resource finding      |
| time_of_day| string  | no       | Affects resource availability              |
- `situation:string`: (from manifest)
- `severity:string`: (from manifest)
- `location:string`: (from manifest)

## Outputs

| Field              | Type    | Description                               |
|--------------------|---------|-------------------------------------------|
| triage_result      | object  | Category, severity, immediate actions      |
| diagnostic_data    | object  | Relevant data pulled from domain flows     |
| resource_list      | array   | Nearest help sorted by availability        |
| cost_estimate      | object  | Expected cost range and budget impact      |
| communication_plan | object  | Who to contact and what to say             |

---
- `triage_result:object`: (from manifest)
- `diagnostic_data:object`: (from manifest)
- `resource_list:array`: (from manifest)
- `cost_estimate:object`: (from manifest)
- `communication_plan:object`: (from manifest)

## Phase 1: Triage

### Entry Criteria
Situation description provided.

### Actions
1. Classify the situation into one of three categories:

   **VEHICLE**
   Keywords: car, truck, engine, tire, brake, won't start, check engine,
   overheating, accident, flat, tow, battery dead, locked out, stalled.

   **HOME**
   Keywords: water, leak, flood, power, outage, fire, smoke, alarm, break-in,
   gas smell, HVAC, furnace, frozen pipe, roof, tree, storm damage.

   **PERSONAL**
   Keywords: hurt, injured, sick, fall, chest, breathing, allergic, cut,
   burn, dizzy, unconscious, medication, hospital.

2. Assess severity if not provided:
   - CRITICAL: life safety risk. Vehicle: accident with injury, fire.
     Home: gas leak, active fire, flooding electrical panel. Personal: any.
   - HIGH: situation worsening without action. Vehicle: overheating while
     driving, brake failure warning. Home: active water leak, no heat below
     32F. Personal: non-emergency medical.
   - MEDIUM: inconvenient but stable. Vehicle: won't start (parked), flat
     tire (safe location). Home: power outage, HVAC failure (mild weather).
   - LOW: annoying, no urgency. Vehicle: check engine light (no symptoms).
     Home: minor leak, cosmetic damage.

3. Generate immediate action based on severity:
   - CRITICAL: "Call 911 if not already done. Do not attempt repair."
   - HIGH: "Stop what you are doing. Secure the area. Do not ignore."
   - MEDIUM: "Safe to assess. Gather information before acting."
   - LOW: "Not urgent. Plan a fix within 24-48 hours."

4. If CRITICAL and category is PERSONAL, skip all remaining phases.
   Output: "Call 911. This flow handles logistics after immediate safety
   is secured."

### Output
Triage record: {category, severity, immediate_action, skip_to_phase}.

### Quality Gate
Category is one of VEHICLE, HOME, PERSONAL. Severity assigned. Immediate
action provided.

---

## Phase 2: Diagnostic Pull

### Entry Criteria
Triage complete. Severity is not CRITICAL/PERSONAL (those go straight to
communication).

### Actions
1. Based on category, identify which domain flows to reference:

   **VEHICLE diagnostics:**
   - Run troubleshooter with the situation as symptom input
   - Pull vehicle-health for current DTC snapshot
   - If electrical issue, pull can-detective for bus anomalies
   - If mechanical, pull maintenance-schedule for overdue items
   - Common quick checks:
     | Symptom               | First Check                    | Second Check         |
     |-----------------------|--------------------------------|----------------------|
     | Won't start           | Battery voltage (< 12.2V dead) | Starter relay click  |
     | Overheating           | Coolant level                  | Thermostat DTC P0128 |
     | Check engine steady   | Read DTCs via 0x19 02 FF       | Freeze frame data    |
     | Check engine flashing | Misfire active, stop driving    | P0300-P0306 codes    |
     | Brake warning         | Fluid level                    | ABS DTCs via C-codes |
     | No electrical power   | Battery terminals corroded     | Fuse box check       |

   **HOME diagnostics:**
   - Run home-status for device/sensor readings
   - Pull home-maintenance for related overdue tasks
   - Common quick checks:
     | Symptom              | First Check                     | Second Check          |
     |----------------------|---------------------------------|-----------------------|
     | Water leak           | Main shutoff valve location     | Water meter spinning  |
     | Power outage         | Breaker panel (tripped breaker) | Neighbors also out    |
     | Gas smell            | Leave immediately, call utility | Do not flip switches  |
     | No heat              | Thermostat setting and battery  | Filter clogged check  |
     | No hot water         | Water heater pilot/breaker      | Age of unit (avg 10yr)|
     | Alarm going off      | Check all zones on panel        | Recent entry/window   |

2. Compile diagnostic findings into a summary with confidence levels.

### Output
Diagnostic summary: {findings[], likely_cause, confidence, recommended_flow}.

### Quality Gate
At least one diagnostic finding produced. Likely cause identified or marked
UNKNOWN with next steps.

---

## Phase 3: Resource Location

### Entry Criteria
Diagnostic data from Phase 2 (or triage data if diagnostics skipped).

### Actions
1. Build a resource list based on category and situation:

   **VEHICLE resources:**
   - Roadside assistance: AAA (800-222-4357), insurance roadside number
   - Tow service: nearest by location
   - Parts store: AutoZone, O'Reilly, NAPA (for DIY)
   - Dealer service: nearest Mopar dealer
   - Independent mechanic: if lower cost preferred
   - Locksmith: if locked out

   **HOME resources:**
   - Utility emergency: gas company, electric company, water company
   - Plumber: for water/sewer emergencies
   - Electrician: for electrical issues
   - HVAC tech: for heating/cooling failure
   - Insurance claim line: for damage incidents
   - Restoration company: for water/fire damage
   - General contractor: for structural issues

2. For each resource, note:
   - Typical response time (emergency plumber: 1-4 hours, tow: 30-60 min)
   - Typical cost range
   - Hours of operation (24/7 vs business hours)
   - Whether your insurance covers it
3. Sort by: urgency match first, then availability, then cost.

### Output
Resource list: [{type, contact_method, response_time, cost_range, hours, insurance_covered}].

### Quality Gate
At least 2 resources listed. Response times realistic for the severity level.

---

## Phase 4: Cost Estimate

### Entry Criteria
Diagnostic findings and resource list available.

### Actions
1. Estimate costs by combining:
   - Service call / diagnostic fee: typical $75-150 for vehicle, $50-200 for home
   - Repair cost range based on likely cause (from parts-finder if vehicle,
     from contractor estimates if home)
   - Emergency premium: after-hours calls typically 1.5-2x normal rate
   - Parts cost: from parts-finder output if available
   - Insurance deductible: note if applicable

2. Common emergency cost ranges:
   | Situation             | Low Estimate | High Estimate | Insurance? |
   |-----------------------|-------------|---------------|------------|
   | Tow (local)           | $75         | $150          | Maybe      |
   | Battery replacement   | $150        | $300          | No         |
   | Flat tire (mobile)    | $50         | $150          | Maybe      |
   | Locksmith (car)       | $75         | $250          | No         |
   | Emergency plumber     | $200        | $800          | Maybe      |
   | Electrician (urgent)  | $150        | $500          | No         |
   | Water damage restore  | $1,500      | $10,000       | Yes        |
   | HVAC emergency repair | $200        | $1,500        | No         |
   | Tree removal          | $300        | $2,000        | Yes        |
   | Broken window board   | $100        | $300          | Yes        |

3. Calculate budget impact:
   - Pull from budget-builder if available: "This repair would use X% of
     your monthly discretionary budget."
   - If emergency fund exists: "You have $X in emergency reserves, this
     would use Y%."
   - If no budget data: provide cost range only.

### Output
Cost estimate: {low, high, most_likely, budget_impact, insurance_applicable,
emergency_fund_impact}.

### Quality Gate
Low estimate < high estimate. Budget impact calculated if budget data available.
Insurance applicability assessed.

---

## Phase 5: Communication Plan

### Entry Criteria
All prior phases complete (or triage only for CRITICAL).

### Actions
1. Build contact list by priority:
   - CRITICAL: emergency services first, then family, then insurance
   - HIGH: service provider first, then family notification
   - MEDIUM: schedule service, notify household
   - LOW: add to task list, no immediate notification needed

2. For each contact, provide a script:
   - Emergency services: location, nature of emergency, number of people
   - Insurance: policy number prompt, incident date/time, description, photos needed
   - Service provider: problem description, address, urgency level, access instructions
   - Family/household: what happened, current status, what you need from them

3. Documentation checklist:
   - Photos of damage or situation (before any repair)
   - Receipts for any emergency purchases
   - Service provider name, license number, estimate
   - Insurance claim number if filed
   - Timeline of events for records

4. Follow-up schedule:
   - Same day: confirm service scheduled
   - Next day: verify repair started or claim filed
   - One week: check repair complete, final cost vs estimate
   - One month: verify no recurrence

### Output
Communication plan: {contacts[], scripts[], documentation_checklist[],
followup_schedule[]}.

### Quality Gate
At least one contact identified. Script provided for the primary contact.
Documentation checklist generated.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Immediate response flow for emergencies: vehicle breakdown, home incident, or me, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

- Situation triaged with severity and category
- Diagnostic data pulled from relevant domain
- At least 2 resources identified with contact info
- Cost range estimated
- Communication plan with at least one scripted contact

## Error Handling

| Error                        | Response                                      |
|------------------------------|-----------------------------------------------|
| Unclassifiable situation     | Default to HOME, severity MEDIUM, ask for detail |
| No diagnostic data available | Skip Phase 2, proceed with triage-only resources |
| Location not provided        | Provide general resources without distance sort  |
| Cost data unavailable        | Provide "typical range" from reference table     |
| Multiple categories apply    | Classify by the most severe aspect               |

## State Persistence

Store each emergency as:
```
{category}_{YYYY-MM-DD}_{severity}.emergency.json
```
Retain indefinitely for insurance records and pattern detection (recurring
issues suggest a deeper root cause).

## Severity Decision Matrix

| Factor                    | CRITICAL | HIGH   | MEDIUM | LOW    |
|---------------------------|----------|--------|--------|--------|
| Life safety at risk       | YES      | no     | no     | no     |
| Situation worsening       | rapidly  | yes    | slowly | no     |
| Property damage active    | yes      | yes    | maybe  | no     |
| Can wait until morning    | NO       | NO     | yes    | yes    |
| Can wait until next week  | NO       | NO     | NO     | yes    |
| Self-serviceable          | NO       | maybe  | likely | yes    |

---

Copyright 2026 the governance provider Group. All rights reserved.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
