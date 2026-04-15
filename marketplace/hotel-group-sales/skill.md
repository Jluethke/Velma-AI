# Hotel Group Sales Contract

**One-line description:** The hotel sales manager and the group client each submit their real event needs, budget constraints, and deal expectations — AI designs the contract terms that fill the block, protect the hotel's revenue, and give the client a workable deal for an event that will actually run as planned.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both hotel sales and client must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_hotel_and_event` (string, required): Hotel name and event name/type.
- `shared_event_dates_and_size` (string, required): Event dates and estimated attendance.

### Hotel Sales Manager Submits Privately
- `hotel_minimum_revenue_requirements` (object, required): Room block minimum, F&B minimum, meeting room fees — what the hotel needs to make the dates valuable.
- `hotel_concession_budget` (object, required): What concessions are available — comp rooms, F&B discounts, AV credits, room rate flexibility — and at what commitment thresholds.
- `hotel_attrition_and_cancellation_requirements` (object, required): Minimum attrition protection, cancellation penalties — what the hotel must have to protect against walking the block.
- `hotel_concerns_about_this_group` (array, required): What worries you — financial reliability, will they fill the block, damage history, demanding program?
- `hotel_what_they_need_from_the_client` (object, required): Deposit schedule, rooming list timing, F&B minimums, signed contract by when.

### Group Client Submits Privately
- `client_event_requirements` (object, required): Room block size, meeting space needs, F&B requirements, AV, setup — what the event needs to succeed.
- `client_budget` (object, required): Total event budget, room rate ceiling, F&B budget, what you can spend.
- `client_concerns_about_the_contract` (array, required): What worries you — attrition penalties, cancellation exposure, room rate increases, hidden fees?
- `client_flexibility_in_the_program` (object, required): Where can you flex — room block size, dates, F&B minimums — without breaking the event?
- `client_what_would_make_them_sign` (string, required): What combination of rate, concessions, and contract terms would get you to commit?

## Outputs
- `revenue_alignment_assessment` (object): Whether the client's budget meets the hotel's minimum revenue requirements.
- `room_block_and_rate_structure` (object): Room block size, rate, and rate protection terms both parties can accept.
- `concession_package` (object): Specific concessions tied to specific commitment thresholds.
- `attrition_and_cancellation_terms` (object): Realistic attrition protection and cancellation schedule that protects the hotel without over-exposing the client.
- `contract_framework` (object): Key terms ready for the hotel's contract — room block, rate, F&B minimum, attrition, cancellation, deposit.
- `signing_path` (object): What the client needs to see to sign and what the hotel must commit to in return.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm hotel's minimums and client's budget present.
**Output:** Readiness confirmation.
**Quality Gate:** Hotel's minimum revenue requirements and client's budget both present.

---

### Phase 1: Assess Revenue and Budget Alignment
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Model the event at the client's stated parameters — does it meet the hotel's minimum revenue requirements? 2. Identify the gap — which minimums (rooms, F&B, meeting fees) are at risk. 3. Assess the hotel's concession budget against what it would take for the client to commit. 4. Evaluate the client's flexibility — where can the block or F&B be adjusted to close the gap?
**Output:** Revenue model, gap analysis, concession-to-close assessment, flexibility options.
**Quality Gate:** Revenue gap is specific — "at client's proposed 80 rooms and $50 room rate, hotel falls $12K short of minimum. Gap is in F&B minimum."

---

### Phase 2: Design the Deal Structure
**Entry Criteria:** Alignment assessed.
**Actions:** 1. Design the room block and rate structure — block size, room rates by type, rate protection terms. 2. Build the concession package — what is offered at what commitment threshold. 3. Design the attrition and cancellation terms — realistic protection for the hotel without unacceptable exposure for the client. 4. Define the deposit schedule and signing deadline.
**Output:** Room block structure, concession package, attrition/cancellation terms, deposit schedule.
**Quality Gate:** Attrition is a specific percentage with a specific slippage schedule. Cancellation penalties are specific dollar amounts by date window.

---

### Phase 3: Build the Contract Framework
**Entry Criteria:** Deal designed.
**Actions:** 1. Assemble the contract framework — all material terms. 2. Define the rooming list and F&B guarantee timeline. 3. Build the signing path — what the hotel needs to commit to before the client will sign. 4. Define what happens if the event size changes significantly before the event.
**Output:** Contract framework, operational timeline, signing path, change scenario protocols.
**Quality Gate:** Contract framework is specific enough to generate the hotel's standard group contract from.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Contract built.
**Actions:** 1. Present revenue alignment assessment. 2. Deliver room block and rate structure. 3. Deliver concession package. 4. Deliver attrition and cancellation terms. 5. Present contract framework and signing path.
**Output:** Full synthesis — revenue alignment, room structure, concessions, contract terms, signing path.
**Quality Gate:** Both parties know the deal. Client can take the terms to approval. Hotel can generate the contract.

---

## Exit Criteria
Done when: (1) revenue gap is identified and closed, (2) room block and rate are specific, (3) concession package is tied to commitment thresholds, (4) attrition/cancellation are specific, (5) signing path is defined.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
