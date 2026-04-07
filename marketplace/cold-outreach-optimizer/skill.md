# Cold Outreach Optimizer

Generates hyper-personalized cold outreach sequences across email, LinkedIn, and phone, builds multi-touch cadences with A/B variants, and optimizes based on response rate data to continuously improve conversion.

## Execution Pattern: Phase Pipeline

```
PHASE 1: PROFILE    --> Deep-dive prospect research: role, company, pain points, recent activity
PHASE 2: CRAFT      --> Generate personalized outreach copy per channel (email, LinkedIn, cold call)
PHASE 3: SEQUENCE   --> Build multi-touch cadence with timing and channel rotation
PHASE 4: TEST       --> Create A/B variants for subject lines, hooks, CTAs, and openers
PHASE 5: OPTIMIZE   --> Analyze response rates, identify winning patterns, refine templates
```

## Inputs

- **prospect_profile**: object -- Target prospect information:
  - `name`: string -- Full name
  - `title`: string -- Job title
  - `company`: string -- Company name
  - `company_size`: number -- Employee count
  - `industry`: string -- Industry vertical
  - `recent_activity`: string[] -- LinkedIn posts, conference talks, blog articles, job changes
  - `pain_points`: string[] -- Known or inferred challenges
  - `tech_stack`: string[] -- Known technologies (optional)
- **product_context**: object -- What you're selling:
  - `product_name`: string
  - `value_proposition`: string
  - `key_differentiators`: string[]
  - `social_proof`: string[] -- Customer names, metrics, case studies
  - `price_range`: string (optional)
- **outreach_channel**: string[] -- Channels to use: ["email", "linkedin", "phone"]
- **historical_performance**: object (optional) -- Past campaign data:
  - `open_rate`: number (0-1)
  - `reply_rate`: number (0-1)
  - `meeting_book_rate`: number (0-1)
  - `winning_templates`: string[] -- Templates that performed above baseline
  - `losing_templates`: string[] -- Templates that underperformed

## Outputs

- **personalized_outreach**: object -- Channel-specific copy:
  - `email`: {subject: string, body: string, cta: string}
  - `linkedin_connection`: {note: string} (under 300 chars)
  - `linkedin_message`: {body: string}
  - `cold_call_script`: {opener: string, value_prop: string, objection_handles: object[], close: string}
- **multi_touch_sequence**: array of {day: number, channel: string, action: string, content: string, purpose: string}
- **ab_variants**: object -- Per element variants with predicted performance:
  - `subject_lines`: array of {variant: string, strategy: string, predicted_open_rate: string}
  - `hooks`: array of {variant: string, strategy: string}
  - `ctas`: array of {variant: string, commitment_level: string}
- **optimization_report**: object -- Analysis and recommendations (when historical data provided)

## Execution

### Phase 1: PROFILE -- Prospect Deep Dive

**Entry criteria:** prospect_profile provided with at minimum: name, title, company.

**Actions:**
1. Parse all prospect data points. Identify the strongest personalization anchors -- recent activity items that directly relate to the product's value proposition.
2. Classify the prospect's likely communication style based on title and seniority:
   - C-level: Brief, ROI-focused, peer-to-peer tone, respect their time
   - VP-level: Strategic but with tactical interest, reference team challenges
   - Director-level: Tactical, hands-on, reference specific workflows
   - Manager-level: Operational, reference daily pain points and efficiency
3. Identify the "connection bridge" -- the specific, verifiable fact that creates a legitimate reason to reach out (conference talk, LinkedIn post, company news, mutual connection, shared community).
4. Map prospect pain points to product value propositions. Rank by relevance.
5. Determine timing signals: Is there urgency? (Recent hiring = building team, funding = spending, incident = reactive buying).

**Output:** Prospect brief with: communication style classification, top 3 personalization anchors, connection bridge, pain-to-value mapping, timing assessment.

**Quality gate:** At least one connection bridge identified that is specific and verifiable (not generic). If no connection bridge found, flag for manual research before proceeding.

### Phase 2: CRAFT -- Generate Personalized Copy

**Entry criteria:** Prospect brief completed with connection bridge and pain-to-value mapping.

**Actions:**
1. Generate primary email using the CONNECTION-QUESTION-BRIDGE-CTA framework:
   - Line 1: Reference the connection bridge (specific, verifiable, shows genuine research)
   - Line 2-3: Ask a genuine question about their challenge (not a rhetorical question)
   - Line 3-4: Bridge your product to their specific pain point (one sentence, no feature dumping)
   - Line 5: Clear, low-friction CTA (specific time ask or value offer)
2. Generate LinkedIn connection note (under 300 characters):
   - Reference one shared context point
   - No selling in the connection request
   - Genuine reason to connect
3. Generate LinkedIn follow-up message (for after connection accepted):
   - Expand on the shared context
   - Offer value before asking for anything
   - Soft CTA (share resource, ask question)
4. Generate cold call script with:
   - 8-second opener (name, company, reason for calling -- reference the connection bridge)
   - 30-second value proposition (one pain point, one outcome, one proof point)
   - Objection handles for top 3 objections: "Not interested," "Send me an email," "We already use [competitor]"
   - Close: specific ask for 15-minute meeting

