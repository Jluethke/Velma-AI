# Aging Parent Care Coordinator

Helps you figure out what kind of care your aging parent actually needs right now, coordinate help across siblings and family members (without the guilt trips), navigate the maze of assisted living and home care options, and make healthcare decisions when things get complicated. This isn't about reading pamphlets -- it's about building a real plan when your parent's needs are changing and nobody in the family knows what to do next. Works whether you're the only child handling everything or one of five siblings who can't agree on anything.

## Execution Pattern: Phase Pipeline

```
PHASE 1: ASSESSMENT   --> Evaluate your parent's current needs, capabilities, and safety risks
PHASE 2: FAMILY MAP   --> Identify who can help, how much, and set realistic expectations
PHASE 3: CARE DESIGN  --> Build a care plan that matches needs to available resources
PHASE 4: NAVIGATION   --> Research and compare care options (in-home, assisted living, memory care)
PHASE 5: HEALTHCARE   --> Coordinate medical decisions, appointments, and insurance
PHASE 6: SUSTAINMENT  --> Prevent caregiver burnout and adapt the plan as needs change
```

## Inputs
- parent_situation: object -- Parent's age, current living situation, diagnosed conditions, mobility level, cognitive status (sharp, some forgetfulness, diagnosed dementia), daily activities they can/can't do independently
- family_resources: object -- List of family members, where they live (proximity to parent), their availability (full-time work, retired, flexible schedule), current involvement level, financial capacity
- current_concerns: array -- What triggered this -- a fall, a diagnosis, forgetting medication, driving incidents, loneliness, can't maintain house, hospitalization, general decline
- financial_info: object -- (Optional) Parent's income (Social Security, pension, savings), insurance coverage (Medicare, Medicaid, long-term care insurance, VA benefits), assets (home equity, investments)
- preferences: object -- (Optional) Parent's stated wishes about care, cultural or religious considerations, geographic constraints, what the parent absolutely refuses

## Outputs
- needs_assessment: object -- Detailed evaluation of current care needs across physical, cognitive, emotional, and safety dimensions with urgency ratings
- family_care_plan: object -- Who does what, when, with specific assignments and backup plans
- care_options_comparison: array -- Ranked care options with costs, pros/cons, and fit scores based on parent's specific situation
- healthcare_coordination: object -- Medical team contacts, appointment schedule, medication list, decision-making framework
- sustainability_plan: object -- Caregiver rotation, burnout prevention strategies, plan review schedule, trigger points for escalating care level

## Execution

### Phase 1: ASSESSMENT
**Entry criteria:** Basic information about parent's current situation and the concerns that prompted this.
**Actions:**
1. Evaluate Activities of Daily Living (ADLs) -- the clinical baseline for care needs. Can your parent independently: bathe, dress, use the toilet, transfer (get in/out of bed/chair), eat, and maintain continence? Score each as independent, needs some help, or fully dependent. Be honest -- "they manage" often means "they struggle but won't admit it."
2. Evaluate Instrumental Activities of Daily Living (IADLs) -- the stuff that determines whether they can live alone: managing medications, cooking meals, grocery shopping, housekeeping, managing finances, using the phone, driving/transportation, doing laundry. These usually decline before ADLs.
3. Assess safety risks in the current living situation. Check for: fall hazards (rugs, stairs, poor lighting, no grab bars), fire risks (leaving stove on, space heaters), wandering risk (if cognitive issues), medication errors (taking wrong doses, skipping doses, expired medications piling up), financial exploitation risk (scam calls, unusual bank activity).
4. Evaluate cognitive status honestly. Red flags beyond normal aging: repeating the same question within minutes, getting lost in familiar places, inability to manage medications even with a pill organizer, significant personality changes, poor judgment about safety, not recognizing familiar people. If you're seeing these, a formal cognitive evaluation is overdue.
5. Assess emotional and social wellbeing: isolation (how often do they see people?), depression signs (loss of interest, not eating, sleeping all day), anxiety about being a burden, grief over lost independence. Loneliness kills as effectively as smoking -- it's not a "nice to have" concern.
6. Rate each area as: stable (no immediate action needed), declining (needs attention in weeks/months), or urgent (needs action now). If anything is urgent, flag it and prioritize in the care plan.

