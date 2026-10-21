# Insurance License Pipeline *(orchestrator flow)*

Orchestrates the end-to-end Wayfinder Trust Insurance/Reinsurance licensing motion from cold stack-layer universe to signed contract to standards acknowledgment. Wraps three child flows (`insurance-prospect-intelligence`, `ip-licensing-prospect`, `insurance-ip-license-launch`) plus native orchestrator phases for standards-track monitoring. Runs on **two clocks**: intelligence + deal layer on one clock (intelligence weekly, deal layer per target), standards track on a longer clock (monthly).

**Why this exists:** The three child flows are complete on their own. But insurance requires coordination across tracks that run on different timescales  --  commercial revenue moves in weeks, standards acknowledgment in quarters. The orchestrator is what keeps these tracks coherent and provides a single dashboard.

**Core principle:** Multi-track by design. Do not block revenue on standards progress; do not block standards on revenue milestones. Each track runs on its own clock with its own success metrics.

## Execution Pattern: Multi-Track Pipeline

```
PHASE 1: INTELLIGENCE SWEEP       --> delegates to insurance-prospect-intelligence  (weekly)
                │
                ▼
PHASE 2: HANDOFF GATE              --> promotes targets by tier × urgency × wave × stack-layer
                │
                ▼
PHASE 3: DECISION-MAKER RESOLUTION --> delegates to ip-licensing-prospect (per promoted target)
                │
                ▼
PHASE 4: ARTIFACT PRODUCTION       --> delegates to insurance-ip-license-launch (per wave)
                │
                │                     ╔════════════════════════════════╗
                ├─────────────────────╢  PHASE 5: STANDARDS TRACK      ║  (monthly, parallel)
                │                     ╚════════════════════════════════╝
                │
                ▼
PHASE 6: PIPELINE CONSOLIDATION    --> dashboard + forecast + cross-track health checks  (daily)
```

Phase 1 runs weekly or on new-signal trigger. Phases 3–4 run per target per wave. Phase 5 runs concurrently on independent cadence. Phase 6 runs daily as read-only aggregation.

## Inputs

Superset of all three child flows plus orchestration parameters.

**Universe / identity:**
- `licensor`: "The Wayfinder Trust"
- `commercial_licensee`: "the governance provider Group"
- `vertical`: "Insurance / Reinsurance"
- `patent_families`: `[{family: "A", name: "governance"}, {family: "B", name: "governance engine"}]`
- `business_plan_ref`: `Documents/Business Investor/Patent_Families_A_B_Business_Plan_Pricing_Insurance.md`

**Intelligence-layer inputs (Phase 1):**
- `target_stack_layers`: list  --  `["UPSTREAM", "CORE", "DOWNSTREAM"]`
- `target_segments`: list  --  14 archetypes from business plan §2
- `include_adjacent_markets`: bool
- `geographic_filter`: list  --  `["US", "UK_Lloyds", "Bermuda", "EU", "Asia"]`
- `min_premium_scale`: number
- `data_sources`: object  --  which public feeds are wired
- `insurance_rag_ref`: object | null
- `intelligence_cadence`: "weekly" | "biweekly" | "monthly"

**Handoff-gate inputs (Phase 2):**
- `promotion_criteria`: `{min_tier, min_urgency, require_demo_artifact, wave_alignment_required, stack_layer_quotas}`
- `promotion_cap_per_week`: number
- `stack_layer_weights`: dict

**Artifact-production inputs (Phase 4):**
- `waves_in_flight`: list[int]  --  subset of Wave 1–7 active
- `lloyds_pilot_criteria`, `reinsurer_mou_criteria`, `broker_channel_criteria`, `carrier_design_partner_criteria`
- `master_license_counsel_contact`: string
- `design_partner_slots`: number  --  MFN cap (default 5)
- `warrant_kicker_range`: `{min, max}` equity %

**Standards-track inputs (Phase 5):**
- `standards_tracks_active`: list  --  `["NAIC_BDAI", "EU_AI_ACT", "BMA", "PRA", "STATE_DOI_SANDBOXES", "RATING_AGENCIES"]`
- `standards_owner_assignments`: dict
- `standards_cadence`: "monthly"

**Orchestration controls:**
- `dry_run`: bool
- `observability_sink`: string

## Outputs

- `intelligence_report`: latest `insurance-prospect-intelligence` run
- `promotion_log`: every target promoted with rationale, stack-layer, wave assignment
- `decision_map_registry`: dict[target → object]
- `artifact_kits`: dict[target → object]
- `wave_progress`: per Wave 1–7, status + milestones hit + blockers
- `standards_track_registry`: dict[track → status]
- `pipeline_dashboard`: stack-layer-aware health view
- `weekly_briefing`: human-readable owner digest
- `monthly_standards_briefing`: standards-owner digest

