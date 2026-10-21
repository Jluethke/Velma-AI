# CRE IP License Launch

Turns the Wayfinder Trust Patent Family A (governance  --  runtime actuation governance) and Family B (governance engine  --  runtime learning governance) into a signable, revenue-generating CRE licensing business. Produces the three artifacts required to go from "we have a business plan" to "we have a first customer": a carrier-MoU outreach list, a master license template with the Base + AUM + Shared-Savings + clever-mechanism menu wired in, and a design-partner term sheet with warrant kicker.

**Why this exists:** The business plan in `Documents/Business Investor/Patent_Families_A_B_Business_Plan_Pricing.md` is directionally right but not executable on its own. A plan becomes revenue only when the three contractual surfaces below exist and are in the right hands at the right time, in the right order.

**Core principle:** Do not approach a customer before the carrier side will accept the artifact, because the shared-savings component dies without it. Do not send a term sheet before the master license exists, because design partners want to see the thing they are piloting. The order is **carrier → license → partner**, not the other way around.

## Execution Pattern: Phase Pipeline

```
PHASE 0: CONTEXT LOAD          --> Re-anchor on Families A+B, CRE pricing, 8 mechanisms
PHASE 1: CARRIER MoU OUTREACH  --> Who accepts the ActuarialReport as evidence
PHASE 2: MASTER LICENSE TEMPLATE --> Base + AUM + Shared Savings + Mechanisms Menu
PHASE 3: DESIGN-PARTNER TERM SHEET --> MFN + warrant kicker + free/cost-recovery year
```

Phases 1, 2, 3 can run in parallel once Phase 0 is complete, but Phase 3 cannot sign until Phase 2 is drafted and Phase 1 has at least one carrier MoU in hand.

## Inputs

- `licensor`: string  --  "The Wayfinder Trust"
- `inventor`: string  --  "Jonathan Luethke"
- `patent_families`: list[object]  --  `[{family: "A", name: "governance", governs: "actuation"}, {family: "B", name: "governance engine", governs: "learning"}]`
- `vertical`: string  --  "Commercial Real Estate (CRE)"
- `pricing_structure`: object  --  `{base_tiered: true, aum_bps: [5,4,3,2], shared_insurance: true, mechanisms_menu: [M1..M8]}`
- `product_surface`: object  --  `{governor: "GovernedCRERunner", artifact: "ActuarialReport", modules: ["TenantEquityBridge", "Shadow CMBS"]}`
- `business_plan_ref`: string  --  path to `Patent_Families_A_B_Business_Plan_Pricing.md`
- `target_state`: string  --  "US, NY/NJ CRE corridor first; expand nationally after first 3 paid"
- `timeline`: object  --  `{carrier_mous: "60 days", first_design_partner: "90 days", first_paid: "180 days"}`

## Outputs

- `context_digest`: object  --  One-page summary of what has already been decided (families, pricing, mechanisms, illustrative ACV). Used to brief every new conversation.
- `carrier_outreach_list`: list[object]  --  Ranked carriers/MGAs/brokers: `{name, line_of_business, why_them, contact_path, draft_pitch, expected_mou_terms}`
- `master_license_template`: object  --  Full draft with all clauses: `{base_schedule, aum_schedule, shared_savings_clause, mechanisms_menu_clauses, mfn_clause, audit_clause, termination, governing_law}`
- `design_partner_term_sheet`: object  --  `{partner_profile, commercial_terms, warrant_kicker, milestones, reference_rights, exclusivity, expiry}`
- `three_artifact_kit`: object  --  Bundled package ready to ship to counsel for redline: all three artifacts + context digest + the business plan as annex.
- `risk_register`: list[object]  --  Top failure modes for each artifact + pre-committed mitigations.

---

## Execution

### Phase 0: CONTEXT LOAD

### Entry Criteria
`business_plan_ref` exists and is readable. Patent Family A + B provisionals are at least drafted (READY status in their respective `README.md`).

