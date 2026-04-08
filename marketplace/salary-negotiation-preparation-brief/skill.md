# Salary Negotiation Preparation Brief

**One-line description:** Systematically prepare for salary negotiations by gathering market data, analyzing your BATNA, developing an anchoring strategy, and scripting responses to common objections.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `job_title` (string, required) -- The position title you are negotiating for or currently hold.
- `location` (string, required) -- Geographic location (city, region, or remote designation).
- `experience_level` (string, required) -- Years of experience or seniority level (e.g., "5 years", "senior", "entry-level").
- `industry` (string, required) -- Industry or sector (e.g., "software engineering", "finance", "healthcare").
- `company_size` (string, optional) -- Company size category (startup, mid-market, enterprise). Default: "mid-market".
- `current_salary` (number, optional) -- Your current or most recent salary (USD or local currency). Used for BATNA analysis.
- `desired_salary` (number, required) -- Your target salary for this negotiation. Must be >= current_salary (if provided) and <= market_median * 1.20.
- `other_offers` (array of objects, optional) -- Other job offers or alternatives. Each object: `{title, company, salary, offer_strength}`. Offer strength: "strong", "moderate", "weak".
- `negotiation_context` (string, required) -- Type of negotiation: "new-hire", "counter-offer", "promotion", "retention".
- `personal_walk_away_threshold` (number, optional) -- Minimum salary you will accept. Default: current_salary * 1.05.
- `non_salary_priorities` (array of strings, optional) -- Non-monetary benefits important to you (e.g., "equity", "remote-flexibility", "title", "PTO"). Default: empty array.

---

## Outputs

- `market_data_points` (array of objects) -- Salary benchmarks from credible sources. Each object: `{source, salary_min, salary_max, percentile, sample_size, date_collected}`.
- `batna_analysis` (object) -- BATNA summary: `{batna_statement, fallback_salary, walk_away_threshold, batna_strength ("strong"|"moderate"|"weak")}`.
- `anchoring_strategy` (object) -- Opening position and range: `{opening_anchor, anchor_justification, acceptable_range_min, acceptable_range_max, anchor_type ("aggressive"|"moderate"|"conservative")}`.
- `response_scripts` (object) -- Scripted responses keyed by objection type. Keys: "budget-constraint", "performance-concern", "market-rate-challenge", "equity-argument", "timing-objection", "non-salary-objection". Each value is a string with a suggested response.
- `negotiation_brief` (string, markdown format) -- Formatted brief ready for reference during negotiation. Includes all above sections in 1-2 page format.

---

## Execution Phases

### Phase 1: Gather Market Salary Data

**Entry Criteria:**
- Job title, location, experience level, industry, and company size are provided.
- Access to at least two credible salary data sources (Glassdoor, PayScale, Bureau of Labor Statistics, LinkedIn Salary, industry-specific surveys, recruiter reports).

**Actions:**
1. Query Glassdoor for salary ranges for the job title + location + company size; record salary_min, salary_max, sample_size, and date.
2. Query PayScale for the same parameters; record salary range, percentile distribution, sample_size, and date.
3. Check Bureau of Labor Statistics (BLS) for the industry and location; record median and quartile data (25th, 50th, 75th percentile).
4. If available, gather recruiter intel or industry survey data for the specific role; record source, salary range, and date.
5. Compile all data points into a single array, with each entry containing: source, salary_min, salary_max, percentile (if available), sample_size, date_collected.
6. Calculate market_median using the following weighted formula: (BLS_median * 0.35) + (PayScale_median * 0.35) + (Glassdoor_median * 0.20) + (other_sources_median * 0.10). If Glassdoor sample_size < 50, reduce its weight to 0.10 and redistribute to BLS and PayScale equally.

**Output:**
- `market_data_points`: Array of 4-6 data points with source, min/max salary, percentile, sample size, and collection date.
- `market_median`: Single number representing the consensus market rate, calculated via weighted formula.

**Quality Gate:**
- At least 3 independent sources are represented in market_data_points.
- All data is dated within the last 12 months; if data is 6-12 months old, apply 3% annual inflation adjustment and document the adjustment.
- Each data point includes location and experience level filters (verify that source data is not national average or entry-level when you are senior).
- market_median is within 10% of the simple average of all source medians (sanity check for weighting formula).

---

### Phase 2: Analyze BATNA

