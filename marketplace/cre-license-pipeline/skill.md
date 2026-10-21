# CRE License Pipeline *(orchestrator flow)*

Orchestrates the end-to-end Wayfinder Trust CRE licensing motion from cold universe to signed contract. Wraps three child flows  --  `cre-prospect-intelligence`, `ip-licensing-prospect`, and `cre-ip-license-launch`  --  into one pipeline with shared state, ordered sequencing, and a single set of inputs and outputs. Runs on two clocks: the **intelligence layer** refreshes weekly as a standing job; the **deal layer** advances per target as prospects surface into urgent status.

**Why this exists:** The three child flows are each complete on their own, but without an orchestrator they are islands  --  each run produces an artifact, and nothing guarantees that the artifacts compose. The pipeline flow is the contract: it says which artifact feeds which, how state is shared, when to gate a handoff, and what the pipeline owner sees as a single dashboard.

**Core principle:** The orchestrator does not re-implement any phase of any child flow. It sequences them, enforces handoff invariants, and consolidates state into one view. If a phase needs to change, change it in the child flow  --  never in the orchestrator.

## Execution Pattern: Chained Flow Pipeline

```
PHASE 1: INTELLIGENCE SWEEP   --> delegates to cre-prospect-intelligence
       (weekly cadence)
            │
            ▼  produces prospect_scorecards + next_action_queue
            │
PHASE 2: HANDOFF GATE         --> promotes targets to the deal layer
            │
            ▼  filters: tier ≥ T2, urgency ≥ B, prereqs met
            │
PHASE 3: DECISION-MAKER RESOLUTION --> delegates to ip-licensing-prospect
       (per promoted target)
            │
            ▼  produces decision_map + entry_strategy
            │
PHASE 4: ARTIFACT PRODUCTION  --> delegates to cre-ip-license-launch
       (per advanced target)
            │
            ▼  produces carrier MoUs + license + term sheet
            │
PHASE 5: PIPELINE CONSOLIDATION --> dashboard, forecast, health check
```

Phase 1 runs on a fixed cadence (weekly by default). Phases 3–4 run per target whenever Phase 2 advances one. Phase 5 runs daily as a read-only aggregation.

## Inputs

Superset of all three child flows, plus orchestration parameters:

- `licensor`: string  --  "The Wayfinder Trust"
- `inventor`: string  --  "Jonathan Luethke"
- `vertical`: string  --  "Commercial Real Estate (CRE)"
- `patent_families`: list[object]  --  `[{family: "A", name: "governance"}, {family: "B", name: "governance engine"}]`
- `business_plan_ref`: string  --  path to `Documents/Business Investor/Patent_Families_A_B_Business_Plan_Pricing.md`
- `pricing_structure_ref`: string  --  same business plan; consumed by Phases 1 and 4 for ACV + term-sheet math

**Intelligence-layer inputs (Phase 1):**
- `target_segments`: list[string]  --  CRE segments to hunt
- `geographic_filter`: list[string]  --  markets in scope
- `min_governed_aum`: number  --  prospect floor
- `rag_connection`: object  --  `{host, db_path, data_feeds}`
- `scoring_weights`: object  --  overridable rubric weights
- `max_targets_deep_profile`: number  --  top-N cutoff per sweep
- `intelligence_cadence`: string  --  `"weekly" | "biweekly" | "monthly"` (default `weekly`)

**Handoff-gate inputs (Phase 2):**
- `promotion_criteria`: object  --  `{min_tier: "T2", min_urgency: "B", require_warm_path: false, require_demo_artifact: true}`
- `promotion_cap_per_week`: number  --  max targets advanced per week (prevents downstream overload)

**Decision-maker inputs (Phase 3):**  --  inherited by `ip-licensing-prospect`
- `role_priority_map`: object  --  sector → role rank
- `people_sources`: list[string]  --  LinkedIn, Crunchbase, conference lists, press
- `outreach_channel_preference`: string  --  `"warm_first" | "direct" | "either"`