### Actions
1. **Load the canonical business plan.** Read `Documents/Business Investor/Patent_Families_A_B_Business_Plan_Pricing.md` and extract:
   - Core three-part fee (Base + AUM bps + Shared Insurance Savings)
   - The four CRE buyer archetypes (lender / sponsor / insurer / servicer)
   - The eight clever mechanisms (M1 Captive, M2 Warehouse, M3 Two-Sided, M4 Avoided-Loss, M5 Capital Relief, M6 Consortium, M7 Quiet-Book, M8 Warrants)
   - The $5B illustrative customer ($4.52M Wayfinder ACV / $14.44M customer value created)

2. **Compress to a one-page context digest.** Structure:
   - What we sell (2 bullets: Family A actuation, Family B learning)
   - Who we sell to (4 bullets: the buyer archetypes)
   - How we charge (3 base + 8 optional mechanisms)
   - The proof number (ACV vs. customer benefit)

3. **Pin the invariants that downstream phases must respect:**
   - Wayfinder Trust retains all IP ownership  --  **licenses only, no assignment**
   - Shared-savings component is **zero-floor, capped at 2× AUM royalty, net of exposure growth**
   - First 5 design partners receive **most-favored-nation (MFN)** pricing
   - No design partner agreement signs without at least one carrier MoU in hand

### Output
`context_digest`
### Quality Gate
Digest fits on one page. A stranger reading only the digest can answer: "What do we sell, to whom, for how much, and why does it matter?" without asking a follow-up question.

---

### Phase 1: CARRIER MoU OUTREACH LIST

### Entry Criteria
Context digest complete. Target state defined.

**Why this goes first:** The shared-savings component (Component 3 of the fee structure) is unenforceable without a carrier or broker who will price the ActuarialReport into renewal. Without a carrier MoU, the fee collapses to Base + AUM  --  leaving ~30% of ACV on the table and gutting the "customer net benefit > customer cost" pitch.

### Actions
1. **Enumerate carrier types by line of business** relevant to CRE:
   - Property (including BI / NatCat)
   - General Liability
   - Professional Liability / E&O
   - Directors & Officers (D&O)
   - Representations & Warranties (R&W)  --  transactional
   - Cyber / operational / model-risk
   - Lender environmental (Phase I/II indemnity)

2. **Build the prioritized target list.** For each line, select 2–4 counterparties from these tiers:
   - **Tier A  --  Lloyd's syndicates / specialist MGAs** (highest appetite for novel risk evidence): Beazley, Canopius, Hiscox, Tokio Marine Kiln, CRC Group.
   - **Tier B  --  Commercial carriers with innovation practices**: Chubb, AIG, Zurich, Travelers, The Hartford, Liberty Mutual.
   - **Tier C  --  CRE-specialist MGAs / wholesale brokers**: Amwins, RT Specialty, CRC, Burns & Wilcox.
   - **Tier D  --  Reinsurers** (for consortium-scale later): Munich Re, Swiss Re, Hannover Re, SCOR.

