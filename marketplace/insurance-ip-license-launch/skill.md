# Insurance IP License Launch

Turns the Wayfinder Trust Patent Families A (governance  --  runtime actuation governance) and B (governance engine  --  runtime learning governance) into a **signable, revenue-generating** licensing motion in the Insurance / Reinsurance vertical. Produces the six artifacts required to move from "we have a business plan" to "we have signed customers": Lloyd's-wave pilot kit, reinsurer + broker MoU pack, master license template with 18 mechanism addenda, nine stack-specific design-partner term sheets, standards-acknowledgment track (NAIC / EU AI Act / BMA / PRA), and adjacent-market expansion kit.

**Why this exists:** The business plan is directionally right; it becomes executable only when the contractual surfaces below exist and are in the right hands at the right time, in the right order.

**Core principle:** Sequence by leverage. Do not pitch a primary carrier before the reinsurer channel has acknowledged the artifact. Do not ship a term sheet before the master license exists. The order is **(Lloyd's → reinsurer → broker) → (master license + term sheets) → (carrier design partners) → (rating agency + standards track) → (adjacent markets + ILS + captive)**.

## Execution Pattern: Phase Pipeline

```
PHASE 1: LLOYD'S WAVE               --> Syndicate pilot + Lloyd's Lab / Product Launchpad
PHASE 2: REINSURER + BROKER WAVE    --> Reinsurer MoU + reinsurance-broker channel MoU
PHASE 3: MASTER LICENSE TEMPLATE    --> Base + premium bps + CR-improvement + 18 mechanisms
PHASE 4: DESIGN-PARTNER TERM SHEETS --> Stack-layer-specific: carrier / Lloyd's / reinsurer / Big-Actuarial / core-system vendor / rating agency / ILS / captive manager / reinsurance broker
PHASE 5: STANDARDS TRACK            --> NAIC BDAI submission + EU AI Act EIOPA + Bermuda BMA + UK PRA
PHASE 6: ADJACENT-MARKET EXPANSION  --> Warranty, trade credit, mortgage, pension-risk-transfer, specialty D&O
```

Phases 1, 2 run in parallel (independent workstreams). Phase 3 runs after Phase 2 MoU language is established. Phase 4 depends on Phase 3. Phase 5 runs in parallel with Phase 4 on a longer clock. Phase 6 depends on Waves 4–5 revenue signals.

## Inputs

- `licensor`: "The Wayfinder Trust"
- `commercial_licensee`: "the governance provider Group"
- `inventor`: "Jonathan Luethke"
- `patent_families`: `[{family: "A", name: "governance"}, {family: "B", name: "governance engine"}]`
- `vertical`: "Insurance / Reinsurance"
- `business_plan_ref`: `Documents/Business Investor/Patent_Families_A_B_Business_Plan_Pricing_Insurance.md`
- `preflight_blockers_cleared`: bool  --  from master playbook; gates Phase 3 signing
- `insurance_rag_status`: string  --  `"not_started" | "in_development" | "mvp_live" | "production"`
- `target_waves_in_flight`: list[int]  --  which of Wave 1–7 are currently active

## Outputs

- `context_digest`: one-page summary of positioning usable as first-page context in any new conversation
- `lloyds_outreach_kit`: list of Lloyd's syndicate targets, Lloyd's Lab application draft, Product Launchpad application draft, syndicate-specific pilot proposals
- `reinsurer_broker_outreach_kit`: reinsurer-MoU target list + reinsurance-broker channel-partnership target list + draft MoUs for each
- `master_license_template`: full clauses per §Phase 3
- `stack_specific_term_sheets`: dict[stack_layer → term_sheet_template]  --  primary_carrier, lloyds_syndicate, reinsurer, big_actuarial, core_system_vendor, rating_agency, ils_manager, captive_manager, reinsurance_broker
- `standards_submission_bundle`: `{naic_bdai_submission, eu_ai_act_input_memo, bma_briefing, pra_briefing}`
- `adjacent_market_entry_kits`: per adjacent market, targeted per business plan §2 adjacent-market list
- `six_artifact_kit`: bundled deliverable  --  all the above ready to ship
- `risk_register`: failure modes + mitigations
- `wave_activation_log`: which waves have been activated when, with milestones

---

## Execution

### Phase 1: LLOYD'S WAVE

### Entry Criteria
Business plan endorsed internally. Lloyd's syndicate universe built (per `insurance-prospect-intelligence`). Named contacts confirmed at 2–3 target syndicates.

**Why first:** Lloyd's is culturally open to novel evidence formats, syndicates bind in 30-day cycles vs carrier 12-month cycles, and Lloyd's Lab / Product Launchpad actively sponsor governance innovations. First paid reference is fastest here.

### Actions
1. **Identify 3–5 target syndicates** from prospect-intelligence top-ranked Lloyd's entries. Diversify across specialty classes (cyber, D&O, E&O, parametric, casualty).
2. **Draft Lloyd's Lab Innovation Cohort application**  --  align with Lloyd's Lab current-cycle themes.
3. **Draft Product Launchpad application**  --  pitch runtime governance as enabling compliant adaptive-AI-priced products.
4. **Per syndicate, produce a pilot proposal:**
   - Scope: 1 line of business, 6-month pilot, governance applied to existing underwriting + retraining loop
   - Deliverables: syndicate-specific ActuarialReport + Lloyd's-market-format export
   - Cost: free Year 1; Year 2+ full rate card with MFN
   - IP: Wayfinder retains all rights; syndicate receives non-exclusive use
5. **Prepare syndicate-specific objection playbook** (managing-agent approval, Lloyd's Market Oversight, initial-cohort positioning).
6. **Success criteria:**
   - Lloyd's Lab or Launchpad acceptance within 90 days of application
   - 1 syndicate pilot-live within 120 days of outreach
   - 1 syndicate producing its first ActuarialReport within 180 days

### Output
`lloyds_outreach_kit`
### Quality Gate
Every target syndicate has a named contact + pilot proposal + objection playbook tailored to that syndicate's line of business. Lloyd's Lab + Launchpad applications are submission-ready.

---

### Phase 2: REINSURER + BROKER WAVE

### Entry Criteria
Business plan endorsed. Reinsurer universe built. Named contacts at 2–3 reinsurers and 1–2 reinsurance brokers.

**Why in parallel with Lloyd's:** Reinsurer acceptance of the ActuarialReport as RoL-pricing input is the leverage channel for all downstream carrier work. Both workstreams can advance in parallel.

### Actions
1. **Identify reinsurer targets**  --  SCOR, RenaissanceRe, PartnerRe, Odyssey Re, Everest Re (Bermuda desk)  --  distinct entries from the CRE list's Munich Re Specialty NA / Swiss Re Corporate Solutions / Hannover Re NA P&C desks.
2. **Draft reinsurer MoU template:**
   - Non-binding, 12-month term
   - Ask: accept ActuarialReport as one loss-cost input for RoL pricing on 3 pilot treaties, across 3 lines of business
   - Reinsurer commit: if artifact meets agreed quality bar, offer modest RoL discount vs ungoverned equivalent
   - Wayfinder commit: artifact production on 3 pilot treaties, technical integration support, broker-placement coordination
   - No exclusivity either direction
3. **Identify reinsurance-broker targets**  --  Guy Carpenter (specialty-casualty practice), Aon Re (cyber/D&O practice), Howden Re, Gallagher Re, WTW Re  --  separate from CRE property practice contacts.
4. **Draft reinsurance-broker channel-partnership LOI:**
   - Non-binding, 12-month term
   - Broker includes ActuarialReport in submission packages for governed-cedant treaties where cedant elects
   - Financial: 2–4% of treaty commission on governed placements brokered by them (per M15-ins)  --  optional activation after 6-month pilot
5. **Per reinsurer/broker, stack-specific objection playbook.**
6. **Success criteria:**
   - ≥1 reinsurer MoU signed within 90 days
   - ≥1 broker channel LOI signed within 120 days
   - Reinsurer-acknowledgment quantum (RoL discount) established before first carrier pitch

### Output
`reinsurer_broker_outreach_kit`
### Quality Gate
MoU + LOI templates counsel-ready. Every target has named contact, pitch, objection playbook. Reinsurer-acknowledgment quantum range pre-negotiated internally.

---

### Phase 3: MASTER LICENSE TEMPLATE

### Entry Criteria
Business plan endorsed. Design-partner candidate list built. Master playbook preflight substantially addressed (the governance provider Group incorporated, Wayfinder→Northstar license executed).

### Actions
1. **Standard commercial-software license scaffolding:** preamble, definitions, grant, restrictions, fees, audit, confidentiality, warranties & disclaimers, indemnity, LoL, termination, governing law, boilerplate.

2. **Insurance-specific commercial clauses:**

   **A. Fee Schedule Exhibit  --  Core Pricing**
   - Base License tiered by segment scale (§3.1: T1 $200K, T2 $450K, T3 $1.0M, T4 $2.0M)
   - Premium Royalty schedule (primary / reinsurer / ILS separate schedules per §3.2)
   - Multi-jurisdictional add-on per §3.1
   - Invoice cadence: Base quarterly in advance; royalty quarterly in arrears; CR-improvement annually in arrears

   **B. Combined-Ratio Improvement Share Addendum**
   - Baseline = last-3-year rolling CR normalized for cat and mix at contract signing
   - Realized improvement calculation per channel (LR / LAE / ER)
   - Wayfinder share: 25% / 30% / 20% respectively per §3.3
   - Guardrails: zero-floor, 2× cap, 3-year re-baseline, neutral consulting-actuary attribution
   - Exposure-index normalization clause

   **C. Mechanisms Menu Addenda (M1–M18, optional, customer-elected)**
   - Separate sub-addendum per applicable mechanism; customer elects at signing
   - Economic terms per mechanism per business plan §4
   - Interplay rules  --  e.g., M7 rebate calculated against Base + Premium royalty only

   **D. IP Ownership & License Grant**
   - Wayfinder Trust retains all rights in Patent Family A and Family B
   - Grant: **non-exclusive, non-transferable, non-sublicensable, field-of-use limited** to customer's insurance portfolio and specified lines of business
   - Customer-specific derivative works owned by Wayfinder with perpetual royalty-free license back to customer
   - Audit right: Wayfinder may audit premium-scale and CR-share calculations once per 12-month period, 30-day notice

   **E. Audit-Chain Evidence Clause**
   - Each ActuarialReport carries SHA-256 content-hash + session-root-hash (Family A native, tamper-evident)
   - Customer receives verification keys for independent confirmation of hash integrity
   - Supersede / amendment path if reports are corrected

   **F. Governance-Layer E&O Warranty**
   - Wayfinder warrants it carries governance-layer E&O at disclosed coverage level ($50M+ tower target)
   - Remedies for breach: pro-rated refund + 12 months maintenance credit

   **G. Termination & Data**
   - Either party, 90 days notice for convenience (no refunds on prepaid Base)
   - For cause: 30 days cure
   - Tail obligations: governance-attributable value (CR share, mechanism economics) persists for 24 months post-termination on events realized during the term
   - Customer receives read-only export of governance telemetry on termination; Wayfinder retains anonymized aggregate rights (with M6 consortium participation requiring separate opt-in)

   **H. Governing Law**
   - Delaware (or NY); JAMS arbitration with equitable-relief carve-out
   - For Lloyd's syndicates and Bermuda reinsurers, optional UK-law or Bermuda-law variant

3. **MFN clause** bounded to first 5 design partners per business plan §6 wave structure.

4. **Exposure Index definition**  --  weighted-average of DWP + reserve balance + NPW, quarterly certified by customer-selected consulting actuary.

5. **Red-team the template**  --  pushback points per stack layer (primary carrier GC, reinsurer legal, Lloyd's managing agent, MGA counsel), with pre-committed fallback positions.

### Output
`master_license_template`
### Quality Gate
Counsel-ready. Every numerical threshold has definition + measurement method. CR-share math walkable by a non-actuary in under 10 minutes. MFN bounded.

---

### Phase 4: STACK-SPECIFIC DESIGN-PARTNER TERM SHEETS

### Entry Criteria
Phase 3 substantially drafted (counsel-review round underway is acceptable).

**Why per stack layer:** Rating agencies, Lloyd's syndicates, reinsurers, primary carriers, Big-Actuarial, ILS managers, captive managers, core-system vendors, and reinsurance brokers each buy a DIFFERENT product with DIFFERENT economics.

**Actions  --  produce a term sheet per stack layer (9 total, each 2 pages):**

1. **Primary carrier design-partner term sheet**  --  free Year 1 + 50% off Years 2–3 + full price Year 4 + MFN + warrant kicker (M8-ins) + milestones (integration live, first production underwriting routed through Governor, first insurance renewal with ActuarialReport attached) + exclusivity on competing runtime governor during partner period.
2. **Lloyd's syndicate design-partner term sheet**  --  pilot-specific (6–12 month pilot terms), managing-agent approval path built in, Lloyd's Lab / Launchpad integration where relevant, clear extension path to full rate card.
3. **Reinsurer design-partner term sheet**  --  cedant-book evidence pilot, 3 pilot treaties across 3 lines, RoL discount quantum pre-committed, M3-ins two-sided fee activation at production, M5-ins capital-relief activation per regulator engagement.
4. **Big-Actuarial channel partnership term sheet**  --  consulting-practice use rights, co-branded deliverable option, quarterly engagement review, revenue share on joint engagements.
5. **Core-system vendor OEM embed term sheet**  --  integration architecture, per-end-customer royalty schedule, co-marketing, customer data handling, 3-year exclusivity option with right to extend, 24-month integration milestones.
6. **Rating-agency tool-license term sheet**  --  M11-ins licensing reversal, annual flat license, per-rated-entity data-royalty option, independence clauses (Wayfinder cannot influence agency's ratings; agency cannot influence Wayfinder's customer selection), information-barrier terms, 2-year initial term with 2-year renewal.
7. **ILS manager term sheet**  --  M10-ins per-tranche license, capital-raised bps, cat-bond-specific clauses, disclosure-to-investor language.
8. **Captive manager platform-license term sheet**  --  M14-ins captive-platform architecture, per-captive royalty, M1-ins captive-architect fee schedule, multi-domicile support (Bermuda, Vermont, Cayman, Guernsey), 3-year term + 3-year renewal.
9. **Reinsurance broker channel-partnership LOI**  --  M15-ins treaty-commission share, submission-package inclusion, per-placement documentation standards, co-marketing, 12-month initial pilot → 3-year commercial extension.

### Output
`stack_specific_term_sheets`
### Quality Gate
Nine templates, each 2 pages, stack-layer-specific, each with a warrant or upside structure where applicable, each with a clear wave assignment (per business plan §6). Every dollar and date is either fixed or explicitly marked `[TBD]`.

---

### Phase 5: STANDARDS TRACK

### Entry Criteria
Business plan endorsed; Phase 3 + 4 underway (this runs in parallel on a longer clock).

**Why it runs in parallel:** Standards acknowledgment is a long clock (12–24 months) and must run concurrently with commercial revenue. Each standards acknowledgment opens commercial pricing power downstream.

### Actions
1. **NAIC BDAI Working Group submission**  --  submit ActuarialReport schema as reference implementation of the NAIC AI Model Bulletin. Target: adoption language in next bulletin revision within 12–24 months.
2. **EIOPA + EU AI Act implementing-act input memos**  --  submit via public consultation windows. Target: Article 9 + 12 + 17 compliance acknowledgment for insurance high-risk AI.
3. **Bermuda BMA briefing**  --  direct briefing to BMA insurance-supervision division. Target: BMA acknowledgment in 12 months.
4. **UK PRA briefing**  --  parallel path to BMA via Lloyd's relationships. Target: PRA acknowledgment in 12–18 months.
5. **State DOI regulatory sandbox applications**  --  NY, CA, TX, FL. Pursue safe-harbor language for carriers using the Wayfinder artifact.
6. **Rating agency engagements**  --  AM Best first (historically most receptive), then S&P, Moody's, Fitch. Target: M11-ins licensing reversal scoping by each.

### Output
`standards_submission_bundle`
### Quality Gate
All six workstream owners identified; each submission/briefing has a named responsible party + target date + current status.

---

### Phase 6: ADJACENT-MARKET EXPANSION

### Entry Criteria
Waves 1–5 producing revenue. Insurance RAG extension path underway or scoped.

### Actions
1. **Select 2 adjacent markets for first expansion** per business plan §2  --  typically trade credit + mortgage insurance OR warranty + specialty D&O. Criteria: lowest friction to scale model; highest ACV per deal.
2. **Per adjacent market, produce entry kit:** adjacent-market-specific pricing tier (scale unit may differ), 3–5 named targets, objection playbook specific to that market, regulatory context.
3. **Standardize the adjacent-market expansion process**  --  reusable template derived from the insurance-core work.

### Output
`adjacent_market_entry_kits`
### Quality Gate
2 markets scoped with fully executable entry kits. Process documentation usable by future market expansions.

---

## Exit Criteria

The flow does not complete  --  it runs continuously. A single **cycle** is complete when:

1. Lloyd's Wave produces at least 1 signed syndicate pilot within 120 days of Phase 1 kickoff
2. Reinsurer + Broker Wave produces ≥1 reinsurer MoU + ≥1 broker channel LOI within 120 days
3. Master License Template: counsel-reviewed; first 3 design partners sign against it
4. Stack-Specific Term Sheets: 9 templates counsel-reviewed
5. Standards Track: ≥3 of the 6 submissions in flight with named owners
6. Adjacent Market: 1 market entered with first target engaged

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| LLOYD'S WAVE | No syndicate accepts pilot | Pivot to Lloyd's Lab / Launchpad cohort path; reposition syndicate outreach as follow-on |
| LLOYD'S WAVE | Managing agent rejects | Move to next syndicate; pilot terms may need softening |
| REINSURER | Reinsurer declines to quantify RoL discount | Accept artifact-acceptance without RoL discount; M2-ins economics deferred |
| REINSURER | No reinsurer MoU in 90 days | Reach out to Lloyd's-market reinsurers (faster via Phase 1 warm paths) |
| BROKER | Broker declines channel partnership | Pursue direct-to-carrier; M15-ins economics deferred |
| MASTER LICENSE | Large-customer GC rejects MFN | MFN applies only to first 5 design partners |
| MASTER LICENSE | CR-share math rejected as too complex | Offer simplified LR-only share for first 3 design partners |
| TERM SHEETS | Stack-layer customer rejects warrants (M8-ins) | Substitute extended MFN + larger Year 2–3 discount |
| STANDARDS TRACK | NAIC submission rejected / delayed | Focus on state DOI sandboxes + EU AI Act independently |
| STANDARDS TRACK | Rating agency declines M11 | Revenue model holds without |
| ADJACENT MARKET | Adjacent-market target unresponsive | Pivot to different adjacent market |

## State Persistence

- `deal_registry`: every MoU, LOI, license, design-partner agreement
- `mfn_ledger`: which of first 5 design partners hold MFN
- `lloyds_pipeline`: syndicate status + Lloyd's Lab / Launchpad status
- `reinsurer_pipeline`: MoU stage per counterparty
- `broker_channel_pipeline`: LOI stage per broker
- `standards_submission_log`: each submission with status + responses
- `adjacent_market_log`: market-entry progress
- `mechanisms_elected`: per customer, which of M1–M18 are active; baselines captured; realized benefits YTD
- `artifact_submission_log`: every ActuarialReport sent to external counterparty

---

## Cross-References

- Business plan: `Documents/Business Investor/Patent_Families_A_B_Business_Plan_Pricing_Insurance.md`
- Upstream flow (prospect intelligence): `marketplace/insurance-prospect-intelligence/skill.md`
- Pipeline orchestrator: `marketplace/insurance-license-pipeline/skill.md`
- Decision-maker resolution: `marketplace/ip-licensing-prospect/skill.md`
- Sibling-vertical precedent: `marketplace/cre-ip-license-launch/skill.md`
- Master cross-vertical playbook: `IP/projects/MarketingOutreach/outreach_master_playbook.md`
- Outreach list deliverable: `Documents/Business Investor/Insurance_Reinsurance_Outreach_List.md`

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
