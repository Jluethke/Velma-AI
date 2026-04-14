# Sector Target Scanner

Systematically scans a target sector to identify every company deploying adaptive AI systems that fall within the scope of patent Family A (runtime actuation governance) or Family B (runtime learning governance). Uses public signals — job postings, press releases, regulatory filings, conference appearances, patent filings, and product disclosures — to build a raw target list with qualifying evidence for each company.

**Why this exists:** You can't license to companies you haven't found. Most licensing campaigns target the obvious names and miss the mid-market. This skill exhausts the sector before a single email is sent — so the prioritization engine works from a complete list, not a partial one.

**Core principle:** A company is a qualifying target if their deployed AI system either (A) makes real-time actuation decisions (Family A) or (B) adapts its parameters based on live data (Family B). You do not need to confirm implementation details — public signals of deployment are sufficient to initiate contact. Confirmation happens in the conversation.

## Inputs

- `sector`: string — Target sector (e.g., "cyber insurance", "autonomous vehicles", "medical AI", "financial services AI", "humanoid robotics")
- `patent_families`: list[object] — Families to scan against. Each: `{family, title, what_it_covers, claim_triggers}`
- `geography`: string — Geographic scope: "US" | "EU" | "global" (default: "US")
- `company_size`: string — Minimum company size: "startup" | "mid_market" | "enterprise" | "all" (default: "mid_market")
- `scan_depth`: string — "surface" (top 20 companies, public sources only) | "deep" (exhaust all signals, 50+ companies)
- `exclude_list`: list[string] — Company names already in pipeline (skip these)

## Outputs

- `raw_targets`: list[object] — Every company found: `{company, sector, hq, size_estimate, ai_system_description, qualifying_signal, signal_sources, family_a_exposure, family_b_exposure, confidence}`
- `signal_summary`: object — What signals were found most frequently across the sector (indicates where to look deeper)
- `sector_intelligence`: object — Regulatory landscape, recent enforcement actions, upcoming compliance deadlines, named companies that have publicly discussed AI governance gaps
- `scan_report`: string — One-page summary of what was found, coverage confidence, and recommended scan extensions

---

## Execution

### Phase 1: SECTOR MAPPING

**Entry criteria:** `sector` and `patent_families` provided.

**Actions:**

1. **Define what a qualifying system looks like in this sector.**

   | Sector | Family A Signal | Family B Signal |
   |---|---|---|
   | Cyber Insurance | AI that issues/denies policies in real time | AI that retrains on new breach events / loss data |
   | Autonomous Vehicles | Drive-by-wire actuation, safety envelope enforcement | Perception models that adapt to new road conditions |
   | Medical AI | Diagnostic systems that actuate treatment recommendations | Clinical models that update on new patient outcomes |
   | Financial Services | Algorithmic trading execution, credit decisioning | Risk models that retrain on market data |
   | Humanoid Robotics | Motor control, manipulation, balance actuation | Skill learning from demonstration or environment |
   | Defense / Autonomous Systems | Weapon system engagement authorization | Target classification models that adapt in field |
   | Insurance (General) | Underwriting AI that accepts/declines in real time | Pricing models that recalibrate on claims history |

2. **Identify the top companies in the sector.** Sources:
   - Crunchbase: sector filter, sort by funding
   - CB Insights: AI company trackers per sector
   - PitchBook: company database
   - Forbes / Fortune lists: sector-specific rankings
   - Industry associations: member lists (RIMS, InsurTech Alliance, AV industry groups)
   - Recent M&A: who just acquired an AI company in this sector

3. **For each company, determine:** Does their core product involve an AI system that matches either family's claim triggers?

**Output:** Initial target list (unscored)

---

### Phase 2: SIGNAL HARVESTING

**For each company on the initial list, search for qualifying signals:**

**Signal Type 1 — Job Postings (highest signal quality)**

Search: `[Company] site:linkedin.com/jobs OR site:greenhouse.io OR site:lever.co "machine learning" OR "model monitoring" OR "AI governance" OR "responsible AI" OR "model reliability" OR "MLOps"`

Job titles that confirm Family B exposure:
- ML Reliability Engineer
- AI Governance Lead
- Model Risk Manager
- Head of Responsible AI
- MLOps Engineer (adaptive systems focus)
- AI Safety Engineer
- Model Validation Analyst

Job titles that confirm Family A exposure:
- Autonomy Safety Engineer
- AI Systems Architect (real-time decisioning)
- Control Systems Engineer (ML-based)
- Runtime AI Engineer

