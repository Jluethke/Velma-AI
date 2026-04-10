# Customer Persona Builder

> **Starter Skill** — Free to use. Royalties to original creator on derivatives. Build on this.

Takes a business or product description and builds detailed customer personas. Covers demographics, psychographics, pain points, buying triggers, objections, preferred channels, and a "day in the life" narrative. Produces 2-4 distinct personas with scoring for which to target first. Building block for any marketing, sales, or product skill.

## Execution Pattern: Phase Pipeline

```
PHASE 1: DISCOVER   --> Extract the product's value propositions and market signals
PHASE 2: SEGMENT    --> Identify 2-4 distinct customer segments
PHASE 3: BUILD      --> Flesh out each segment into a full persona
PHASE 4: SCORE      --> Rank personas by targeting priority
```

## Inputs

- `business_description`: string -- What the business/product does, who it serves, how it makes money.
- `existing_customers`: string (optional) -- Any information about current customers: demographics, common feedback, best/worst customers.
- `competitors`: string[] (optional) -- Competitor names or descriptions for positioning context.
- `persona_count`: number (optional) -- Number of personas to generate (default: 3, range: 2-4).
- `market_context`: string (optional) -- Industry, geography, B2B vs B2C, price point range.

## Outputs

- `personas`: object[] -- 2-4 complete persona profiles, each with all fields below.
- `targeting_scorecard`: object -- Ranked list of personas by priority, with scoring rationale.
- `anti_persona`: object -- One profile of who is explicitly NOT the customer, to prevent wasted effort.
- `messaging_hooks`: object -- Per-persona: the one sentence that would make them stop scrolling.

---

## Execution

### Phase 1: DISCOVER -- Extract Value Propositions

**Entry criteria:** Business description is provided.

**Actions:**

1. Identify the core value proposition: what problem does this product solve? What outcome does the customer get?
2. List all features and translate each into a benefit (feature: "real-time analytics"; benefit: "make decisions faster than competitors").
3. Identify the urgency driver: why would someone buy this NOW vs. later?
4. Determine the switching cost: what is the customer currently using, and what does it cost them to switch?
5. If competitors are provided, identify the differentiation angle: what does this product do that competitors do not?
6. Categorize the product: is it a painkiller (solves acute problem), vitamin (nice to have), or candy (pure desire/status)?

**Output:** Value proposition map with benefits, urgency drivers, switching costs, and differentiation.

**Quality gate:** At least 3 distinct benefits identified. The product is categorized as painkiller/vitamin/candy. Urgency driver is specific, not "they need it."

---

### Phase 2: SEGMENT -- Identify Customer Segments

**Entry criteria:** Value proposition map is complete.

**Actions:**

1. Generate candidate segments by asking: who experiences the pain this product solves? List 5-8 candidate groups.
2. For each candidate, assess: how severe is their pain (1-5)? How willing are they to pay (1-5)? How reachable are they (1-5)?
3. Merge candidates that overlap significantly (similar demographics, same pain, same channel).
4. Select the top 2-4 segments based on the combined score (pain + willingness + reachability).
5. Give each segment a memorable name — a specific person archetype, not a demographic label. "Overwhelmed Agency Owner" not "SMB Marketing Professional."
6. Validate differentiation: each segment must differ on at least 2 of these dimensions: pain severity, buying trigger, budget, decision process, preferred channel.

**Output:** 2-4 named segments with pain/willingness/reachability scores and differentiation notes.

**Quality gate:** Each segment has a distinct name. Segments differ on at least 2 dimensions. No segment scores below 3 on pain.

---

### Phase 3: BUILD -- Create Full Personas

**Entry criteria:** Segments are selected and named.

**Actions:**

1. For each segment, build the complete persona profile:
   - **Name and photo description**: a realistic first name and brief visual description to make the persona feel human.
   - **Demographics**: age range, location type (urban/suburban/rural), income range, education, job title, company size (if B2B).
   - **Psychographics**: values, beliefs about their industry, attitude toward technology, risk tolerance, decision-making style (analytical/intuitive/consensus).
   - **Day in the life**: a 3-5 sentence narrative of a typical workday, including the moment where the product's problem shows up.
   - **Pain points**: 3-5 specific frustrations related to the product's domain, ranked by severity.
   - **Buying triggers**: what events or moments push this person from "aware" to "searching" (e.g., missed a deadline, lost a client, got a budget increase).
   - **Objections**: 3-5 reasons this person would say "no" or "not now" and how to address each.
   - **Preferred channels**: where they spend attention (LinkedIn, Twitter, podcasts, conferences, Google search, Reddit, newsletters).
   - **Decision process**: who else is involved in the purchase? What is the typical timeline? What proof do they need?
   - **Success metric**: how does this person measure whether the product worked? What would make them renew/recommend?

