# Subscription Audit

Finds every recurring charge you're paying for and sorts them into three buckets: essential, nice-to-have, and forgotten. The average American household pays $219/month in subscriptions but thinks they pay $86. This flow closes that gap. Calculates your total monthly and annual subscription burn, identifies services you're not using, flags duplicates and downgradeable plans, and gives you a cancellation priority list ordered by savings-to-pain ratio.

## Execution Pattern: Phase Pipeline

```
PHASE 1: DISCOVER     --> Find every recurring charge
PHASE 2: CATEGORIZE   --> Sort into essential / nice-to-have / forgotten
PHASE 3: ANALYZE      --> Usage assessment and duplicate detection
PHASE 4: PRIORITIZE   --> Build the cancellation/downgrade list
PHASE 5: EXECUTE      --> Cancellation instructions and savings summary
```

## Inputs
- `known_subscriptions`: array -- (Optional) Subscriptions the user knows about: service name, monthly cost, billing cycle (monthly/annual). Starting point that the audit will expand on.
- `bank_statement_data`: object -- (Optional) Bank or credit card transaction history. If provided, will be scanned for recurring charges the user may have forgotten.
- `household_size`: string -- (Optional) "single", "couple", "family". Affects which subscriptions are likely shared vs. individual and what reasonable spending benchmarks are.

## Outputs
- `subscription_inventory`: array -- Every recurring charge with: service name, monthly cost (annualized if billed yearly), billing date, payment method, last used date if known
- `categorized_assessment`: object -- Subscriptions sorted into essential/nice-to-have/forgotten with justification for each
- `savings_opportunities`: array -- Downgrades, annual billing switches, competitor alternatives, and cancellations ranked by monthly savings
- `cancellation_plan`: object -- Ordered list of what to cancel/downgrade first, with cancellation method (link, phone, in-app), retention offer likelihood, and timing considerations

## Execution

### Phase 1: DISCOVER
### Entry Criteria
At least known subscriptions list OR bank statement data provided.
### Actions
1. Start with user-provided subscriptions. For each, normalize: service name, exact monthly cost (divide annual by 12), billing cycle, payment method.
2. If bank/card statements provided, scan for recurring charges using these patterns:
   - Same vendor, same or similar amount, appearing monthly or quarterly
   - Common subscription vendor names: Netflix, Spotify, Apple, Google, Amazon, Adobe, Microsoft, Hulu, Disney+, HBO, gym chains, meal kits, news sites
   - Small recurring charges people forget: iCloud storage ($0.99-$9.99), Google One, app subscriptions, domain renewals, cloud hosting, VPN services
3. Prompt the user with a category checklist to catch missing subscriptions:
   - Streaming (video, music, podcasts, audiobooks)
   - Software (productivity, creative tools, cloud storage, VPN, antivirus)
   - Gaming (Xbox Game Pass, PS Plus, Nintendo Online, individual game subs)
   - Health/fitness (gym, apps like Peloton/MyFitnessPal/Noom, meditation apps)
   - Food (meal kits, grocery delivery membership, restaurant loyalty programs)
   - Shopping (Amazon Prime, Walmart+, Costco, warehouse club memberships)
   - News/media (newspaper digital subscriptions, magazine apps, Substack)
   - Financial (credit monitoring, budgeting apps, investment tools, tax software)
   - Insurance-adjacent (extended warranties, roadside assistance, identity theft protection)
   - Kids (learning apps, streaming profiles, gaming)
4. Check for annual subscriptions that don't show up monthly: domain names, professional memberships, annual software licenses, Amazon Prime (annual), insurance premiums.
5. Total count and total monthly cost.

### Output
Complete subscription inventory with monthly cost, billing cycle, and payment method for each.
### Quality Gate
At least 10 subscriptions identified (most households have 12-15+). Annual costs converted to monthly. Total monthly burn calculated.

### Phase 2: CATEGORIZE
### Entry Criteria
Subscription inventory complete.
### Actions
1. Sort each subscription into one of three categories:
   - **Essential:** Services that directly support work, safety, or basic needs. Examples: internet, phone plan, professional software needed for income, security system monitoring, health insurance.
   - **Nice-to-have:** Services actively used and enjoyed but not necessary. Examples: streaming services watched weekly, gym membership used 3+ times/month, music streaming.
   - **Forgotten/unused:** Services the user forgot about, rarely uses, or could easily live without. Examples: free trial that converted to paid, gym membership not used in 60+ days, duplicate services (two cloud storage providers), apps tried once.
