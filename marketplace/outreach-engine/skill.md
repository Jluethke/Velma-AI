# Outreach Engine

Domain-agnostic enterprise outreach engine. Takes a product brief plus an Ideal Customer Profile and produces a complete cold-to-signed campaign package: ranked targets with fit scoring, per-target deep intelligence, named decision-maker contacts, multi-touch send packs with cadence, archetype one-pagers, meeting simulations, and a master execution playbook. Works for IP licensing, SaaS sales, partnerships, fundraising, services, channel sales  --  vertical specifics are passed in via inputs, not hardcoded into the engine.

## Execution Pattern: Phase Pipeline

Justification: the workflow always follows the same sequence (no branching except a per-target loop), each phase's output feeds the next without conditional paths, and the steps are discrete and non-overlapping. Phase Pipeline is the correct execution pattern per the FlowFabric ORPA-vs-Phase-Pipeline Decision Criteria.

```
PHASE 1: SCOPE         --> Validate every required input, propagate guardrails to all downstream steps
PHASE 2: DISCOVER      --> Score and rank target_count companies against ICP (parallel with ARCHETYPE)
         ARCHETYPE     --> Generate per-archetype one-pager + LinkedIn post + DM (parallel with DISCOVER)
PHASE 3: RESEARCH      --> Per-target deep intelligence dossier, then per-target contact dossier
PHASE 4: PERSONALIZE   --> Per-target send pack + per-target meeting simulation (parallel within per-target)
PHASE 5: ASSEMBLE      --> Master execution playbook aggregating all per-target and per-archetype outputs
```

## Inputs

- `product_brief`: string (required) -- 500-2000 words. What is sold, the buyer pain it removes, the regulatory or competitive timing trigger that creates urgency, the proof points that establish credibility.
- `icp_definition`: object (required) -- `industry: string[]`, `size_band: {min, max}`, `geography: string[]`, `tech_stack_signals: string[]`, `budget_signals: string[]`, `pain_points: string[]`, `deal_breakers: string[]`.
- `voice_sample`: string (required) -- 200-500 words of past writing in the licensor's voice. Without this, output reverts to generic AI tone and fails the specificity gate.
- `archetypes`: string[] (required) -- Buyer archetypes for one-pager generation. Example for insurance: `["primary carrier", "reinsurer", "rating agency", "reinsurance broker", "ILS manager", "captive manager", "core-system vendor", "Big-Actuarial"]`.
- `credibility_line`: string (required) -- One sentence proof of operational legitimacy.
- `sender_signature`: object (required) -- `name`, `title`, `entity`, `contact_email`, `contact_phone`.
- `exclusions`: string[] (optional) -- Companies or domains to never contact.
- `target_count`: integer (optional, default 25) -- How many targets to discover.
- `cadence_days`: integer[] (optional, default [0, 5, 10, 16, 22]) -- Outreach touch days.

## Outputs

- `scored_lead_list`: object[] -- Ranked `target_count` companies with `company_name`, `fit_tier` (perfect/strong/moderate/weak), `composite_score` (0-100), `dimension_scores` per ICP axis with reasoning, `wave_assignment`, `deal_estimate`, `stack_layer`, `why_them`, `why_now`.
- `target_intel_registry`: object -- Per-target 17-field dossier (standard shape  --  do not re-order): `tier`, `stack_layer`, `wave`, `line_of_business`, `approx_scale`, `primary_contact_name`, `primary_contact_title`, `primary_contact_linkedin`, `email_pattern_guess` (with verification status), `secondary_contact`, `why_them`, `why_now`, `recent_public_statements` (with source attribution), `podcasts_speaking`, `talking_style_notes`, `stated_worries`, `specific_hooks_for_our_pitch`, `what_we_could_fix_for_them`, `best_conference_to_meet`, `warm_intro_path`, `recommended_opening_line`.
- `contact_dossier_registry`: object -- Per-target 6-phase decision-maker output: identity confirmation, channel mining, email discovery (primary + 3 alternates + verification status), channel ranking with response-probability adjusted per person's activity, warm-path mapping with drafted activation messages, complete one-page dossier.
- `send_pack_registry`: object -- Per-target: 5-7 subject-line A/B variants, 120-200-word cold email, 3-sentence LinkedIn DM, day-by-day follow-up cadence, escalation path, what-NOT-to-say.
- `archetype_pack_registry`: object -- Per-archetype: 400-600-word one-pager + LinkedIn post variant + DM variant.
- `meeting_sim_registry`: object -- Per-target 20-minute call simulation with opening, top 5 likely questions + ideal responses, top 3 derail reactions + redirects, one genuine-interest signal + how to capitalize, close script.
- `master_playbook`: string -- Single markdown artifact: pre-launch checklist + master target table + send calendar + response handling protocol + per-target call prep + champion kit pointers + campaign milestones.