---

## Shared State

| State key | Written by | Read by | Purpose |
|---|---|---|---|
| `prospect_registry` | Phase 1 | Phase 2, 3, 4 | Target identities, scorecards, stage, stack layer |
| `public_pain_history` | Phase 1 | Phase 1 (deltas), 4 (demo refresh) | Public-data signal evolution |
| `promotion_log` | Phase 2 | Phase 5, 6 | Advances + rationale + wave assignment |
| `decision_map_registry` | Phase 3 | Phase 4, 6 | Named humans + decision flow per target |
| `artifact_kit_registry` | Phase 4 | Phase 5, 6 | License / MoU / term sheet status per target |
| `lloyds_pipeline` | Phase 4 | Phase 6 | Lloyd's syndicate + Lloyd's Lab / Launchpad status |
| `reinsurer_pipeline` | Phase 4 | Phase 6 | MoU status per counterparty |
| `broker_channel_pipeline` | Phase 4 | Phase 6 | LOI status per broker |
| `mfn_ledger` | Phase 4 | Phase 4, 6 | First-5 MFN tracking |
| `mechanism_effectiveness_ledger` | Phase 4 | Phase 1 (re-score), 6 | Which mechanisms close which targets |
| `standards_submission_log` | Phase 5 | Phase 6 | Each standards track's status + responses |
| `standards_milestone_log` | Phase 5 | Phase 1 (re-score boosts to downstream targets), 6 | Major standards milestones hit |
| `adjacent_market_log` | Phase 4 | Phase 6 | Adjacent-market entry progress |
| `objection_library` | Phase 3, 4 | Phase 1, 3, 4 | Real objections × tested responses; stack-layer-tagged |
| `warm_path_ledger` | Phase 1 (institutional), 3 (individual) | Phase 3 | Warm paths across all layers |
| `pipeline_events` | all phases | Phase 6 | Event log |

State format: JSON on disk under `.wayfinder/pipeline_state/insurance/`; schema versioned.

---

## Execution

### Phase 1: INTELLIGENCE SWEEP

### Entry Criteria
Cadence timer fires, OR manual trigger, OR `public_pain_history` red-flag delta, OR new standards-track milestone boosts a target into re-score.

### Actions
1. Invoke `insurance-prospect-intelligence` with intelligence-layer inputs.
2. Merge outputs into state.
3. Diff against prior: tag each target `new` / `tier_up` / `tier_down` / `urgency_up` / `urgency_down` / `unchanged` / `deprioritized`.
4. Apply standards-milestone boost  --  targets whose applicability grew because of a new standards-track milestone get surfaced.
5. Regenerate `weekly_briefing`.

### Quality Gate
Child exit criteria met. Every tier_up / urgency_up has a linked signal rationale.

---

### Phase 2: HANDOFF GATE

### Entry Criteria
Phase 1 complete, OR manual promotion request.

### Actions
1. Apply `promotion_criteria` filter.
2. Cap at `promotion_cap_per_week`.
3. Multi-criteria rank: (urgency × tier × ACV × stack-layer-priority). Stack-layer priority respects wave.
4. Record promotions with concrete rationale + wave assignment.

### Quality Gate
Every promoted target has Phase 1 artifacts, stack-layer tag, wave assignment, rationale.

---

### Phase 3: DECISION-MAKER RESOLUTION

### Entry Criteria
At least one target newly promoted.

### Actions
1. Invoke `ip-licensing-prospect` per promoted target.
2. Store output under `decision_map_registry[target]`.
3. Enrich `warm_path_ledger` with individual-level paths.
4. Write-back objections to `objection_library` tagged by stack layer.

### Quality Gate
Each target has ≥1 named human with non-cold-InMail path.

---

### Phase 4: ARTIFACT PRODUCTION

