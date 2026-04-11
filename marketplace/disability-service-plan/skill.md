# Disability Service Plan

**One-line description:** The case manager and the individual or family each submit their real goals, available services, and priorities — Claude produces a service plan that reflects what the person actually needs to live, work, and participate in their community, not just what the funding stream will pay for.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both case manager and individual/family must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_individual_name_or_id` (string, required): Individual identifier.
- `shared_service_type_and_program` (string, required): Service type and funding program (e.g., supported employment, residential, day services).

### Case Manager Submits Privately
- `case_manager_assessment` (object, required): Current functional abilities, support needs, service history, what is working and what is not.
- `case_manager_available_services_and_funding` (object, required): What services and funding are available — what the program covers, provider capacity, waitlists.
- `case_manager_recommendations` (array, required): What services you believe would best support this individual's goals and needs.
- `case_manager_concerns` (array, required): What worries you — family expectations that exceed available services, safety risks, provider fit, sustainability of current plan?
- `case_manager_regulatory_requirements` (array, required): What the plan must include or document to meet funding and compliance requirements.

### Individual / Family Submits Privately
- `individual_life_goals` (object, required): What does a good life look like — where to live, what to do, who to spend time with, what to contribute?
- `individual_current_priorities` (array, required): What matters most right now — employment, independence, relationships, health, community participation?
- `family_concerns_and_priorities` (array, required): What the family is most worried about and what they need the plan to address.
- `individual_what_is_not_working` (array, required): Current services or supports that are not meeting needs — what you would change if you could.
- `individual_what_they_will_not_accept` (array, required): Service types, providers, or living arrangements that are not acceptable.

## Outputs
- `person_centered_goals` (array): Goals that reflect the individual's actual life priorities — not just service utilization objectives.
- `service_plan` (object): Specific services, providers, frequency, and funding — matched to goals.
- `gap_analysis` (object): Where the individual's goals exceed available services and options for addressing the gap.
- `natural_supports_plan` (object): Family, friends, and community supports that complement paid services.
- `risk_and_safety_plan` (object): How identified risks are managed — proactive plans, not just restrictions.
- `plan_review_schedule` (object): When the plan is reviewed, what triggers an early review, how progress is measured.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm individual's goals and case manager's assessment present.
**Output:** Readiness confirmation.
**Quality Gate:** Individual's life goals and case manager's service assessment both present.

---

### Phase 1: Align Goals and Available Services
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Translate the individual's life goals into service needs. 2. Map available services against those needs — where is there coverage and where are the gaps? 3. Identify family concerns that are not reflected in the individual's stated priorities — how are they weighted? 4. Assess case manager's concerns — are they service-system limitations or genuine risk assessments?
**Output:** Goal-to-service mapping, coverage and gap analysis, family-individual priority alignment, concern assessment.
**Quality Gate:** Every life goal has an associated service or support — or an honest acknowledgment that it is not addressed in the plan.

---

### Phase 2: Build the Service Plan
**Entry Criteria:** Goals aligned.
**Actions:** 1. Define each service — type, provider, frequency, duration, funding source. 2. Build the natural supports plan — what family and community provide. 3. Address the service gaps — waitlist plan, interim alternatives, advocacy actions. 4. Build the risk and safety plan — specific to identified risks, not generic.
**Output:** Service plan, natural supports, gap actions, risk and safety plan.
**Quality Gate:** Every service has a named provider and a specific frequency. Gap actions have a named responsible party.

---

### Phase 3: Establish Monitoring and Review
**Entry Criteria:** Plan built.
**Actions:** 1. Define progress measures for each goal — what does progress look like and how is it tracked? 2. Set the review schedule — annual, semi-annual, and early review triggers. 3. Define the individual's and family's role in monitoring — how they flag problems. 4. Define what happens if a service is not delivered as planned.
**Output:** Progress measures, review schedule, monitoring roles, service failure response.
**Quality Gate:** Progress measures are observable behaviors or outcomes, not "individual is happy with services."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Monitoring set.
**Actions:** 1. Present person-centered goals. 2. Deliver service plan. 3. Deliver gap analysis. 4. Deliver natural supports plan. 5. Present risk and safety plan and review schedule.
**Output:** Full synthesis — goals, services, gaps, natural supports, safety, review.
**Quality Gate:** Individual and family have a plan that reflects their priorities. Case manager has a plan that meets compliance requirements.

---

## Exit Criteria
Done when: (1) every life goal has an associated service or acknowledged gap, (2) every service has a named provider and frequency, (3) gaps have action plans, (4) risk plan is specific, (5) progress measures are observable.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
