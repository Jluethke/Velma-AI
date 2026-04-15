# Executive Coaching Engagement

**One-line description:** An executive coach and a client each submit their real development goals, blind spots, and engagement expectations before the coaching begins — AI aligns on a coaching structure that develops the executive in the ways that actually matter, not just the ones that are comfortable to discuss.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both coach and executive must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_coach_and_executive` (string, required): Coach name and executive name/title.
- `shared_engagement_context` (string, required): Company-sponsored or self-sponsored, what triggered this engagement, any stakeholder involvement.

### Coach Submits Privately
- `coach_initial_assessment` (object, required): Your read on this executive — strengths, development edges, leadership style, what the real work is likely to be.
- `coach_methodology` (object, required): How you coach — frameworks you use, what the process looks like, what you require from clients.
- `coach_engagement_structure` (object, required): Session frequency, length, between-session work, stakeholder interviews, 360 assessment.
- `coach_fees_and_logistics` (object, required): Engagement fee, structure, what is included, what is not.
- `coach_concerns_about_this_client` (array, required): Coachability, defensiveness, organizational dynamics that affect the work, what could derail this engagement.

### Executive Submits Privately
- `executive_real_development_goals` (object, required): What you actually want to develop — not the HR-approved version, but what you know you need to change and why it matters to you.
- `executive_blind_spots_and_fears` (object, required): What you suspect you are missing, what feedback you keep getting that you haven't fully addressed, what you are afraid the coaching will surface.
- `executive_organizational_context` (object, required): What is happening in your organization that makes development urgent — performance pressure, promotion, transition, team problems.
- `executive_past_coaching_experience` (object, required): Prior coaching — what worked, what was a waste, what the coach got wrong.
- `executive_constraints_and_concerns` (array, required): Time, confidentiality, who sees the outputs, how this affects your relationship with HR or your manager.

## Outputs
- `development_focus_alignment` (object): What the coaching will actually work on — the real development agenda.
- `coaching_process_design` (object): Session structure, frequency, assessment tools, stakeholder involvement.
- `goal_and_milestone_framework` (object): What progress looks like at 30, 60, 90 days and at engagement completion.
- `engagement_terms` (object): Fee, duration, session structure, what is included, confidentiality provisions.
- `accountability_and_measurement_plan` (object): How progress is tracked, what feedback is gathered, who sees what.
- `engagement_agreement_framework` (object): Key terms for the coaching agreement.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm coach's assessment and executive's real development goals both present.
**Output:** Readiness confirmation.
**Quality Gate:** Both parties' development assessment and engagement expectations present.

---

### Phase 1: Align on Development Agenda
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare coach's assessment with executive's stated goals — where is the real work? 2. Assess fit between coach's methodology and what this executive needs. 3. Evaluate organizational context — what will enable or constrain the coaching? 4. Identify blind spots the executive has not fully acknowledged.
**Output:** Development agenda, methodology fit, organizational context assessment, blind spot identification.
**Quality Gate:** Development goals are specific behavioral changes — not "become a better leader" but named behaviors and named situations.

---

### Phase 2: Design the Engagement
**Entry Criteria:** Agenda aligned.
**Actions:** 1. Define the coaching process — session frequency, assessment tools, stakeholder interviews. 2. Build the milestone framework — what progress looks like at each stage. 3. Define confidentiality and reporting structure — what goes to the company, what stays private. 4. Establish the engagement terms.
**Output:** Coaching process, milestones, confidentiality framework, engagement terms.
**Quality Gate:** Every milestone is an observable behavioral change — not a feeling or general improvement.

---

### Phase 3: Define Accountability and Governance
**Entry Criteria:** Engagement designed.
**Actions:** 1. Define how progress is measured — what feedback is gathered and how. 2. Build the sponsor/company interface — what is reported, what is not. 3. Define what triggers mid-engagement course correction. 4. Assemble the engagement agreement framework.
**Output:** Progress measurement plan, sponsor interface, course correction triggers, agreement framework.
**Quality Gate:** Accountability structure names who sees what — not "appropriate parties" but named roles.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — development agenda, coaching process, milestones, confidentiality structure, measurement plan, engagement terms.
**Quality Gate:** Executive knows what the work is and what is required of them. Coach knows the real development agenda and organizational context.

---

## Exit Criteria
Done when: (1) development goals are specific and behavioral, (2) coaching process is defined, (3) milestones are observable, (4) confidentiality and reporting are clear, (5) engagement terms are complete.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