### Entry Criteria
Phase 3 completed for target AND prerequisites for the target's wave are met:
- Wave 1 (Lloyd's): no external prerequisite
- Wave 2 (Reinsurer / Broker): no external prerequisite (parallel to W1)
- Wave 3 (Carrier): ≥1 reinsurer MoU or broker LOI signed (from Wave 2)
- Wave 4 (Rating agency / Big-Actuarial / adjacent markets): Wave 3 has ≥2 live customers
- Wave 5 (Enterprise): Wave 3 has ≥3 live customers + ≥1 reinsurer-mandated line
- Wave 6 (ILS / captive / OEM): Wave 3 ≥4 live customers
- Wave 7 (Adjacent markets at scale): Wave 4 + Wave 5 live; standards track has active submissions

### Actions
1. Invoke `insurance-ip-license-launch` per target.
2. Store under `artifact_kit_registry[target]`.
3. Update pipeline state + MFN ledger + mechanism ledger.

### Quality Gate
Child exit criteria met. MFN ledger invariant holds. Wave prerequisites verified.

---

### Phase 5: STANDARDS TRACK *(parallel, monthly cadence)*

### Entry Criteria
Standards cadence timer fires (monthly by default), OR major milestone in any track.

### Actions
1. For each track in `standards_tracks_active`, poll owner for status update.
2. Advance workstreams per Phase 5 of child `insurance-ip-license-launch` skill.
3. Record status in `standards_submission_log`.
4. If any track hits a major milestone, write to `standards_milestone_log` and trigger Phase 1 re-score with milestone as rescoring input.
5. Generate `monthly_standards_briefing`.

### Quality Gate
Every active track has named owner + current status + next action + target date.

---

### Phase 6: PIPELINE CONSOLIDATION

### Entry Criteria
Daily timer, OR on-demand.

### Actions
1. **Aggregate counts** from state into dashboard fields.
2. **Trailing-30d and 90d deltas.**
3. **Forecast ACV by quarter** from stage-weighted close probabilities, separately by stack layer.
4. **Multi-track health checks:** stuck targets, silent syndicates/reinsurers/brokers/standards, wave prerequisite blocks, MFN approaching exhaustion, warrant-milestone misses.
5. **Cross-track coherence checks:** standards-milestone → downstream-prospect rescore, rating-agency engagement → term-sheet-pipeline open.
6. **Publish `weekly_briefing` + monthly standards briefing**.

### Quality Gate
Dashboard reflects state. Every flag has target + stage + days-in-stage.

---

## Exit Criteria

Does not complete  --  standing pipeline. A **cycle** is complete when Phases 1–6 have all run in a 24-hour window.

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| INTELLIGENCE SWEEP | Child flow fails mid-run | Keep last-good snapshot; alert owner |
| HANDOFF GATE | Zero promotions 2+ weeks | Widen geography or relax min_tier temporarily |
| DECISION-MAKER RESOLUTION | Only cold paths repeatedly | Route to cold-nurture or conference-targeting strategy |
| ARTIFACT PRODUCTION | Wave prerequisite missing | Hold target at end of Phase 3; escalate to prerequisite track owner |
| ARTIFACT PRODUCTION | Design-partner MFN cap full | Standard commercial terms for new targets |
| STANDARDS TRACK | Submission rejected / shelved | Not blocking; preserve submission history; reassess next cycle |
| PIPELINE CONSOLIDATION | Cross-track incoherence detected | Flag + auto-generate remediation task |

## State Persistence

- `pipeline_cycle_log`: every cycle run + phases executed + errors
- `stage_weight_table`: stage-weighted close probabilities per stack layer (updated quarterly from realized data)
- `health_flag_ledger`: all historical flags + resolution
- `cap_policy_log`: MFN / design-partner / promotion-cap changes with reason
- `child_flow_versions`: which versions pinned per cycle
- `cross_track_coherence_log`: every coherence check + result
- `wave_activation_history`: when each wave was activated + prerequisite trigger
- `standards_milestone_ledger`: milestones hit (NAIC / EIOPA / BMA / PRA / state DOI / rating agencies) and the commercial-pricing changes they unlocked

---

## Cross-References

- Executable manifest: `marketplace/chains/insurance-license-pipeline.chain.json`
- Child flow (intelligence): `marketplace/insurance-prospect-intelligence/skill.md`
- Child flow (decision-maker): `marketplace/ip-licensing-prospect/skill.md`
- Child flow (artifacts): `marketplace/insurance-ip-license-launch/skill.md`
- Business plan: `Documents/Business Investor/Patent_Families_A_B_Business_Plan_Pricing_Insurance.md`
- Sibling-vertical precedent: `marketplace/cre-license-pipeline/skill.md`
- Outreach deliverable: `Documents/Business Investor/Insurance_Reinsurance_Outreach_List.md`
- Scoring-rubric Python: `IP/projects/Risk_Analytics_Governor/risk_analytics/insurance/prospecting/scoring.py`
- Tracker: `IP/projects/MarketingOutreach/Wayfinder_Insurance_Vertical/README.md`

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