2. Write the "day in the life" narrative in present tense, second person ("You wake up at 6 AM..."). Make it vivid and specific.
3. Ensure pain points connect directly to the value proposition from Phase 1 — the product must solve at least 2 of each persona's top 3 pains.

**Output:** 2-4 complete persona profiles with all fields populated.

**Quality gate:** Every persona has all 10 sections filled. Pain points link to value propositions. Day-in-the-life mentions the product's problem area. Objections have counter-arguments.

---

### Phase 4: SCORE -- Rank and Finalize

**Entry criteria:** All personas are built.

**Actions:**

1. Score each persona on 5 dimensions (1-10 each):
   - **Pain severity**: how bad is the problem for them?
   - **Willingness to pay**: do they have budget and authority?
   - **Market size**: how many people match this persona?
   - **Reachability**: can you actually get in front of them?
   - **Speed to close**: how fast do they typically decide?

2. Calculate total score (sum of 5 dimensions, max 50). Rank personas highest to lowest.
3. Build the anti-persona: who looks like they might be a customer but is NOT? What characteristics disqualify them? (e.g., "too small to afford it," "problem isn't severe enough to change tools").
4. For each persona, write the messaging hook: one sentence that would stop them mid-scroll. It must reference their specific pain and imply the product's outcome without naming the product.
5. Produce the targeting recommendation: which persona to go after first and why, which to defer, which to test.

**Output:** Targeting scorecard, anti-persona, messaging hooks, targeting recommendation.

**Quality gate:** Personas are ranked with specific scores, not just "high/medium/low." Anti-persona is defined with disqualifying criteria. Every messaging hook references a specific pain point.

---

## Exit Criteria

The skill is DONE when:
- 2-4 personas are fully built with all 10 profile sections
- Personas are ranked by targeting priority with numerical scores
- An anti-persona is defined
- Each persona has a messaging hook
- Pain points connect to the product's value proposition

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| DISCOVER | Business description is too vague to extract benefits ("we help people") | **Adjust** -- ask clarifying questions: what specific problem, for whom, what do they pay |
| SEGMENT | All candidate segments score identically | **Adjust** -- split by channel preference or decision process to differentiate |
| BUILD | Existing customer data contradicts a generated persona | **Adjust** -- weight real customer data over generated assumptions, note the conflict |
| SCORE | Two personas score within 2 points of each other | **Adjust** -- present both as co-primary targets and recommend A/B testing messaging |
| ACT | User rejects final output | Targeted revision -- ask which persona fell short (missing depth, wrong pain points, wrong channel) and rebuild only that persona. Do not regenerate all personas. |

---

## Reference

### Persona Scoring Dimensions (1-10 each, max 50)

| Dimension | What to Measure |
|---|---|
| Pain severity | How acutely does this persona feel the problem? (1 = mild inconvenience, 10 = crisis) |
| Willingness to pay | Do they have budget authority and urgency to spend? |
| Market size | How many people match this profile? |
| Reachability | Can you get in front of them via paid, content, or outbound? |
| Speed to close | How fast do they typically decide (days vs. months)? |

### Product Category Framework

| Category | Meaning | Implication for Messaging |
|---|---|---|
| Painkiller | Solves acute, recurring pain | Lead with relief: "Stop [pain] today" |
| Vitamin | Nice-to-have improvement | Lead with aspiration: "Become [better version]" |
| Candy | Pure desire or status | Lead with identity: "Join [group you admire]" |

### Messaging Hook Formula

Pain + Implication + Relief hint = Hook that stops the scroll

Example: "Still losing deals to [competitor]? [Product] gives your reps the [outcome] they need to close faster."

### Anti-Persona Disqualifiers

Common traits that exclude a lead despite surface similarity:
- Budget below minimum viable contract value
- Problem severity too low to justify switching cost
- Decision cycle longer than your runway
- Stakeholder count too high for a self-serve motion
- Already locked into a long-term competitor contract

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