**Artifact-production inputs (Phase 4):**  --  inherited by `cre-ip-license-launch`
- `carrier_waves`: object  --  Tier A/B/C/D target counts per wave
- `master_license_counsel_contact`: string  --  outside counsel who redlines
- `design_partner_slots`: number  --  first-5 MFN count (default 5)
- `warrant_kicker_range`: object  --  `{gp_interest_pct_low: 0.25, gp_interest_pct_high: 1.00}`

**Orchestration controls:**
- `dry_run`: bool  --  if true, all phases produce artifacts but nothing external is sent
- `observability_sink`: string  --  where pipeline events log to (local JSON file or SkillChain state)

## Outputs

Consolidated outputs from all phases, keyed by target where applicable:

- `intelligence_report`: object  --  latest `cre-prospect-intelligence` run: `{universe_size, ranked_prospects, rag_signal_log, demo_artifacts, scoring_audit}`
- `promotion_log`: list[object]  --  every target ever promoted from intelligence to deal layer: `{target, promoted_on, tier_at_promotion, urgency_at_promotion, reason, current_stage}`
- `decision_map_registry`: dict[target → object]  --  all `ip-licensing-prospect` outputs by target: `{role_stack, people_list, decision_map, entry_strategy}`
- `artifact_kits`: dict[target → object]  --  all `cre-ip-license-launch` outputs by target: `{context_digest, carrier_outreach_list, master_license_draft, design_partner_term_sheet}`
- `pipeline_dashboard`: object  --  health view: `{universe_size, prospects_scored, prospects_profiled, targets_in_motion, artifacts_shipped, mous_signed, design_partners_signed, paid_customers, trailing_30d_deltas, forecast_acv_by_quarter}`
- `state_snapshot`: object  --  all shared state at last refresh (see Shared State below); the single source of truth across the three child flows
- `weekly_briefing`: object  --  human-readable summary for the pipeline owner: top 5 new urgent prospects, top 3 handoff blockers, top 3 artifacts awaiting signature, any RAG-signal spikes that newly qualified a target

---

## Shared State

All three child flows read and write to one shared state store. This is the integration backbone  --  orchestrator does not pass giant payloads between phases; it passes pointers into shared state.

| State key | Written by | Read by | Purpose |
|---|---|---|---|
| `prospect_registry` | Phase 1 | Phase 2, 3, 4 | Target identities, scorecards, stage |
| `rag_signal_history` | Phase 1 | Phase 1 (deltas), 4 (demo refresh) | RAG signal values over time; drives auto-surfacing |
| `promotion_log` | Phase 2 | Phase 5 | Which targets advanced and when |
| `decision_map_registry` | Phase 3 | Phase 4, 5 | Named humans and decision flow per target |
| `artifact_kit_registry` | Phase 4 | Phase 5 | License versions, MoU status, term-sheet status |
| `carrier_pipeline` | Phase 4 | Phase 1 (enriches receptivity), 5 | Carrier MoU status by counterparty |
| `mfn_ledger` | Phase 4 | Phase 4 | First-5 MFN tracking |
| `objection_library` | Phase 3, 4 | Phase 1, 3 | Real objections and tested responses |
| `warm_path_ledger` | Phase 1 (institutional), 3 (individual) | Phase 3 | All warm paths discovered |
| `pipeline_events` | all phases | Phase 5 | Event log for dashboard and audit |

State format: JSON documents on disk under `.wayfinder/pipeline_state/` or a SkillChain state backend; schema versioned.

---

## Execution

### Phase 1: INTELLIGENCE SWEEP

### Entry Criteria
`intelligence_cadence` timer fires, OR manual trigger, OR `rag_signal_history` reports a new red-severity hit on any target in `prospect_registry`.

### Actions
1. **Invoke `cre-prospect-intelligence`** with the intelligence-layer inputs. The child flow runs its full 8-phase pipeline.
2. **Merge its outputs into shared state**  --  `prospect_registry`, `rag_signal_history`, and the embedded `demo_artifacts` collection.
3. **Diff against prior run.** Tag every target with one of: `new`, `tier_up`, `tier_down`, `urgency_up`, `urgency_down`, `unchanged`, `deprioritized`.
4. **Re-generate `weekly_briefing`**  --  the human-readable digest for the owner.