**Entry Criteria:**
- Current salary (if applicable), desired salary, and walk-away threshold are defined.
- Other job offers or alternatives (if any) are documented.

**Actions:**
1. If current_salary is provided, calculate the minimum acceptable increase: `current_salary * 1.05` (5% floor). If personal_walk_away_threshold is provided, use that instead; otherwise, use the 5% calculation.
2. If other_offers exist, identify the strongest offer by salary and terms. Record its salary and strength rating ("strong", "moderate", "weak").
3. If no other offers exist, assess your market alternatives: Can you find a comparable role in 2-4 weeks? Rate your market position as "strong" (yes, multiple options), "moderate" (yes, 1-2 options), or "weak" (uncertain or limited options).
4. Write a BATNA statement using this template: "My best alternative is [specific offer or market alternative], which offers $[salary] and [key terms]. I will not accept less than $[walk_away_threshold]." Ensure the statement is specific and credible (not hypothetical).
5. Set walk_away_threshold: the minimum salary at which you will accept the role. Calculate as the maximum of: (a) current_salary * 1.05, (b) other_offer salary (if exists), or (c) personal_walk_away_threshold. Round to nearest $1,000.
6. Rate BATNA strength using this decision table:
   - "strong" if walk_away_threshold >= market_median AND (other_offers exist OR market alternatives are abundant).
   - "moderate" if 0.90 * market_median <= walk_away_threshold < market_median OR market alternatives are limited but viable.
   - "weak" if walk_away_threshold < 0.90 * market_median OR market alternatives are uncertain.

**Output:**
- `batna_analysis`: Object with batna_statement (string), fallback_salary (number), walk_away_threshold (number), and batna_strength ("strong"|"moderate"|"weak").

**Quality Gate:**
- BATNA statement is specific and credible (references a concrete offer or documented market alternative, not hypothetical).
- Walk-away threshold is a single concrete number, not a range.
- BATNA strength rating aligns with the gap between walk_away_threshold and market_median (verify via decision table above).
- walk_away_threshold <= desired_salary (if not, flag for Phase 3 recalibration).

---

### Phase 3: Develop Anchoring Strategy

**Entry Criteria:**
- Market data (market_median) is available from Phase 1.
- BATNA analysis is complete (walk_away_threshold and BATNA strength are known) from Phase 2.
- Desired salary is defined and >= walk_away_threshold.

**Actions:**
1. Validate desired_salary: Confirm that desired_salary >= walk_away_threshold and <= market_median * 1.20. If desired_salary > market_median * 1.20, flag as unrealistic and recommend recalibration downward. If desired_salary < walk_away_threshold, flag as inconsistent and recommend recalibration upward.
2. Determine anchor type using this decision table:
   - "aggressive": BATNA strength = "strong" AND negotiation_context = "new-hire". Anchor = desired_salary * 1.10 (10% above desired).
   - "moderate": BATNA strength = "moderate" OR negotiation_context = "promotion" OR negotiation_context = "retention". Anchor = desired_salary * 1.05 (5% above desired).
   - "conservative": BATNA strength = "weak" OR negotiation_context = "counter-offer". Anchor = desired_salary * 1.02 (2% above desired).
3. Calculate opening_anchor using the formula from Step 2. Round to nearest $5,000 (or local currency equivalent).
4. Define acceptable_range_min: the maximum of (a) walk_away_threshold or (b) market_median * 0.95. This is your floor; do not negotiate below this.
5. Define acceptable_range_max: the minimum of (a) opening_anchor or (b) market_median * 1.15. This is your ceiling; do not ask for more than this.
6. Write anchor_justification using this template: "Based on [source] data for [job_title] in [location], the market median is $[market_median]. My [years/level] of experience in [domain] and track record of [specific achievement] position me at the [percentile] of the market. An opening anchor of $[opening_anchor] reflects this premium and is justified by [1-2 specific reasons]." Keep to 2-3 sentences.
7. If non_salary_priorities are provided, identify which can be traded for salary (e.g., equity for lower base, remote flexibility for lower salary). Create a "negotiation levers" list: "If salary is constrained, I can accept [benefit] in exchange for [salary reduction]." For example: "If salary is constrained at $X, I can accept equity grant of [Y shares] in exchange for $[X - reduction]." This list is for your reference, not to be shared unless salary negotiation stalls.

