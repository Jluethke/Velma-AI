# Competitive Intelligence Brief Generator

**One-line description:** Systematically analyze a target company's market positioning, competitive strengths and weaknesses, recent strategic moves, and generate actionable competitive recommendations.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `company_name` (string, required) -- Name of the target company to analyze.
- `industry_focus` (string, optional) -- Primary industry or sector (e.g., "SaaS", "Healthcare Tech"). If omitted, inferred from company data.
- `time_window_months` (number, optional, default: 12) -- How many months back to scan for recent moves.
- `competitive_set_size` (number, optional, default: 5) -- Number of direct competitors to reference in strength/weakness analysis.
- `analysis_depth` (string, optional, default: "standard") -- "quick" (summary), "standard" (detailed), or "deep" (exhaustive with sub-analyses).
- `data_freshness_threshold_months` (number, optional, default: 6) -- Maximum age of data sources before flagging as stale. If primary sources exceed this age, brief status becomes "partial".

---

## Outputs

- `brief_status` (string, enum: "complete", "partial", "failed") -- "complete" if all sections populated with recent data (sources <6 months old); "partial" if data gaps exist or sources >6 months old; "failed" if company cannot be validated or insufficient data for any section.
- `company_verified` (object) -- {name, status (active/acquired/merged/defunct), headquarters, founded_year, employee_count_range, verification_source}.
- `positioning_summary` (object) -- {market_segment, stated_positioning, target_customers, value_proposition, source_recency_days}.
- `strengths` (array of objects) -- [{strength_title, description, evidence, evidence_source, evidence_recency_days, impact_level (high/medium/low), differentiated_vs_competitors (yes/no)}].
- `weaknesses` (array of objects) -- [{weakness_title, description, evidence, evidence_source, evidence_recency_days, severity_level (critical/high/medium), structural_vs_temporary (structural/temporary/unknown)}].
- `recent_moves` (array of objects) -- [{move_type (product/partnership/acquisition/funding/hiring/market_expansion), date, description, strategic_implication, data_source, confidence_level (high/medium/low)}].
- `strategic_recommendations` (array of objects) -- [{recommendation, rationale, supporting_evidence_from_phases (array of phase references), priority (high/medium/low), timeframe (immediate/3-6mo/6-12mo/ongoing), confidence_score (0-100)}].
- `competitive_trajectory` (string) -- "gaining_ground", "losing_ground", "stable", or "pivoting". Supported by evidence from recent moves and trend analysis.
- `key_threats` (array of objects) -- [{threat_description, likelihood (high/medium/low), impact_if_realized (high/medium/low), monitoring_signals (array of strings)}].
- `key_opportunities` (array of objects) -- [{opportunity_description, addressability (high/medium/low), timeframe (immediate/3-6mo/6-12mo)}].
- `brief_document` (string) -- Formatted markdown brief ready for distribution.
- `confidence_notes` (string) -- Caveats about data quality, recency, gaps, and methodology limitations.
- `data_quality_summary` (object) -- {average_source_age_days, sources_over_threshold_count, data_completeness_percentage (0-100), gaps_identified (array of strings)}.

---

## Execution Phases

### Phase 1: Company Validation and Context Gathering

**Entry Criteria:**
- `company_name` is provided and non-empty.
- `industry_focus` is provided or will be inferred.

**Actions:**
1. Validate that the company name matches a known entity by cross-referencing against: official company website, SEC filings (if US-based), LinkedIn company page, Crunchbase, or industry-specific databases. Record the verification source and date.
2. If company name is ambiguous (matches multiple entities), **Abort** and request clarification (ticker symbol, headquarters, or parent company).
3. Retrieve company metadata: headquarters, founding date, employee count range, primary industry, current status (active/acquired/merged/defunct). Record source and recency for each data point.
4. If company status is "defunct" or acquired >2 years ago, **Adjust**: analyze the acquiring company instead, or note that analysis is historical only.
5. Identify the company's stated market segment and primary customer base from official sources (website, investor relations, pitch deck, recent earnings call).
6. Extract the company's official value proposition from the most recent official source (website homepage, tagline, or mission statement). Record source and date.
7. Determine the competitive set: identify 3-7 direct competitors in the same market segment, using industry analyst reports (Gartner, Forrester) or market research as primary source.
8. For each competitor, record: name, market position (leader/challenger/niche), and brief description. This baseline enables strength/weakness comparison in later phases.