---

## Execution

### Phase 1: SCOPE -- Validate Inputs and Propagate Guardrails

### Entry Criteria
A `product_brief`, `icp_definition`, `voice_sample`, `archetypes`, `credibility_line`, and `sender_signature` are provided.

### Actions
1. Verify each required input is present and non-empty. If any required input is missing or empty, halt and report which input failed validation  --  do not proceed.
2. Verify `voice_sample` is at least 200 words. Verify `product_brief` is at least 500 words. Shorter inputs fail downstream specificity gates.
3. Normalize `exclusions` (lowercase, strip Inc/Corp/Ltd suffixes, dedupe).
4. Apply defaults for optional inputs: `target_count` default 25, `cadence_days` default `[0, 5, 10, 16, 22]`.
5. Build the propagation_manifest  --  the guardrail pack that every downstream step's instruction explicitly references: ZERO-TOLERANCE FABRICATION (no invented quotes, no fabricated podcast titles, no manufactured CEO statements, no claimed customer wins that do not exist, no inflated metrics; every fact cites a public source; unknown fields marked 'no public source found' or 'NA'  --  never guessed); SPECIFICITY TEST (every email body must reference at least one verifiable public fact about the specific target in the first two sentences; if a body could be sent to a different target by swapping names it fails  --  rewrite); VOICE DISCIPLINE (default 30,000-ft framing for non-domain audiences; strip domain jargon and internal codenames beyond a parenthetical; lead with what-it-does; anchor every piece to voice_sample); ASK DISCIPLINE (the ask is always a 15-20 minute call, never 'let's schedule a demo'; frame as a regulatory-gap or architecture conversation); CHANNEL DISCIPLINE (cold email subject lines never contain 'patent', 'license', or 'monetize' unless recipient is a General Counsel; LinkedIn DMs 3 sentences max).

### Output
`scope_pack` containing normalized inputs + propagation_manifest, ready for every downstream step.

### Quality Gate
Every required input is present and meets minimum length thresholds  --  verified by: presence check + word count check. Propagation_manifest is non-empty and contains all five guardrail categories  --  verified by: structural assertion. If validation fails, the engine halts and surfaces the specific gap.

---

### Phase 2: DISCOVER + ARCHETYPE -- Target Discovery and Archetype Copy (Parallel)

### Entry Criteria
`scope_pack` is built and quality-gated.

**Actions (parallel branch A: DISCOVER):**

1. Invoke `b2b-lead-finder` with `icp_definition`, `target_count`, `exclusion_list` from scope_pack. Score and rank candidates against the weighted ICP rubric.
2. For each target produce: `company_name`, `fit_tier`, `composite_score`, `dimension_scores` per ICP axis with reasoning, `deal_estimate`, `wave_assignment` (Wave 1-4 by urgency × addressability), `stack_layer` (upstream/core/downstream), `why_them` (one sentence), `why_now` (recent public trigger).
3. Cross-reference shared state to skip companies already contacted in past campaigns. Emit `icp_refinement_suggestions` based on observed conversion patterns if state contains them.

**Actions (parallel branch B: ARCHETYPE):**

