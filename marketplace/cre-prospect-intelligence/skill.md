# CRE Prospect Intelligence

Turns the universe of CRE companies (lenders, sponsors, servicers, insurers) into a **ranked, scored, tier-placed prospect list** for licensing Patent Families A (governance) and B (governance engine). Every prospect gets a worth × pay-capacity × receptivity score, a Base/AUM/Shared-Savings ACV estimate, and a pre-pitch demo ActuarialReport generated from public data about their own book  --  so the first meeting opens with *their* portfolio under *our* Governor, not a generic deck.

**Why this exists:** The ip-licensing-prospect flow finds the right human at a named target. This flow runs one step upstream: it tells us **which targets are worth naming in the first place**, and **how much they can pay on what terms**. Without it, outreach is uniform effort against a non-uniform opportunity  --  the $50M AUM boutique and the $50B megacap get the same pitch at the same time and both fall flat.

**Core principle:** Never pitch cold when the Risk Analytics Governor can already show us  --  from public data  --  how much of the target's book would have been scored DECLINE or CONSTRAINED. The pitch is not "you need governance." The pitch is "here are the specific deals in your book our Governor would have flagged, and the specific dollars of realized impairment it would have avoided." RAG is not only the product  --  it is the **demonstration engine** that qualifies the prospect.

## Execution Pattern: Phase Pipeline

```
PHASE 1: UNIVERSE BUILD        --> Enumerate the target universe from public registries
PHASE 2: SCALE & CAPACITY      --> Size each target (AUM, revenue, portfolio, EBITDA)
PHASE 3: RAG SIGNAL OVERLAY    --> Cross-reference with Risk Analytics Governor distress signals
PHASE 4: GOVERNANCE POSTURE    --> Existing tooling, tech sophistication, model-risk maturity
PHASE 5: RECEPTIVITY SIGNALS   --> Recent events that open a buying window
PHASE 6: WARM-PATH INVENTORY   --> Shared investors, alumni, conference overlap
PHASE 7: DEMO ARTIFACT         --> Generate a pre-pitch ActuarialReport on target's public book
PHASE 8: SCORE, TIER, ACV      --> Multi-factor score → T1-T4 tier + ACV estimate + urgency grade
```

Phases 2–6 can run in parallel for each target after Phase 1 produces the universe. Phase 7 depends on Phase 3 output. Phase 8 is the consolidation step.

## Inputs

- `target_segments`: list[string]  --  which CRE buyer archetypes to hunt: `["cre_debt_funds", "balance_sheet_cre_lenders", "cmbs_originators", "reits", "pe_real_estate", "opportunity_funds", "special_servicers", "cre_insurers", "cre_mgas"]`
- `geographic_filter`: list[string]  --  `["US_northeast", "US_national"]` for first wave
- `min_governed_aum`: number  --  exclude targets below this threshold (suggest $250M for first pass; $1B for enterprise)
- `rag_connection`: object  --  Risk Analytics Governor connection details: `{host: "localhost:3148", db_path: ".../cre.db", data_feeds: ["cre_shadow_signal", "edgar_cmbs", "borrower_exposure", "tenant_distress_signals", "market_shadow_scores"]}`
- `pricing_structure_ref`: string  --  path to the business plan (for ACV math: Base tiers, AUM bps schedule, Shared-Savings percentages, Mechanisms M1–M8)
- `scoring_weights`: object  --  overridable weights per dimension (defaults in §8 rubric)
- `max_targets_deep_profile`: number  --  stop at top N for full profile + demo artifact (suggest 25 for first pass)

## Outputs