**Why job postings work:** A company hiring for "model monitoring" has an adaptive model that needs monitoring. A company hiring for "AI governance" knows they have a governance gap. These are the warmest targets.

**Signal Type 2 — Press Releases and Product Announcements**

Search: `[Company] "AI" "real-time" "adaptive" OR "dynamic" OR "continuously learning" site:prnewswire.com OR site:businesswire.com`

Qualifying language:
- "continuously learning from new data"
- "adaptive underwriting"
- "dynamic pricing engine"
- "real-time risk assessment"
- "AI-powered decisioning"
- "model updates automatically"

**Signal Type 3 — Regulatory Filings**

For insurance companies: NAIC regulatory filings, state insurance commissioner filings, annual reports (10-K for public companies)

Search: `[Company] 10-K "artificial intelligence" "machine learning" "adaptive" site:sec.gov`

For autonomous vehicles: NHTSA safety filings, California DMV AV testing reports

For medical AI: FDA 510(k) clearances mentioning adaptive algorithms, De Novo classifications

**Signal Type 4 — Conference Appearances**

Search for company employees speaking at:
- InsureTech Connect, RIMS, AI in Insurance Summit
- NeurIPS, ICML, ICLR (for technical staff)
- RSA Conference, Black Hat (cyber/insurance AI)
- CES, AV Summit (autonomous vehicles)
- HLTH, HIMSS (medical AI)

Speakers who present on: adaptive AI, model governance, AI reliability, regulatory compliance for AI — these people feel the pain. They're the champions.

**Signal Type 5 — Patent Filings**

Search USPTO/Google Patents: `[Company] "machine learning" "adaptive" "governance" OR "monitoring" OR "constraint"`

Companies filing adjacent patents know the space — they're likely implementing something that overlaps with Family A or B.

**Signal Type 6 — Published Research and Technical Blog Posts**

Search: `[Company] engineering blog "model" "drift" OR "governance" OR "monitoring" OR "rollback"`

Companies publishing on model drift, data drift, or model governance are actively thinking about the problem Family B solves.

**Output:** `raw_targets` with qualifying signals and sources per company

---

### Phase 3: EXPOSURE MAPPING

**For each company with qualifying signals:**

1. **Map Family A exposure.** Does their system make real-time actuation decisions? What is the consequence of an ungoverned actuation? What enforcement mechanism do they currently have?

2. **Map Family B exposure.** Does their system learn or adapt on live data? What is the consequence of ungoverned parameter drift? What is their current audit trail for model updates?

3. **Assess regulatory exposure.** For this company in this sector:
   - What specific regulation applies (NAIC, EU AI Act, NHTSA, FDA, FINRA)?
   - What is the enforcement timeline?
   - What is the estimated penalty range?
   - Has the regulator issued guidance specific to adaptive AI in this sector?

4. **Assign confidence score.** HIGH (confirmed deployment via press or filing), MEDIUM (strong signals via job postings or technical blog), LOW (inferred from product description).

**Output:** Updated `raw_targets` with exposure fields

---

### Phase 4: SECTOR INTELLIGENCE COMPILATION

1. **Identify the regulatory clock.** What is the most urgent compliance deadline in this sector? This becomes the urgency anchor for all outreach.

2. **Find public statements about AI governance gaps.** Have any companies in this sector publicly acknowledged compliance challenges? These are warm targets.

3. **Identify sector-wide patterns.** What is the most common qualifying signal type in this sector? What is the average company's exposure level?

4. **Note recent enforcement actions.** Has any company in this sector been cited or fined for AI-related governance failures? This becomes a reference point in outreach.

**Output:** `sector_intelligence`, `signal_summary`, `scan_report`

---

## Exit Criteria

Done when:
1. All companies in sector scanned across all 6 signal types
2. Each qualifying target has at least one confirmed signal with source citation
3. Family A and Family B exposure assessed per target
4. Regulatory exposure mapped per target
5. Confidence score assigned to each
6. Scan report compiled

## Error Handling

| Failure Mode | Response |
|---|---|
| Company has no public AI disclosures | Mark LOW confidence — include in list with note "stealth deployment possible" |
| Sector has <10 qualifying targets | Expand geography or lower company size threshold — flag for review |
| Regulatory framework unclear | Flag — note that outreach should lead with technology proof, not regulatory urgency |

## State Persistence

- `sector_registry`: All sectors scanned — companies found, signal types, scan date
- `signal_library`: Qualifying signal patterns per sector — improves scan accuracy over time
- `regulatory_calendar`: Upcoming enforcement deadlines by sector — drives urgency timing

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
