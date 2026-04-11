# PR Agency Client Engagement

**One-line description:** A PR agency and a client each submit their real communications goals, approval tolerance, and news agenda before the engagement — Claude aligns on a PR strategy and working relationship that generates earned media without the approval bottlenecks that kill every news cycle.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both agency and client must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_client_and_agency` (string, required): Client organization and PR agency names.
- `shared_pr_objective` (string, required): What the PR program is meant to achieve — awareness, reputation, crisis, product launch, executive profile.

### Agency Submits Privately
- `agency_pr_strategy` (object, required): How you see this client's story, which media targets make sense, what angles have legs, what narratives to build.
- `agency_scope_and_fees` (object, required): Retainer structure, what is included, what is billed as additional, reporting cadence.
- `agency_media_relationships_and_access` (object, required): Relevant media contacts you have, coverage you can realistically target, what is aspirational.
- `agency_concerns_about_this_client` (array, required): Approval speed, message discipline, willingness to engage media, any reputational issues that complicate coverage.
- `agency_what_kills_pr_programs` (array, required): Client behaviors that undermine earned media — approvals that take a week, messages that shift, executives who won't do interviews.

### Client Submits Privately
- `client_communications_goals` (object, required): What coverage you want, in which outlets, for what audience, to achieve what business result.
- `client_story_and_proof_points` (object, required): What you can actually talk about — product, customers, data, executive perspective, what makes you genuinely newsworthy.
- `client_sensitive_topics_and_restrictions` (object, required): What you cannot discuss — competitive, legal, regulatory, investor, or personnel-related restrictions.
- `client_approval_and_spokesperson_reality` (object, required): Who approves messaging, how long it actually takes, who can speak to media and on what topics.
- `client_past_pr_experience` (array, required): What worked, what didn't, what the last agency got wrong, what you're afraid will happen again.

## Outputs
- `pr_strategy_alignment` (object): Agreed narrative, target media, angles, and what success looks like.
- `story_and_opportunity_assessment` (object): What is genuinely newsworthy, realistic coverage targets, what requires more development.
- `scope_and_fee_structure` (object): Retainer scope, what is included, what triggers additional billing.
- `approval_and_spokesperson_plan` (object): Who approves what, turnaround commitments, spokesperson training needs.
- `sensitive_topic_and_crisis_protocol` (object): What cannot be discussed, who handles media on sensitive topics, crisis response process.
- `engagement_framework` (object): Key terms for the PR agency agreement.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm agency's strategy and client's goals, story, and approval reality both present.
**Output:** Readiness confirmation.
**Quality Gate:** Agency's PR strategy and client's communications goals and approval process both present.

---

### Phase 1: Assess Story and Fit
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Evaluate what is genuinely newsworthy against target media expectations. 2. Assess approval process against media speed requirements — can this client move fast enough? 3. Identify sensitive topic risks that limit what can be pitched. 4. Evaluate agency's media access against client's target coverage.
**Output:** Newsworthiness assessment, approval speed risk, sensitive topic map, media access alignment.
**Quality Gate:** Every target publication is named with a specific angle and what makes that angle viable.

---

### Phase 2: Build the PR Program
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the narrative architecture — master message, supporting proof points, angles for different media segments. 2. Build the media target list — specific outlets, specific reporters, specific pitches. 3. Define the spokesperson and approval process with specific commitments. 4. Establish the scope and retainer structure.
**Output:** Narrative architecture, media target plan, spokesperson plan, scope and fees.
**Quality Gate:** Media targets are specific outlets and reporters with named pitches — not category descriptions.

---

### Phase 3: Define Operations and Crisis Protocol
**Entry Criteria:** Program built.
**Actions:** 1. Define the day-to-day operating cadence — weekly calls, monthly reports, coverage tracking. 2. Build the crisis protocol — who decides, who speaks, what is the process. 3. Define what triggers program review — insufficient coverage, story changes, crisis. 4. Assemble the engagement framework.
**Output:** Operating cadence, crisis protocol, program review triggers, engagement framework.
**Quality Gate:** Crisis protocol names specific decision-makers and their response time commitments.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — strategy, story assessment, scope, approval plan, sensitive topic protocol, operating plan.
**Quality Gate:** Client knows what coverage is realistic and what is required of them. Agency knows the story, the restrictions, and the approval reality.

---

## Exit Criteria
Done when: (1) narrative is aligned, (2) media targets are specific, (3) scope and fees are defined, (4) approval process is established with turnaround commitments, (5) crisis protocol is in place.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