**Output:**
- `anchoring_strategy`: Object with opening_anchor (number), anchor_justification (string), acceptable_range_min (number), acceptable_range_max (number), anchor_type ("aggressive"|"moderate"|"conservative"), and negotiation_levers (array of strings, optional).

**Quality Gate:**
- Opening anchor is higher than desired_salary and justified by market data and personal qualifications (verify: opening_anchor >= desired_salary * 1.02).
- Acceptable range is realistic: acceptable_range_min < acceptable_range_max AND both are within 20% of market_median (verify: 0.80 * market_median <= acceptable_range_min AND acceptable_range_max <= 1.20 * market_median).
- Anchor justification references specific market data (source and median) and at least one personal qualification (experience, achievement, or domain expertise).
- Anchor type matches BATNA strength and negotiation context (verify via decision table in Action 2).

---

### Phase 4: Create Response Scripts

**Entry Criteria:**
- Anchoring strategy is complete (opening_anchor, acceptable_range_min, acceptable_range_max, negotiation_levers are defined).
- BATNA analysis is available (walk_away_threshold, BATNA strength).
- Non-salary priorities (if any) are defined.

**Actions:**
1. Identify likely objections based on negotiation_context using this mapping:
   - "new-hire": expect "budget-constraint", "market-rate-challenge", "timing-objection".
   - "counter-offer": expect "budget-constraint", "performance-concern", "equity-argument".
   - "promotion": expect "performance-concern", "timing-objection", "equity-argument".
   - "retention": expect "budget-constraint", "market-rate-challenge".
2. For each likely objection, generate a response script (2-3 sentences) that: (a) acknowledges the concern without conceding, (b) references market data or your BATNA, (c) proposes a path forward. Use the templates below as starting points; customize based on your specific situation.
3. Script for "budget-constraint": "I understand budget constraints are real. However, market data shows $[market_median] for this role in [location], and investing in competitive compensation reduces turnover and improves retention. Can we structure this as [base + equity / bonus / deferred increase]?"
4. Script for "market-rate-challenge": "I've researched market rates using [sources: Glassdoor, PayScale, BLS]. The median for [job_title] in [location] is $[market_median]. My [years/level] of experience in [domain] and [specific achievement] positions me at the [percentile] of the market. I'm confident $[opening_anchor] is justified."
5. Script for "performance-concern": "I appreciate the feedback. My track record demonstrates [specific achievement with measurable outcome]. I'm confident I'll deliver [measurable outcome] in this role. I'm asking for $[opening_anchor] based on the value I'll create, not just current performance."
6. Script for "equity-argument": "I'm excited about the company's equity and long-term upside. However, equity is speculative and illiquid, while base salary reflects my current market value. I'd be happy to discuss equity as an additional component on top of market-rate base salary."
7. Script for "timing-objection": "I understand timing is important. I'm committed to [company/role]. However, I need to ensure my compensation reflects my market value and the value I'll deliver. Can we revisit this in [timeframe, e.g., 30 days] or explore a signing bonus to bridge the gap?"
8. Script for "non-salary-objection" (e.g., role scope, reporting structure, team composition): "I understand [concern]. This is important to me as well. Can we discuss how [concern] might be addressed? In the meantime, I'd like to ensure my base salary reflects the market rate for this role."
9. Script for "fallback scenario" (final offer below walk-away threshold): "I appreciate the offer of $[final_offer]. My research and BATNA indicate that $[walk_away_threshold] is my minimum. I'm committed to finding a solution. Can we explore [equity / signing bonus / deferred increase / non-salary benefits] to bridge the gap of $[gap]?"
10. For each script, note the key variables (e.g., [market_median], [opening_anchor], [walk_away_threshold]) that you will fill in before the negotiation. Prepare these numbers in advance so you can reference them smoothly during the conversation.

**Output:**
- `response_scripts`: Object with keys for each objection type ("budget-constraint", "performance-concern", "market-rate-challenge", "equity-argument", "timing-objection", "non-salary-objection", "fallback-scenario") and values as response scripts (strings). Each script is 2-3 sentences, conversational, and includes placeholders for key variables (e.g., [market_median], [opening_anchor]).