**Output:** Comprehensive needs assessment with ADL/IADL scores, safety risk inventory, cognitive and emotional evaluation, and urgency ratings per domain.
**Quality gate:** Every ADL and IADL is scored. Safety risks are specific (not just "fall risk" but "no grab bars in bathroom, loose rug in hallway"). At least one honest conversation with the parent (not just family assumptions) informed the assessment.

### Phase 2: FAMILY MAP
**Entry criteria:** Needs assessment complete.
**Actions:**
1. List every family member who could potentially contribute -- not just siblings but also adult grandchildren, in-laws, close family friends, church/community members. For each person note: geographic proximity, work flexibility, relevant skills (a nurse niece is gold), financial capacity, and -- critically -- willingness. Someone who lives 10 minutes away but refuses to help is not a resource.
2. Have the honest conversation about capacity. "I'll help however I can" means nothing. Get specific: "Can you commit to Tuesday and Thursday evenings for 3 hours?" "Can you contribute $300/month?" "Can you handle all doctor appointments?" Vague promises create resentment when they inevitably fall through.
3. Acknowledge the unequal distribution problem head-on. In almost every family, one person (usually a daughter, usually the one who lives closest) ends up doing 80% of the work. Name this pattern. Assign a fair distribution that accounts for proximity, work schedules, and financial capacity -- not just willingness. Someone who can't visit can contribute money, research, or handle phone calls and paperwork.
4. Establish a communication system. Pick ONE channel (group text, shared app like CaringBridge or Lotsa Helping Hands, weekly email update) and require everyone to use it. No more "I didn't know Mom fell because nobody told me" followed by guilt trips. Include a weekly status update template.
5. Define decision-making authority. Who has medical power of attorney? Financial power of attorney? If these documents don't exist, getting them created is Job One (see Phase 5). If multiple siblings disagree on care decisions, establish a framework: parent's wishes first, then medical recommendation, then majority family vote. Not loudest voice wins.

**Output:** Family resource map with specific commitments, communication plan, decision-making framework, and honest assessment of gaps that need to be filled by paid care.
**Quality gate:** Every family member has a specific, time-bound commitment (or has explicitly opted out). Communication channel is selected and set up. Decision-making authority is documented. Gaps between family capacity and parent's needs are clearly quantified.

### Phase 3: CARE DESIGN
**Entry criteria:** Needs assessment and family resource map complete.
**Actions:**
1. Match each identified need to a resource. For every ADL/IADL deficit and safety risk, assign either: a family member (with backup), a paid caregiver, a community resource (Meals on Wheels, senior center, transportation service), or a technology solution (medication dispenser, medical alert system, video check-in).
2. Build the weekly care schedule. Map out every day of the week with: who's responsible, what tasks they're covering, transition times, and emergency contact for that time slot. Include overnights if wandering or fall risk is high. Identify the gaps -- the Tuesday afternoon nobody can cover, the Sunday when your parent is alone for 12 hours.
3. Fill the gaps with paid care options. Calculate the hours per week of paid help needed. Research local rates: home health aides ($15-30/hour depending on location), licensed nurses for medical tasks ($35-75/hour), adult day programs ($50-100/day). Compare the cost of filling gaps with paid in-home care vs. the cost of a higher level of care facility.
4. Build the medication management system. Create a complete medication list with: drug name, dose, frequency, prescribing doctor, what it's for (in plain English), and any interactions or side effects to watch for. Set up a medication management method: pill organizer, automated dispenser, pharmacy blister packs, or family member supervision -- based on cognitive status.
5. Create the emergency response plan. For each likely emergency (fall, medical crisis, wandering, power outage, caregiver no-show): who to call first, what information to have ready, nearest ER and their preferred hospital, where to find the medication list and insurance cards, who has house keys.

**Output:** Complete weekly care schedule, gap analysis with cost estimates, medication management system, and emergency response plan.
**Quality gate:** Every hour of the week has coverage assigned or a conscious risk acceptance. Medication list is verified with at least one pharmacist review. Emergency plan fits on one page for quick reference.