**Output:**
- `company_verified` object with name, status, location, founding year, employee range, verification_source, verification_date.
- `positioning_summary` with market segment, stated positioning, target customers, value proposition, source_recency_days.
- `competitive_set` array with competitor names, market positions, and descriptions.

**Quality Gate:**
- Company status is confirmed as "active" or recently acquired/merged (not defunct). If defunct or >2 years old, note as historical analysis only.
- Positioning summary is grounded in official company sources (website, SEC filings, investor materials), not speculation. Source recency is <6 months.
- Competitive set includes at least 3 direct competitors, verified against analyst reports or market research.
- All data points have associated source and recency metadata.

---

### Phase 2: Strengths Analysis

**Entry Criteria:**
- Company is validated.
- Positioning summary and competitive set are defined.

**Actions:**
1. Identify product/service strengths: what does this company do better than competitors? Evaluate: feature set breadth, performance benchmarks, ease of use (UX), integration ecosystem, customization options, reliability/uptime, security certifications. For each, gather evidence from: product reviews (G2, Capterra), customer case studies, analyst reports, or performance benchmarks.
2. Identify market position strengths: brand recognition, customer loyalty, market share, customer concentration, NPS/satisfaction, geographic reach. Evidence sources: analyst reports, customer surveys, LinkedIn following, press mentions, industry rankings.
3. Identify operational strengths: team depth (headcount, seniority), technology stack (modern vs. legacy), IP/patents, cost structure (unit economics), supply chain resilience, hiring velocity. Evidence sources: LinkedIn company page, patent databases, job postings, news coverage, SEC filings.
4. Identify financial strengths: funding level, profitability, burn rate, runway, revenue growth rate, pricing power. Evidence sources: SEC filings, Crunchbase, press releases, analyst reports.
5. For each strength, gather evidence (customer testimonials, analyst reports, public metrics, case studies, benchmarks) and record: evidence source, recency (days old), and confidence level (high/medium/low based on source quality).
6. Rate impact (high/medium/low) on competitive positioning: High = directly differentiates from competitors and drives customer choice; Medium = competitive advantage but not unique; Low = table-stakes or hygiene factor.
7. Cross-reference against competitive set: for each strength, explicitly note whether it is unique to this company, shared with 1-2 competitors, or table-stakes across all competitors.
8. If insufficient public information exists for a strength category, note "private company limitation" and infer from recent moves or customer base signals.

**Output:**
- `strengths` array with 5-12 items, each with: title, description, evidence, evidence_source, evidence_recency_days, impact_level, differentiated_vs_competitors (yes/no).

**Quality Gate:**
- Every strength is supported by at least one evidence source (not opinion). If inferred, confidence_level is marked "low" and caveat is noted.
- Strengths are specific and measurable (not "good product" but "fastest query response time in category: 50ms vs. competitor average 200ms").
- At least 2 strengths are marked "differentiated_vs_competitors: yes" or analysis notes that company is not differentiated (rare but possible).
- Average evidence recency is <6 months. If any strength relies on data >12 months old, it is flagged in confidence_notes.

---

### Phase 3: Weaknesses Analysis

**Entry Criteria:**
- Strengths analysis is complete.
- Competitive set is defined.