- `prospect_universe`: list[object]  --  full enumerated universe with minimum viable fields: `{name, segment, geography, estimated_aum, ticker_or_fund_id, registry_source}`
- `prospect_scorecards`: list[object]  --  one deep card per top-N target, all phase outputs joined: `{name, scale_profile, rag_exposure, governance_posture, receptivity_events, warm_paths, demo_artifact_ref, dimension_scores, total_score, tier, acv_estimate, urgency_grade, recommended_next_action}`
- `prospect_ranking`: ordered list  --  the top-N scorecards sorted by composite score with tiebreakers documented
- `rag_signal_log`: list[object]  --  per target, which RAG signals fired and with what severity: `{target, shadow_cmbs_exposure, tenant_distress_hits, market_cycle_phase, fema_stress, basel_concentration_flag}`
- `demo_artifacts`: list[object]  --  one pre-pitch ActuarialReport per top-ranked target: `{target, scope, deals_flagged, hypothetical_avoided_loss, governance_posture_comment, pdf_path}`
- `next_action_queue`: ordered list  --  per target, the recommended next step: `{target, action, owner, due_date, prerequisite}` (e.g., "Pull their quarterly filing", "Request intro via shared investor X", "Hand demo artifact to CRO at [conference]")
- `objection_prebuild`: object  --  per tier, the top 3 objections expected and the pre-drafted responses
- `scoring_audit`: object  --  weights used, score breakdown per target, sensitivity check (did any target flip tiers under ±20% weight perturbation?)

---

## Execution

### Phase 1: UNIVERSE BUILD

### Entry Criteria
`target_segments` and `geographic_filter` specified.

### Actions
1. **Pull the universe from registries**, one pass per segment:

   | Segment | Primary source | Secondary |
   |---|---|---|
   | CRE debt funds | SEC Form PF, Form ADV (part 7A); Preqin CRE debt list | PERE 100 |
   | Balance-sheet CRE lenders | FDIC SDI (Summary of Deposits + CRE concentration metrics) | FFIEC call reports |
   | CMBS originators | CREFC top-issuer leaderboard; Trepp issuer list | CMBS trustee reports via EDGAR |
   | REITs | SEC EDGAR (Form 10-K/10-Q); NAREIT directory | Bloomberg REIT index constituents |
   | PE real estate / opportunity funds | Preqin; PitchBook; Form PF | Institutional LP disclosures (CalPERS, CalSTRS, TRS) |
   | Special servicers | Fitch/S&P/KBRA rated master and special servicer lists | CMBS trustee reports |
   | CRE insurers / MGAs | NAIC filings (P&C Schedule T); Lloyd's syndicate directory | AM Best ratings lookup |

2. **Deduplicate and enrich with stable IDs**:
   - LEI (Legal Entity Identifier) for regulated entities
   - CIK for SEC filers
   - FDIC cert number for banks
   - NAIC company code for insurers

3. **Apply the `min_governed_aum` filter.** Exclude anything below threshold after a first-pass AUM estimate.

4. **Record the source pedigree** for every entry  --  who it came from, when pulled, what raw ID.

### Output
`prospect_universe`
### Quality Gate
Every entry has a name, segment, geography, at least one estimated AUM number, and at least one stable ID. No duplicates across segments (an entity can be in one segment only; pick the dominant one). Universe size target: 200–500 entries for a first run.

---

### Phase 2: SCALE & CAPACITY PROFILE

### Entry Criteria
Universe built.

### Actions
1. **Size each target on five axes:**
   - **AUM / Portfolio size**  --  from SEC filings (Form ADV 5.F, 10-K schedules), FDIC call reports (Schedule RC-C CRE lines), Preqin, disclosed LP reports. Prefer latest quarter; tolerate 2-quarter lag.
   - **Revenue**  --  from 10-K for public; from Form ADV Item 5.F for private funds; from call reports for banks; from statutory P&C statements for insurers.
   - **EBITDA / pre-provision net revenue**  --  10-K where available; else estimate from revenue × segment-typical margin.
   - **Free cash / budget proxy**  --  for private funds: management fee × AUM; for banks: non-interest income + margin; for insurers: written premium × retention.
   - **Vintage / lifecycle stage**  --  for funds: fund number (Fund I vs Fund VIII), current vintage year, remaining deployment window, position in fundraise cycle. For banks: M&A posture, board composition stability.

