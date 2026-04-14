# Contact Intelligence

Deep-research a specific executive or role at a target company to find every viable contact point — email, LinkedIn, phone, conference presence, mutual connections, and warm intro paths. Goes beyond surface-level search to build a complete contact dossier ready for outreach.

**Why this exists:** Finding a name is easy. Finding the right email format, verifying it's current, identifying three independent contact paths, and knowing which channel this specific person actually responds to — that's what converts cold outreach into meetings.

**Core principle:** Never send a single-channel outreach to a cold contact. Always have at least three independent paths. Always verify before sending.

## Execution Pattern: Phase Pipeline

```
PHASE 1: IDENTITY RESOLUTION    --> Confirm the person exists in the role, find their full profile
PHASE 2: CONTACT POINT MINING   --> Extract every possible contact vector for this person
PHASE 3: EMAIL DISCOVERY        --> Find or derive the verified email address
PHASE 4: CHANNEL RANKING        --> Rank contact methods by likely response rate for this person
PHASE 5: WARM PATH MAPPING      --> Find every possible introduction route
PHASE 6: CONTACT DOSSIER        --> Compile the complete actionable profile
```

## Inputs

- `target_name`: string -- Full name if known (e.g., "Sarah Chen") or role if not ("Chief Risk Officer")
- `target_company`: string -- Company name (e.g., "Coalition Insurance")
- `target_role`: string -- The role you believe they hold (e.g., "Chief Risk Officer")
- `licensor_name`: string -- Your company name (for warm path cross-referencing)
- `licensor_linkedin`: string -- (Optional) Your LinkedIn profile URL for connection gap analysis
- `licensor_investors`: list[string] -- (Optional) Your known investors / advisors for warm path matching
- `sector`: string -- Industry sector (for conference and publication targeting)
- `research_depth`: string -- "standard" (public sources only) or "deep" (exhaust all vectors)

## Outputs

- `identity_confirmed`: object -- Confirmed person: `{name, title, company, confidence_score, sources}`
- `contact_points`: list[object] -- Every contact vector found: `{method, value, confidence, verification_method, notes}`
- `primary_email`: object -- Best email candidate: `{address, format_source, confidence, verification_status}`
- `email_alternatives`: list[object] -- Additional email candidates in priority order
- `linkedin_profile`: object -- `{url, connection_degree, activity_level, last_post_topic, best_engagement_angle}`
- `phone_intel`: object -- Direct line or assistant contact if available: `{number, source, context}`
- `conference_presence`: list[object] -- Events where they speak or attend: `{event, date, role, topic}`
- `content_footprint`: list[object] -- Published articles, podcast appearances, interviews, quotes: `{title, outlet, date, key_themes}`
- `warm_paths`: list[object] -- Every introduction route ranked by strength: `{path_type, connector, strength, how_to_activate}`
- `channel_ranking`: list[object] -- Contact methods ranked by estimated response probability: `{channel, probability, rationale, timing}`
- `contact_dossier`: string -- Complete one-page markdown profile ready for the outreach team

---

## Execution

### Phase 1: IDENTITY RESOLUTION

**Entry criteria:** `target_company` and either `target_name` or `target_role` provided.

**Actions:**

1. **Confirm current role holder.** Search these sources in order:
   - Company official website: leadership page, team page, about us
   - LinkedIn: search "[Company] [Role Title]" — filter by current employees
   - Crunchbase: team section under the company profile
   - PitchBook / CB Insights (if accessible): leadership data
   - Recent press releases announcing executive appointments or promotions
   - Conference speaker bios from the last 24 months
   - Bylined articles in industry publications

2. **Verify tenure and current status.** Check:
   - LinkedIn "Current" designation on their profile
   - Recent posts or activity confirming active role
   - Any news of leadership changes, departures, or restructuring at the company
   - If no confirmation found within 6 months, flag as "unconfirmed — may have changed"