**Quality Gate:**
- Each script is 2-3 sentences, conversational, and avoids jargon or aggressive language.
- Each script references data (market data, BATNA, or specific achievement) or proposes a concrete path forward (e.g., "explore equity", "revisit in 30 days").
- At least one script (fallback-scenario) addresses the case where the employer's final offer is below your walk-away threshold.
- Scripts avoid ultimatums (e.g., "I will not accept less than $X") in favor of collaborative language (e.g., "Can we find a way to bridge this gap?").
- All key variables in scripts (e.g., [market_median], [opening_anchor]) are defined in anchoring_strategy or batna_analysis.

---

### Phase 5: Compile Negotiation Brief

**Entry Criteria:**
- All prior phases are complete: market_data_points, batna_analysis, anchoring_strategy, response_scripts.

**Actions:**
1. Create a markdown document with the following structure and content:
   - **Header**: "Salary Negotiation Brief for [Job Title] at [Company/Context]" with date prepared.
   - **Section 1: Market Data** -- Create a table with columns: Source, Salary Min, Salary Max, Percentile, Sample Size, Date. Include all entries from market_data_points. Add a summary line: "Market Median (Weighted): $[market_median]".
   - **Section 2: BATNA** -- Include batna_statement, walk_away_threshold, and batna_strength. Add a brief rationale: "BATNA Strength: [strong/moderate/weak] because [reason, e.g., 'I have a competing offer of $X' or 'Market alternatives are limited']."
   - **Section 3: Anchoring Strategy** -- Include opening_anchor, anchor_justification, acceptable_range_min, acceptable_range_max, anchor_type. Format as: "Opening Anchor: $[opening_anchor] ([anchor_type]). Acceptable Range: $[min] - $[max]. Walk-Away: $[walk_away_threshold]."
   - **Section 4: Response Scripts** -- Bulleted list of objections with corresponding scripts. Format: "**[Objection]:** [Script]". Include all 7 objection types (budget-constraint, market-rate-challenge, performance-concern, equity-argument, timing-objection, non-salary-objection, fallback-scenario).
   - **Section 5: Quick Reference** -- One-line summary of key numbers in a box or highlighted section: "Opening: $[opening_anchor] | Range: $[min]-$[max] | Walk-Away: $[walk_away_threshold] | Market Median: $[market_median]".
   - **Footer**: Date prepared, negotiation_context, and a note: "Prepared for [negotiation_context] negotiation. Customize scripts based on actual conversation flow. Do not share walk-away threshold or negotiation levers with employer."
2. Ensure the document is 1-2 pages (500-800 words) and printable or viewable on a phone during negotiation. If content exceeds 2 pages, condense response scripts to 1-2 sentences each and move detailed market data to an appendix.
3. Use clear formatting: bold for key numbers, tables for data, bullets for scripts, and a highlighted box for quick reference.
4. Proofread for consistency: verify that opening_anchor >= desired_salary, acceptable_range_min <= acceptable_range_max, walk_away_threshold <= acceptable_range_min, and all numbers match anchoring_strategy and batna_analysis.

**Output:**
- `negotiation_brief`: String containing the full markdown brief (1-2 pages, formatted for quick reference during negotiation).

**Quality Gate:**
- Brief is concise (1-2 pages, 500-800 words) and scannable during a live negotiation (verify by reading aloud in < 2 minutes).
- All key numbers (opening anchor, acceptable range, walk-away, market median) are visible at a glance in Section 5 (Quick Reference).
- Scripts are ready to use with minimal customization; all placeholders (e.g., [market_median], [opening_anchor]) are filled in with actual numbers.
- Brief is consistent: opening_anchor >= desired_salary, acceptable_range_min <= acceptable_range_max, walk_away_threshold <= acceptable_range_min, and all numbers match prior phases.
- Brief is formatted for phone viewing: font size is readable, sections are clearly labeled, and key information is highlighted.

---

## Exit Criteria