**Actions:**
1. Identify product/service weaknesses: what is missing, outdated, or inferior vs. competitors? Evaluate: limited integrations, poor UX, performance gaps, missing features, technical debt signals, scalability limits. Evidence sources: customer reviews (G2, Capterra, Reddit), feature comparison matrices, analyst reports, support forum discussions.
2. Identify market position weaknesses: brand awareness gaps, customer churn, market share loss, geographic limitations, customer concentration risk, pricing pressure. Evidence sources: analyst reports, customer reviews, news coverage, LinkedIn job postings (high turnover signals), Glassdoor reviews.
3. Identify operational weaknesses: team gaps (missing functions), technical debt, legacy systems, hiring challenges, key person dependency, organizational friction. Evidence sources: LinkedIn company page (team composition, turnover), job postings, news coverage, Glassdoor reviews, patent activity (or lack thereof).
4. Identify financial weaknesses: burn rate, funding gaps, margin compression, revenue concentration, customer concentration, pricing pressure. Evidence sources: SEC filings, Crunchbase, news coverage, analyst reports.
5. Identify strategic vulnerabilities: regulatory exposure, technology disruption risk, supplier dependency, customer concentration, market shift risk. Evidence sources: news coverage, analyst reports, regulatory filings, industry trends.
6. For each weakness, gather evidence and record: evidence source, recency (days old), confidence level. Rate severity (critical/high/medium) based on impact on competitiveness and business viability. Critical = threatens business viability or competitive survival; High = significantly impacts competitiveness or growth; Medium = limits market expansion or efficiency.
7. Classify each weakness as: structural (hard to fix, requires fundamental change), temporary (being addressed, should resolve), or unknown (insufficient data). Structural weaknesses are more strategically significant.
8. If insufficient public information exists for a weakness category, note "private company limitation" and infer from competitive set comparison or market feedback signals.
9. If no critical or high-severity weaknesses are identified, note that company is exceptionally strong in this dimension.

**Output:**
- `weaknesses` array with 4-10 items, each with: title, description, evidence, evidence_source, evidence_recency_days, severity_level, structural_vs_temporary, confidence_level.

**Quality Gate:**
- Every weakness is supported by evidence (not speculation). If inferred, confidence_level is marked "low" and caveat is noted.
- Weaknesses are specific and actionable (not "bad culture" but "high engineering turnover: 35% annual attrition vs. 15% industry average, evidenced by LinkedIn job postings and Glassdoor reviews").
- At least one critical or high-severity weakness is identified, OR analysis explicitly notes that company is exceptionally strong (rare).
- Average evidence recency is <6 months. If any weakness relies on data >12 months old, it is flagged in confidence_notes.
- Structural vs. temporary classification is justified by evidence (e.g., "structural: no recent hiring in this function" vs. "temporary: job postings indicate active hiring").

---

### Phase 4: Recent Moves Analysis

**Entry Criteria:**
- Company validation and positioning are complete.
- Time window is defined (default: last 12 months).

**Actions:**
1. Scan for product launches, major feature releases, or product sunsetting within the time window. Evidence sources: company blog, press releases, product roadmap, customer announcements, G2/Capterra release notes.
2. Scan for partnerships, integrations, or ecosystem moves (e.g., API launches, marketplace launches, reseller agreements). Evidence sources: press releases, company blog, partnership announcements, LinkedIn posts.
3. Scan for acquisitions, investments, or M&A activity. Evidence sources: press releases, SEC filings, Crunchbase, news coverage.
4. Scan for funding rounds, IPO, or capital events. Evidence sources: Crunchbase, SEC filings, press releases, news coverage.
5. Scan for leadership changes, hiring announcements, or organizational restructuring. Evidence sources: LinkedIn announcements, press releases, news coverage, company blog.
6. Scan for market expansion (new geographies, new verticals, new customer segments). Evidence sources: press releases, company blog, job postings (new regional offices), news coverage.
7. For each move, document: type, date, description, strategic implication (what does this signal about company direction, priorities, or urgency?), data source, and confidence level (high if from official source; medium if from news; low if inferred).
8. Identify patterns: are moves defensive (responding to competition) or offensive (expanding market)? Are they aligned with stated positioning? Are they accelerating or decelerating in frequency?
9. If no recent moves are found in the time window, **Adjust**: extend time window or note that company is in "steady state" (no major strategic shifts detected).

**Output:**
- `recent_moves` array with 3-15 items, each with: move_type, date, description, strategic_implication, data_source, confidence_level.
- `move_pattern_summary` (string): brief narrative of whether moves are offensive/defensive, aligned with positioning, and accelerating/decelerating.