### Phase 4: NAVIGATION
**Entry criteria:** Care plan designed and gaps identified.
**Actions:**
1. Determine the right level of care based on the assessment. The spectrum: independent living with check-ins, in-home care (companion, personal care, or skilled nursing), adult day programs, assisted living, memory care (for dementia), skilled nursing facility (for complex medical needs), hospice (for end-of-life). Most families wait too long to move up the spectrum -- if you're debating whether it's time, it might already be past time.
2. If in-home care is the plan: research agencies vs. independent caregivers. Agencies cost more (they take 30-50% of the caregiver's rate) but handle background checks, bonding, insurance, backup caregivers, and payroll. Independent caregivers are cheaper but you're the employer -- you handle taxes, insurance, and finding a replacement when they call in sick. Get at least 3 quotes.
3. If a facility is needed: visit at least 3 options in person, unannounced if possible (not just during the scheduled tour). Check: staff-to-resident ratio, staff turnover (ask directly -- high turnover is the biggest red flag), how residents look (clean, engaged, or parked in front of TVs?), smell (ammonia smell means understaffing), activity calendar (is it real or decorative?), food quality (eat a meal there), and how they handle behavioral issues for memory care.
4. Understand the costs and who pays. In-home care: $20-35/hour, not covered by Medicare except short-term skilled nursing after hospitalization. Assisted living: $3,000-8,000/month, not covered by Medicare, possibly by Medicaid after spend-down or long-term care insurance. Nursing home: $7,000-15,000/month, covered by Medicaid if eligible. Veterans may qualify for Aid and Attendance benefit ($1,500-2,700/month). Long-term care insurance has specific triggers -- review the policy carefully.
5. Plan the transition. Moving a parent is one of the hardest things a family does. Involve your parent in the decision as much as possible. Visit facilities together. Bring familiar items. Expect a rough adjustment period (2-6 weeks is normal). Plan for increased family visits in the first month. Watch for rapid decline after a move -- it can signal depression or poor facility fit.

**Output:** Ranked list of care options with costs, coverage analysis, facility comparison matrix (if applicable), and transition plan.
**Quality gate:** At least 3 options researched and compared. Costs are specific to the local area. Insurance and benefit eligibility is verified. Parent's preferences are reflected in the ranking.

### Phase 5: HEALTHCARE
**Entry criteria:** Care plan in place or being implemented.
**Actions:**
1. Build the medical team roster: primary care physician, all specialists, pharmacist, dentist, eye doctor, and any therapists (physical, occupational, speech). Include: office phone, patient portal login, and what each one manages. Designate one family member as the medical coordinator who attends appointments and maintains records.
2. Get the legal documents in place -- this is urgent and non-negotiable. Needed: Healthcare Power of Attorney (who makes medical decisions if parent can't), Financial Power of Attorney (who manages money if parent can't), Advance Directive/Living Will (what the parent wants if they can't communicate -- resuscitation, ventilator, feeding tube, comfort care only). If these don't exist and the parent has cognitive decline, the window for getting them done is closing. Consult an elder law attorney.
3. Coordinate medication across all providers. Bring the complete medication list to every appointment. Ask every doctor: "Does this interact with their other medications?" Use one pharmacy for everything so the pharmacist can catch interactions. Schedule an annual medication review with the pharmacist to eliminate unnecessary prescriptions (polypharmacy is a huge risk for seniors).
4. Set up appointment tracking. Create a shared calendar with all medical appointments, who's taking the parent, what questions need to be asked, and post-appointment notes about changes to medications or care. Before every appointment, write down the top 3 concerns -- doctors visits go fast and the important stuff gets forgotten.
5. Prepare for healthcare decisions. Discuss these while the parent can still participate: what quality of life means to them, at what point they would not want aggressive treatment, their feelings about specific interventions (surgery, chemotherapy, dialysis, hospitalization vs. comfort care at home). Document these conversations. When the crisis comes, you'll be making decisions based on what they told you, not what you're guessing.

**Output:** Medical team directory, legal document status and action items, medication coordination system, appointment tracker, and documented care preferences.
**Quality gate:** All legal documents are either completed or have appointments scheduled to complete them. Medication list is reconciled across all providers. Care preferences are documented in the parent's own words.

### Phase 6: SUSTAINMENT
**Entry criteria:** Care plan is operational.
**Actions:**
1. Set up caregiver burnout monitoring. Primary caregivers should honestly check: Am I sleeping? Am I seeing my own doctor? Have I cancelled plans with friends more than 3 times this month? Am I feeling resentful? Am I drinking more? Do I fantasize about the situation "being over"? Any yes answers mean the care plan needs to redistribute load -- not that the caregiver needs to "try harder."
2. Schedule mandatory respite. The primary caregiver gets at least one full day off per week and one full weekend off per month -- non-negotiable. This means other family members step up, respite care is hired, or adult day programs are used. A burnt-out caregiver helps no one and often becomes a patient themselves.
3. Plan for progressive decline. Most aging conditions don't stay stable. Set trigger points for escalating care: if parent falls more than once in a month, if medication errors happen despite the system, if the caregiver can't safely transfer the parent, if nighttime supervision becomes needed, if behavioral symptoms (aggression, wandering) increase. When a trigger is hit, reconvene the family and reassess within one week.
4. Review the care plan monthly for the first 3 months, then quarterly. At each review: Is the care schedule working? Are family members following through on commitments? Has the parent's condition changed? Are costs sustainable? What needs to adjust? Keep notes so you can see trends over time.
5. Build the support network. Connect with: local Area Agency on Aging (free resource navigation), Alzheimer's Association (if dementia is involved), caregiver support groups (online or in-person), and an elder law attorney (for Medicaid planning if long-term care costs are unsustainable). You don't have to figure this out alone, and the people who've been through it are the best resource.

**Output:** Caregiver wellness check template, respite schedule, escalation trigger list with specific thresholds, quarterly review template, and local resource directory.
**Quality gate:** Primary caregiver has scheduled respite. Escalation triggers are specific and measurable (not "when things get worse"). At least 3 local resources are identified and contact information is verified.

## Exit Criteria
Done when: (1) parent's needs are assessed across all domains with urgency ratings, (2) family care responsibilities are assigned with specific commitments, (3) weekly care schedule is complete with gaps filled or acknowledged, (4) care options are researched and compared with costs, (5) legal documents are completed or in progress, (6) caregiver sustainability plan is in place with respite scheduled.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| ASSESSMENT | Parent refuses to be assessed or discuss needs | Adjust -- observe during a normal visit instead of formal assessment. Note what you see (unopened mail piling up, expired food, bruises from falls). If safety is at risk and parent refuses help, consult an elder law attorney about options |
| ASSESSMENT | Family disagrees about how bad things are | Adjust -- have a doctor do a geriatric assessment (objective third party). Request a home safety evaluation from the local Area Agency on Aging |
| FAMILY MAP | One sibling refuses to help at all | Accept -- you cannot force participation. Document the refusal, adjust the plan, and don't waste energy on guilt campaigns. Consider whether their share should come as financial contribution |
| FAMILY MAP | Family conflict is paralyzing all decisions | Escalate -- bring in a geriatric care manager (professional mediator who knows elder care). Insurance sometimes covers this. It's worth the cost to stop the fighting |
| CARE DESIGN | Can't afford needed level of care | Adjust -- investigate Medicaid eligibility, VA benefits, local nonprofit assistance, church/community support, and whether modifying the home is cheaper than a facility |
| NAVIGATION | Parent refuses to move to a facility | Adjust -- maximize in-home support and revisit when the next crisis happens (it will). Don't force a move unless safety is truly at risk. Consider a trial stay or adult day program as a stepping stone |
| HEALTHCARE | No legal documents exist and parent has dementia | Escalate -- consult an elder law attorney immediately. If the parent cannot understand what they're signing, a court-appointed guardian may be necessary. This is expensive and slow -- prevention is everything |
| SUSTAINMENT | Primary caregiver is burning out despite the plan | Escalate -- temporary increase in paid care, adult day program enrollment, short-term facility respite stay (Medicare covers up to 5 days in some cases). Caregiver's health is not optional |

## State Persistence
- Parent's needs assessment (baseline and changes over time)
- Family commitment tracker (who's doing what, are they following through)
- Care schedule and any modifications
- Medication list with change history
- Medical appointment log with outcomes
- Legal document status
- Financial tracking (care costs, insurance claims, benefit applications)
- Caregiver wellness check results
- Escalation trigger log (what was hit, what was done about it)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