3. **Resolve ambiguity.** If multiple people share a role (e.g., Co-CROs) or the role doesn't exist, document what was found and recommend the next best target.

4. **Assign confidence score:** HIGH (confirmed via 2+ sources, active LinkedIn), MEDIUM (confirmed via 1 source), LOW (inferred from org structure or older data).

**Output:** `identity_confirmed`
**Quality gate:** Person is confirmed at the company in the stated role with a source citation. Confidence is explicitly scored.

---

### Phase 2: CONTACT POINT MINING

**Entry criteria:** Identity confirmed.

**Actions:**

1. **LinkedIn deep scan.** Extract from their public profile:
   - Exact current title and company
   - Connection degree (1st, 2nd, 3rd) from your account
   - Activity level (posts per month, last post date)
   - What topics they engage with (their own posts + comments on others)
   - Groups they belong to
   - Schools, prior employers (for alumni network paths)
   - Any mutual connections visible

2. **Twitter/X scan.** Search for their name + company:
   - Do they have an active account?
   - What do they post about?
   - Direct message availability
   - Any recent posts referencing AI, governance, compliance, or regulation

3. **GitHub / technical presence.** If they have engineering background:
   - GitHub username if public
   - Any open source contributions relevant to AI, ML, safety
   - This reveals email format (commits often expose email)

4. **Published content scan.** Search:
   - Google: "[Name]" "[Company]" — scan first 3 pages
   - Google: "[Name]" "[Role]" "interview" OR "podcast" OR "article"
   - Industry publications: Insurance Journal, Risk.net, InsureTech News (for insurance targets)
   - Substack, Medium, personal blogs
   - Podcast databases: ListenNotes, Spotify search, Apple Podcasts
   - YouTube: conference talks, webinars, panel appearances

5. **Conference and event scan.** Search:
   - Event websites for their name as speaker or panelist
   - RSA Conference, InsureTech Connect, AI Summit, ICLR, NeurIPS (sector-appropriate)
   - Upcoming events in the next 6 months (best for in-person contact)
   - Past event archives for talk topics and co-panelists

6. **Company press scan.** Search:
   - "[Company] press releases" — do they appear in quotes?
   - "[Name] [Company]" on Google News
   - Earnings calls, investor days (public companies)
   - Regulatory filings (insurance companies file exec bios with state regulators)

**Output:** All raw contact vectors feeding into Phases 3-5.
**Quality gate:** At least 3 independent contact vectors identified. LinkedIn profile URL confirmed. Content footprint documented.

---

### Phase 3: EMAIL DISCOVERY

**Entry criteria:** Identity confirmed and company domain known.

**Actions:**

1. **Identify the company email format.** Methods in order of confidence:

   **Method A — Direct discovery (highest confidence):**
   - Search GitHub commits: company employees' commits often expose email addresses
   - Search email-finding tools by name + domain: Hunter.io format, Apollo.io, Clearbit, RocketReach
   - Check WHOIS records for the company domain (sometimes reveals admin emails with format hints)
   - Search Google: `"@coalition.com"` + their name (public email appearances)
   - Check any published papers, patents, or regulatory filings with contact emails

   **Method B — Format inference (medium confidence):**
   - Find 3-5 confirmed emails at the same company from public sources
   - Common formats: firstname@, f.lastname@, firstname.lastname@, flastname@, firstnamelastname@
   - Cross-reference multiple known emails to confirm the pattern
   - Apply the pattern to the target

   **Method C — Tool-based (variable confidence):**
   - Hunter.io domain search: lists known emails and the company's format
   - Apollo.io: executive email database
   - ContactOut: LinkedIn email finder
   - Lusha: direct dials and emails
   - Snov.io: email finder + verifier

2. **Verify the email.** Never send to unverified addresses.
   - Syntax check: correct format for this domain
   - MX record check: domain accepts email
   - SMTP verification (without sending): ping the server to confirm mailbox exists
   - Cross-reference: does this email appear anywhere publicly?
   - Deliverability score: estimate spam filter risk