2. **Estimate annual discretionary-tech budget.** Heuristic: 0.3–0.8% of revenue for risk-and-analytics tooling in CRE firms, 0.8–1.5% for banks with model-risk-management functions, 1.5–3.0% for large CMBS issuers and insurers. This sets the outer envelope for what they can pay for our license.

3. **Map segment-specific pay-capacity proxies:**

   | Segment | Pay-capacity proxy |
   |---|---|
   | Debt funds | AUM × mgmt-fee rate × 1.0% (their risk-tool budget is usually 1% of fee revenue) |
   | Balance-sheet lenders | CRE exposure × 0.02% (2 bps of CRE book) |
   | CMBS originators | Annual origination volume × 0.05% (5 bps) |
   | REITs | Gross asset value × 0.015% + G&A × 5% |
   | Servicers | UPB under management × 0.03% |
   | Insurers | Direct written premium × 0.3% (insurers spend more on analytics) |

### Output
`scale_profile` per target (folded into `prospect_scorecards`)
### Quality Gate
Each target has at least 3 of the 5 axes populated. Data source and pull-date stamped for every number. Pay-capacity proxy matches the segment rule. Flag any target where AUM is more than 5× the nearest comparable  --  investigate before scoring, often a data error.

---

### Phase 3: RAG SIGNAL OVERLAY  --  *the competitive edge*

### Entry Criteria
Target universe sized.

**Why this is the edge:** Any sales-intelligence vendor can pull revenue and AUM. **Only we can measure how much of a specific target's book our Governor would have flagged**  --  because only we operate the Risk Analytics Governor. This phase converts RAG from "product we license" into "qualifying instrument for prospects." Same codebase, two revenue-generating jobs.

### Actions
1. **Cross-reference each target against these RAG data surfaces** (all exist in `risk_analytics/cre/data_feeds/`):

   | RAG feed | What we read from it | What it tells us about the prospect |
   |---|---|---|
   | `edgar_cmbs` + `borrower_exposure` | CMBS deals the target originated, holds, or services; borrower names and balances | Their actual exposure to specific properties and borrowers |
   | `cre_shadow_signal` → `market_shadow_scores` | Shadow score per CBSA / ZORI phase / FEMA stress | How distressed the target's geography mix is |
   | `cre_shadow_signal` → `tenant_distress_signals` | Scored tenants (Five Below 100, Kroger 98, Dollar Tree 90.8, Rite Aid 84.4) | How much tenant-credit rot the target is sitting on |
   | `fema_data` | Flood / NatCat exposure per property cluster | Their NatCat insurance pain |
   | `fhfa_hpi` + `zillow_market` | Property-value trajectory in target's core geographies | How fast their LTVs are drifting |
   | `census_permits` | Supply-side pressure by metro | Rent-growth risk in target's top markets |
   | `edgar_cmbs` (loan-level) + GovernedCRERunner | Deals the Governor would have scored DECLINE or CONSTRAINED | **Pain intensity**  --  the headline number for the pitch |
   | `auditor.py` | ActuarialReport MTBF / availability / grade A–F applied to their observable book | Evidence-grade finding for the demo artifact |

2. **Produce a RAG Exposure Report per target:**
   - `shadow_cmbs_exposure`  --  weighted average shadow score across target's CMBS positions (0–100)
   - `tenant_distress_hits`  --  count and $UPB of tenant positions at distress score ≥ 70
   - `market_cycle_phase`  --  weighted Kuramoto phase across target's top-5 geographies
   - `fema_stress`  --  weighted FEMA percentile across target's geography mix
   - `basel_concentration_flag`  --  for bank targets only: CRE loans / Tier 1 capital vs. OCC CRE concentration thresholds (100% / 300%)
   - `rwa_relief_opportunity_$`  --  estimated $ of RWA that could be released under governed-evidence adjustment (feeds Mechanism M5 ACV)
   - `governed_decline_pct`  --  from GovernedCRERunner replay on public loan-level data: percent of observable deals that would have been DECLINE or CONSTRAINED
   - `hypothetical_avoided_loss_$`  --  estimated $ loss the target would have avoided had our Governor been in the loop

