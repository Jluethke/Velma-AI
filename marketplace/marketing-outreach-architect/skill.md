# Marketing Outreach Architect

Parent orchestrator that reproduces an entire `MarketingOutreach/`-shaped project (targets + intel + contact pages + pitch decks + pricing models + reviewer briefs + master playbook) from a single **business pack**. Composes `company-naming-pipeline`, `trademark-clearance-pipeline`, `outreach-engine`, `vertical-scaffolder`, `pricing-model-writer`, `reviewer-brief-writer`, and `artifact-codegen`. Works for any company  --  inventor IP licensing, a CRE sponsor, a SaaS founder, a services firm  --  so long as the operator can describe their product base, history, past deals, and the verticals they want to hit.

Designed so a non-technical operator can run it by filling a single input pack (past deals, product base, mission statement, history) and getting a complete outreach-ready project back  --  DOCX, PPTX, HTML contact pages, XLSX master tracker.

## Execution Pattern: Phase Pipeline

Justification: the workflow always follows the same sequence, there is no conditional branching except per-vertical / per-reviewer iteration, each phase's output feeds the next, and phases are non-overlapping. Phase Pipeline is correct per the FlowFabric decision criteria.

```
PHASE 1: INTAKE              --> Validate business_pack, derive product_brief + voice_sample + credibility_line
PHASE 2: BRAND               --> (optional) company-naming-pipeline + trademark-clearance-pipeline
PHASE 3: VERTICAL SCAFFOLD   --> vertical-scaffolder per vertical → README + roadmap + PROJECT_BRIEF
PHASE 4: OUTREACH ENGINE     --> outreach-engine per vertical → 7 registries per vertical
PHASE 5: PRICING             --> pricing-model-writer per vertical → pricing model docs
PHASE 6: REVIEWERS           --> reviewer-brief-writer per reviewer → 30K + detailed briefs
PHASE 7: ARTIFACT BUILD      --> artifact-codegen → .py scripts → Claude runs → .docx/.pptx/.html/.xlsx
PHASE 8: ASSEMBLY            --> Master playbook + project brief assembled; delivery-format gate
```

## Inputs

The operator provides a single **business_pack** object. Most fields are strings or arrays of small objects; no programming required.

### Required

- `company_name`  --  operator's company.
- `mission_statement` (1-3 sentences)  --  anchors positioning across every artifact.
- `company_history` (200-1000 words)  --  founding, pivots, current state. Provides the "why us" narrative.
- `product_base`  --  array of `{name, description, differentiation, buyers_served, price_band}`. Minimum 1 entry.
- `past_deals`  --  array of `{counterparty, year, type, size_band, outcome, takeaway}`. Zero is allowed but weakens credibility_line synthesis.
- `case_studies`  --  array of `{title, customer_or_archetype, challenge, approach, outcome_metric}`. Used as proof points in pricing one-pagers and reviewer briefs.
- `voice_sample` (200-500 words)  --  past writing by the operator in the voice the outputs should match.
- `sender_signature`  --  `{name, title, entity, contact_email, contact_phone}`.
- `verticals`  --  array of `{vertical_name, icp_definition, archetypes, regulatory_context, timing_triggers}`. Minimum 1.

### Optional (strengthen quality  --  supply when available)