**Output:** Complete copy package across all requested channels.

**Quality gate:** Every piece of copy references at least one personalization anchor from the prospect brief. No copy contains generic filler ("I hope this email finds you well," "I'd love to pick your brain," "I'm reaching out because"). Email body is under 150 words. LinkedIn note is under 300 characters.

### Phase 3: SEQUENCE -- Build Multi-Touch Cadence

**Entry criteria:** Personalized copy generated for all requested channels.

**Actions:**
1. Design a 14-day (or custom duration) multi-touch sequence following the GIVE-GIVE-ASK rhythm:
   - Touch 1 (Day 1): Primary outreach -- open the conversation
   - Touch 2 (Day 2-3): Different channel -- create visibility without asking
   - Touch 3 (Day 4-5): Follow-up -- advance the question, not the pitch
   - Touch 4 (Day 7): Value-add -- share something useful with no ask
   - Touch 5 (Day 10): Social proof -- reference a customer outcome or benchmark
   - Touch 6 (Day 14): Break-up -- create urgency through departure
2. Assign each touch a specific channel based on:
   - Channel preference of the persona (executives prefer email, managers may prefer LinkedIn)
   - Channel rotation rule: never send 3 consecutive touches on the same channel
   - Channel appropriateness: first cold touch on LinkedIn should be connection, not InMail
3. Write content for each touch point, ensuring:
   - Thread continuity -- later touches reference earlier ones naturally
   - Escalating specificity -- each touch adds new information or a new angle
   - Decreasing length -- touches get shorter as the sequence progresses
4. Define exit conditions: when to stop the sequence (reply received, meeting booked, explicit opt-out, sequence completed).

**Output:** Complete sequence timeline with channel, content, purpose, and exit conditions per touch.

**Quality gate:** Sequence has minimum 4 touches across at least 2 channels. No two consecutive touches are identical in approach. Break-up email exists as final touch. Every touch has a clear purpose that differs from the previous touch.

### Phase 4: TEST -- A/B Variant Generation

**Entry criteria:** Primary sequence completed with all touch content.

**Actions:**
1. Generate 2-3 subject line variants per email touch using different strategies:
   - **Reference:** Mentions a specific, verifiable fact about the prospect
   - **Data hook:** Leads with a relevant statistic
   - **Peer proof:** References what a similar company/role achieved
   - **Question:** Poses a genuine question about their challenge
   - **Curiosity gap:** Creates intrigue without being clickbait
2. Generate 2 hook variants for the email body opening line.
3. Generate 2-3 CTA variants at different commitment levels:
   - **Low:** Offer to send a resource (no meeting required)
   - **Medium:** Suggest a specific time for a short call
   - **High:** Propose a demo or working session
4. Predict relative performance based on prospect persona:
   - C-level: Reference + Low CTA typically wins (they want respect, not pressure)
   - VP-level: Peer proof + Medium CTA typically wins (they want validation)
   - Director-level: Data hook + Medium CTA typically wins (they want proof)
   - Manager-level: Question + Low CTA typically wins (they want help)
5. Recommend the test plan: which variant to send to which segment, minimum sample size for statistical significance (typically 50+ per variant).

**Output:** Variant matrix with predicted performance rankings and test plan.

**Quality gate:** At least 2 variants per element (subject, hook, CTA). Each variant uses a distinctly different strategy (not just word swaps). Predicted performance rationale references persona type.

### Phase 5: OPTIMIZE -- Performance Analysis

**Entry criteria:** Historical performance data provided (from previous campaign runs OR industry benchmarks if first run).

**Actions:**
1. Compare actual performance against benchmarks:
   - Email open rate: B2B average 35-45%, personalized exec 50-60%
   - Email reply rate: B2B average 5-8%, personalized exec 10-15%
   - LinkedIn connection acceptance: Average 25-35%, personalized 40-55%
   - Cold call connect rate: Average 3-5%, meeting set from connect 15-25%
   - Overall meeting book rate: 3-8% of total sequence starts
2. Diagnose performance gaps using the diagnostic tree:
   - Low open rate -> subject line problem -> rotate to data hook or peer proof variant
   - High open, low reply -> body copy or CTA problem -> test softer CTA, shorter copy
   - High reply, low meeting -> qualification problem -> add pre-qualifying question
   - Low LinkedIn acceptance -> note too salesy -> remove all product mentions from note
3. Identify winning patterns from historical data:
   - Which personalization anchors correlated with higher reply rates?
   - Which sequence length (short vs. long) converted better?
   - Which channels drove the most replies vs. meetings?
4. Generate refined templates incorporating winning patterns.
5. Update pattern library in state persistence.

**Output:** Optimization report with diagnostic findings, winning patterns, refined templates, and updated benchmarks.

**Quality gate:** Every recommendation is tied to a specific metric and has a measurable expected improvement. Pattern library updated with at least 1 new winning or losing pattern.

## Exit Criteria