The skill is complete when:
1. Market data is gathered from at least 3 sources and compiled into market_data_points array. All data is dated within 12 months (with inflation adjustment if needed).
2. BATNA is analyzed with a concrete walk_away_threshold (single number, not range) and batna_strength rating ("strong", "moderate", or "weak").
3. Anchoring strategy is defined with opening_anchor, anchor_justification, acceptable_range_min, acceptable_range_max, anchor_type, and negotiation_levers (if applicable).
4. Response scripts are written for all 7 objection types (budget-constraint, market-rate-challenge, performance-concern, equity-argument, timing-objection, non-salary-objection, fallback-scenario).
5. Negotiation brief is compiled in markdown format, 1-2 pages, with all sections (Market Data, BATNA, Anchoring Strategy, Response Scripts, Quick Reference) and ready for reference during negotiation.
6. All outputs are populated and internally consistent:
   - opening_anchor >= desired_salary * 1.02 (justified by market data).
   - acceptable_range_min <= acceptable_range_max (logical range).
   - walk_away_threshold <= acceptable_range_min (walk-away is below acceptable range).
   - market_median is within 10% of simple average of all source medians (sanity check).
   - All numbers in negotiation_brief match anchoring_strategy and batna_analysis (no discrepancies).

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Insufficient market data (fewer than 2 sources available) | **Adjust** -- Use industry salary surveys, recruiter reports, or LinkedIn Salary as supplementary sources. Document data limitations in the brief with a note: "Market data is limited; consider consulting with recruiters for additional validation." |
| Phase 1 | Market data is outdated (> 12 months old) | **Adjust** -- Apply a 3-5% annual inflation adjustment to historical data based on industry inflation trends. Document the adjustment in market_data_points with a note: "[Source] data adjusted by 3% for inflation (original date: [date])." |
| Phase 1 | Data sources conflict significantly (e.g., Glassdoor shows $100k, BLS shows $150k) | **Adjust** -- Investigate the discrepancy: check if sources use different job titles, experience levels, or geographies. If discrepancy persists, use the weighted formula and note the conflict in the brief. Consider consulting with recruiters for clarification. |
| Phase 2 | No BATNA exists (no other offers, weak market alternatives) | **Adjust** -- Set walk_away_threshold conservatively at current_salary * 1.03 (3% increase). Rate BATNA as "weak". Recommend a moderate or conservative anchor in Phase 3. Add a note to the brief: "BATNA is weak; recommend conservative negotiation approach." |
| Phase 2 | Walk-away threshold is above desired_salary | **Adjust** -- This indicates an inconsistency. Recalibrate desired_salary upward to at least walk_away_threshold * 1.05, OR reassess BATNA strength (may be overstated). If walk_away_threshold > market_median * 1.15, flag as unrealistic and recommend recalibration downward. |
| Phase 3 | Desired_salary is unrealistic (e.g., > market_median * 1.20) | **Adjust** -- Recommend recalibrating desired_salary downward to market_median * 1.15 or lower. Add a note to the brief: "Desired salary exceeds market median by [X]%; recommend recalibration to improve negotiation credibility." |
| Phase 3 | Opening anchor is below market_median | **Adjust** -- Increase opening_anchor to market_median * 1.05. Review anchor_type and BATNA strength; this may indicate a weak negotiating position. Consider whether BATNA strength is overstated or desired_salary is too conservative. |
| Phase 4 | Negotiation context is ambiguous (e.g., "internal discussion", "lateral move") | **Adjust** -- Treat ambiguous context as "promotion" and use moderate anchor. Add a note: "Negotiation context is unclear; using 'promotion' as default. Adjust anchor_type if context changes." Ask user to clarify context before finalizing scripts. |
| Phase 5 | Brief exceeds 2 pages | **Adjust** -- Condense response scripts to 1-2 sentences each. Move detailed market data to an appendix (not included in main brief). Prioritize opening anchor, walk-away, and 2-3 key scripts on the main brief. Verify that Quick Reference section is visible on first page. |
| Phase 5 | Brief contains inconsistencies (e.g., opening_anchor < desired_salary, walk_away > acceptable_range_min) | **Abort** -- Do not proceed with negotiation. Return to Phase 3 to recalibrate anchoring_strategy. Verify that all numbers are consistent before finalizing the brief. |

---

## Reference Section

### Domain Knowledge: Salary Negotiation Principles