1. Invoke `multi-platform-copywriter` with `product_brief`, `voice_sample`, `archetypes` list, `credibility_line`. For each archetype produce a 400-600-word one-pager structured as headline → timing trigger → what is sold/licensed/partnered on → 3-5 mechanisms with one-line commercial terms → credibility line → 15-20 minute ask.
2. For each archetype also produce one LinkedIn post variant (cold-warming the audience before any 1:1 outreach lands) and one short DM variant (follow-up warming).
3. Strip jargon when the archetype's audience is non-domain (e.g. a healthcare-IT reviewer evaluating an insurance product).

### Output
`scored_lead_list` (Branch A), `archetype_pack_registry` keyed by archetype name (Branch B).

### Quality Gate
`scored_lead_list` contains exactly `target_count` ranked entries with all required fields populated  --  verified by: schema check + count assertion. `archetype_pack_registry` contains one entry per archetype in scope.archetypes  --  verified by: count match. Every one-pager is 400-600 words  --  verified by: word count check.

---

### Phase 3: RESEARCH -- Per-Target Deep Intelligence and Contacts

### Entry Criteria
`scored_lead_list` is built and quality-gated.

**Actions (per target in scored_lead_list):**

1. Invoke `competitive-intel` with `company_name`, `industry_focus` from scope.icp_definition.industry, `time_window_months: 18`, `analysis_depth: deep`. Produce the 17-field dossier in the standard shape: `tier`, `stack_layer`, `wave`, `line_of_business`, `approx_scale`, `primary_contact_name`, `primary_contact_title`, `primary_contact_linkedin`, `email_pattern_guess` with verification status, `secondary_contact`, `why_them`, `why_now`, `recent_public_statements` with source attribution, `podcasts_speaking` with dates, `talking_style_notes`, `stated_worries`, `specific_hooks_for_our_pitch`, `what_we_could_fix_for_them`, `best_conference_to_meet` with date, `warm_intro_path`, `recommended_opening_line`. Every claim cites a public source; unknown fields marked 'no public source found' or 'NA'  --  never guessed.
2. Invoke `contact-intelligence` with the primary_contact identified in step 1, running its 6-phase process: IDENTITY RESOLUTION, CONTACT POINT MINING, EMAIL DISCOVERY (primary email + 3 alternates + verification status), CHANNEL RANKING (response probability per channel adjusted for activity level), WARM PATH MAPPING (with drafted activation messages for STRONG/MEDIUM paths), CONTACT DOSSIER (one-page profile with what NOT to do for this person).
3. Persist outputs to shared state as `target_intel_registry[company]` and `contact_dossier_registry[company]`.

### Output
`target_intel_registry` and `contact_dossier_registry`, each keyed by company name.

### Quality Gate
Every target in scored_lead_list has both a target_intel entry AND a contact_dossier entry  --  verified by: registry count == scored_lead_list count. Every target_intel entry has all 17 standard fields present (with NA for unfindable)  --  verified by: field-presence check. Every contact_dossier has at least one email candidate with verification status  --  verified by: dossier schema check. Spot-check 5 random targets for fabrication  --  every cited public statement must be sourceable; if any sample fails, halt and surface the offending entry for re-research.

---

### Phase 4: PERSONALIZE -- Send Pack and Meeting Simulation (Per-Target Parallel)

### Entry Criteria
`target_intel_registry` and `contact_dossier_registry` are built and quality-gated.

**Actions (per target in scored_lead_list, with parallel sub-branches):**