**Quality Gate:**
- Moves are documented with specific dates and sources. No move is dated "sometime in 2024" without specificity.
- Strategic implications are explicit and specific (not "they hired people" but "they hired 12 engineers in ML/AI, signaling acceleration of AI-powered features and potential pivot toward autonomous agents").
- Moves span multiple categories (not all product, not all hiring). If moves are concentrated in one category, note this as a strategic signal.
- At least 3 moves are documented. If fewer than 3 moves are found, note "limited strategic activity" and extend time window if appropriate.
- Average move recency is within the time window. If most moves are >12 months old, note "declining activity" as a signal.

---

### Phase 5: Strategic Synthesis and Recommendations

**Entry Criteria:**
- Strengths, weaknesses, and recent moves are documented.

**Actions:**
1. Synthesize positioning: based on strengths, weaknesses, and recent moves, what is the company's overall competitive strategy? Classify as one of: cost leader, feature/capability leader, vertical specialist, platform play, or hybrid. Justify the classification with 2-3 supporting data points from strengths/moves.
2. Assess trajectory: based on recent moves and current position, is the company gaining or losing ground? Classify as: "gaining_ground" (expanding market share, accelerating moves, strong funding), "losing_ground" (declining moves, customer churn signals, funding gaps), "stable" (steady moves, no major shifts), or "pivoting" (strategic direction change evident). Justify with evidence from recent moves and trend analysis.
3. Identify threats to the company: what could disrupt its position? For each threat, estimate likelihood (high/medium/low) and impact if realized (high/medium/low). Identify monitoring signals: what would indicate the threat is materializing? Threats may include: new competitor, technology shift, customer consolidation, regulatory change, market saturation, pricing pressure.
4. Identify opportunities for the company: where could it expand or strengthen? For each opportunity, estimate addressability (high/medium/low) and timeframe (immediate/3-6mo/6-12mo). Opportunities may include: adjacent markets, new customer segments, partnerships, M&A targets, geographic expansion, product line extension.
5. Generate 4-8 strategic recommendations for our organization's response. Recommendations must fall into at least these categories: (a) defensive (how to protect against this competitor), (b) offensive (how to exploit their weaknesses), (c) partnership (could we work with them?), (d) monitoring (what signals should we watch?). Each recommendation must be traceable to specific evidence from strengths/weaknesses/moves analysis.
6. For each recommendation, provide: recommendation statement, rationale (2-3 sentences grounded in evidence), supporting_evidence_from_phases (array of references like "Phase 2, Strength: X" or "Phase 4, Move: Y"), priority (high/medium/low), timeframe (immediate/3-6mo/6-12mo/ongoing), and confidence_score (0-100 based on how directly supported by evidence).
7. Rank recommendations by priority and confidence score. High-priority, high-confidence recommendations should be actionable immediately.

**Output:**
- `competitive_trajectory` (string, enum: "gaining_ground", "losing_ground", "stable", "pivoting") with supporting evidence summary.
- `key_threats` array with 2-5 items, each with: threat_description, likelihood, impact_if_realized, monitoring_signals (array of specific signals to watch).
- `key_opportunities` array with 2-5 items, each with: opportunity_description, addressability, timeframe.
- `strategic_recommendations` array with 4-8 items, each with: recommendation, rationale, supporting_evidence_from_phases, priority, timeframe, confidence_score.

**Quality Gate:**
- Competitive trajectory is justified by 2+ data points from recent moves or trend analysis. Not opinion-based.
- Recommendations are grounded in the strengths/weaknesses/moves analysis (traceable via supporting_evidence_from_phases). No generic recommendations like "stay aware."
- Recommendations are actionable (not "stay aware" but "accelerate feature X to close the gap on their strength Y, estimated 2-quarter effort").
- At least one recommendation is defensive, one is offensive, and one is monitoring-focused.
- Confidence scores reflect evidence quality: high confidence (80+) only if supported by multiple sources; medium confidence (50-79) if supported by 1-2 sources; low confidence (<50) if inferred or single-source.
- Threats and opportunities are specific and measurable (not "market changes" but "AI-powered competitors entering the market, evidenced by 3 new entrants in last 6 months").

---

### Phase 6: Brief Compilation and Formatting