1. **Anchoring Effect**: The first number mentioned in a negotiation disproportionately influences the final outcome. Always anchor first with a justified, ambitious number. Research shows that anchoring can shift the final outcome by 10-15% in your favor.
2. **BATNA Strength**: Your negotiating power is directly proportional to the strength of your alternatives. A strong BATNA (competing offer or abundant market alternatives) allows aggressive anchoring. A weak BATNA requires conservative anchoring and lower walk-away threshold.
3. **Market Data Credibility**: Glassdoor and PayScale are useful but can be biased (self-reported, skewed toward satisfied/dissatisfied employees). Cross-reference with BLS and industry surveys. For tech roles, Levels.fyi and Blind are highly credible. For finance, Wall Street Oasis and recruiter reports are preferred.
4. **Non-Salary Levers**: When salary is constrained, negotiate equity, signing bonus, PTO, remote flexibility, title, or performance bonuses. These are often easier to move than base salary. Equity is especially valuable in startups; signing bonuses are easier to move in large companies.
5. **Negotiation Context Matters**: New-hire negotiations allow more aggressive anchoring (employer expects negotiation). Promotions and counter-offers are more sensitive; use moderate anchoring. Retention negotiations are collaborative; focus on demonstrating value and market rate.
6. **Walk-Away Threshold**: This is your true reservation price. Do not negotiate below it, even under pressure. Clarity on this number prevents emotional decision-making and regret after accepting an offer.
7. **Script Flexibility**: Scripts are starting points, not rigid formulas. Adapt based on the employer's actual objections and tone. Listen more than you talk (aim for 70% listening, 30% talking). If the employer raises an objection not in your scripts, pause and ask clarifying questions before responding.
8. **Silence is Powerful**: After you state your opening anchor or a key point, pause and let the employer respond. Do not fill silence with additional justification or concessions. Silence often prompts the employer to move first.

### Checklist: Before Entering Negotiation

- [ ] Market data is from at least 3 sources and dated within 12 months (with inflation adjustment if needed).
- [ ] BATNA is concrete (specific offer or documented market alternative) and walk-away threshold is a single number.
- [ ] Opening anchor is justified by market data and personal qualifications; anchor_type matches BATNA strength and negotiation context.
- [ ] Acceptable range is realistic (min < max, both within 20% of market_median).
- [ ] Response scripts are memorized or printed for quick reference; all placeholders are filled in with actual numbers.
- [ ] Non-salary priorities are ranked (which would you trade for salary?).
- [ ] Negotiation brief is 1-2 pages, formatted for phone viewing, and all numbers are consistent.
- [ ] You have practiced saying your opening anchor out loud (reduces anxiety and improves delivery).
- [ ] You have identified 2-3 negotiation levers (non-salary benefits) to propose if salary is constrained.
- [ ] You understand your walk-away threshold and are prepared to walk away if final offer is below it.

### Decision Criteria: When to Walk Away

- Final offer is below your walk_away_threshold and employer will not move (and you have exhausted negotiation levers).
- Employer's tone or behavior suggests misalignment on values or respect (e.g., dismissive of your market data, unwilling to negotiate).
- Non-salary terms (role scope, reporting structure, team, location) are significantly worse than expected and cannot be renegotiated.
- You have a strong BATNA and the negotiation is not progressing (e.g., employer's best offer is 5%+ below your opening anchor with no movement).
- You discover during negotiation that the role or company is not aligned with your career goals (e.g., role scope is narrower than described, company culture is misaligned).

### Anchoring Mistakes to Avoid

1. **Anchoring too low**: Opening anchor below market_median or only 2-3% above desired_salary. This signals weakness and limits upside. Always anchor at least 5% above desired_salary, justified by market data.
2. **Anchoring without justification**: Stating a number without explaining why it's justified. Employer will dismiss it as unrealistic. Always pair your anchor with 2-3 sentences of justification (market data, experience, achievement).
3. **Anchoring too aggressively for your BATNA strength**: If BATNA is weak, anchoring 15%+ above market_median damages credibility. Match anchor_type to BATNA strength (conservative for weak BATNA, aggressive for strong BATNA).
4. **Failing to anchor at all**: Letting the employer anchor first puts you at a disadvantage. Always anchor first with a justified number. If employer anchors first, pause and say: "That's lower than my research suggests. Let me share my market data." Then present your opening anchor.
5. **Anchoring on a range instead of a single number**: Saying "I'm looking for $100k-$120k" signals uncertainty and allows employer to anchor at the low end. Always anchor on a single number (e.g., "$110k") and let the employer propose a range.
6. **Conceding too quickly**: If employer counters your opening anchor, do not immediately lower your ask. Pause, acknowledge their concern, and ask clarifying questions (e.g., "What's driving that number?"). This often prompts them to move closer to your anchor.
7. **Anchoring based on current salary instead of market data**: Saying "I'm currently making $80k, so I'm looking for $90k" anchors to your past, not the market. Always anchor to market_median and your value, not your history.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.