3. **Build email alternatives.** If primary is low confidence, list alternatives in order:
   - Different format variants at the same domain
   - Assistant or EA email (often easier to reach)
   - General department email (legal@, risk@, compliance@)
   - PR/comms email (for media-style intro)

**Output:** `primary_email`, `email_alternatives`
**Quality gate:** Primary email has a stated confidence level (HIGH/MEDIUM/LOW) and a source. At least one alternative is identified. Verification status is documented.

---

### Phase 4: CHANNEL RANKING

**Entry criteria:** All contact vectors collected.

**Actions:**

1. **Score each channel by estimated response probability.** Base rates for cold outreach to C-suite:
   - Cold email: 8-15% open rate, 2-5% reply rate
   - LinkedIn DM (1st connection): 25-40% read rate, 10-20% reply rate
   - LinkedIn DM (2nd connection): 15-25% read rate, 5-10% reply rate
   - LinkedIn DM (3rd / cold): 5-10% read, 1-3% reply
   - Warm intro via mutual connection: 60-80% open, 30-50% reply
   - Conference in-person: 70-90% engagement if done right
   - Twitter/X DM: low for most executives, high for those who are active

2. **Adjust for this specific person.** Modifiers:
   - Active LinkedIn poster → +20% LinkedIn DM probability
   - Publishes in industry press → email with content reference → +10%
   - Conference speaker → in-person is viable → high value
   - No public presence found → email is likely primary path, lower probability
   - Warm intro path exists → always leads regardless of other channels

3. **Sequence the channels.** Don't blast all at once. Recommended sequence:
   - Day 1: LinkedIn connection request (no message, just connect)
   - Day 2: Email first touch
   - Day 4: LinkedIn DM (if connected)
   - Day 7: Email follow-up Touch 2
   - Day 10: Warm intro if path exists
   - Day 14: Conference outreach if applicable

**Output:** `channel_ranking`
**Quality gate:** Each channel has a probability estimate with rationale specific to this person, not generic averages.

---

### Phase 5: WARM PATH MAPPING

**Entry criteria:** Contact vectors and licensor context known.

**Actions:**

1. **Map every possible introduction route.** Search systematically:

   **Investor overlap:**
   - Who are the target company's known investors? (Crunchbase, PitchBook, press releases)
   - Who are the licensor's known investors or advisors?
   - Any overlap? → That investor can make the intro

   **Board member overlap:**
   - Target company board members (SEC filings, Crunchbase, company website)
   - Any shared board members with licensor's advisors or investors?

   **Alumni networks:**
   - Where did the target executive go to school? (LinkedIn Education section)
   - Where did they work before? (LinkedIn Experience)
   - Does the licensor have connections at those same schools or companies?

   **Conference co-appearance:**
   - Has the target executive and anyone connected to the licensor spoken at the same conference?
   - Same panel? → Warm connection

   **Mutual LinkedIn connections:**
   - 2nd-degree LinkedIn connections between licensor and target
   - Identify which mutual connections are most likely to intro (former colleagues, investors)

   **Industry association membership:**
   - RIMS (risk management), PLUS (product liability), IAPP (privacy), InsureTech Connect community
   - Does the target participate? Does anyone connected to the licensor?

   **Press / media:**
   - Has the target quoted or cited anything the licensor has published?
   - Same journalist or publication connection?

2. **Rank warm paths by strength:**
   - STRONG: Shared investor who knows both parties well and will make active intro
   - MEDIUM: 2nd-degree LinkedIn connection who knows the target professionally
   - WEAK: Alumni network or conference overlap with no direct relationship
   - COLD: No warm path found — proceed with cold outreach strategy

3. **Draft intro activation message.** For each STRONG or MEDIUM path, draft the note to send to the connector:
   - What you're doing (one sentence)
   - Why this person specifically (one sentence)
   - What you're asking (a warm email intro, not a sales pitch)
   - What the connector needs to say (provide them the words)

