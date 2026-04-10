# Gift Finder

Takes the recipient (who they are, age, relationship), occasion, budget, and what you know about their interests, then suggests personalized gift ideas ranked by thoughtfulness and practicality. Covers birthdays, holidays, weddings, baby showers, retirements, thank-you gifts, and "I have no idea what to get them." Avoids generic suggestions -- no "a nice candle" unless they actually like candles. Includes where to buy and estimated price.

## Execution Pattern: ORPA Loop

## Inputs
- recipient: object -- Who they are (name, age, gender if relevant), your relationship to them (partner, parent, coworker, boss, acquaintance, kid's friend's parent)
- occasion: string -- Birthday, Christmas, wedding, baby shower, housewarming, retirement, thank-you, anniversary, graduation, "just because", or custom
- budget: string -- Dollar range (e.g., "$25-50", "under $20", "money is no object", "I forgot and need something by tomorrow")
- interests: object -- What you know about them: hobbies, job, lifestyle, things they've mentioned wanting, things they already own too much of
- constraints: object -- (Optional) Shipping deadline, must be available locally, no gift cards, nothing fragile, needs to fit in luggage, group gift with others
- past_gifts: array -- (Optional) What you've given them before (so you don't repeat)

## Outputs
- gift_ideas: array -- 5-8 ranked gift suggestions with name, description, why it fits this person, estimated price, and where to buy
- backup_picks: array -- 2-3 safe fallback options in case top picks are unavailable
- presentation_tips: object -- Wrapping/packaging ideas, card message suggestions tailored to the occasion
- timing_plan: object -- Order-by dates for shipping, local pickup alternatives if time is tight
- avoid_list: array -- Common gifts to avoid for this person and why (e.g., "no kitchen gadgets -- they've mentioned feeling like everyone assumes they cook")

## Execution

### OBSERVE: Profile the Recipient
**Entry criteria:** Recipient info and occasion provided.
**Actions:**
1. Build a recipient profile from provided info: age bracket, life stage (student, new parent, mid-career, retired), lifestyle signals (outdoorsy, homebody, tech-savvy, minimalist, collector).
2. Identify relationship dynamics: how personal can the gift be? A boss gets something different than a best friend. A new boyfriend gets something different than a husband of 20 years.
3. Map the occasion to gift norms: wedding gifts follow registries, baby showers have practical expectations, retirements allow sentimental, birthdays are open-ended.
4. Flag the "never buy" list: gifts that are too personal for the relationship (perfume for a coworker), gifts that imply something (self-help books, gym memberships, cleaning supplies), gifts they explicitly hate.
5. Check timing: how many days until the occasion? If under 3 days, restrict to local/instant options.

**Output:** Recipient profile, relationship-appropriate gift range, occasion norms, hard constraints, timing status.
**Quality gate:** Relationship appropriateness is assessed. "Never buy" items are flagged. Timeline is realistic.