3. **For each target, produce:**
   - `why_them`  --  specific reason (known CRE book, prior adoption of telematics/evidence-based pricing, CRO's published views on model risk)
   - `contact_path`  --  named person where possible (CUO, Head of Real Estate, Head of Innovation / Chief Underwriting Innovation Officer), LinkedIn / conference / warm intro route
   - `draft_pitch`  --  three-sentence ask: (1) what the ActuarialReport artifact is, (2) what the governed book looks like, (3) what we are asking for (pilot acceptance of the artifact as a loss-cost input, not an endorsement)
   - `expected_mou_terms`  --  non-binding, 12-month initial window, at least 3 pilot policies accepted, no exclusivity to us, no financial commitment either direction

4. **Sequence the outreach**:
   - **Wave 1** (first 14 days): 3 Tier A + 1 Tier C broker  --  fastest to pilot
   - **Wave 2** (days 15–45): 3 Tier B  --  credibility anchors
   - **Wave 3** (days 46–60): 1–2 Tier D reinsurers  --  consortium precursor

5. **Define success threshold:** **At least 2 signed non-binding MoUs within 60 days**, one of which must be Tier A or B (for the "recognized by a real carrier" headline).

### Output
`carrier_outreach_list`
### Quality Gate
Every target has a named human or named role, a contact path that does not depend on cold LinkedIn InMail, and a draft pitch under 500 characters. At least one Tier A syndicate is in Wave 1. Fallback counterparties listed for any target that goes silent at 10 days.

---

### Phase 2: MASTER LICENSE TEMPLATE

### Entry Criteria
Context digest complete. Can run in parallel with Phase 1.

**Why this goes second in priority (but can be parallel):** Design partners want to read the thing they are piloting. The template is also what counsel redlines once  --  producing all downstream customer contracts by parameter substitution.

### Actions
1. **Draft the document skeleton.** Standard commercial software license scaffolding: preamble, definitions, grant, restrictions, fees, audit, confidentiality, warranties & disclaimers, indemnity, LoL, termination, governing law, boilerplate.

2. **Insert the Wayfinder-specific commercial clauses:**

   **A. Fee Schedule Exhibit**
   - Base License tiered by governed AUM (T1 $150K, T2 $350K, T3 $750K, T4 $1.5M)
   - AUM Royalty tiered (5 bps ≤ $500M, 4 bps ≤ $2B, 3 bps ≤ $10B, 2 bps > $10B)
   - Annual AUM true-up provision with 30-day cure and pro-rata billing
   - Invoice cadence: Base quarterly in advance; AUM quarterly in arrears; Shared Savings annually in arrears

   **B. Shared Insurance Savings Addendum** (per policy class)
   - **Baseline** = last renewal binder premium at contract signing, on file
   - **Realized Savings** = Baseline − Renewal Premium, normalized to exposure change via the Exposure Index (defined in exhibit)
   - **Wayfinder Share** = table per policy class (30% Property, 30% GL, 35% E&O, 25% D&O, 35% R&W, 40% Cyber)
   - **Guardrails**: zero-floor (no clawback in hardening market), cap at 2× annual AUM royalty, 3-year term per policy class with re-baselining, neutral-auditor certification (broker or agreed third-party actuary), exclusion of exposure-growth-driven premium increases
   - **Attribution** clause: Wayfinder Share payable only if the ActuarialReport was submitted to the binding carrier before quote

   **C. Mechanisms Menu Addendum** (optional, customer-elected at signing)
   - M1 Captive-Architect: one-time $250K–$1M + 12–18% share of captive underwriting result, 10-yr term
   - M2 Warehouse Spread Dividend: 15–25% of realized spread reduction vs. pre-governance warehouse rate
   - M3 Two-Sided Carrier Fee: not a customer-facing clause; recorded as Wayfinder disclosure
   - M4 Avoided-Loss Alpha: 3–8% of avoided loss on governor-declined deals that subsequently default within 36 months, per public default database, annual cap $X
   - M5 Capital Relief Share: 5–15% of annualized RWA-relief benefit, capped $2–8M, paid only upon regulator acknowledgement
   - M6 Consortium Contributor Rebate: 15–30% of combined Base + AUM proportional to data contribution
   - M7 Quiet-Book Rebate: 20% of combined Base + AUM following any fiscal year with zero governance-level escalations
   - M8 Warrants: only for design partners; see Phase 3

   **D. IP Ownership & License Grant**
   - Wayfinder Trust retains **all** rights in Patent Family A (governance) and Family B (governance engine)
   - Grant: **non-exclusive, non-transferable, non-sublicensable, field-of-use limited** to the customer's CRE portfolio
   - No assignment, no joint ownership of improvements, customer-specific derivative works owned by Wayfinder with perpetual royalty-free license back to customer
   - Audit right: Wayfinder may audit AUM and savings calculations once per 12-month period, 30-day notice

   **E. Termination & Data**
   - Either party, 90 days notice for convenience (no refunds on prepaid Base)
   - For cause: 30 days cure
   - **Tail obligations**: Shared-savings attributable to Wayfinder governance persists for 24 months post-termination (savings realized from renewals within that window attributable to evidence already delivered)
   - Customer receives a read-only export of governance telemetry on termination; Wayfinder retains anonymized aggregate rights

   **F. Governing Law**
   - Delaware (or NY) law, venue in Wilmington (or Manhattan), JAMS arbitration with carve-out for equitable relief
   - Note: if licensor is Wayfinder Trust (Wyoming situs), confirm with counsel whether WY or DE is preferable

3. **Carve out the MFN clause** for the first 5 design partners: if any subsequent customer receives better commercial terms for the same scope, those terms are retroactively applied to the MFN customer.

4. **Draft the Exposure Index definition.** This is the most heavily-negotiated number in the template. Proposed definition: weighted average of (i) gross asset value, (ii) net leased sqft, (iii) outstanding principal balance. Weights disclosed in exhibit. Broker-certified quarterly.

5. **Red-team the template.** For each clause, ask: where does a large customer's GC pushback land, and do we have a pre-committed fallback position?

### Output
`master_license_template`
### Quality Gate
Template is counsel-ready (not customer-ready  --  counsel redlines first). Every numerical threshold has a definition and a measurement method. Shared-savings math is walkable by a non-actuary in under 10 minutes. MFN clause is bounded (first 5 design partners only) to prevent open-ended repricing risk.

---

### Phase 3: DESIGN-PARTNER TERM SHEET

### Entry Criteria
Context digest complete AND at least a draft of the master license template (Phase 2) exists. **Signature** on a design-partner agreement requires: Phase 2 signed out by counsel, and at least one signed Phase 1 carrier MoU in hand.

**Why this goes last:** A term sheet without a license template underneath is a handshake. A term sheet without a carrier MoU promises shared savings that cannot be delivered. The bar to **ship** a term sheet is earlier than the bar to **sign** one.

### Actions
1. **Define the design-partner profile.** Target first three:
   - 1 CRE debt fund, $1–5B AUM, CRO or CIO as champion
   - 1 CRE sponsor (REIT or opportunity fund), $500M–$3B AUM, Head of Acquisitions as champion
   - 1 special servicer or specialty lender, $1–10B AUM, Head of Special Servicing or CCO as champion

   Three partners across three archetypes produce three different case studies  --  worth far more than three partners in the same archetype.

2. **Draft the design-partner commercial terms:**
   - **Year 1: free or cost-recovery** (integration fees only, no license or AUM fees)
   - **Years 2–3: 50% off the standard rate card** on Base + AUM; shared-savings at standard terms (skin-in-the-game on our side)
   - **Year 4+: full rate card** with **permanent MFN** status on any new commercial-clause improvements offered to later customers
   - **Volume commitment**: partner agrees to route at least 70% of governed-eligible AUM through the platform during the discount period  --  otherwise discount re-prices to 25% off

3. **Define the Warrant Kicker (M8):**
   - Grant to Wayfinder Trust: **warrants on 0.25–1.00% of the partner's GP interest or management-company equity**, struck at current-vintage post-money valuation
   - **Vesting**: 4-year vesting, 1-year cliff, monthly thereafter, full acceleration on change of control
   - **Expiration**: 10 years from grant
   - **Scope**: applies only to the operating entity, not to underlying fund assets; no participation in carry pools
   - **Cap**: aggregate warrant grants across all design partners not to exceed [TBD] % ownership drag on Wayfinder Trust's own cap table  --  this is for Wayfinder's internal discipline, not a partner-facing term

4. **Define the reference-rights package.** Partner grants:
   - Named case study after 12 months of production usage (with partner approval of the specific text)
   - Unattributed metrics usage (e.g., "Across three design partners governing $X of CRE AUM...") from day one
   - One joint-conference speaking slot per year
   - Right to cite the partner name in carrier and regulator conversations under NDA

5. **Define milestones and exit conditions:**
   - **Milestone 1** (day 90): integration live in non-production; first ActuarialReport generated on a real deal
   - **Milestone 2** (day 180): first production deal routed through GovernedCRERunner
   - **Milestone 3** (day 365): at least one insurance renewal processed with the ActuarialReport submitted to a carrier
   - **Exit for Wayfinder**: if no milestone reached within 150% of target, Wayfinder may terminate and unwind warrants at zero
   - **Exit for partner**: 60-day notice for convenience in Year 1; standard commercial terms thereafter

6. **Exclusivity clause**: partner agrees **not to pilot a competing runtime-governance product** in CRE during the design-partner period. Wayfinder does **not** grant exclusivity in return  --  we need three partners.

7. **Term-sheet format:** 2 pages maximum, non-binding except for confidentiality, warrants, and exclusivity clauses. Signed before counsel is engaged on the definitive agreement, which uses the Phase 2 master license as the basis.

### Output
`design_partner_term_sheet`
### Quality Gate
Term sheet fits on 2 pages. Every dollar, percent, and date is either a fixed number or explicitly marked `[TBD]`. Warrant mechanics are specific enough that the partner's GC can run a cap-table impact analysis without a follow-up call. Exit conditions cut both ways.

---

## Exit Criteria

The flow is DONE when all five outputs exist, AND:

1. `context_digest` has been validated against the business plan (no silent drift)
2. `carrier_outreach_list` has at least 10 ranked targets, at least 4 in Wave 1
3. `master_license_template` is counsel-ready and every commercial threshold is defined
4. `design_partner_term_sheet` fits on 2 pages with specific warrant mechanics
5. `risk_register` names the top 3 failure modes per artifact with pre-committed mitigations
6. `three_artifact_kit` is bundled into one directory ready to ship to counsel and the first three design-partner candidates

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| CONTEXT LOAD | Business plan file missing or stale | Regenerate from this chat's decisions before proceeding; block downstream phases until complete |
| CARRIER OUTREACH | Zero carrier response within 30 days | Pivot to **broker-led** outreach (Amwins / RT Specialty / CRC)  --  brokers will shop the artifact to carriers on our behalf for a placement fee |
| CARRIER OUTREACH | Carrier wants endorsement, not acceptance | Reframe ask  --  we are requesting acknowledgement as *loss-cost input*, not *rating factor*. Endorsement is a 2-year process; acknowledgement is a 60-day process |
| LICENSE TEMPLATE | Customer GC rejects MFN | MFN applies only to first 5 design partners  --  this is a feature, not a bug. If customer is not one of the first 5, MFN is not on the table |
| LICENSE TEMPLATE | Customer GC rejects "Wayfinder retains IP" | Non-negotiable. Offer field-of-use exclusivity as an alternative at 2–3× standard fee |
| LICENSE TEMPLATE | Shared-savings math too complex | Simplify to property + E&O only for first 3 customers; expand to other policy classes in Year 2 |
| TERM SHEET | Design partner rejects warrants | Substitute extended MFN (first 10 customers instead of first 5) + larger Year 2–3 discount; warrants only work with founder-type GPs |
| TERM SHEET | No design partner signed at day 120 | Reopen: widen profile to include non-US CRE (UK, Canada) where carrier MoU conditions may be easier |

## State Persistence

- `deal_registry`: Every carrier MoU, license instance, and design-partner agreement  --  counterparty, stage, renewal date, MFN status, warrant grants
- `mfn_ledger`: Tracks which of the first 5 design partners has MFN rights and what the current best commercial terms offered to any customer are  --  updated on every new signing
- `carrier_pipeline`: Tier A/B/C/D status, contact last-touched date, MoU stage (outreach → meeting → MoU drafted → signed)
- `mechanisms_elected`: Per customer, which of M1–M8 are live, baselines captured, realized benefits YTD
- `artifact_acceptance_log`: Every ActuarialReport submission to a carrier, accepted/rejected outcome, carrier feedback  --  feeds back into Phase 1 as objection library
- `term_sheet_inventory`: Every version of the design-partner term sheet shipped, redline status, warrant terms agreed

---

## Cross-References

- Business plan source of truth: `Documents/Business Investor/Patent_Families_A_B_Business_Plan_Pricing.md`
- Family A patent folder: `IP/projects/SkillChain/docs/patents/Family_A_governance/`
- Family B patent folder: `IP/projects/SkillChain/docs/patents/Family_B_ALG/`
- Risk Analytics Governor (product surface): `IP/projects/Risk_Analytics_Governor/`
- Related flow (upstream): `ip-licensing-prospect`  --  identifies the right human at each target
- Related flow (sibling): `ip-counsel`  --  handles the redline-to-signature path on the master license

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