2. For each categorization, provide a one-line justification: "Netflix -- Nice-to-have: used 4+ times/month" or "Audible -- Forgotten: last book downloaded 3 months ago."
3. Calculate subtotals per category:
   - Essential total per month
   - Nice-to-have total per month
   - Forgotten/unused total per month
4. Benchmark against averages:
   - Single person: $100-$150/month in subscriptions is typical
   - Couple: $150-$250/month
   - Family: $200-$350/month
   - Above these ranges signals subscription creep

### Output
Categorized subscription list with justifications, category subtotals, benchmark comparison.
### Quality Gate
Every subscription is categorized. Justification is specific (usage frequency, not generic). Benchmark comparison included.

### Phase 3: ANALYZE
### Entry Criteria
Subscriptions categorized.
### Actions
1. Detect duplicates and overlap:
   - Multiple streaming video services (do you need 4?). Calculate cost per hour of content watched if usage data is available.
   - Multiple cloud storage services (iCloud + Google Drive + Dropbox = paying triple for the same need)
   - Multiple music services (Spotify + Apple Music + YouTube Music)
   - Bundled services being paid for separately (Disney+/Hulu/ESPN+ bundle vs. individual, Apple One vs. individual Apple services, Amazon Prime includes Music/Video/Photos)
2. Identify downgrade opportunities:
   - Premium tiers where standard would work (Spotify Family when only one person uses it, 2TB cloud storage when using 50GB, premium gym with only treadmill use)
   - Monthly billing where annual saves money (typical annual discount: 15-20%). Calculate the break-even: if you keep it for 7+ months, annual is cheaper.
3. Identify free alternatives:
   - Paid antivirus when Windows Defender is sufficient for most users
   - Paid password manager when browser-integrated options exist
   - Paid weather apps when free versions have the same data
   - Paid VPN for non-sensitive use cases
4. Flag retention risk: services with contracts, early termination fees, or services where cancellation loses stored data (cloud storage with files, password managers with vaults). These need migration plans before cancellation.
5. Calculate the "subscription tax" -- what percentage of monthly take-home income goes to subscriptions. Above 5% warrants serious review.

### Output
Duplicate detection, downgrade opportunities with savings, free alternative suggestions, retention risk flags, subscription tax percentage.
### Quality Gate
Duplicates identified across categories. Downgrade savings calculated in dollars. Free alternatives are genuinely comparable. Data migration risks flagged.

### Phase 4: PRIORITIZE
### Entry Criteria
Analysis complete.
### Actions
1. Rank all savings opportunities by "Savings-to-Pain Ratio" (SPR):
   - **High SPR (cancel first):** Forgotten/unused services, duplicates where one can be dropped, free trial conversions never intentionally kept. These save money with zero lifestyle impact.
   - **Medium SPR (downgrade or switch):** Premium tiers to standard, monthly to annual billing, bundle consolidation. Small lifestyle adjustment for meaningful savings.
   - **Low SPR (keep or negotiate):** Actively used services that could be cheaper through negotiation or competitor switching. Worth trying but don't lose the service.
2. For each recommended action, calculate:
   - Monthly savings
   - Annual savings
   - One-time effort required (5 minutes to click cancel vs. 30 minutes to migrate data)
   - Risk (none, data to migrate, contract penalty)
3. Build a sequenced cancellation plan:
   - Week 1: Cancel all forgotten/unused services (highest SPR, zero pain)
   - Week 2: Consolidate duplicates and switch to bundles
   - Week 3: Downgrade premium tiers to standard
   - Week 4: Negotiate rates on keepers (call and ask for retention discount)
4. Calculate total monthly and annual savings if all recommendations are followed.
5. Calculate partial savings: "Even if you only do the top 3 items, you save $X/month ($Y/year)."

### Output
Prioritized action list with savings per item, sequenced execution plan, total savings projection, partial savings floor.
### Quality Gate
Every action has a dollar amount. Sequence is logical (easy wins first). Total and partial savings both calculated.