### Output
`intelligence_report` + state mutations
### Quality Gate
Child flow exit criteria all met. Every prospect with `tier_up` or `urgency_up` has a linked RAG signal change explaining the delta. No silent deletions from `prospect_registry`  --  deprioritized targets move to an archive partition, never disappear.

---

### Phase 2: HANDOFF GATE

### Entry Criteria
Phase 1 completed, or a manual promotion is requested.

### Actions
1. **Apply `promotion_criteria` filter** to the latest `prospect_registry`:
   - Tier ≥ min_tier
   - Urgency ≥ min_urgency
   - `demo_artifact_ref` present (if required)
   - No active deprioritization reason
   - Not already in motion in Phase 3 or 4

2. **Cap at `promotion_cap_per_week`.** If more targets qualify than the cap allows, rank by (urgency × tier × ACV_mid) and promote the top N. The rest stay in `prospect_registry` and remain eligible next cycle.

3. **Record each promotion in `promotion_log`** with the tier, urgency, ACV estimate, and the concrete reason from the RAG signals.

4. **Emit a pipeline event** per promotion for observability.

### Output
`promotion_log` entries
### Quality Gate
Every promoted target has all Phase 1 artifacts in state. Cap respected. Rationale (named RAG signals) recorded, not a generic "scored well".

---

### Phase 3: DECISION-MAKER RESOLUTION

### Entry Criteria
At least one target newly promoted in Phase 2.

### Actions
1. **Invoke `ip-licensing-prospect`** per promoted target with inherited Phase-3 inputs plus the target's scorecard from state.
2. **Store output** under `decision_map_registry[target]`.
3. **Enrich `warm_path_ledger`** with any individual-person-level warm paths the child flow discovered.
4. **Write-back to `objection_library`** any preempted objections the child flow identified.

### Output
`decision_map_registry[target]`
### Quality Gate
Child flow exit criteria met. Every target has at least one named human with a contact path that is *not* cold LinkedIn InMail. If only cold paths were found, target is routed to a "cold nurture" lane and does not advance to Phase 4 until a warm path surfaces.

---

### Phase 4: ARTIFACT PRODUCTION

### Entry Criteria
Phase 3 completed for target AND at least one carrier MoU is signed in `carrier_pipeline` (global precondition  --  the shared-savings promise is empty without it).

### Actions
1. **Invoke `cre-ip-license-launch`** per advanced target.
2. **Store outputs** under `artifact_kit_registry[target]`.
3. **Update `carrier_pipeline`** if new carriers were engaged in Phase 1 of the child flow.
4. **Update `mfn_ledger`** if target becomes one of the first 5 design partners.
5. **Emit a pipeline event** per artifact shipped (MoU sent, license sent, term sheet sent, signature received).

### Output
`artifact_kit_registry[target]`
### Quality Gate
Child flow exit criteria met. Every artifact traces back to the business-plan commercial structure (no off-book pricing). MFN ledger invariant holds (never more than 5 MFN seats occupied unless the policy is explicitly changed).

---

### Phase 5: PIPELINE CONSOLIDATION

### Entry Criteria
Daily timer, OR on-demand.

### Actions
1. **Aggregate counts** from state into the dashboard fields: universe size, prospects scored, prospects profiled, targets in motion per stage, artifacts shipped, MoUs signed, design partners signed, paid customers.
2. **Compute trailing 30-day deltas** per metric  --  leading indicators matter more than totals.
3. **Forecast ACV by quarter** from the current `artifact_kit_registry` × stage-weighted close probabilities.
4. **Run pipeline health checks:**
   - Any target stuck >21 days in a stage → flag
   - Any carrier silent >10 days after MoU sent → flag
   - Any design partner with warrants issued but no production milestone hit by day 180 → flag
   - Any RAG signal that moved a prospect tier-up but no handoff gate fired → flag
5. **Publish `weekly_briefing`** to the configured sink.