**Entry Criteria:**
- All prior phases are complete.
- Confidence scores and evidence recency are documented.

**Actions:**
1. Assemble the brief in a standard structure:
   - **Executive Summary** (1 paragraph, 100-150 words): who they are, where they stand competitively, top 1-2 strengths, top 1-2 weaknesses, competitive trajectory, and top 1-2 recommended actions.
   - **Company Overview** (1 section): positioning, market segment, key metrics (employee count, funding, revenue if public), founding date, headquarters.
   - **Competitive Strengths** (1 section): table or list with strength title, description, evidence, impact level. Highlight 2-3 most differentiated strengths.
   - **Competitive Weaknesses** (1 section): table or list with weakness title, description, evidence, severity level. Highlight 1-2 most critical weaknesses.
   - **Recent Strategic Moves** (1 section): timeline or narrative of 3-15 moves with strategic implications. Summarize pattern (offensive/defensive/steady).
   - **Competitive Trajectory** (1 section): 1-2 paragraphs assessing whether company is gaining/losing/stable/pivoting, with supporting evidence.
   - **Key Threats and Opportunities** (1 section): brief list of 2-5 threats and 2-5 opportunities with monitoring signals.
   - **Strategic Recommendations** (1 section): prioritized list of 4-8 recommendations with rationale, priority, timeframe, and confidence score. Organize by priority (high first).
   - **Confidence and Caveats** (1 section): data freshness, gaps, assumptions, methodology notes.
   - **Metadata** (footer): analysis date, analyst name (if applicable), data sources used, next review date.
2. Format as markdown for easy sharing and version control. Use tables for strengths/weaknesses/recommendations for readability.
3. Validate internal consistency: check that no section contradicts another. For example, if Phase 2 identifies a strength, it should not be contradicted in Phase 3 weaknesses. If contradiction exists, **Adjust**: flag the section for author review rather than auto-resolving.
4. Generate a data_quality_summary: average source age (days), count of sources >6 months old, data completeness percentage (0-100 based on how many data points are populated vs. gaps), and list of identified gaps.
5. Determine brief_status: "complete" if all sections populated and average source age <6 months; "partial" if data gaps exist or average source age 6-12 months; "failed" if company cannot be validated or >50% of sections are missing.
6. Generate confidence_notes: explain data quality, caveats, gaps, and assumptions. If brief_status is "partial", specify which sections are incomplete and why.
7. Validate that the brief is readable: a person unfamiliar with the company should be able to understand: (a) what the company does, (b) how it compares to competitors, (c) what we should do in response. Test by checking that Executive Summary + Recommendations sections are self-contained and actionable.

**Output:**
- `brief_document` (markdown string, 3-5 pages).
- `brief_status` ("complete", "partial", or "failed").
- `confidence_notes` (string, 200-400 words).
- `data_quality_summary` (object with: average_source_age_days, sources_over_threshold_count, data_completeness_percentage, gaps_identified array).

**Quality Gate:**
- Brief is readable and well-structured. Executive Summary + Recommendations sections are self-contained and actionable without reading full brief.
- All sections are populated (no "TBD" placeholders). If data is missing, it is noted in confidence_notes.
- Recommendations are actionable and tied to evidence (each recommendation references supporting evidence from earlier sections).
- Brief_status accurately reflects data quality: "complete" only if all sources <6 months old and all sections populated; "partial" if gaps exist; "failed" if >50% missing.
- Data quality summary is accurate and complete. Average source age is calculated and reported.
- No internal contradictions between sections. If contradictions exist, they are flagged for author review.

---

## Exit Criteria