### Phase 5: EXECUTE
### Entry Criteria
Prioritized list approved.
### Actions
1. For each cancellation, provide:
   - Cancellation method: direct link to cancel page (if web-based), app instructions, phone number if cancellation requires a call (looking at you, gym memberships and Sirius XM)
   - Timing: cancel before the next billing date. Note if the service requires 30-day notice.
   - Retention offers: services known for offering discounts when you cancel (Sirius XM typically offers 50%+ off, many streaming services offer a free month). Note that accepting a retention offer means revisiting in 3-6 months.
   - Data to save: export photos from cloud storage, download password vault, save playlists, download purchased content before access is lost
2. For downgrades: step-by-step instructions for changing plan tier.
3. For annual billing switches: note the upfront cost and when the savings break even.
4. Set up a 30-day checkpoint: verify all cancellations took effect (some services "accidentally" continue billing). Check next month's statement for charges that should have stopped.
5. Create a subscription review calendar: repeat this audit every 6 months. Set a reminder.

### Output
Cancellation/downgrade instructions per service, data migration checklist, 30-day verification plan, 6-month review reminder.
### Quality Gate
Every action has specific instructions (not "go to the website and cancel"). Data migration steps listed for any service holding user data. Verification plan is dated.


---

## Worked Example

Illustrative only.

Given typical inputs for What am I paying for monthly? List all recurring charges, categorize by value, c, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria
Done when: (1) all subscriptions inventoried with monthly costs, (2) each categorized as essential/nice-to-have/forgotten, (3) duplicates and downgrade opportunities identified, (4) prioritized savings list with dollar amounts, (5) cancellation instructions provided for recommended cuts.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| DISCOVER | No bank data and user can only recall a few subscriptions | Use the category checklist aggressively. Most people forget 3-5 subscriptions. Flag that the audit may be incomplete. |
| DISCOVER | Subscriptions paid by someone else (spouse, parent, employer) | Separate into "paid by me" vs. "paid by others." Only count user-paid subscriptions in the total burn. |
| CATEGORIZE | User disagrees with categorization | Recategorize based on their assessment. The user knows their usage better than any heuristic. |
| ANALYZE | Cannot determine usage frequency | Default to asking the user: "When did you last use [service]?" If they can't remember, it's probably in the forgotten category. |
| PRIORITIZE | User wants to keep everything | Calculate the annual cost of keeping everything and present it as a lump sum. $219/month sounds manageable. $2,628/year sounds different. |
| EXECUTE | Service makes cancellation difficult (dark patterns) | Provide the FTC complaint link and the direct method to cancel regardless of dark patterns (often calling is faster than navigating the website's intentional friction) |

## State Persistence
- Subscription inventory with status (active, cancelled, downgraded, date of change)
- Monthly burn over time (tracking whether it creeps back up)
- Cancelled services list with cancellation date (for verification)
- Savings realized (running total of money saved by cancellations)
- Next audit date reminder

## Reference

### Average Subscription Spending (US 2024)

| Category | Avg Monthly Spend | Common Services |
|---|---|---|
| Streaming video | $46 | Netflix ($15), Hulu ($8-18), Disney+ ($8-14), HBO Max ($10-16), Prime Video (included in Prime) |
| Music/audio | $12 | Spotify ($11), Apple Music ($11), Audible ($15), podcast premium ($5) |
| Gaming | $18 | Xbox Game Pass ($10-17), PS Plus ($5-14), Nintendo ($4), individual game subs |
| Software/cloud | $25 | iCloud ($1-10), Office 365 ($7-10), Adobe ($22-55), VPN ($3-13) |
| Health/fitness | $35 | Gym ($30-60), fitness apps ($10-30), meditation ($8-13) |
| Shopping memberships | $20 | Amazon Prime ($15), Costco ($5), Walmart+ ($13) |
| News/media | $18 | NYT ($4-17), WSJ ($4-12), Substack ($5-15 each) |
| **Total average** | **$219** | |

### Annual vs. Monthly Billing Savings

Most services offer 15-20% savings on annual billing. Break-even point: if you'll keep it for 7+ months, annual is cheaper. Do NOT switch to annual for services you're unsure about.

### Retention Offer Likelihood

| Service | Typical Retention Offer |
|---|---|
| Sirius XM | 50-70% off for 6-12 months |
| Cable/internet | $10-30/month off for 12 months |
| Streaming services | 1-3 free months, reduced tier |
| Gym memberships | Freeze option, reduced rate, waived fees |
| Cell phone plans | Minimal (competitive market, less flexibility) |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