### REASON: Generate and Rank Ideas
**Entry criteria:** Recipient profile complete.
**Actions:**
1. Generate 12-15 candidate gift ideas across categories: experience gifts (concert tickets, classes, spa day), physical items (gear, books, tools), consumable gifts (food, wine, subscription boxes), sentimental gifts (custom/personalized items, photo books), practical gifts (things they need but won't buy themselves).
2. Score each candidate on four dimensions:
   - **Thoughtfulness** (1-5): Does it show you know them? A guitar pick holder for a guitarist scores higher than a generic Amazon gift card.
   - **Practicality** (1-5): Will they actually use it, or will it collect dust?
   - **Surprise factor** (1-5): Would they think of buying this themselves? Low surprise = low impact.
   - **Budget fit** (pass/fail): Is it within the stated range?
3. Eliminate anything that fails budget, violates constraints, or repeats past gifts.
4. Rank remaining candidates by combined score. Top 5-8 become primary suggestions.
5. Select 2-3 safe fallbacks: gifts that are universally well-received for this occasion (a great bottle of wine for a housewarming, a quality leather journal for a graduate).

**Output:** Ranked gift list with scores, reasoning for each pick, fallback options.
**Quality gate:** No generic suggestions without justification. Every pick ties back to something specific about the recipient. Budget is respected.

### PLAN: Source and Logistics
**Entry criteria:** Gift list ranked.
**Actions:**
1. For each recommended gift, identify where to buy: specific retailer (online and local), artisan marketplace (Etsy, local craft fairs), direct from brand.
2. Estimate price including tax and shipping. Flag if shipping cost makes it exceed budget.
3. Check timing feasibility: standard shipping arrival date, expedited options and cost, local pickup alternatives.
4. For experience gifts: confirm availability, booking process, whether a printable voucher works as a placeholder gift.
5. For personalized/custom items: add production lead time (engraving, printing, custom orders typically need 1-2 extra weeks).
6. Identify wrapping and presentation options: gift-wrapped by retailer, DIY wrapping suggestions, creative packaging ideas that match the occasion.

**Output:** Sourcing details per gift, shipping timelines, pricing with all costs, presentation options.
**Quality gate:** Every recommended gift has a confirmed purchase path. Timeline works for the occasion date. Total cost (gift + shipping + wrapping) is within budget.

### ACT: Deliver Recommendations
**Entry criteria:** Sourcing validated.
**Actions:**
1. Present top 5-8 picks in ranked order. For each: gift name, 2-3 sentence description, why it's right for this person, price range, where to buy, and delivery timeline.
2. Present 2-3 fallback picks with the same format.
3. Include a card message suggestion tailored to the occasion and relationship (not a greeting card cliche -- something that sounds like it came from a real person).
4. Add practical notes: "Order by [date] for guaranteed delivery," "Available at [local store] if you need it today," "Ask for gift receipt in case of duplicates."
5. If this is a group gift situation, suggest how to split cost and coordinate without spoiling the surprise.

**Output:** Complete gift recommendation package with purchasing guidance, timing, and presentation tips.
**Quality gate:** Recommendations are specific, not generic. Each ties to recipient's actual interests. Logistics are actionable.

## Exit Criteria
Done when: (1) at least 5 personalized gift suggestions are provided with reasoning, (2) each has a price estimate within budget, (3) each has a purchase source and delivery timeline, (4) fallback options are included, (5) no suggestion violates relationship appropriateness or recipient constraints.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Almost no info about the recipient ("my coworker Dave, I know nothing about him") | Adjust -- ask targeted questions: what department, any desk decorations, coffee or tea, has he mentioned any weekend activities? If still nothing, default to crowd-pleasing gifts for the demographic |
| OBSERVE | Occasion is tomorrow or today | Adjust -- restrict to digital gifts (e-gift cards, streaming subscriptions, donation in their name), local same-day options, or printable "experience" vouchers |
| REASON | Budget is extremely low (under $10) | Adjust -- pivot to homemade, experiential (cook them dinner, babysit their kids), or consumable gifts (baked goods, a great card with a heartfelt note) |
| REASON | Recipient "has everything" or is a minimalist | Adjust -- focus on experiences, consumables, and charitable donations in their name. Avoid physical objects |
| PLAN | Preferred gift is out of stock or discontinued | Adjust -- promote next-ranked alternative, find similar items from other brands |
| ACT | User rejects all suggestions | Reset -- ask what felt wrong about them (too impersonal, too expensive, wrong vibe) and regenerate with refined profile |
| ACT | User rejects final output | **Targeted revision** -- ask which gift suggestion, category, or personalization factor fell short and rerun only that section. Do not regenerate the full gift list. |

## State Persistence
- Recipient profiles (interests, past gifts, known preferences -- builds better suggestions over time)
- Gift history (what was given, when, and how it was received -- prevents repeats and doubles down on hits)
- Occasion calendar (upcoming birthdays, anniversaries, holidays -- proactive reminders)
- Retailer reliability (which sources delivered on time, which had quality issues)
- Price tracking (gift price memory improves budget accuracy for future recommendations)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.