**Output:** `warm_paths`
**Quality gate:** Every intro route is documented with the connector's name/role and how to activate it. Activation message drafted for STRONG and MEDIUM paths.

---

### Phase 6: CONTACT DOSSIER

**Entry criteria:** All phases complete.

**Actions:**

1. **Compile the one-page contact dossier.** Format:

```
CONTACT DOSSIER — [Name] — [Title] @ [Company]
Generated: [Date]
Confidence: [HIGH/MEDIUM/LOW]

IDENTITY
Name: [Full name]
Title: [Exact current title]
Company: [Company] | [Location]
Confirmed via: [Source 1], [Source 2]

CONTACT POINTS (ranked by priority)
1. [Channel]: [Value] — Confidence: [H/M/L] — [Notes]
2. [Channel]: [Value] — Confidence: [H/M/L] — [Notes]
3. [Channel]: [Value] — Confidence: [H/M/L] — [Notes]

EMAIL
Primary: [email] — Confidence: [H/M/L] — Format source: [method]
Alternative: [email] — [Format variant]
Verification status: [Verified/Unverified/Tool-confirmed]

LINKEDIN
URL: [url]
Connection degree: [1st/2nd/3rd]
Activity level: [High/Medium/Low — posts X/month]
Last post topic: [topic]
Best engagement angle: [what to reference]

WARM PATHS (ranked by strength)
1. [STRONG] via [Connector Name/Role] — [How to activate]
2. [MEDIUM] via [Connector] — [How to activate]
3. [WEAK] via [Network/Event] — [How to activate]

CONTENT FOOTPRINT
- [Title, Outlet, Date] — Key theme: [theme]
- [Title, Outlet, Date] — Key theme: [theme]

CONFERENCE PRESENCE
- [Event, Date, Role] — Topic: [topic]

CHANNEL SEQUENCE
Day 1: LinkedIn connection request
Day 2: Email — [primary_email]
Day 4: LinkedIn DM — [if connected]
Day 7: Email Touch 2
Day 10: Warm intro via [connector] — [activation message ready]
Day 14: [Conference / event if applicable]

WHAT NOT TO DO
- [Specific caution based on their profile]
- [Specific caution based on their profile]
```

**Output:** `contact_dossier`
**Quality gate:** Dossier is complete, specific, and actionable. No generic placeholders. Every field has a real value or is explicitly marked "not found."

---

## Exit Criteria

The skill is DONE when:
1. Identity is confirmed with a confidence score and source citations
2. At least 3 independent contact vectors are found
3. Primary email is identified with confidence level and verification status
4. LinkedIn profile URL is confirmed with connection degree and activity assessment
5. All warm paths are documented with activation messages for STRONG/MEDIUM paths
6. Channel ranking shows estimated response probability for each method
7. Contact dossier is complete and ready for the outreach team

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| IDENTITY | Person not found in role | Flag — search for who does hold the role, output alternative targets |
| IDENTITY | Person left the company | Flag with date if known — identify successor |
| EMAIL | Company email format unknown | Output 3 format variants at LOW confidence — flag for manual verification before send |
| EMAIL | All verification methods fail | Flag — recommend LinkedIn DM as primary channel instead |
| WARM PATHS | No warm path exists | Flag explicitly — recommend cold outreach strategy with conference targeting as best alternative |
| CHANNEL RANKING | Person has no public presence | Flag — recommend email as primary, adjust probability estimates down, increase follow-up frequency |

## State Persistence

- `contact_registry`: All contacts researched — name, company, email, LinkedIn, confidence, last verified date
- `email_format_library`: Known email formats per company domain — reused for future targets at the same company
- `warm_path_map`: All identified intro paths across all targets — improves with each research run
- `conference_calendar`: Upcoming events where target executives will be present — used for timing outreach
- `content_monitor`: Watching for new publications, interviews, or posts by target contacts — triggers re-engagement

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