3. **Tag severity per signal**  --  green / yellow / red  --  with thresholds documented in the scoring audit.

4. **Cache the RAG query outputs** so that a re-run on the same target during the week doesn't re-hit the underlying APIs. Invalidate weekly.

### Output
`rag_exposure` per target + `rag_signal_log` entry
### Quality Gate
Every target with ≥$500M estimated AUM has at least three RAG signals computed. Every red-severity signal is backed by a specific dollar number or specific named deal/borrower, never a generalization. The `governed_decline_pct` figure is reproducible (seed / snapshot date logged).

---

### Phase 4: GOVERNANCE POSTURE

### Entry Criteria
Scale profile complete.

### Actions
1. **Inventory existing risk-tooling footprint:**
   - Aladdin / MSCI RiskMetrics / Moody's Analytics CRE / Trepp Analytics / RiskSpan / Altus Argus  --  which they disclose using (investor deck, earnings call, press release, vendor case study)
   - In-house model-risk-management function  --  existence and size (bank targets: Federal Reserve SR 11-7 MRM function; fund targets: disclosed in Form ADV)
   - Data science team  --  from LinkedIn headcount and org-chart signals
   - Published research or patents  --  USPTO / Google Scholar / arxiv searches on named analysts

2. **Grade the posture gap (what we can offer that they don't have):**

   | Posture | Gap we close | Implied receptivity |
   |---|---|---|
   | No risk tooling + no MRM | Everything  --  but they may not be buyers | Low (budget problem) |
   | Spreadsheet + consultants | Core evidence artifact | Medium |
   | Aladdin or Trepp, no runtime governance | Runtime + evidence + insurance leg | **High  --  ideal profile** |
   | In-house model-risk function, no external tooling | Evidence artifact + insurance leg | High |
   | Full stack including a runtime governor | Small  --  likely pass | Very low |

3. **Identify the recent-hire signal.** Any CRO, CCO, Chief Model Risk Officer, Head of Quant / Head of Data Science hired in the last 18 months is a high-receptivity signal  --  new executives want a new platform.

### Output
`governance_posture` per target
### Quality Gate
Posture is backed by at least two evidence sources (vendor press release + LinkedIn org-chart, or 10-K disclosure + conference talk). No posture grade derived from a single source.

---

### Phase 5: RECEPTIVITY SIGNALS

### Entry Criteria
Scale + posture complete.

### Actions
1. **Scan for event-driven buying windows (last 12 months):**
   - **Regulatory event**  --  OCC / Fed / FDIC consent order, MRA, horizontal-review finding; SEC enforcement; state insurance regulator actions
   - **Impairment event**  --  reported CRE loan loss provisions elevated vs. prior quarter; non-accrual jump; REO/OREO balance jump
   - **Leadership change**  --  new CEO / CRO / CIO / CCO / Chief Risk Model Officer
   - **Fundraise event**  --  private fund in market (Form D filings, PitchBook signals); bank capital raise
   - **M&A event**  --  announced / pending acquisition on either side; integrations create governance urgency
   - **LP pressure event**  --  public LP letter / side-letter concessions; allocator downgrade
   - **Earnings-call keyword hits**  --  "model risk", "runtime monitoring", "audit trail", "insurance renewal", "risk grade" (scrape prior 2 quarterly calls)

2. **Score receptivity 0–10** with half the weight on recency  --  a consent order this quarter is worth 10× a consent order two years ago.

3. **Tag the window type**:
   - **Urgent now**  --  active consent order, active fundraise, new exec < 6 months, pending renewal
   - **Near**  --  event 6–12 months old; board-level review in progress
   - **Quiet**  --  no visible signals

4. **Cross-check with Phase 3 RAG exposure.** A target with *both* a recent impairment event *and* high `governed_decline_pct` is priority-one.

### Output
`receptivity_events` per target
### Quality Gate
Every target has at least one signal attempted (even if result is "quiet"). Each signal has a source link and a date. "Urgent now" tag requires at least two concurrent signals  --  prevents hype inflation.

---

### Phase 6: WARM-PATH INVENTORY

### Entry Criteria
People-level access is not required here (that's the next flow). This phase stays company-level: what *institutional* warm paths exist?

### Actions
1. **Institutional warm paths** (not individual LinkedIn connections  --  those are the next flow's job):
   - Shared investor: any LP or shareholder in both Wayfinder (if/when raised) and target
   - Shared board: overlap of directors
   - Shared advisor / consultant / counsel
   - Conference co-sponsorship or co-appearance in last 12 months (CREFC, IMN, NAREIT, AFIRE, PERE Investors)
   - Industry-body co-membership (CRE Finance Council committees)
   - Prior commercial relationship of any kind (even if adversarial  --  prior counterparty on a deal is a warm path)

2. **Score warm-path availability** 0–5.

### Output
`warm_paths` per target (institutional layer only; individual-person layer handled in `ip-licensing-prospect`)
### Quality Gate
Every warm-path claim has a specific named overlap  --  no "probably shared LPs" type entries. Zero warm paths is a valid result; do not manufacture them.

---

### Phase 7: DEMO ARTIFACT GENERATION  --  *the first-meeting weapon*

### Entry Criteria
Phases 3 (RAG) and 4 (posture) complete. Run only for top N targets per `max_targets_deep_profile`.

### Actions
1. **Assemble the observable book.** For the target, pull:
   - Public CMBS loan-level positions (where they are originator, B-piece buyer, servicer, or advertised holder)
   - Publicly disclosed property holdings (REIT 10-K Exhibit 21, fund disclosed investments, press releases on named acquisitions)
   - Disclosed loan portfolios from call reports (banks: Schedule RC-C line items + HMDA CRE proxies)
   - Public filings referencing specific properties or borrowers

2. **Run the observable book through `GovernedCRERunner`** in replay mode against the last 24 months of data. Capture:
   - Number of deals scored DECLINE or CONSTRAINED
   - Dollar volume flagged
   - Trust-trajectory time series on the top-5 largest positions
   - Constraint pressure summary (which constraints would have bound most often)
   - Near-miss list (deals that *didn't* impair but came close by Governor metrics)

3. **Generate the ActuarialReport** via `auditor.py` with the target-specific inputs:
   - MTBF of observed impairments vs. Governor-flagged deals
   - Availability (% of book under continuous governance)
   - Risk grade A–F for the observable portfolio
   - Hypothetical avoided-loss figure

4. **Package into a 3-page prospect-facing brief:**
   - Page 1  --  "What your book looks like through the governance"  --  headline numbers, one chart
   - Page 2  --  Three specific deals (named by CMBS deal ID, anonymized borrower if needed) that would have been scored CONSTRAINED with the specific constraint that would have bound
   - Page 3  --  "What this would have saved you, and what it would cost to deploy"  --  hypothetical avoided loss vs. estimated Year-1 ACV at their tier

5. **Watermark** every page `Confidential  --  Pre-Pitch Analysis  --  Not for Distribution  --  Prepared by The Wayfinder Trust, [date]`.

### Output
`demo_artifact` per target
### Quality Gate
Every deal named on Page 2 is a real deal traceable to a public CMBS loan-level record. No fabricated borrower names. Every dollar number on Page 3 is produced by an audited method (scoring_audit section links the calculation). Brief fits on 3 pages with reasonable type size  --  not shrunk-to-fit.

---

### Phase 8: SCORE, TIER, ACV ESTIMATE

### Entry Criteria
Phases 2–6 complete for every target; Phase 7 complete for top N.

### Actions
1. **Apply the scoring rubric** (defaults  --  overridable via `scoring_weights`):

   | Dimension | Max | What it measures |
   |---|---|---|
   | Scale | 25 | log-scaled AUM: $250M = 5, $1B = 12, $5B = 18, $20B = 25 |
   | Pay capacity | 20 | Pay-capacity proxy (Phase 2) vs. estimated Year-1 ACV  --  if proxy > 3× ACV, full 20; 1×–3× = linear; <1× = 0 |
   | Pain intensity (RAG) | 25 | Weighted sum of: governed_decline_pct (0–10), shadow_cmbs_exposure (0–8), basel_concentration_flag (0–4), hypothetical_avoided_loss tier (0–3) |
   | Governance gap | 15 | Posture table in Phase 4 |
   | Receptivity | 10 | Phase 5 event score, half weight on recency |
   | Warm path | 5 | Phase 6 score |
   | **Total** | **100** | |

2. **Tier placement:**
   - **T1 Enterprise** (score ≥ 80, scale ≥ 18)  --  ACV $3M+
   - **T2 Strategic** (65–79)  --  ACV $1–3M
   - **T3 Core** (50–64)  --  ACV $400K–$1M
   - **T4 Emerging / nurture** (35–49)  --  ACV $150–400K
   - **Disqualify** (<35 or capacity proxy < 0.5× ACV)

3. **Estimate the ACV per target** by walking the Patent_Families_A_B_Business_Plan_Pricing.md pricing structure using the target's actual AUM and RAG-derived Shared-Savings opportunity. Produce low / mid / high ACV bounds.

4. **Assign urgency grade A–F** using receptivity × RAG pain intensity × warm-path availability.

5. **Produce `recommended_next_action` per target:**
   - **A-urgency T1/T2**  --  Hand demo artifact to named champion via warm path within 14 days
   - **B-urgency T1/T2**  --  Conference or industry event approach in next 60 days
   - **C-urgency, any tier**  --  Add to quarterly nurture sequence
   - **D–F**  --  Deprioritize; re-score at next cycle

6. **Pre-build top 3 objections per tier** with responses drawn from Phase 4 governance-posture data  --  because the objections differ (T1 enterprise says "we already have an MRM function"; T4 emerging says "can't afford this year").

7. **Sensitivity check:** perturb each weight by ±20%; flag any target whose tier flips. Tier flippers need manual review before outreach.

### Output
`prospect_scorecards`, `prospect_ranking`, `next_action_queue`, `objection_prebuild`, `scoring_audit`
### Quality Gate
Every top-N target has all eight dimension scores, total score, tier placement, ACV estimate (low/mid/high), urgency grade, and a specific recommended next action with an owner and due date. Sensitivity check run and tier-flippers flagged.

---

## Exit Criteria

The flow is DONE when:

1. `prospect_universe` contains 200+ deduplicated, ID-stamped entries
2. `prospect_scorecards` covers at least the top 25 (or `max_targets_deep_profile`) with full 8-phase profiling
3. `rag_signal_log` shows every top-N target crossed against the full RAG surface
4. `demo_artifacts` contains one 3-page brief per top-ranked target, every numeric claim sourced
5. `prospect_ranking` is ordered with tiebreaker rules documented
6. `next_action_queue` has a specific action, owner, and due date per top-N target
7. `scoring_audit` includes weights, score breakdowns, and sensitivity perturbation results
8. `objection_prebuild` covers the top 3 objections per tier with pre-drafted responses

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| UNIVERSE BUILD | A registry source is offline | Fall back to secondary sources per the table; mark affected entries with `source_degraded: true` |
| SCALE & CAPACITY | AUM not disclosed (private fund) | Use Form ADV 5.F estimate; if still missing, estimate from fund vintage × typical AUM ladder; lower confidence flag |
| RAG SIGNAL OVERLAY | Target has no CMBS / public loan-level presence (e.g., private-credit boutique) | Fall back to `fhfa_hpi` + `census_permits` on disclosed geographies; Phase 7 demo artifact reduces to portfolio-level heatmap instead of named-deal list |
| RAG SIGNAL OVERLAY | `governed_decline_pct` implausibly high (>60%) | Almost always a data alignment bug  --  fail the target into manual review rather than ship an inflated demo |
| GOVERNANCE POSTURE | Posture signals conflict (vendor press release vs. recent earnings-call contradicting it) | Prefer the more recent source; note conflict in scorecard |
| RECEPTIVITY | No event signals visible | Valid result  --  mark `quiet`, lower urgency grade, keep in nurture |
| WARM-PATH INVENTORY | Zero warm paths found | Valid result  --  escalate to `ip-licensing-prospect` with "cold outreach  --  no institutional warm path" flag; cost is higher, still possible |
| DEMO ARTIFACT | Observable book is too small (<5 named positions) | Produce segment-level rather than portfolio-level demo; label it as illustrative |
| SCORE & TIER | Large number of tier-flippers in sensitivity | Weights are poorly calibrated  --  re-run with tighter weight ranges before shipping rankings |

## State Persistence

- `prospect_registry`: Every target ever profiled  --  name, segment, all scorecard versions by date, outreach status, response, conversion or deprioritization reason
- `rag_signal_history`: Per target, RAG signal values over time  --  detect trend changes (a target that just crossed into red severity on shadow_cmbs_exposure is a new hot lead)
- `governance_posture_changes`: Vendor switches, new MRM hires, disclosed tooling changes  --  each is a receptivity event on next re-score
- `warm_path_ledger`: Institutional overlaps discovered, with freshness dates
- `objection_library`: Which pre-built objections fired in real conversations, and whether the pre-built responses worked  --  feeds Phase 8 for future runs
- `demo_artifact_archive`: Every brief produced, with the snapshot date of the RAG data used; supports reproducibility and re-pitch against a refreshed book
- `tier_migration_log`: When a target moves between tiers (e.g., T3 → T1 because of a new impairment); drives the nurture-to-active transition

---

## Integration with the Three-Flow Chain

This flow is the **upstream** of a three-flow chain for Wayfinder CRE licensing:

```
cre-prospect-intelligence  ──(scorecards + next_action_queue)──▶
      ip-licensing-prospect  ──(named human + entry strategy)──▶
            cre-ip-license-launch  ──(signed MoU + license + term sheet)──▶  $$$
```

- **Feeds forward**  --  `prospect_scorecards` + `next_action_queue` are direct inputs to `ip-licensing-prospect` (which names the human) and `cre-ip-license-launch` (which sets ACV anchor for term sheet).
- **Cadence**  --  runs **weekly** as a standing job (re-score deltas are the alpha). The downstream flows run per-target when a target surfaces into urgent status.
- **RAG double-duty**  --  the same Risk Analytics Governor codebase that is the *product* we license **is also the qualifying instrument for prospects**. Sunk cost of building RAG pays twice: once as product revenue, once as sales-qualification moat that no competitor can replicate without also owning the Governor.
- **Re-score on signal changes**  --  Phase 3 `rag_signal_history` watches for new red-severity hits and re-runs Phase 5/8 automatically; targets auto-surface into the urgent queue without manual sweeping.

## Cross-References

- Business plan source of truth: `Documents/Business Investor/Patent_Families_A_B_Business_Plan_Pricing.md`
- Risk Analytics Governor source: `IP/projects/Risk_Analytics_Governor/risk_analytics/cre/`
- Shadow-CMBS signal generator: `risk_analytics/cre/data_feeds/cre_shadow_signal.py`
- CMBS / borrower data feeds: `risk_analytics/cre/data_feeds/edgar_cmbs.py`, `borrower_exposure.py`
- ActuarialReport generator: `risk_analytics/cre/data_feeds/auditor.py`
- Downstream flow  --  decision-maker resolution: `marketplace/ip-licensing-prospect/skill.md`
- Downstream flow  --  artifact production: `marketplace/cre-ip-license-launch/skill.md`
- Sibling-vertical expansion template: use this flow's structure for future `*-prospect-intelligence` flows when we expand from CRE to residential mortgage, specialty finance, quant asset management, etc.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