- `team_bios`  --  array of `{name, role, relevant_experience, public_profile_url}`. Becomes the "who is behind this" signal for reviewers and prospect due-diligence.
- `current_customers`  --  list of customer names. Used for exclusions (don't double-pitch) and social proof.
- `stated_objections_patterns`  --  objections heard in prior calls. Seeds the `what_NOT_to_say` and the objection library in the playbook.
- `competitive_wins_losses`  --  `{won_against: [...], lost_against: [...], reason: string}`. Informs the send_pack Risk Hook framing.
- `portfolio_proof`  --  patents, filings, certifications, published work  --  anything public that establishes credibility.
- `reviewers`  --  array of `{name, role, org, domain_fluency: native|adjacent|outside, relationship, review_goal}`. If absent, reviewer-brief-writer is skipped.
- `naming_required` (default `false`)  --  if true, runs company-naming-pipeline as Phase 2a.
- `trademark_clearance_required` (default `false`)  --  if true, runs trademark-clearance-pipeline as Phase 2b.
- `credibility_line`  --  if absent, INTAKE synthesizes one from past_deals + case_studies + portfolio_proof.
- `exclusions`  --  array of companies or domains to never contact.
- `target_count_per_vertical` (default 25).
- `cadence_days` (default [0, 5, 10, 16, 22]).
- `output_root`  --  directory where the project scaffold is written (default: caller's working directory + `MarketingOutreach/`).

## Outputs

- `project_manifest`  --  object describing every file produced, its source registry, and its verification status.
- `project_brief_docx`  --  the synthesized PROJECT_BRIEF as a DOCX.
- `vertical_artifacts`  --  per vertical: README.docx, roadmap.docx, outreach_list.docx, tactical_copy.docx, conference_strategy.docx, warm_intro_framework.docx, pricing_one_pagers/*.docx, pitch_deck.pptx.
- `contact_pages`  --  per-target HTML page + `_index.html`.
- `per_target_docx`  --  per-target one-pager DOCX (from the 17-field intel + send pack + simulation).
- `master_intelligence_xlsx`  --  master Excel workbook with sheets: Master, per-Vertical Targets, Pitch Hooks, Conferences, Critical Updates, Source Index.
- `reviewer_briefs`  --  per reviewer: `<Reviewer>_30K_Pitch.docx` + `<Reviewer>_Detailed_Followup.docx` (if reviewers supplied).
- `master_playbook_docx`  --  the outreach-engine master playbook, converted to DOCX.
- `generated_build_scripts`  --  the `.py` scripts emitted by artifact-codegen (kept in `build/` for re-run).

**Delivery format rule (HARD):** Primary deliverables are **DOCX, PPTX, XLSX, HTML**. Markdown is permitted only as an intermediate source format in `_intel/` (research notes the operator may want to re-grep). No markdown at the top of the project tree. The Phase 8 gate enforces this  --  if any top-level deliverable is still `.md` at exit, the run fails.

---

## Execution

### Phase 1: INTAKE  --  Validate business_pack and Derive Synthesis Inputs

### Entry Criteria
`business_pack` object is provided.

### Actions
1. Verify each required field is present and meets minimum length (voice_sample ≥ 200 words; company_history ≥ 200 words; at least one product_base entry; at least one vertical). Halt with a specific gap report if anything fails.
2. **Derive `product_brief`** (500-2000 words) by composing: mission_statement → company_history → product_base narrative → past_deals credibility paragraph → case_studies evidence paragraph → competitive differentiation → sender_signature. Output as markdown (intermediate) ready for downstream consumers.
3. **Derive `credibility_line`** if absent: pick the strongest single provable fact from past_deals + case_studies + portfolio_proof. Template: `"<quantifiable proof>; <current operational signal>; <third-party validation>."` Example: `"$14M in closed CRE acquisitions 2019-2025; Risk Analytics Governor passing 80/80 unit tests; pilot signed with Lloyd's syndicate."`
4. **Build propagation_manifest** (same five guardrails as outreach-engine Phase 1  --  fabrication, specificity, voice, ask, channel) plus this architect-specific addition: **DELIVERY FORMAT DISCIPLINE**  --  every top-level deliverable must ship as .docx/.pptx/.xlsx/.html; markdown is intermediate-only.
5. **Normalize verticals**: ensure each vertical has an ICP object with industry + size_band + geography minimum; fill any missing archetype defaults from the shipped archetype catalog (insurance, CRE, healthcare, lending, agentic-AI, services  --  see Reference).
6. **Persist the scope_pack**  --  every downstream step reads from this single source of truth.

**Output:** `scope_pack` with `product_brief`, `voice_sample`, `credibility_line`, normalized verticals, propagation_manifest, reviewer slate, optional flags.

### Quality Gate
Every required field present and meeting thresholds; `product_brief` ≥ 500 words; `credibility_line` is one sentence with at least one quantifiable fact; propagation_manifest has six guardrail categories.

---

### Phase 2: BRAND  --  Naming + Trademark (Optional)

### Entry Criteria
`scope_pack` built.

**Actions (parallel when both required):**

- **2a NAMING**  --  if `naming_required` is true, invoke `company-naming-pipeline` with `{patent_themes: product_base, vibe_categories: derived-from-mission, target_tlds: [".com", ".ai", ".io", ".co"]}`. Capture shortlist + final_recommendation as artifacts.
- **2b TRADEMARK**  --  if `trademark_clearance_required` is true, invoke `trademark-clearance-pipeline` with the chosen name + goods/services classes derived from product_base. Capture clearance brief + prosecution memo + supplemental filing package.

**Output:** `naming_outputs` (or `null`), `trademark_outputs` (or `null`).

### Quality Gate
If either pipeline was invoked, its required artifacts are present (final_recommendation for naming; prosecution memo for trademark).

---

### Phase 3: VERTICAL SCAFFOLD  --  Per-Vertical README + Roadmap

### Entry Criteria
`scope_pack` built.

**Actions (per vertical in scope.verticals):**

1. Invoke `vertical-scaffolder` with `{vertical, product_brief, voice_sample, credibility_line}`. Produces a README (positioning, ICP summary, archetypes, timing triggers, expected deal shape) and a roadmap (Wave 1/2/3 sequencing).
2. Assemble a vertical-specific slice of the product_brief that emphasizes this vertical's regulatory_context and timing_triggers  --  passed downstream as `vertical_brief[vertical_name]`.

**Output:** `vertical_scaffold_registry` keyed by vertical_name with `{readme_md, roadmap_md, vertical_brief}`.

### Quality Gate
Every vertical in scope has both README and roadmap. No vertical's vertical_brief is < 300 words.

---

### Phase 4: OUTREACH ENGINE  --  Per-Vertical Targets + Intel + Send Packs

### Entry Criteria
`vertical_scaffold_registry` built.

**Actions (per vertical):**

1. Invoke `outreach-engine` with inputs mapped from scope:
   - `product_brief` ← `vertical_scaffold_registry[vertical].vertical_brief`
   - `icp_definition` ← `scope.verticals[vertical].icp_definition`
   - `voice_sample` ← `scope.voice_sample`
   - `archetypes` ← `scope.verticals[vertical].archetypes`
   - `credibility_line` ← `scope.credibility_line`
   - `sender_signature` ← `scope.sender_signature`
   - `exclusions` ← `scope.exclusions + scope.current_customers` (never pitch a current customer)
   - `target_count` ← `scope.target_count_per_vertical`
   - `cadence_days` ← `scope.cadence_days`
2. Propagate the DELIVERY FORMAT guardrail to the engine's own propagation_manifest so its outputs are tagged for downstream docx/html conversion.

**Output:** `engine_outputs[vertical]` containing the 7 registries produced by outreach-engine (scored_lead_list, target_intel_registry, contact_dossier_registry, send_pack_registry, archetype_pack_registry, meeting_sim_registry, master_playbook).

### Quality Gate
Every vertical returns all 7 registries; counts match scope.target_count_per_vertical per vertical.

---

### Phase 5: PRICING  --  Per-Vertical Pricing Model

### Entry Criteria
`engine_outputs` built (pricing references the discovered archetype shape).

**Actions (per vertical):**

1. Invoke `pricing-model-writer` with `{vertical, product_brief, case_studies, past_deals, archetype_pack_registry, target_intel_registry}`. Produces a 3-component pricing document: Base License band + Scale Royalty in bps + Performance Share tied to outcome metric  --  sized per archetype using case_studies and past_deals as comparables.
2. Also produce a 1-page Investor Overview variant and a Formal Risk Register variant when `portfolio_proof` is present.

**Output:** `pricing_outputs[vertical]` containing `{pricing_business_plan_md, investor_overview_md, risk_register_md}`.

### Quality Gate
Every vertical has a pricing business plan; structure matches the 3-component shape; every dollar figure cites either a past_deal or a case_study as provenance.

---

### Phase 6: REVIEWERS  --  Reviewer Briefs (Optional)

### Entry Criteria
`scope_pack` built (this phase does not depend on engine_outputs  --  reviewer briefs are portfolio-wide).

**Actions (per reviewer in scope.reviewers):**

1. Invoke `reviewer-brief-writer` with `{reviewer, product_brief, case_studies, portfolio_proof, voice_sample}`. Produce:
   - `<Reviewer>_30K_Pitch.md`  --  1 page, framed for the reviewer's domain_fluency (native/adjacent/outside), jargon stripped if outside.
   - `<Reviewer>_Detailed_Followup.md`  --  deep architecture + claim shape + prior-art comparison if the operator has that depth (from product_base + portfolio_proof).
2. Honour voice anchor; honour relationship register (peer vs mentor vs cold).

**Output:** `reviewer_brief_registry` keyed by reviewer name.

### Quality Gate
Every reviewer has both docs; jargon-strip check applied to `outside` reviewers (no NAIC / Solvency II / IFRS-class tokens unless parenthesized with plain-English gloss).

---

### Phase 7: ARTIFACT BUILD  --  Generate Code, Execute Code, Emit Binaries

### Entry Criteria
All prior phase outputs built.

**This is where "generates code and utilizes Claude" manifests.** The flow hands all registries to `artifact-codegen`, which writes Python build scripts tailored to the actual registry shapes. Claude then executes those scripts.

### Actions
1. Invoke `artifact-codegen` with all registries + `scope.output_root`. It writes these scripts into `<output_root>/build/`:
   - `_build_docx.py`  --  converts every `.md` deliverable (product_brief, vertical README + roadmap, outreach_list, tactical_copy, reviewer briefs, pricing plans, master_playbook) into DOCX using python-docx with a consistent Wayfinder style (Calibri 11, 1" margins, branded headers).
   - `_build_one_pagers.py`  --  per-target: merges `target_intel_registry[company] + send_pack_registry[company] + meeting_sim_registry[company]` into a per-target one-pager DOCX with TOC.
   - `_build_contact_html.py`  --  per-target: merges `target_intel_registry[company] + contact_dossier_registry[company] + send_pack_registry[company]` into a responsive HTML page (identity card, primary + alternate contact panel with mailto: + tel: links, warm paths, recent statements with source links, best conference, talking style, what NOT to say, opening line, drafted email preview). Also emits `Contacts/_index.html` with a sortable table across all targets.
   - `_build_pptx.py`  --  per vertical: assembles a 12-15-slide PPTX pitch deck (Title, Problem, Why Now, What We Sell, Mechanism, Proof, Pricing, Target Archetypes, Case Studies, Timeline, The Ask, Appendix) using python-pptx with a consistent theme.
   - `_build_intel_xlsx.py`  --  writes `Wayfinder_Target_Intelligence.xlsx` with sheets Master, per-Vertical Targets, Pitch Hooks, Conferences (from target_intel.best_conference_to_meet), Critical Updates (from target_intel.recent_public_statements), Source Index.
2. Emit a single `run_build.sh` / `run_build.bat` pair that pip-installs dependencies (`python-docx`, `python-pptx`, `openpyxl`) then runs all five scripts in order.
3. **Claude executes the scripts** via its Bash tool: `pip install python-docx python-pptx openpyxl && python build/_build_docx.py && python build/_build_one_pagers.py && python build/_build_contact_html.py && python build/_build_pptx.py && python build/_build_intel_xlsx.py`.
4. If any script errors, Claude reads the error, amends the corresponding builder, and re-runs. This is the "utilize Claude to complete the parts where necessary" loop.

**Output:** `binary_artifacts`  --  every path to every generated .docx / .pptx / .xlsx / .html file, keyed by category.

### Quality Gate
Every expected binary exists and opens; spot-check 3 random per-target one-pagers for all required sections; spot-check 1 HTML contact page per vertical for contact info correctness; verify the pptx is not empty (slide_count ≥ 10 per vertical); verify xlsx has all expected sheets.

---

### Phase 8: ASSEMBLY  --  Master Playbook + Delivery Format Gate

### Entry Criteria
binary_artifacts built.

### Actions
1. Assemble the project `PROJECT_BRIEF.docx` at the top of output_root summarizing: company identity → mission → verticals covered → target counts → archetype counts → reviewer counts → naming + trademark status → artifact inventory with click-through paths.
2. Emit `project_manifest.json` listing every file produced with its source registry, builder script, verification status, and file hash.
3. **DELIVERY FORMAT GATE (HARD):** scan `output_root` (non-recursive through `_intel/` which is explicitly markdown-allowed). If any top-level deliverable is still `.md`, fail the run and report which files need conversion. Re-run Phase 7 for the missing ones.
4. Emit a one-page `NEXT_ACTIONS.docx` tailored to this operator: confirm primary_email before sending; confirm warm-intro activation messages; schedule the first-wave sends per send_calendar; book the reviewer meetings.

**Output:** Final delivery bundle at `output_root`  --  ready to hand to the operator.

### Quality Gate
`project_manifest.json` present; no stray markdown at top level; `PROJECT_BRIEF.docx` references every vertical, every reviewer, every deliverable by path; `NEXT_ACTIONS.docx` has dated entries.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Parent orchestrator that produces a complete MarketingOutreach project (targets,, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

The flow is DONE when:

- Every required business_pack field validated.
- Every vertical has: README.docx, roadmap.docx, outreach_list.docx, tactical_copy.docx, conference_strategy.docx, warm_intro_framework.docx, pricing_one_pagers/*.docx, pitch_deck.pptx, per-target docx one-pagers, per-target HTML contact pages.
- Every reviewer has 30K + detailed briefs as DOCX (if reviewers supplied).
- `Wayfinder_Target_Intelligence.xlsx` exists with all sheets.
- `outreach_master_playbook.docx` exists.
- `PROJECT_BRIEF.docx` + `project_manifest.json` + `NEXT_ACTIONS.docx` exist at the project root.
- DELIVERY FORMAT GATE passes (no stray `.md` at project root level).
- Fabrication / specificity / voice / ask / channel gates from outreach-engine all pass.

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| INTAKE | Required business_pack field missing | **Abort**  --  surface the specific gap; operator fills and re-runs |
| INTAKE | voice_sample too generic (no distinctive style markers) | **Adjust**  --  warn; allow override only with explicit acknowledgement that downstream fails likelier |
| BRAND | Naming pipeline finds zero acceptable candidates | **Adjust**  --  relax availability requirements (drop .ai or .io), retry once; surface if still empty |
| BRAND | Trademark clearance surfaces a senior mark in the primary class | **Escalate**  --  surface conflict to operator, suggest class-reshape, do not block downstream (name stands pending attorney review) |
| VERTICAL SCAFFOLD | Vertical ICP missing critical fields | **Abort for that vertical**  --  scaffold the others, report the gap |
| OUTREACH ENGINE | Any vertical returns < target_count after engine's internal widening | **Adjust**  --  accept and flag; do not block other verticals |
| PRICING | Past deals + case studies insufficient to cite any dollar figure | **Adjust**  --  produce pricing with ranges only, flag for human sanity-check |
| REVIEWERS | Reviewer domain_fluency = outside but product_brief is jargon-dense | **Retry**  --  once with stricter jargon strip; if still failing, flag for human rewrite |
| ARTIFACT BUILD | A script errors on execution | **Claude fixes the generator, re-runs**  --  part of the designed loop, not a terminal failure |
| ARTIFACT BUILD | python-docx / pptx / openpyxl missing | **Install + retry**  --  the flow's run_build script handles this |
| ASSEMBLY | DELIVERY FORMAT GATE fails | **Retry**  --  artifact-codegen re-invoked for the offending files; do not emit until gate passes |
| ACT | Operator rejects final output | **Targeted revision**  --  ask which vertical / reviewer / artifact fell short, re-run only that phase. Do not regenerate everything. |

---

## Reference

### Who This Is For

Two operator profiles:

1. **The inventor / founder** with a patent portfolio and multiple verticals to hit, who needs a standing commercial package (this is the the governance provider Group use case that seeded the pattern).
2. **The established operator** (e.g. a CRE sponsor with a product base and deal history) who wants a full outreach project from their existing materials without re-engaging a consultant each time.

Both operators supply a single business_pack. The architect handles the rest.

### Business Pack Template (Copy-Paste)

```
company_name: "<your company>"
mission_statement: "<1-3 sentences>"
company_history: """
<200-1000 words  --  founding, pivots, current state, what you've learned>
"""
product_base:
  - name: "<product name>"
    description: "<what it does>"
    differentiation: "<why it wins>"
    buyers_served: ["<who buys it>"]
    price_band: "<range or NA>"
past_deals:
  - counterparty: "<name or anonymized>"
    year: <year>
    type: "<acquisition | license | service engagement | partnership>"
    size_band: "<$ range>"
    outcome: "<what happened>"
    takeaway: "<what it proves about you>"
case_studies:
  - title: "<short>"
    customer_or_archetype: "<specific or anonymized>"
    challenge: "<their pain>"
    approach: "<what you did>"
    outcome_metric: "<quantified result>"
team_bios:
  - name: "<>"
    role: "<>"
    relevant_experience: "<>"
    public_profile_url: "<linkedin or NA>"
voice_sample: """
<200-500 words of your past writing  --  blog, email, memo, anything you'd send>
"""
sender_signature:
  name: "<>"
  title: "<>"
  entity: "<>"
  contact_email: "<>"
  contact_phone: "<>"
verticals:
  - vertical_name: "<e.g. CRE, Insurance, Healthcare>"
    icp_definition:
      industry: ["..."]
      size_band: {min_employees: 0, max_employees: 0}
      geography: ["US"]
      tech_stack_signals: ["..."]
      budget_signals: ["..."]
      pain_points: ["..."]
      deal_breakers: ["..."]
    archetypes: ["..."]
    regulatory_context: "<what rules govern this buyer>"
    timing_triggers: ["..."]
# optional
reviewers:
  - name: "<>"
    role: "<>"
    org: "<>"
    domain_fluency: "native | adjacent | outside"
    relationship: "friend | peer | cold"
    review_goal: "<what they're being asked to stress-test>"
naming_required: false
trademark_clearance_required: false
exclusions: []
portfolio_proof: []
current_customers: []
target_count_per_vertical: 25
cadence_days: [0, 5, 10, 16, 22]
output_root: "MarketingOutreach/"
```

### Composition

| Phase | Skill | Role |
|---|---|---|
| INTAKE | (this flow) | Derive product_brief + credibility_line + scope_pack |
| BRAND | `company-naming-pipeline` | Naming shortlist + buy-readiness score (optional) |
| BRAND | `trademark-clearance-pipeline` | USPTO + common-law + international clearance (optional) |
| VERTICAL SCAFFOLD | `vertical-scaffolder` | Per-vertical README + roadmap + vertical-brief slice |
| OUTREACH ENGINE | `outreach-engine` | Per-vertical 7-registry outreach package |
| PRICING | `pricing-model-writer` | Per-vertical 3-component pricing doc + investor overview + risk register |
| REVIEWERS | `reviewer-brief-writer` | Per-reviewer 30K + detailed briefs, jargon-adaptive |
| ARTIFACT BUILD | `artifact-codegen` | Emits `.py` builders, Claude executes → .docx/.pptx/.xlsx/.html |
| ASSEMBLY | (this flow) | PROJECT_BRIEF.docx + project_manifest.json + DELIVERY FORMAT GATE |

### Archetype Catalog (Defaults When Vertical Doesn't Specify)

- **Insurance:** primary carrier, reinsurer, rating agency, reinsurance broker, ILS manager, captive manager, core-system vendor, Big-Actuarial.
- **CRE:** Lloyd's syndicate, commercial admitted carrier, wholesale broker, reinsurer, MGA, lender, REIT, sponsor.
- **Healthcare:** AMC CMIO, payor medical director, EHR vendor, SaMD operator, FDA consultancy, AHRQ adjacent buyer.
- **Lending:** bank model risk officer, fintech lender CRO, OCC examiner-facing GC, credit card model team, BNPL CRO.
- **Agentic AI:** platform CTO, enterprise buyer with agentic ambitions, risk & control officer, policy/GC, system integrator.
- **Services:** managing partner, director of professional services, head of solutions, VP customer success, RFP coordinator.

### Output Layout

```
<output_root>/
├── PROJECT_BRIEF.docx
├── NEXT_ACTIONS.docx
├── project_manifest.json
├── Naming/                                   (if naming_required)
│   ├── final_recommendation.docx
│   ├── naming_shortlist.docx
│   └── naming_candidates.xlsx
├── Trademark/                                (if trademark_clearance_required)
│   ├── clearance_brief.docx
│   ├── prosecution_memo.docx
│   └── supplemental_filing_package.docx
├── Documents/Business_Plans/
│   ├── <Vertical>_Pricing_Business_Plan.docx
│   ├── 1_Page_Investor_Overview.docx
│   └── Formal_Risk_Register.docx             (if portfolio_proof supplied)
├── <Vertical>_Vertical/
│   ├── README.docx
│   └── roadmap.docx
├── <Vertical>_Outreach_List.docx
├── <Vertical>_Outreach_Tactical_Copy.docx
├── <Vertical>_Conference_Targeting_Strategy.docx
├── <Vertical>_Warm_Intro_Framework.docx
├── <Vertical>_Pricing_One_Pagers/
│   └── <archetype>.docx
├── Pitch_Decks/
│   └── <Vertical>_Business_Presentation.pptx
├── DOCX/
│   ├── <Vertical>_Targets/
│   │   └── <company>.docx
│   └── One_Pagers/
│       └── <archetype>.docx
├── Contacts/
│   ├── _index.html
│   └── <company>.html
├── Reviewer_Briefs/
│   ├── <Reviewer>_30K_Pitch.docx
│   └── <Reviewer>_Detailed_Followup.docx
├── Wayfinder_Target_Intelligence.xlsx
├── outreach_master_playbook.docx
├── _intel/                                   (markdown  --  intermediate, research notes)
│   └── <vertical>_<batch>.md
└── build/                                    (generated by artifact-codegen  --  kept for re-run)
    ├── _build_docx.py
    ├── _build_one_pagers.py
    ├── _build_contact_html.py
    ├── _build_pptx.py
    ├── _build_intel_xlsx.py
    ├── run_build.sh
    └── run_build.bat
```

### State Persistence

Writes to `<output_root>/.architect/state/`:

- `prior_contacts` (passed through to outreach-engine)  --  never double-pitches across campaigns.
- `prior_reviewer_feedback`  --  reviewer reactions logged for the next revision cycle.
- `generator_versions`  --  hashes of emitted build scripts; lets a re-run skip unchanged artifacts.

### Related Chains

- `chains/outreach-engine.chain.json`  --  target + intel + send-pack worker (invoked in Phase 4).
- `chains/company-naming-pipeline.chain.json`  --  naming pipeline (invoked in Phase 2a, optional).
- `chains/trademark-clearance-pipeline.chain.json`  --  trademark clearance pipeline (invoked in Phase 2b, optional).
- `chains/insurance-license-pipeline.chain.json` + `chains/cre-license-pipeline.chain.json`  --  legacy vertical orchestrators, subsumed by this architect; kept for backward compatibility.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2026-present The Wayfinder Trust. All rights reserved.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