The skill is DONE when:
1. Company is validated and positioned in its market (Phase 1 complete, company_verified object populated).
2. At least 5 strengths and 4 weaknesses are documented with evidence, source, and recency (Phases 2-3 complete).
3. At least 3 recent moves are documented with strategic implications and confidence levels (Phase 4 complete).
4. At least 4 strategic recommendations are generated, prioritized, and confidence-scored (Phase 5 complete).
5. A formatted brief document is produced in markdown format, readable in 10 minutes (Phase 6 complete).
6. Confidence notes explain data gaps, source recency, and methodology limitations (Phase 6 complete).
7. Brief_status is determined: "complete", "partial", or "failed" (Phase 6 complete).
8. Data quality summary is provided with average source age and completeness percentage (Phase 6 complete).

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Company name is ambiguous or matches multiple entities | **Abort** -- ask for clarification (ticker symbol, headquarters, or parent company) before proceeding. Do not guess. |
| Phase 1 | Company is defunct or acquired >2 years ago | **Adjust** -- analyze the acquiring company instead, or note that analysis is historical only. Mark brief_status as "partial" and explain in confidence_notes. |
| Phase 1 | Company cannot be validated (no official sources found) | **Abort** -- company does not exist or is too private/obscure. Recommend using alternative data sources or conducting primary research (customer interviews). |
| Phase 2 | Insufficient public information on strengths | **Adjust** -- note "private company" limitation in confidence_notes. Infer strengths from recent moves, customer base, and competitive set comparison. Mark inferred strengths with confidence_level "low". |
| Phase 3 | Insufficient public information on weaknesses | **Adjust** -- note "private company" limitation in confidence_notes. Infer weaknesses from competitive set comparison, market feedback, and absence of signals (e.g., no hiring in key function). Mark inferred weaknesses with confidence_level "low". |
| Phase 4 | No recent moves found in time window | **Adjust** -- extend time window to 24 months or note that company is in "steady state" (no major strategic shifts detected in last 12 months). This is a valid finding and should be noted in competitive_trajectory. |
| Phase 4 | Conflicting evidence on a move (e.g., one source says acquisition, another says partnership) | **Adjust** -- document both versions and note the conflict in confidence_notes. Use official source (press release) as primary; note secondary sources as "unconfirmed". |
| Phase 5 | Recommendations are too generic or not traceable to evidence | **Retry** -- re-examine strengths/weaknesses/moves and generate more specific, differentiated recommendations. Each recommendation must have supporting_evidence_from_phases array populated. |
| Phase 5 | Conflicting signals (e.g., recent moves suggest growth but weaknesses suggest decline) | **Adjust** -- note the contradiction in competitive_trajectory and confidence_notes. Classify trajectory as "pivoting" if direction is unclear. Flag for analyst review. |
| Phase 6 | Brief exceeds 5 pages | **Adjust** -- move detailed evidence tables to appendix, keep main brief to Executive Summary + key sections (Positioning, Strengths, Weaknesses, Recommendations). Ensure brief is still readable in 10 minutes. |
| Phase 6 | Internal contradiction between sections (e.g., strength in Phase 2 contradicts weakness in Phase 3) | **Adjust** -- flag the contradiction in confidence_notes and mark brief_status as "partial". Do not auto-resolve; recommend author review to clarify the contradiction. |
| Phase 6 | Data quality is poor (average source age >12 months, >50% of sections missing) | **Adjust** -- mark brief_status as "partial" or "failed". Explain gaps in confidence_notes. Recommend re-running analysis with more recent data sources or conducting primary research (customer interviews). |

---

## Reference Section: Domain Knowledge and Decision Criteria

### Strength Categories
- **Product/Service:** Feature breadth, performance, ease of use, integration ecosystem, customization, reliability, security, compliance certifications.
- **Market Position:** Brand recognition, customer loyalty, NPS, market share, customer concentration, geographic reach, vertical penetration.
- **Operational:** Team depth, technology stack, IP/patents, cost structure, supply chain, hiring velocity, organizational maturity.
- **Financial:** Funding, profitability, burn rate, revenue growth, unit economics, pricing power, customer lifetime value.

### Weakness Categories
- **Product/Service:** Missing features, poor UX, performance gaps, limited integrations, technical debt, scalability limits, security gaps.
- **Market Position:** Brand awareness gaps, churn, market share loss, geographic gaps, customer concentration, pricing pressure, NPS decline.
- **Operational:** Team gaps, hiring challenges, key person dependency, legacy systems, organizational friction, process inefficiency.
- **Financial:** Burn rate, funding gaps, margin compression, revenue concentration, customer concentration, pricing pressure, unit economics deterioration.
- **Strategic:** Regulatory exposure, technology disruption risk, supplier dependency, customer concentration, market shift vulnerability.