The skill is DONE when:
1. Personalized outreach copy exists for every requested channel.
2. Multi-touch sequence is complete with 4+ touches across 2+ channels.
3. A/B variants exist for at least subject lines and CTAs.
4. If historical data was provided, optimization report is delivered with actionable recommendations.
5. All copy passes the quality gate (personalized, under length limits, no generic filler).

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| PROFILE | No recent activity found for prospect | **Adjust** -- use company-level activity (funding, product launches, hiring) as connection bridge instead of personal activity |
| PROFILE | Prospect title/seniority unclear | **Adjust** -- default to VP-level communication style, note uncertainty |
| CRAFT | Generated copy exceeds length limits | **Retry** -- regenerate with explicit word count constraint |
| CRAFT | No valid connection bridge for personalization | **Escalate** -- flag that outreach will be semi-personalized (company-level, not individual-level), recommend manual research |
| SEQUENCE | Only one channel requested | **Adjust** -- build single-channel sequence with varied approaches per touch instead of channel rotation |
| TEST | Insufficient historical data for optimization | **Skip** -- use industry benchmarks, note that optimization will improve after 50+ sends |
| OPTIMIZE | No clear winning pattern in data | **Adjust** -- recommend continued testing with larger sample, flag that current sample may be too small for significance |

## State Persistence

This skill maintains persistent state across executions:
- **winning_patterns**: Array of {template_type, personalization_anchor, channel, metric, value} -- templates that outperformed baseline
- **losing_patterns**: Array of same structure -- templates that underperformed
- **response_rate_history**: Per-campaign metrics over time for trend analysis
- **persona_performance**: Performance data segmented by prospect title/seniority -- which approaches work for which personas
- **template_library**: Evolving library of best-performing copy templates

## Reference

### The CONNECTION-QUESTION-BRIDGE-CTA Framework

The most effective cold outreach follows this 4-part structure:

1. **CONNECTION** (1 sentence): Reference something specific about the prospect that shows you did research. Must be verifiable -- conference talks, LinkedIn posts, company news, mutual connections. Never fake familiarity.

2. **QUESTION** (1 sentence): Ask a genuine question about a challenge they face. This is not rhetorical. You want to start a conversation, not deliver a monologue. The question should relate to a problem your product solves, but should be framed in their terms, not yours.

3. **BRIDGE** (1-2 sentences): Connect their challenge to your solution. One specific outcome, one proof point. No feature dumping. "We helped [similar company] achieve [specific metric] by [mechanism]."

4. **CTA** (1 sentence): Clear, low-friction ask. Specify the time commitment ("15 minutes"), the format ("quick call"), and the value ("compare approaches"). Never end with "Let me know if you're interested" -- that's not a CTA.

### Outreach Benchmarks by Channel and Seniority

| Metric | IC/Manager | Director | VP | C-Level |
|---|---|---|---|---|
| Email open rate | 40-50% | 35-45% | 30-40% | 25-35% |
| Email reply rate | 8-12% | 6-10% | 4-8% | 3-6% |
| LinkedIn accept rate | 35-50% | 30-40% | 25-35% | 15-25% |
| Cold call connect | 8-12% | 5-8% | 3-5% | 1-3% |
| Meeting from sequence | 5-10% | 4-8% | 3-6% | 2-4% |

### Subject Line Strategy Matrix

| Strategy | Best For | Example | Avg Open Rate Lift |
|---|---|---|---|
| Reference | Any seniority | "Your [talk/post] on [topic]" | +15-25% vs generic |
| Data Hook | Directors, VPs | "[Stat] of [their industry] companies [fact]" | +10-15% |
| Peer Proof | VPs, C-level | "How [similar company] [achieved outcome]" | +10-20% |
| Question | ICs, Managers | "[Genuine question about their workflow]?" | +5-15% |
| Curiosity Gap | Any (use sparingly) | "The [topic] problem nobody talks about" | +5-10% (diminishing) |

### Anti-Patterns (Things That Kill Response Rates)

- "I hope this email finds you well" -- adds nothing, screams template
- "I'd love to pick your brain" -- one-sided value extraction
- "Just checking in" -- no new information, no value
- "As a [title] at [company], you probably..." -- presumptuous
- "We're the leading..." -- self-aggrandizing, nobody cares
- Attaching PDFs or decks in first touch -- triggers spam filters and feels heavy
- More than one link in the email body -- looks like marketing, not a person
- Longer than 150 words for first-touch email -- nobody reads walls of text from strangers

### Sequence Timing Guidelines

| Touch # | Optimal Gap | Channel Preference | Commitment Ask |
|---|---|---|---|
| 1 | Day 1 | Email (primary) | Question or value offer |
| 2 | Day 2-3 | LinkedIn (connect) | No ask -- visibility only |
| 3 | Day 4-5 | Email (follow-up) | Advance the question |
| 4 | Day 7 | LinkedIn (engage) or Phone | Value-add (share resource) |
| 5 | Day 10 | Email (social proof) | Soft meeting ask |
| 6 | Day 14 | Email (break-up) | Last chance framing |

Copyright 2024-present The Wayfinder Trust. All rights reserved.