**Sub-branch A: OUTREACH** -- Invoke `cold-outreach-optimizer` with `prospect_profile` (target_intel + contact_dossier merged), `product_context` (product_brief + voice_sample), `outreach_channel: multi`, `historical_performance` (from shared state if available). Produce the standard send pack:
1. `subject_line_variants`: 5-7 tuned for A/B; never contains 'patent'/'license'/'monetize' unless recipient is a GC.
2. `cold_email_body`: 120-200 words structured as Personal Relevance (cite something they said/wrote/presented in first two sentences) → Insight (regulatory or market observation they have not fully acted on) → Risk Hook (name their specific system and the specific gap, no jargon) → Curiosity Gap (leave something only a call resolves) → Soft Ask (15-20 minute call, never 'demo').
3. `linkedin_dm`: 3 sentences max, sharper than the email.
4. `followup_sequence` aligned to scope.cadence_days  --  Touch 2 (Day 5) regulatory angle; Touch 3 (Day 10) peer comparison; Touch 4 (Day 16) economic framing with cost-of-inaction number from target_intel.what_we_could_fix_for_them; Touch 5 (Day 22) close-the-loop. If contact_dossier surfaced an upcoming conference where the person is speaking, add Touch 6 in-person ask.
5. `escalation_path` using contact_dossier.alternate.
6. `what_NOT_to_say` for this specific target (pulled from talking_style_notes and stated_worries).
7. `credibility_signature` appending scope.credibility_line + scope.sender_signature.

**Sub-branch B: SIMULATE** -- Invoke `deal-risk-analyzer` with `deal_data` (target_intel.dossier), `stakeholder_map` (contact_dossier.dossier), `competitive_intel` (target_intel.recent_moves). Produce: opening_2_minutes (what they likely say first based on their public posture); likely_questions_top_5 with the ideal response to each; derail_reactions_top_3 with redirect language; one_genuine_interest_signal and how to capitalize; close_script (concrete next step, never "I will send materials"). Add coaching notes in [brackets].

### Output
`send_pack_registry` and `meeting_sim_registry`, each keyed by company name.

### Quality Gate
Every target has both a send_pack and a meeting_sim entry  --  verified by: count match. Apply the SPECIFICITY TEST to 5 random send_pack entries: each cold_email_body must reference a verifiable public fact about THIS target in the first two sentences, and must fail the swap test (cannot be sent to a different target by name swap)  --  verified by: spot-check; if any fails, halt and surface for re-write. Channel discipline check: no subject_line contains forbidden tokens unless GC-targeted  --  verified by: regex scan.

---

### Phase 5: ASSEMBLE -- Master Execution Playbook

### Entry Criteria
All upstream registries (`scored_lead_list`, `target_intel_registry`, `contact_dossier_registry`, `send_pack_registry`, `archetype_pack_registry`, `meeting_sim_registry`) are built and quality-gated.

### Actions
1. Invoke `checklist-builder` to assemble the master_playbook. Produce sections in this exact order:
   - **PRE-LAUNCH CHECKLIST** -- verify primary_email confidence per target, LinkedIn connection status, target not in prior_contacts state, scope.credibility_line populated, scope.sender_signature populated.
   - **MASTER TARGET TABLE** -- one row per target with company, tier, wave, stack_layer, composite_score, deal_estimate, primary_contact, primary_email_status, first_send_date, current_status. The spreadsheet rollup.
   - **SEND CALENDAR** -- exact dates × channels × message references for every touch across email, LinkedIn, warm intro, conference tracks, sorted chronologically.
   - **RESPONSE HANDLING PROTOCOL** -- positive (send deal brief, book call within 48 hours, prepare NDA, route to which archetype one-pager); neutral (send archetype one-pager only, log objection, schedule re-engage at Day 45); negative (log reason, mark for 90-day re-engage, update objection_library).
   - **CALL PREP PER TARGET** -- 5 must-know facts from target_intel + 3 questions to ask + 2 things not to say from outreach.what_NOT_to_say + the simulate.close_script for each scheduled call.
   - **CHAMPION ACTIVATION KIT POINTERS** -- for each target who responds positively, route them to the relevant archetype_pack one-pager as the forwarding artifact.
   - **CAMPAIGN MILESTONES** -- first response → first call booked → first NDA → first term sheet → first signed agreement, with estimated timeline and operator action per milestone.
2. Output as markdown structured for both human reading and downstream tooling consumption (master target table parseable as markdown table).

### Output
`master_playbook` -- single markdown artifact.

