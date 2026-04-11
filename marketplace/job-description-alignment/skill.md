# Job Description Alignment

**One-line description:** Hiring manager and recruiter each submit their real requirements and market constraints before writing a JD — Claude calibrates the role to what actually exists in the market and produces a JD that fills.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both hiring manager and recruiter must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_role_title` (string, required): Job title.
- `shared_team` (string, required): Team and reporting structure.

### Hiring Manager Submits Privately
- `manager_what_they_actually_need` (string, required): What problem is this hire solving? What does success look like at 6 months?
- `manager_must_haves` (array, required): Non-negotiable skills, experience, or attributes.
- `manager_nice_to_haves` (array, required): Preferred but not required.
- `manager_culture_requirements` (string, required): What kind of person thrives in this team?
- `manager_what_failed_in_past_hires` (array, required): What has gone wrong with previous hires in this or similar roles?

### Recruiter Submits Privately
- `hr_market_reality` (object, required): What does the talent market actually look like for this role? What are candidates expecting in terms of comp, title, and flexibility?
- `hr_compensation_constraints` (object, required): What's the comp range? Is it competitive for what the manager is asking for?
- `hr_sourcing_approach` (object, required): Where will candidates come from? What's realistic?
- `hr_concerns_about_requirements` (array, required): What about the manager's requirements will significantly narrow or compromise the candidate pool?
- `hr_what_will_widen_or_narrow_pool` (object, required): What changes would meaningfully expand or shrink the candidate pool?

## Outputs
- `requirements_reality_check` (object): Which requirements are market-realistic and which will significantly narrow the pool.
- `compensation_alignment` (object): Whether the comp range matches the requirements being asked for.
- `job_description_draft` (string): Full JD ready to post — title, summary, responsibilities, requirements, comp range, culture note.
- `sourcing_strategy` (object): Where to source, what to look for, outreach approach.
- `screening_criteria` (array): The specific criteria to use in initial screening.
- `hiring_timeline` (object): Realistic timeline from posting to offer based on market and capacity.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm must-haves and market reality present.
**Output:** Readiness confirmation.
**Quality Gate:** Both requirement lists and market reality present.

---

### Phase 1: Reality-Check the Requirements
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Check each must-have against market reality — does this person exist at this comp range? 2. Identify requirements that will narrow the pool beyond what the business need justifies. 3. Flag compensation misalignment — are the requirements and comp range compatible? 4. Identify past hire failures and what screening criteria would catch those patterns.
**Output:** Requirement reality check, comp alignment, past failure prevention criteria.
**Quality Gate:** Every must-have has a market reality assessment.

---

### Phase 2: Calibrate the Role
**Entry Criteria:** Requirements checked.
**Actions:** 1. Propose adjustments to requirements that maintain the business need while improving pool quality. 2. Recommend comp range adjustment if needed. 3. Identify which nice-to-haves should be elevated to must-haves and vice versa.
**Output:** Calibrated requirement set, comp recommendation.
**Quality Gate:** Calibrated requirements are achievable in the market at the stated comp.

---

### Phase 3: Draft the JD and Sourcing Plan
**Entry Criteria:** Role calibrated.
**Actions:** 1. Write the full JD: title, one-paragraph summary, responsibilities (5-7), requirements (separated into required and preferred), comp range, culture note. 2. Draft sourcing strategy with specific channels. 3. Draft screening criteria. 4. Build realistic hiring timeline.
**Output:** Full JD draft, sourcing strategy, screening criteria, hiring timeline.
**Quality Gate:** JD is specific enough to attract the right candidates and filter the wrong ones. Comp range is included.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** JD drafted.
**Actions:** 1. Present requirements reality check. 2. Present comp alignment. 3. Deliver JD draft. 4. Deliver sourcing strategy. 5. Deliver screening criteria and timeline.
**Output:** Full synthesis — reality check, comp alignment, JD, sourcing, screening, timeline.
**Quality Gate:** Manager and recruiter can align on this JD before it's posted.

---

## Exit Criteria
Done when: (1) every must-have has market reality assessment, (2) comp alignment confirmed or gap named, (3) full JD draft ready to post, (4) sourcing strategy with specific channels, (5) screening criteria named.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
