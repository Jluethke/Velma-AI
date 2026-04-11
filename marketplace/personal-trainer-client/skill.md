# Personal Trainer Client Engagement

**One-line description:** A personal trainer and a client each submit their real fitness goals, physical history, and expectations before the engagement begins — Claude aligns on a training program that achieves the client's goals without the misaligned expectations that end most trainer relationships by month three.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both trainer and client must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_trainer_and_client` (string, required): Trainer name and client name.
- `shared_training_context` (string, required): In-person, online, gym, home, or outdoor — and frequency.

### Trainer Submits Privately
- `trainer_initial_assessment` (object, required): Client's current fitness level, movement quality, injury history — what you observed and what it means for programming.
- `trainer_program_approach` (object, required): Training methodology, how you program for this type of client, what you believe produces results.
- `trainer_fees_and_policies` (object, required): Session rate, package pricing, cancellation policy, rescheduling, no-show fees.
- `trainer_concerns_about_this_client` (array, required): Injury risk, unrealistic expectations, compliance history, commitment level, lifestyle factors that undermine training.
- `trainer_what_they_will_not_do` (array, required): Training approaches you will not prescribe, goals you will not pursue (extreme weight loss, unsafe performance goals), clients you will not continue working with.

### Client Submits Privately
- `client_real_goals` (object, required): What you actually want — not the polished version, but the real target: weight, performance, appearance, pain reduction, sport.
- `client_physical_history` (object, required): Injuries, surgeries, chronic conditions, medications, prior training experience — everything that affects how you move and recover.
- `client_lifestyle_and_compliance` (object, required): Sleep, nutrition, stress, work schedule — the real context that will determine whether the program works.
- `client_concerns_about_training` (array, required): What you are afraid of — injury, not seeing results, the program being too hard or not hard enough.
- `client_what_they_will_not_do` (array, required): Exercises, dietary changes, or commitments you will not make.

## Outputs
- `training_program_design` (object): Programming approach, weekly structure, exercise selection, and why it fits this client.
- `goal_timeline_and_milestones` (object): Realistic outcomes at 4, 8, 12, and 24 weeks given current fitness and compliance expectations.
- `safety_and_injury_considerations` (object): Movement limitations, exercises to avoid, monitoring plan.
- `engagement_terms` (object): Session rate, package, cancellation policy, what triggers re-evaluation.
- `nutrition_and_lifestyle_alignment` (object): What the client must do outside sessions to achieve the stated goals.
- `progress_measurement_plan` (object): How progress is tracked, what metrics, review frequency.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm trainer's assessment and client's goals and physical history both present.
**Output:** Readiness confirmation.
**Quality Gate:** Trainer's assessment and client's goals, history, and lifestyle context all present.

---

### Phase 1: Assess Goals and Physical Reality
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare client's stated goals against their physical history — what is achievable given their history and lifestyle? 2. Assess trainer's approach against client's goals and limitations. 3. Identify undisclosed physical history that affects programming. 4. Assess compliance risk given client's lifestyle.
**Output:** Goal feasibility assessment, programming fit, physical risk factors, compliance risk.
**Quality Gate:** Every goal has a realistic timeframe based on current fitness and compliance expectations — not aspirational.

---

### Phase 2: Design the Program
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the training program structure — frequency, modality, progression. 2. Build the milestone plan — realistic outcomes at specific timeframes. 3. Define safety parameters — movements to avoid, monitoring triggers. 4. Establish the engagement terms — fees, packages, policies.
**Output:** Program design, milestone plan, safety parameters, engagement terms.
**Quality Gate:** Milestones are specific and measurable — not "improved fitness" but named metrics at named timeframes.

---

### Phase 3: Align on Lifestyle and Progress Tracking
**Entry Criteria:** Program designed.
**Actions:** 1. Define what the client must do outside sessions — minimum nutrition, sleep, activity. 2. Build the progress tracking plan — measurements, assessments, check-in frequency. 3. Define what triggers program modification — stall, injury, life change. 4. Establish the re-evaluation process and when.
**Output:** Lifestyle commitments, progress tracking plan, modification triggers, re-evaluation schedule.
**Quality Gate:** Lifestyle commitments are specific and agreed — not "eat better" but named minimums the client commits to.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plan complete.
**Output:** Full synthesis — program design, goal timeline, safety considerations, engagement terms, lifestyle plan, progress tracking.
**Quality Gate:** Client knows what to expect and what is required of them. Trainer knows the client's real history and goals.

---

## Exit Criteria
Done when: (1) program design is specific, (2) milestones are measurable and realistic, (3) safety parameters are defined, (4) engagement terms are clear, (5) lifestyle commitments are specific and agreed.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
