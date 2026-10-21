# Insurance Prospect Intelligence

Turns the universe of insurance-stack participants (primary carriers, Lloyd's syndicates, reinsurers, ILS managers, captive managers, reinsurance brokers, rating agencies, actuarial consultancies, core-system vendors, and adjacent risk-bearing markets) into a **ranked, stack-layer-tagged, mechanism-matched prospect list** for licensing Patent Families A (governance) and B (governance engine). Every prospect gets a worth × pay-capacity × receptivity score, a Base/Premium-royalty/CR-improvement ACV estimate, a list of applicable v3 mechanisms (M1–M24), and a **protocol-thesis tag** indicating whether the target is a pricing customer, a standards-track partner, or both.

**Why this exists:** The master outreach playbook runs on cross-vertical targets (Coalition, Upstart, Tempus, Mobileye). The CRE vertical has its own prospect intelligence flow. Insurance is bigger than both  --  and is a stack, not a vertical. Without a stack-aware intelligence layer, outreach collapses to "pitch carriers," which undersells the TAM by ~70% and squanders the rating-agency / ILS / broker / captive-manager channels that make the protocol thesis possible.

**Core principle:** Do not pitch cold when public-data signals can already demonstrate the prospect's pain  --  even without an Insurance RAG. Leverage NAIC Schedule P loss-development, CR trend deterioration, RBC drift, rating-agency trajectory, DOI enforcement, and SEC disclosure scanning to produce a *portfolio-level* demo artifact for each top-tier target. The protocol thesis means we are not a vendor  --  we are the standard  --  and every prospect conversation must reflect which stack-layer role they would play.

**Honest caveat:** Until the Insurance Risk Analytics Governor (§11 of `Patent_Families_A_B_Business_Plan_Pricing_Insurance.md`) is built, the Phase 7 demo artifact is portfolio-level (line-of-business loss-ratio comparison, reserve-adequacy stress, CR-trend vs peer) rather than policy-level. The framework is architected to absorb the Insurance RAG when ready  --  no rewrite required.

## Execution Pattern: Phase Pipeline

```
PHASE 1: UNIVERSE BUILD           --> Enumerate the stack (14+ archetypes) across core + adjacent markets
PHASE 2: SCALE & CAPACITY         --> Segment-specific scale unit (DWP / assumed / AUM / commission / employees)
PHASE 3: PUBLIC-DATA PAIN OVERLAY --> NAIC Schedule P + CR trend + RBC + rating-trajectory + DOI + SEC disclosure
PHASE 4: GOVERNANCE POSTURE       --> Core-system vendor footprint; MRM maturity; actuarial staffing; recent exec hires
PHASE 5: RECEPTIVITY SIGNALS      --> DOI enforcement, rating downgrade, CR spike, reserve strengthening, leadership change, AI-regulation posture
PHASE 6: WARM-PATH INVENTORY      --> Shared reinsurers, shared brokers, rating-agency overlap, Lloyd's-market co-membership, industry bodies
PHASE 7: DEMO ARTIFACT            --> Portfolio-level peer-comparison brief; stack-layer-specific framing
PHASE 8: SCORE, TIER, ACV         --> 100-point rubric + T1-T4 + ACV low/mid/high + urgency grade + Wave assignment + applicable mechanisms (M1-M24)
```

Phases 2–6 run in parallel for each target after Phase 1. Phase 7 runs for top-N. Phase 8 consolidates.

## Inputs

- `target_stack_layers`: list[string]  --  which layers to hunt: `["UPSTREAM", "CORE", "DOWNSTREAM"]` (default all three)
- `target_segments`: list[string]  --  specific archetypes per v3 §2.3: `["PRIMARY_P_AND_C", "SPECIALTY_CARRIER", "MGA", "LLOYDS_SYNDICATE", "LIFE_HEALTH_CARRIER", "INSURTECH_ADAPTIVE_AI", "REINSURER_TRADITIONAL", "ILS_MANAGER", "CAPTIVE_MANAGER", "REINSURANCE_BROKER", "CAT_MODEL_VENDOR", "RATING_AGENCY", "BIG_ACTUARIAL", "CORE_SYSTEM_VENDOR", "ADJACENT_MARKET"]`
- `include_adjacent_markets`: bool  --  if true, also enumerate warranty, trade credit, title, mortgage-insurance, pension-risk-transfer, surety, workers-comp, specialty D&O, medical stop-loss, crop, ECA, bancassurance, embedded-insurance platforms (per v3 §2.2)
- `geographic_filter`: list[string]  --  `["US", "UK_Lloyds", "Bermuda", "EU", "Asia"]`
- `min_premium_scale`: number  --  exclude targets below this threshold (suggest $200M first pass; $1B for enterprise)
- `scoring_weights`: object  --  overridable rubric weights
- `max_targets_deep_profile`: number  --  top-N for full profile + demo artifact (suggest 30 for first insurance pass)
- `data_sources`: object  --  available feeds: `{naic: true, am_best: false, serff: true, edgar: true, lloyds: true, artemis: true, doi_enforcement: true}`  --  honest flagging of what's wired
- `insurance_rag_ref`: object | null  --  path to Insurance Risk Analytics Governor DB if built; null if not yet (demo artifact downgrades to portfolio-level)
- `protocol_context`: object  --  `{attestation_live: bool, standards_engagements: list, supervisory_board: bool}`  --  drives the protocol-fit scoring

## Outputs

- `prospect_universe`: list[object]  --  full enumerated universe with stable IDs per segment: `{name, segment, stack_layer, geography, estimated_premium_usd_or_scale_unit, cik, lei, naic_code, am_best_rating, lloyds_syndicate_number, ticker, registry_source}`
- `prospect_scorecards`: list[object]  --  one deep card per top-N target: `{identity, scale_profile, public_pain_report, governance_posture, receptivity_events, warm_paths, demo_artifact_ref, dimension_scores, total_score, tier, acv_estimate, urgency_grade, wave_assignment, applicable_mechanisms, recommended_next_action, protocol_fit_tag}`
- `prospect_ranking`: ordered list  --  top-N sorted with tiebreaker rules documented
- `public_pain_log`: list[object]  --  per target, public-data signals that fired: `{target, reserve_development_stress, cr_trend_deterioration_bps, naic_rbc_ratio, ratings_trajectory, doi_enforcement_hits, ai_model_disclosure_signals}`
- `mechanism_match_map`: dict[target → list[str]]  --  for each target, which of the 24 mechanisms (M1-M24) from v3 §4 apply
- `demo_artifacts`: list[object]  --  one 3-page portfolio-level brief per top-ranked target
- `wave_assignments`: dict[wave_num → list[target]]  --  per v3 §8 Wave 1-8 sequencing
- `protocol_contributions`: list[object]  --  targets whose participation advances the protocol thesis independent of direct revenue (rating agencies, standards bodies, regulators)  --  scored separately
- `next_action_queue`: ordered list  --  per target: `{target, action, owner, due_date, prerequisite_wave}`
- `objection_prebuild`: object  --  top 5 objections **per stack layer** with pre-drafted responses (rating agency objections differ from reinsurer objections differ from Lloyd's syndicate objections)
- `scoring_audit`: object  --  weights, score breakdowns, sensitivity check

---

## Execution

### Phase 1: UNIVERSE BUILD

### Entry Criteria
`target_stack_layers` + `target_segments` specified.

### Actions
1. **Pull universe per segment** from the appropriate registry:

   | Segment | Primary source | Secondary |
   |---|---|---|
   | Primary P&C / specialty / life-health | NAIC company list; AM Best directory; SEC EDGAR | Form ADV / NAIC National Insurance Producer Registry |
   | Lloyd's syndicates | Lloyd's list of syndicates; Lloyd's market directory | Annual Lloyd's business review |
   | Traditional reinsurers | AM Best top-50 reinsurers; S&P Global Reinsurance Highlights | BMA list of registered reinsurers |
   | ILS / cat-bond managers | Artemis deal directory; Preqin ILS funds | Industry publications (Insurance Insider, Trading Risk) |
   | Captive managers | Captive Insurance Companies Association member directory | State captive registries (Vermont, Bermuda, Cayman, Guernsey) |
   | Reinsurance brokers | Reinsurance Broker Association; Lloyd's broker list | Marsh / Aon / WTW / Gallagher / Howden corporate disclosures |
   | Cat-model vendors | Industry knowledge  --  RMS/Moody's RMS, AIR Worldwide/Verisk, KCC, CoreLogic, Impact Forecasting | Vendor RFP public disclosures |
   | Rating agencies | AM Best, S&P, Moody's, Fitch, Kroll Bond Rating, DBRS Morningstar | IAIS (International Association of Insurance Supervisors) lists |
   | Big-Actuarial consultancies | Society of Actuaries member firm directory; Casualty Actuarial Society | SOA/CAS conference sponsorship lists |
   | Core-system vendors | Gartner insurance-platform Magic Quadrant vendor list; Celent insurance-analytics reports | Vendor customer case-study lists |
   | MGAs | Target Markets Program Administrators Association (TMPAA); AM Best MGA ratings | Wholesale broker program rosters |
   | InsurTechs | CB Insights InsurTech lists; Plug and Play Insurance cohort alumni | Venture database scrape |
   | Adjacent markets | Per adjacent market: NAIC + segment-specific registries (e.g., mortgage insurance via CMBS/mortgage council) | |

2. **Deduplicate** and assign stable IDs: CIK, LEI, NAIC code, FDIC cert for banks holding insurance ops, AM Best number, Lloyd's syndicate number.

3. **Apply `min_premium_scale` filter**  --  exclude below threshold. For stack layers without traditional premium scale (rating agencies, actuarial consultancies, standards bodies), substitute revenue, employee count, or addressable-customer-count as the scale proxy.

4. **Record source pedigree.**

### Output
`prospect_universe`
### Quality Gate
Every entry has segment, stack_layer, geography, a scale unit, and a stable ID. No duplicates. Universe size target: 300–700 entries for first insurance run.

---

### Phase 2: SCALE & CAPACITY PROFILE

### Entry Criteria
Universe built.

### Actions
1. **Segment-specific scale unit per v3 §2.3 pay-capacity proxies:**

   | Segment | Scale unit | Public source |
   |---|---|---|
   | Primary carrier / specialty / life-health | DWP or NPW | NAIC statutory filings; SEC 10-K |
   | MGA | Gross program premium | Program-administrator disclosures |
   | Lloyd's syndicate | Syndicate capacity + SCR | Lloyd's annual report |
   | Reinsurer | Assumed premium | AM Best; SEC 10-K if public |
   | ILS manager | AUM | Artemis; Preqin |
   | Captive manager | Managed captive premium | Captive manager disclosures |
   | Reinsurance broker | Commission revenue | Public financials; 10-K |
   | Cat-model vendor | Model-license revenue | Parent-company financials |
   | Rating agency | Insurer-ratings revenue | 10-K |
   | Big-Actuarial | Insurance-practice revenue | Firm disclosures; partnership rosters |
   | Core-system vendor | Insurance-SaaS ARR | 10-K for public (Guidewire); PE disclosures for private (Duck Creek, Majesco) |
   | Adjacent markets | Segment-specific premium or revenue | |

2. **Estimate discretionary model-risk + analytics budget** per v3 §2.3 pay-capacity rates.

3. **Map pay-capacity proxy → year-1 ACV envelope** using v3 §3 core pricing.

4. **Flag scale outliers** for manual review.

### Output
`scale_profile` per target
### Quality Gate
Each target has at least 3 scale signals stamped and sourced. Pay-capacity proxy matches segment rate.

---

### Phase 3: PUBLIC-DATA PAIN OVERLAY  --  *the competitive edge without Insurance RAG*

### Entry Criteria
Target universe sized.

**Why this is the edge (honest version):** CRE prospect intelligence benefits from the Risk Analytics Governor running replay against public CMBS loan-level data. Insurance does not yet have an equivalent. **But the public data in insurance is uniquely rich**  --  NAIC Schedule P publishes loss-development triangles by line of business by accident year for every statutory filer, and nobody else is scoring these feeds through an AI-governance lens. This phase uses that asymmetry.

**Actions  --  per target, read what's available:**

1. **NAIC Schedule P reading**  --  pull loss-development triangles; compute prior-accident-year development as % of prior-estimate; flag lines with >5% adverse development 2+ years running. Return `reserve_development_stress` (0–100).

2. **CR trend**  --  3–5 year CR series from statutory filings; flag CR spikes or persistent deterioration. `cr_trend_deterioration_bps`.

3. **RBC ratio drift**  --  NAIC Authorized Control Level RBC ratio; flag <350% as tightening; <250% as critical. `naic_rbc_ratio_latest`.

4. **Rating-agency trajectory**  --  AM Best / S&P / Moody's / Fitch recent actions; rating watch status; outlook changes. `ratings_trajectory`.

5. **DOI enforcement scan**  --  state DOI public enforcement-action databases (per-state URLs); consent orders, rate-filing denials, market-conduct exam findings. Recency-weighted. `doi_enforcement_hits`, `doi_enforcement_recency_days`.

6. **SEC 10-K / 10-Q AI-disclosure scan**  --  regex hits for "adaptive AI", "machine learning", "model risk management", "model validation", "EU AI Act", "NAIC AI Model Bulletin", "algorithmic pricing", "automated underwriting". Captures disclosure signals that indicate (a) adaptive AI in production and (b) awareness of regulatory pressure. `ai_model_disclosure_signals`.

7. **Schedule F ceded-reinsurance stress**  --  unusual Schedule F recoverable deterioration or concentration.

8. **Lloyd's market**  --  for Lloyd's syndicates, read syndicate performance reports for underwriting-year losses, CR, and managing-agent commentary.

9. **Artemis ILS**  --  for ILS managers, recent tranche issuance, trigger events, investor flow.

10. **Compute `hypothetical_avoided_loss_usd`** from a public-data proxy (NOT from Governor replay): `estimated_premium_usd × target_CR_improvement_pct × premium_governance_share`. Document the formula in the scorecard.

11. **Tag severity per signal** (green/yellow/red) with thresholds documented in `scoring_audit`.

12. **Cache outputs**  --  weekly invalidation.

### Output
`public_pain_report` per target + `public_pain_log` entry
### Quality Gate
Every top-N target has at least 4 of the 11 signals computed. Red-severity signals backed by specific numbers (not generalizations). `rag_gap_note` present on every report ("Insurance RAG not yet built  --  scoring on public signals only  --  pending Insurance RAG build per business plan §12").

---

### Phase 4: GOVERNANCE POSTURE

### Entry Criteria
Scale profile complete.

### Actions
1. **Vendor-footprint inventory**  --  evidence of Duck Creek / Guidewire / Majesco / Earnix / Insurity / Sapiens / Socotra / EIS / FINEOS deployments via:
   - 10-K vendor disclosures
   - Earnings-call keyword hits
   - Vendor press releases / case studies
   - LinkedIn employee skill keywords at the target firm

2. **In-house MRM function detection:**
   - 10-K MD&A / Risk Factors language ("model risk management", "model validation", "SR 11-7", "PRA CP13/17")
   - Chief Model Risk Officer / Head of MRM / Head of Model Validation roles publicly disclosed
   - SOA / CAS / GARP (Global Association of Risk Professionals) membership of senior staff
   - Published actuarial research or conference presentations

3. **Actuarial staffing depth**  --  FSA / FCAS / MAAA headcount inferred from LinkedIn, annual reports, Society of Actuaries employer lists.

4. **Recent exec-hire signal**  --  CRO / Chief Actuary / CUO / Head of Data Science / Head of Model Governance hired in last 18 months.

5. **Grade the posture gap:**

   | Posture | Gap we close | Implied receptivity |
   |---|---|---|
   | No risk tooling + no MRM | Everything  --  but they may not be buyers | Low (budget problem) |
   | Spreadsheets + consultants | Core evidence artifact | Medium |
   | **Vendor (Duck Creek / Guidewire etc.) + no runtime governance** | Runtime + evidence + actuarial + audit legs | **High  --  ideal profile** |
   | In-house MRM function, no external vendor | Artifact + rating-agency leg | High |
   | Already using a runtime governor (if any exist) | Small  --  likely pass | Very low |

### Output
`governance_posture` per target
### Quality Gate
Posture backed by ≥2 sources. No grade from a single signal.

---

### Phase 5: RECEPTIVITY SIGNALS

### Entry Criteria
Scale + posture complete.

### Actions
1. **Event scanning (last 18 months):**
   - Regulatory event  --  DOI consent order, MRA, market-conduct exam finding; NAIC accreditation findings; EIOPA findings
   - Rating-agency action  --  downgrade, outlook-negative, placed on watch
   - Reserve strengthening / CR spike from financial filings
   - Leadership change  --  CRO / Chief Actuary / CUO / Head of Data Science / Chief Model Risk Officer
   - M&A event  --  announced / pending / completed
   - Fundraise event  --  parent holding-company capital raise, SPAC, IPO
   - LP / investor pressure event  --  shareholder letters, activist investor positions
   - AI-regulation posturing  --  public comments at NAIC, EIOPA, state DOI hearings
   - Earnings-call AI-related keyword hits

2. **Score receptivity 0–10** with half-weight on recency.

3. **Tag window type**  --  `urgent_now` / `near` / `quiet`.

4. **Cross-check with Phase 3 public pain**  --  targets with both high public pain AND active receptivity signals are priority-one for Wave-3 carrier outreach.

### Output
`receptivity_events` per target
### Quality Gate
Every target has ≥1 signal attempted. Each signal has source + date. `urgent_now` requires ≥2 concurrent signals.

---

### Phase 6: WARM-PATH INVENTORY

### Entry Criteria
People-level access not required here.

**Actions  --  insurance-specific institutional overlaps:**

1. **Shared reinsurers**  --  NAIC Schedule F for primaries reveals which reinsurers they cede to; overlap with other governed prospects signals a reinsurer-channel path.
2. **Shared reinsurance brokers**  --  treaty placement broker is public for most large treaties; overlap creates broker-channel path.
3. **Shared rating agency**  --  which agency rates this target; overlap with other prospects who have the same agency creates a rating-agency-channel path.
4. **Shared industry body**  --  CIAB (Council of Insurance Agents & Brokers), RAA (Reinsurance Association of America), AAIA, APCIA (American Property Casualty Insurance Association), NAMIC, III (Insurance Information Institute), Lloyd's Market Association, IRLA (Insurance and Reinsurance Legacy Association)  --  co-membership is a warm path via the body.
5. **Shared Big-Actuarial consultant**  --  Milliman / Oliver Wyman / Deloitte Actuarial / EY / PwC client overlap.
6. **Shared core-system vendor**  --  same Duck Creek / Guidewire / Majesco deployment creates peer-network warm paths.
7. **Lloyd's-market co-membership**  --  syndicates that co-participate on the same consortium or panel.
8. **Prior commercial relationship**  --  8-K Item 1.01 Material Definitive Agreement scans.
9. **Shared LP (for InsurTechs / ILS funds)**  --  Preqin / PitchBook investor overlaps where available.

**Score warm-path 0–5** per v3 mechanism-density logic.

### Output
`warm_paths` per target (institutional layer only)
### Quality Gate
Every warm-path claim has a specific named overlap (reinsurer X, broker Y, agency Z). Zero warm paths is valid.

---

### Phase 7: DEMO ARTIFACT GENERATION  --  *portfolio-level until Insurance RAG exists*

### Entry Criteria
Phases 3 + 4 complete for top-N.

### Actions
1. **Assemble the observable book / position:**
   - NAIC Schedule P line-of-business loss-ratio + development
   - NAIC Schedule F ceded-reinsurance concentration
   - CR history 3–5 years
   - RBC ratio trend
   - Rating-agency trajectory
   - For Lloyd's syndicates: syndicate performance tables by year of account
   - For reinsurers: assumed-premium concentration, treaty-type mix
   - For ILS: recent tranche performance, trigger events
   - For brokers: placement-volume disclosures

2. **Produce a 3-page stack-layer-aware brief:**
   - **Page 1**  --  "What your [book / portfolio / managed capital / rated-entity roster] looks like from a runtime-governance lens"  --  headline numbers, one chart, a peer-comparison table
   - **Page 2**  --  Three specific observable signals that runtime governance would have flagged or constrained. **This page differs by stack layer:**
     - Primary carrier: 3 lines of business with adverse development in the last 24 months that Governor would have CONSTRAINED
     - Lloyd's syndicate: 3 years of account with underwriting losses that Governor would have flagged
     - Reinsurer: 3 cedant relationships with Schedule F recoverable deterioration
     - ILS manager: 3 tranches whose trigger-calculation integrity would have been auditable via attestation layer
     - Rating agency: 3 rated carriers whose MRM maturity would have been scored differently under the ActuarialReport framework (this is the reversal conversation)
     - Big-Actuarial / core-system vendor: 3 existing customers whose governance posture would improve with artifact adoption
   - **Page 3**  --  "What this would have meant economically, and what it would cost to deploy"  --  hypothetical-avoided-loss figure, estimated Year-1 ACV at their tier, **applicable mechanisms (M1–M24) from the v3 catalog** called out explicitly

3. **Watermark** `Confidential  --  Pre-Pitch Analysis  --  Prepared by The Wayfinder Trust for [Target]  --  [date]  --  Portfolio-level analysis (Insurance RAG pending)`.

### Output
`demo_artifact` per target
### Quality Gate
Every number on Page 2 is a real disclosed number (NAIC, Lloyd's, or SEC filing). No fabricated specifics. Brief fits 3 pages. Stack-layer framing matches the target.

---

### Phase 8: SCORE, TIER, ACV, WAVE, MECHANISMS

### Entry Criteria
Phases 2–6 complete; Phase 7 complete for top-N.

### Actions
1. **Apply rubric** per CRE-analog weights (25 / 20 / 25 / 15 / 10 / 5 = 100), with insurance-specific interpretation:

   | Dimension | Max | Insurance-specific signal source |
   |---|---|---|
   | Scale | 25 | log-scaled segment scale unit |
   | Pay capacity | 20 | segment proxy × scale vs illustrative ACV |
   | Pain intensity | 25 | Phase 3 public-pain composite |
   | Governance gap | 15 | Phase 4 posture table |
   | Receptivity | 10 | Phase 5 event composite, half-weight on recency |
   | Warm path | 5 | Phase 6 institutional overlaps |

2. **Tier placement** per v3 §3.1 Base tiers + total score gates (T1 ≥80 & scale ≥18; T2 65–79; T3 50–64; T4 35–49; disqualify <35 OR capacity < 0.5 × ACV).

3. **Estimate ACV low/mid/high** using v3 §3 pricing  --  Base + premium royalty (segment-specific schedule) + CR improvement share mid-case + applicable mechanisms.

4. **Assign Wave (1–8) per v3 §8 sequencing:**
   - Wave 1: Lloyd's syndicates + Lloyd's Lab application
   - Wave 2: Reinsurers + reinsurance brokers
   - Wave 3: Specialty carriers + MGAs
   - Wave 4: Rating agencies + Big-Actuarial channel partnerships + first adjacent-market entry
   - Wave 5: Enterprise carriers + reinsurer inversion
   - Wave 6: ILS + captive managers + core-system vendor OEM + cat-model vendors
   - Wave 7: Standards adoption work intensifies
   - Wave 8: Protocol-layer economics live

5. **Match applicable mechanisms (M1–M24) per target**  --  each scorecard lists the 3–6 most relevant mechanisms from the v3 catalog.

6. **Assign urgency A–F** using receptivity × pain × warm composite.

7. **Recommend next action** per tier × urgency × wave.

8. **Produce `protocol_contributions` list**  --  rating agencies, standards-body stakeholders, supervisory-board candidates, consortium-data contributors  --  scored separately for protocol-thesis advancement, not just direct revenue.

9. **Pre-build objections per stack layer**  --  top 5 objections per layer (they differ) with pre-drafted responses.

10. **Sensitivity check**  --  perturb weights ±20%; flag tier-flippers.

### Output
`prospect_scorecards`, `prospect_ranking`, `wave_assignments`, `mechanism_match_map`, `protocol_contributions`, `next_action_queue`, `objection_prebuild`, `scoring_audit`
### Quality Gate
Every top-N target has: 6 dimension scores, total, tier, ACV triple, urgency, wave, ≥3 applicable mechanisms, next action with owner + due date, protocol contribution flag (or explicit "commercial-only"). Sensitivity run. Tier-flippers flagged for manual review.

---

## Exit Criteria

1. `prospect_universe` ≥300 deduplicated, ID-stamped entries across all 14+ segments
2. `prospect_scorecards` covers top-30 with full 8-phase profiling
3. `public_pain_log` shows every top-30 target scored against available public feeds
4. `demo_artifacts` contains one 3-page stack-layer-specific brief per top-ranked target
5. `prospect_ranking` ordered with tiebreaker rules
6. `wave_assignments` populated per v3 §8
7. `mechanism_match_map` populated for all top-30
8. `protocol_contributions` identifies upstream and standards-track targets distinctly
9. `next_action_queue` specific per target
10. `objection_prebuild` covers 5 objections × per stack layer
11. `scoring_audit` includes sensitivity

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| UNIVERSE BUILD | Segment registry unavailable | Fall back to secondary; flag `source_degraded` |
| SCALE & CAPACITY | Private captive with undisclosed premium | Use managed-captive tier proxy; lower confidence |
| PUBLIC-DATA PAIN | NAIC Schedule P unavailable (non-US carrier) | Substitute jurisdiction-appropriate filing (UK PRA, EIOPA, BMA); lower confidence |
| PUBLIC-DATA PAIN | `hypothetical_avoided_loss` implausibly high | Flag for manual review before shipping demo |
| GOVERNANCE POSTURE | Vendor-detection regex hits on historical-only mention | Require disclosure-year + earnings-call confirmation |
| RECEPTIVITY | No event signals visible | Valid result  --  `quiet` tag, lower urgency |
| WARM-PATH INVENTORY | Zero warm paths | Valid  --  escalate to `ip-licensing-prospect` with cold-outreach flag |
| DEMO ARTIFACT | Non-public segment (captive manager, ILS fund) with no disclosable book | Produce layer-specific illustrative brief; flag as generic |
| SCORE & TIER | Many tier-flippers | Re-calibrate weights; re-run |
| PROTOCOL CONTRIBUTION | Target's direct revenue is low but standards value is high | Tag separately; escalate to protocol-track rather than commercial-track |

## State Persistence

- `prospect_registry`: every target profiled, segment, stack layer, all scorecard versions, outreach status
- `public_pain_history`: per-target signal values over time  --  detect new red flags
- `governance_posture_changes`: vendor switches, new MRM hires, disclosed tooling changes
- `warm_path_ledger`: institutional overlaps
- `objection_library`: pre-built objections vs real-world conversations
- `demo_artifact_archive`: every brief with snapshot data
- `tier_migration_log`: targets moving between tiers
- `mechanism_effectiveness_ledger`: which mechanisms close which targets → feeds `mechanism_match_map` over time
- `protocol_milestone_log`: standards-body engagements, rating-agency acknowledgments, regulator references

---

## Integration with the Pipeline Chain

Feeds into `insurance-license-pipeline` (orchestrator) → `ip-licensing-prospect` (named-human resolution) → `insurance-ip-license-launch` (artifact production across Waves 1–8).

**Cadence:** weekly standing run. Re-scores + auto-surfacing on new public-pain signal red flags (new Schedule P deterioration, new DOI enforcement, new rating-agency action, new AI-disclosure language in filings).

**Insurance RAG integration point:** When Insurance RAG is built per `Patent_Families_A_B_Business_Plan_Pricing_Insurance.md §12`, Phase 3 is augmented with Governor replay against the target's observable book (for primary carriers and reinsurers  --  the segments with loan-level or policy-level public data); `compute_public_pain` becomes `compute_rag_exposure`; Phase 7 demo artifact moves from portfolio-level to policy-level. No downstream change required in the flow structure.

## Cross-References

- Business plan source of truth: `Documents/Business Investor/Patent_Families_A_B_Business_Plan_Pricing_Insurance.md`
- Scoring-rubric Python: `IP/projects/Risk_Analytics_Governor/risk_analytics/insurance/prospecting/scoring.py`
- Downstream flow  --  decision-maker resolution: `marketplace/ip-licensing-prospect/skill.md`
- Downstream flow  --  artifact production: `marketplace/insurance-ip-license-launch/skill.md`
- Orchestrator: `marketplace/insurance-license-pipeline/skill.md`
- Sibling-vertical precedent: `marketplace/cre-prospect-intelligence/skill.md`
- Master cross-vertical playbook: `IP/projects/MarketingOutreach/outreach_master_playbook.md`

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