### Severity Levels for Weaknesses
- **Critical:** Threatens business viability or competitive survival (e.g., massive churn >30% annually, regulatory violation, technology obsolescence, funding runway <12 months).
- **High:** Significantly impacts competitiveness or growth (e.g., missing key features vs. competitors, high burn rate, team turnover >25% annually, market share loss).
- **Medium:** Limits market expansion or efficiency (e.g., geographic gap, integration gap, process inefficiency, customer concentration >40%).

### Impact Levels for Strengths
- **High:** Directly differentiates from competitors and drives customer choice (e.g., unique feature, superior performance, strong brand, exclusive partnership).
- **Medium:** Competitive advantage but not unique (e.g., good product, solid team, adequate funding, standard integrations).
- **Low:** Table-stakes or hygiene factor (e.g., basic compliance, standard features, adequate support, industry-standard pricing).

### Recent Move Types
- **Product:** Launch, major feature release, sunsetting, pivot, rebranding, API launch, marketplace launch.
- **Partnership:** Integration, reseller agreement, OEM, strategic alliance, ecosystem play, co-marketing.
- **M&A:** Acquisition, investment (equity or debt), merger, divestiture, spin-off.
- **Capital:** Funding round (Series A/B/C/etc.), IPO, debt issuance, buyback, secondary offering.
- **Organization:** Leadership change (CEO, CTO, etc.), hiring spree (>10% headcount increase), restructuring, office opening/closing, layoffs.
- **Market:** Geographic expansion, vertical expansion, new customer segment, channel shift, pricing change.

### Recommendation Priority Framework
- **High:** Urgent, directly impacts our competitive position or revenue, requires immediate action (next 1-4 weeks).
- **Medium:** Important but not urgent, should be planned for next quarter or planning cycle (next 3-6 months).
- **Low:** Nice-to-have, monitor but no immediate action required (next 6-12 months or ongoing).

### Recommendation Timeframe
- **Immediate:** Action within 1-4 weeks.
- **3-6mo:** Action within next quarter or two.
- **6-12mo:** Action within next planning cycle.
- **Ongoing:** Continuous monitoring or incremental action.

### Confidence Score Calculation for Recommendations
- **80-100:** Supported by 3+ independent sources, recent data (<3 months), direct evidence from multiple phases.
- **50-79:** Supported by 1-2 sources, moderate recency (3-6 months), evidence from 1-2 phases.
- **<50:** Inferred or single-source, older data (>6 months), limited direct evidence.

### Data Sources (in order of reliability)
1. Company official sources (website, investor relations, press releases, SEC filings, earnings calls).
2. Third-party analyst reports (Gartner, Forrester, IDC, etc.).
3. Customer reviews and testimonials (G2, Capterra, case studies, customer interviews).
4. News and media coverage (TechCrunch, industry publications, Bloomberg, Reuters).
5. LinkedIn and hiring signals (team composition, hiring velocity, turnover signals).
6. Social media and community signals (Twitter, Reddit, forums, Hacker News).
7. Inferred from competitive set comparison or market trends.

### Data Freshness Standards
- **Fresh:** <3 months old (high confidence).
- **Recent:** 3-6 months old (medium-high confidence).
- **Moderate:** 6-12 months old (medium confidence, flag in brief).
- **Stale:** >12 months old (low confidence, flag as "partial" brief status).

---

## State Persistence (Optional)

If this skill is run repeatedly on the same company, consider tracking:
- Previous brief date and version (to avoid duplicate analysis and identify what has changed).
- Tracked metrics over time (employee count, funding, market share, customer count, NPS) to identify trends and trajectory.
- Analyst notes and corrections from previous runs (to improve accuracy and avoid repeating errors).
- Competitive set changes (new entrants, consolidation, exits) to update comparison baseline.
- Recent moves from previous analysis (to avoid re-documenting and focus on new moves only).
- Recommendation outcomes: which recommendations were acted on, and what was the result? This enables feedback loop and improves future recommendations.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.