### Quality Gate
master_playbook contains all 7 sections in the specified order  --  verified by: section-header presence check. MASTER TARGET TABLE contains exactly target_count rows  --  verified by: row count. SEND CALENDAR is sorted chronologically  --  verified by: date monotonicity check. CALL PREP has one block per target with all four sub-elements present  --  verified by: per-target structural check.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Domain-agnostic enterprise outreach engine. Takes a product brief plus an ICP an, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

The flow is DONE when:

- All 7 standard outputs are populated and persisted to shared state.
- `scored_lead_list` contains exactly `target_count` ranked entries.
- `target_intel_registry`, `contact_dossier_registry`, `send_pack_registry`, `meeting_sim_registry` each have one entry per target in scored_lead_list (count match).
- `archetype_pack_registry` has one entry per archetype in `scope.archetypes`.
- `master_playbook` contains all 7 specified sections in order.
- Specificity gate spot-check passes (5 random emails reference verifiable public facts in first two sentences and fail the name-swap test).
- Fabrication gate spot-check passes (5 random target_intel entries have sourceable public statements).
- Channel discipline scan passes (no forbidden tokens in non-GC subject lines).

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| SCOPE | A required input is missing or below minimum length threshold | **Abort** -- surface the specific gap and require the operator to provide the missing input before re-running |
| SCOPE | `voice_sample` is generic (matches no distinctive style markers) | **Adjust** -- warn the operator that downstream output will likely fail the specificity gate; allow override only with explicit acknowledgement |
| DISCOVER | Fewer than `target_count` qualified targets found | **Adjust** -- widen ICP search parameters by one tier (relax tech_stack_signals first, then size_band), report the relaxation, retry; if still under target_count after one widening, return what was found and surface the gap |
| DISCOVER | Target overlap with `exclusions` exceeds 50% of candidates | **Adjust** -- the exclusion list may be too aggressive; surface the overlap rate and ask the operator to reconfirm |
| ARCHETYPE | Generated one-pager exceeds 600 words or falls below 400 | **Retry** -- once with tighter length constraint; if still out of bounds, accept and flag for human review |
| RESEARCH | A target has no findable primary_contact at the right seniority | **Adjust** -- mark target_intel.primary_contact as 'no public source found at required seniority'; flag for human override; do not block the rest of the per-target loop |
| RESEARCH | Spot-check finds a fabricated public statement | **Abort the affected target** -- re-run target_intel for the offending company with stricter source-citation enforcement; do not include the offending target in send_pack until cleared |
| PERSONALIZE | Email body fails the specificity test (could be sent to a different target by swapping names) | **Retry** -- once with a stricter prompt referencing target_intel.specific_hooks; if still failing, flag for human rewrite |
| PERSONALIZE | Subject line contains a forbidden token in a non-GC context | **Adjust** -- regenerate the subject_line_variants set with the token explicitly excluded |
| ASSEMBLE | A registry is missing entries (count mismatch with scored_lead_list) | **Adjust** -- identify which targets are missing from which registry, attempt re-run for just those targets; if re-run fails, produce master_playbook flagging the gaps explicitly rather than silently dropping |
| ACT | Operator rejects final output | **Targeted revision** -- ask which section of the master_playbook missed the mark (target list, intel quality, send pack voice, archetype copy, call prep) and re-run only the affected phase. Do not regenerate the entire chain. |

---

## Reference

### Why This Engine Exists

This engine generalizes the Wayfinder MarketingOutreach pipeline that produced the 47-target Insurance + CRE outreach package (`Carrier_MoU_Outreach_List.md`, `Insurance_Reinsurance_Outreach_List.md`, `_intel/*.md`, `Insurance_Outreach_Tactical_Copy.md`, archetype one-pagers, master playbook). That package was originally produced by orchestrating multiple flows manually with the `PROJECT_BRIEF.md` loaded as context  --  a process that took weeks per vertical. This engine encodes the orchestration so the next domain (healthcare governance, lending governance, autonomous-vehicle policy, agentic AI operator licensing, geopolitical risk forecasting) takes one chain run, not 3 weeks of manual orchestration.

### Composition

The engine composes existing FlowFabric skills and adds no new code:

