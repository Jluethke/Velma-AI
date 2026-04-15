# Media Creator Brand Deal

**One-line description:** A content creator and a brand each submit their real audience, content expectations, and commercial requirements before the sponsorship — AI aligns on a creator partnership that produces authentic content the audience trusts and measurable results the brand can defend to their CMO.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both creator and brand must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_creator_and_brand` (string, required): Creator/channel name and brand name.
- `shared_platform_and_format` (string, required): Platform (YouTube, TikTok, Instagram, podcast, newsletter, etc.) and content format.

### Creator Submits Privately
- `creator_audience_reality` (object, required): Real audience demographics, engagement rates, what your audience trusts you to recommend — honest data, not inflated metrics.
- `creator_content_approach` (object, required): How you create, your editorial standards, what integrations feel authentic vs. sellout, what you will and will not do for money.
- `creator_rate_card_and_economics` (object, required): Your rates, what is included, exclusivity pricing, what you need to make this deal worth doing.
- `creator_concerns_about_this_brand` (array, required): Brand fit with your audience, approval process, creative control, payment terms, exclusivity demands.
- `creator_what_they_will_not_do` (array, required): Content approaches, brand categories, or deal terms that would damage your relationship with your audience.

### Brand Submits Privately
- `brand_campaign_objectives` (object, required): What you need this partnership to achieve — awareness, conversion, reach, authenticity, content for repurposing.
- `brand_target_audience_fit` (object, required): Who you are trying to reach and why this creator is the right vehicle — what makes their audience your customer.
- `brand_budget_and_expectations` (object, required): Budget, what you expect for it, how you measure success, what KPIs you will report to leadership.
- `brand_creative_requirements` (object, required): Key messages, claims you need made, disclaimers required, content approval process, how much control you need.
- `brand_concerns_about_this_creator` (array, required): Past controversy, audience quality, engagement authenticity, whether their audience is actually your customer.

## Outputs
- `audience_brand_fit_assessment` (object): Whether this creator's audience is actually the brand's customer and what the expected reach is.
- `content_and_creative_framework` (object): What content gets created, how brand requirements and creator authenticity are balanced.
- `commercial_terms` (object): Rate, deliverables, exclusivity, usage rights, payment terms.
- `performance_and_measurement_plan` (object): What metrics are tracked, what constitutes success, how results are reported.
- `approval_and_content_process` (object): How content is reviewed, turnaround times, what requires approval vs. creator discretion.
- `partnership_agreement_framework` (object): Key terms for the influencer/creator agreement.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm creator's audience data and brand's objectives and budget both present.
**Output:** Readiness confirmation.
**Quality Gate:** Creator's audience metrics and brand's objectives and creative requirements both present.

---

### Phase 1: Assess Fit and Authenticity
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Evaluate audience-brand fit — is this creator's audience actually the brand's customer? 2. Assess creative requirements against creator's standards — can this be done authentically? 3. Evaluate expected performance against brand's KPIs. 4. Identify exclusivity and usage rights conflicts.
**Output:** Audience fit assessment, authenticity risk, performance projection, rights conflict.
**Quality Gate:** Audience fit is specific — demographic overlap, engagement rate on comparable sponsorships, audience purchase behavior data.

---

### Phase 2: Structure the Deal
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define deliverables — content pieces, platforms, format, timeline. 2. Build the commercial terms — rate, exclusivity scope, usage rights. 3. Define the creative process — what the creator controls, what requires approval. 4. Establish performance measurement.
**Output:** Deliverables, commercial terms, creative process, measurement framework.
**Quality Gate:** Exclusivity scope is specific — product category, platform, competitive set, duration.

---

### Phase 3: Define Approval and Compliance
**Entry Criteria:** Deal structured.
**Actions:** 1. Define the content approval process — who approves, turnaround time, what constitutes a block. 2. Build the FTC/disclosure compliance framework. 3. Define what happens if content is rejected or the campaign underperforms. 4. Assemble the partnership agreement framework.
**Output:** Approval process, disclosure compliance, performance remedy, agreement framework.
**Quality Gate:** Approval process has specific turnaround commitments and defines what constitutes approval vs. rejection.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — audience fit, deliverables, commercial terms, creative framework, measurement, approval process, agreement framework.
**Quality Gate:** Creator knows what is expected and what creative control they retain. Brand knows what they are buying and how it will be measured.

---

## Exit Criteria
Done when: (1) audience fit is assessed with specific data, (2) deliverables are named, (3) commercial terms are specific, (4) creative process is defined, (5) performance measurement is established.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