### Output
`pipeline_dashboard` + health-check alerts
### Quality Gate
Dashboard reflects state without missing counters. Every flag has a named target, a stage, and a days-in-stage number. Forecast math is reproducible from the stage-weight table (recorded in `scoring_audit`).

---

## Exit Criteria

This flow does not "complete"  --  it runs as a standing pipeline. A single **cycle** is considered complete when:

1. Phase 1 has produced a fresh `intelligence_report`
2. Phase 2 has evaluated promotion for every prospect with a state delta since last cycle
3. Phase 3 and Phase 4 have at minimum acknowledged any newly-promoted targets (entered their backlog)
4. Phase 5 has published the fresh `weekly_briefing` and dashboard

Lifetime exit only on explicit shutdown (e.g., decision to pause the CRE vertical, deprecation of pricing structure).

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| INTELLIGENCE SWEEP | Child flow fails mid-run | Do not overwrite `prospect_registry`; keep last-good snapshot; alert owner |
| HANDOFF GATE | More qualifying targets than cap allows every cycle for 4+ weeks | Raise the cap, or investigate a tier-inflation issue in the rubric |
| HANDOFF GATE | Zero targets qualify for 2+ weeks | Investigate  --  either universe is too small, rubric is too strict, or the vertical is exhausted in the current geography |
| DECISION-MAKER RESOLUTION | Only cold paths found for a target repeatedly | Route to cold-nurture lane; trigger `ip-social-strategist` or conference-targeting |
| ARTIFACT PRODUCTION | Precondition (carrier MoU) missing | Hold target at end of Phase 3; do not advance; alert owner to accelerate carrier track |
| ARTIFACT PRODUCTION | Design-partner MFN cap (5) already full | Switch to standard commercial terms for new target; flag that MFN closure is approaching |
| PIPELINE CONSOLIDATION | Health check flags accumulate without resolution | Escalate  --  pipeline silently degrading even if headline metrics look fine |

## State Persistence

Beyond the per-phase state above, orchestrator-level persistence:

- `pipeline_cycle_log`: Every cycle run, timestamp, duration, phases executed, errors
- `stage_weight_table`: Probability weights per stage for ACV forecasting  --  update from realized close rates quarterly
- `health_flag_ledger`: All historical flags with resolution status  --  identify chronic stalls
- `cap_policy_log`: Any time promotion cap or design-partner MFN cap changes, with reason  --  audit trail for strategic decisions
- `child_flow_versions`: Which version of each child flow was last invoked  --  when a child changes, decide whether to re-run downstream targets against new version

---

## Integration with Child Flows

| Child flow | Role | Where in pipeline | Cadence |
|---|---|---|---|
| `cre-prospect-intelligence` | Produce scored prospect list + demo artifacts + RAG signal overlay | Phase 1 | Weekly (cadence configurable) |
| `ip-licensing-prospect` | Resolve named humans + decision map + entry strategy | Phase 3 | Per promoted target |
| `cre-ip-license-launch` | Produce carrier MoUs + license + term sheet | Phase 4 | Per advanced target |

Orchestration contract:
- Each child flow remains independently runnable and testable.
- Orchestrator adds state sharing and sequencing, not behavior.
- Versioning is per child; orchestrator pins a version per cycle.
- Any change to child-flow inputs/outputs must be reflected in this orchestrator's §Inputs and §Outputs before the change ships.

## Cross-References

- Executable manifest: `marketplace/chains/cre-license-pipeline.chain.json`
- Child flow (intelligence): `marketplace/cre-prospect-intelligence/skill.md`
- Child flow (decision-maker): `marketplace/ip-licensing-prospect/skill.md`
- Child flow (artifacts): `marketplace/cre-ip-license-launch/skill.md`
- Business plan (pricing source of truth): `Documents/Business Investor/Patent_Families_A_B_Business_Plan_Pricing.md`
- Risk Analytics Governor (prospect-qualifying instrument + product): `IP/projects/Risk_Analytics_Governor/risk_analytics/cre/`
- Scoring rubric implementation: `IP/projects/Risk_Analytics_Governor/risk_analytics/cre/prospecting/scoring.py`

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