| Phase | Skill | Role |
|---|---|---|
| SCOPE | `checklist-builder` | Pre-campaign input validation + guardrail propagation |
| DISCOVER | `b2b-lead-finder` | Target discovery + ICP scoring |
| ARCHETYPE | `multi-platform-copywriter` | Per-archetype one-pager + post + DM (parallel with DISCOVER) |
| RESEARCH | `competitive-intel` | Per-target 17-field intelligence dossier |
| RESEARCH | `contact-intelligence` | Per-target 6-phase decision-maker dossier |
| PERSONALIZE | `cold-outreach-optimizer` | Per-target send pack with multi-touch cadence |
| PERSONALIZE | `deal-risk-analyzer` | Per-target 20-minute call simulation |
| ASSEMBLE | `checklist-builder` | Master execution playbook |

If any of these skills evolve, the engine inherits the improvement automatically.

### Vertical Specializations

The engine itself is domain-agnostic. Vertical-specific orchestrators wrap it with pre-filled inputs and additional cross-coordination:

- `marketplace/chains/insurance-license-pipeline.chain.json` -- Insurance / Reinsurance vertical orchestrator (adds standards track on monthly cadence, intelligence layer on weekly cadence)
- `marketplace/chains/cre-license-pipeline.chain.json` -- CRE vertical orchestrator (adds carrier MoU + design-partner term sheet stages)
- `marketplace/chains/ip-licensing-outreach.chain.json` -- Earlier per-target IP licensing chain (predates this generalization; uses dead codenames and is flagged for refresh)

New verticals (healthcare, lending, agentic AI, geopolitical risk) can either invoke this engine directly with a verticalized brief OR wrap it in a new vertical-specific orchestrator following the insurance/CRE pattern.

### Standards Baked In

This engine enforces the following standards on every step output via the propagation_manifest emitted by Phase 1:

- **Zero-Tolerance Fabrication.** No fabricated quotes, podcast titles, or CEO statements. No claimed customer wins. No inflated metrics. Every fact cites a public source. Unknown fields marked NA.
- **Specificity Test.** Every email body references at least one verifiable public fact about the specific target in the first two sentences. Swap test (could the email be sent to a different target by name swap?) must fail.
- **Voice Discipline.** Default 30,000-ft framing for non-domain audiences. Strip jargon and codenames beyond a parenthetical. Lead with what-it-does. Anchor to voice_sample.
- **Ask Discipline.** Always a 15-20 minute call, never "demo." Frame as a regulatory-gap or architecture conversation.
- **Channel Discipline.** Cold email subject lines never contain "patent", "license", or "monetize" unless recipient is a General Counsel. LinkedIn DMs 3 sentences max.

### File Layout (matches existing MarketingOutreach/ structure)

After a successful run, drop the outputs into the standard layout:

```
MarketingOutreach/
├── <Vertical>_Outreach_List.md            # from scored_lead_list
├── _intel/
│   └── <vertical>_<n>_<m>.md              # from target_intel_registry, batched 10 per file
├── <Vertical>_Outreach_Tactical_Copy.md   # from send_pack_registry
├── <Vertical>_Pricing_One_Pagers/
│   └── <archetype>.md                     # from archetype_pack_registry
├── <Vertical>_Conference_Targeting_Strategy.md  # extracted from target_intel.best_conference_to_meet
├── <Vertical>_Warm_Intro_Framework.md     # from contact_dossier_registry.warm_paths
└── outreach_master_playbook.md            # from master_playbook
```

### State Persistence

The engine writes to `.outreach_engine/state/` between runs:

- `prior_contacts` -- companies already contacted (read by DISCOVER for dedup)
- `prior_campaign_response_rates` -- historical performance by archetype/channel (read by PERSONALIZE for optimization)
- `objection_library` -- objections logged from negative responses (read by ASSEMBLE for response handling)

This makes successive campaigns (re-runs against an evolved ICP, or the same vertical 6 months later) cumulatively smarter.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2026-present The Wayfinder Trust. All rights reserved.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
