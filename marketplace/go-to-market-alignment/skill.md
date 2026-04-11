# Go-to-Market Alignment

**One-line description:** Marketing and sales each submit their real ICP views and field realities before a launch — Claude surfaces the messaging gaps and ICP misalignments, and produces a joint GTM plan with an SLA both sides commit to.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both marketing and sales leads must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_product_or_launch` (string, required): What is being launched?
- `shared_target_date` (string, required): Launch date.

### Marketing Submits Privately
- `marketing_strategy` (string, required): What's the overall marketing strategy for this launch?
- `marketing_icp_view` (object, required): Who is the ideal customer? How does marketing define them?
- `marketing_messaging` (object, required): Core messaging — value prop, differentiators, proof points.
- `marketing_channel_plan` (array, required): Channels, budget allocation, expected MQL volume and timeline.
- `marketing_concerns_about_sales` (array, required): What do you worry sales won't do with what marketing generates?

### Sales Submits Privately
- `sales_icp_reality` (object, required): Who actually buys? How does this differ from marketing's ICP view?
- `sales_objections_in_field` (array, required): What objections are you hearing? What does the current messaging not address?
- `sales_what_marketing_gets_wrong` (array, required): What does marketing consistently misunderstand about the buyer or the market?
- `sales_what_they_need_to_close` (array, required): What materials, proof points, or positioning do you need to close deals?
- `sales_concerns_about_marketing` (array, required): What are you worried marketing won't deliver or will mess up?

## Outputs
- `icp_alignment` (object): Where marketing's ICP and sales' field reality agree vs. diverge.
- `messaging_reality_check` (object): What current messaging lands vs. what creates objections.
- `channel_effectiveness_assessment` (object): Whether marketing's channel plan is likely to reach the real ICP.
- `joint_gtm_plan` (object): Unified plan covering messaging, channels, MQL/SQL handoff, and launch timeline.
- `sla_draft` (object): Marketing-to-sales SLA covering MQL definition, SLA timing, and feedback loops.
- `launch_readiness_checklist` (array): What must be true before launch day.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm ICP views and messaging fields present from both sides.
**Output:** Readiness confirmation.
**Quality Gate:** ICP definition present from both sides.

---

### Phase 1: Map the ICP Gap
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare marketing's ICP definition to sales' field reality. Identify specific differences — title, company size, use case, buying process. 2. Assess which ICP is more accurate and why. 3. Identify whether the current channel plan reaches the real ICP.
**Output:** ICP gap with specific differences, channel reach assessment.
**Quality Gate:** ICP gap is specific — "Marketing targets VP of Marketing; sales closes with Head of Demand Gen" is specific.

---

### Phase 2: Pressure-Test the Messaging
**Entry Criteria:** ICP gap mapped.
**Actions:** 1. Take the current messaging and run it against the objections sales is hearing in the field. 2. Identify which value props land and which create friction. 3. Identify the proof points and materials sales needs that don't exist. 4. Draft messaging adjustments based on field reality.
**Output:** Messaging assessment, proof point gaps, messaging adjustments.
**Quality Gate:** Every sales objection is addressed by either the messaging or a flag that it cannot be addressed with messaging alone.

---

### Phase 3: Build the Joint GTM Plan
**Entry Criteria:** Messaging assessed.
**Actions:** 1. Draft the unified ICP definition both sides agree on. 2. Build the channel plan against the real ICP. 3. Define the MQL/SQL handoff: what qualifies as an MQL, what sales does within what timeframe, what feedback goes back to marketing. 4. Draft the launch readiness checklist.
**Output:** Joint GTM plan with unified ICP, channel plan, SLA, launch checklist.
**Quality Gate:** SLA has specific definitions and timeframes, not aspirational language.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plan built.
**Actions:** 1. Present ICP alignment and gap. 2. Present messaging assessment. 3. Deliver joint GTM plan. 4. Deliver SLA draft. 5. Deliver launch readiness checklist.
**Output:** Full synthesis — ICP alignment, messaging reality check, joint GTM plan, SLA, launch checklist.
**Quality Gate:** Both leads can defend the GTM plan in a launch review.

---

## Exit Criteria
Done when: (1) ICP gap mapped specifically, (2) every sales objection assessed, (3) proof point gaps named, (4) SLA has specific definitions, (5) launch checklist covers all critical items.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
