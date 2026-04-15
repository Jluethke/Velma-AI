# Freight Broker-Carrier Agreement

**One-line description:** The freight broker and the carrier each submit their real lane requirements, rate expectations, and service standards — AI aligns on the carrier agreement that moves freight reliably without the carrier taking unprofitable loads or the broker losing a shipper over a service failure.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both broker and carrier must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_broker_and_carrier` (string, required): Broker and carrier names.
- `shared_lanes_or_freight_type` (string, required): Lanes or freight type being discussed.

### Freight Broker Submits Privately
- `broker_volume_and_lane_commitments` (object, required): What volume you can realistically commit — loads per week by lane, seasonality, consistency.
- `broker_rate_targets` (object, required): Target all-in rates by lane, what market benchmarks are, what your margin requirements mean for carrier rates.
- `broker_shipper_requirements` (object, required): What your shippers require — transit times, tracking, communication, equipment, damage claims performance.
- `broker_concerns_about_the_carrier` (array, required): What worries you — reliability, capacity availability, communication, equipment quality, compliance?
- `broker_what_they_need_to_commit_volume` (array, required): What the carrier must demonstrate before you give them your best lanes.

### Carrier Submits Privately
- `carrier_cost_structure_and_rate_floor` (object, required): Your cost per mile on these lanes and the minimum rate that makes each lane viable.
- `carrier_capacity_and_equipment` (object, required): Available trucks, equipment type, home base, where you need to reposition and where deadhead is a problem.
- `carrier_service_capabilities` (object, required): Transit time reliability, tracking technology, communication standards, what you can and cannot deliver.
- `carrier_concerns_about_the_broker` (array, required): What worries you — rate reliability, load quality, detention and accessorial payment, relationship consistency?
- `carrier_what_they_need_from_the_broker` (array, required): Consistent volume, fair rates, fast load acceptance, detention pay, quick payment — what makes this relationship worth your best capacity.

## Outputs
- `rate_viability_assessment` (object): Whether broker's rate target covers carrier's costs with an acceptable margin.
- `volume_and_lane_commitment` (object): What lanes and volumes are committed vs. spot, with rate tiers by volume level.
- `service_standards_agreement` (object): Specific performance standards — transit times, tracking, communication, claims.
- `carrier_agreement_terms` (object): Rate schedule, accessorials, payment terms, termination.
- `relationship_development_plan` (object): How capacity and volume grow — what triggers preferred carrier status.
- `dispute_resolution_process` (object): How claims, detention disputes, and rate disagreements are handled.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm broker's rates and carrier's cost floor present.
**Output:** Readiness confirmation.
**Quality Gate:** Broker's lane rates and carrier's cost structure both present.

---

### Phase 1: Assess Rate and Volume Viability
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Check broker's target rates against carrier's cost floor by lane — is there margin? 2. Assess the broker's volume commitment against the carrier's capacity — can they fill the equipment? 3. Identify lanes where the rate does not cover costs and determine if repositioning value or volume commitment bridges it. 4. Check shipper requirements against the carrier's service capabilities.
**Output:** Rate viability by lane, volume coverage, repositioning value, service capability fit.
**Quality Gate:** Rate viability is lane-specific — "Lane A at $X/mile covers carrier cost with $Y/mile margin; Lane B does not cover cost without B repositioning credit."

---

### Phase 2: Structure the Agreement
**Entry Criteria:** Viability assessed.
**Actions:** 1. Build the rate schedule — committed lanes with contracted rates, spot load access rates, fuel surcharge methodology. 2. Define the accessorial schedule — detention, layover, TONU, lumper — specific amounts. 3. Define volume tiers — what the carrier gets at different volume levels. 4. Define service standards with measurement and consequences.
**Output:** Rate schedule, accessorial schedule, volume tiers, service standards.
**Quality Gate:** Every accessorial has a specific dollar amount. Service standards have specific thresholds — "on-time performance below 90% triggers rate review."

---

### Phase 3: Define Terms and Relationship
**Entry Criteria:** Agreement structured.
**Actions:** 1. Set payment terms — net days, QuickPay rate, factoring acceptance. 2. Define the claims process — what the carrier must provide, timeline, dispute resolution. 3. Build the preferred carrier pathway — what metrics earn priority access to best loads. 4. Define termination — notice period, what terminates immediately.
**Output:** Payment terms, claims process, preferred carrier pathway, termination terms.
**Quality Gate:** Payment terms are specific — net X days from POD. Claims timeline has specific milestones.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Terms defined.
**Actions:** 1. Present rate viability assessment. 2. Deliver volume and lane commitment. 3. Deliver service standards agreement. 4. Deliver carrier agreement terms. 5. Present relationship development and dispute resolution plan.
**Output:** Full synthesis — rate viability, commitments, service standards, agreement, relationship plan.
**Quality Gate:** Carrier knows what rates they will move freight for and what the broker commits to in return.

---

## Exit Criteria
Done when: (1) rate viability confirmed by lane, (2) volume commitments are specific, (3) every accessorial is a specific dollar amount, (4) service standards are measurable, (5) payment terms are specific.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
