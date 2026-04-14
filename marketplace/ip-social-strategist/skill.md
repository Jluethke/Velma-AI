# IP Social Campaign Strategist

Takes a patent portfolio context and designs a full multi-platform social media campaign strategy — audiences, angles, platform cadence, hashtags, and a 30-day content calendar. Output feeds directly into the content writer and Playwright automation builder.

**Why this exists:** Patent licensing awareness requires a different content playbook than product marketing. You're not selling a product — you're establishing credibility, signaling technical authority, creating regulatory urgency, and putting decision-makers on notice that the technology exists and is deployed. Each platform requires a completely different voice and angle.

**Core principle:** Never use patent language on social media. Never say "license," "royalty," or "IP" in posts. Talk about the problem the technology solves, the regulatory gap it addresses, and the production system that proves it works. Let the credibility do the work.

## Inputs

- `patent_families`: list[object] — Families to campaign around. Each: `{family, title, what_it_covers, market_application}`
- `licensor_name`: string — Entity running the campaign (e.g., "Northstar Systems Group")
- `ecosystem_context`: string — Description of the live production deployment (FlowFabric, TRUST token, on-chain)
- `target_sectors`: list[string] — Industries to reach (e.g., ["cyber insurance", "autonomous vehicles", "medical AI"])
- `campaign_goal`: string — Primary objective: "licensing_leads" | "ecosystem_awareness" | "regulatory_positioning" | "talent_attraction"
- `campaign_duration_days`: integer — Campaign length (default 30)
- `poster_handles`: object — (Optional) Known social handles per platform for @ mentions and community targeting

## Outputs

- `platform_strategy`: object — Per-platform approach: audience, voice, content types, posting frequency
- `content_angles`: list[object] — 8-12 distinct angles that work across platforms: `{angle, hook, why_it_works, best_platform}`
- `hashtag_sets`: object — Per-platform hashtag sets (LinkedIn, Reddit communities, Instagram tags)
- `content_calendar`: list[object] — 30-day day-by-day plan: `{day, platform, angle, format, target_community}`
- `target_communities`: object — Specific Reddit subreddits, LinkedIn groups, Facebook groups to post in
- `campaign_brief`: string — One-page brief summarizing the entire strategy for handoff to content writer

---

## Execution

### Phase 1: AUDIENCE MAPPING

**Actions:**

1. **Map decision-makers on each platform.**

   | Platform | Who's There | Why They Matter |
   |---|---|---|
   | LinkedIn | CROs, GCs, CTOs, Head of AI, VPs of Risk | Direct licensing targets — this is their professional network |
   | Reddit | Engineers, AI researchers, compliance professionals | Technical credibility audience — they validate before their exec does |
   | Twitter/X | AI researchers, policy people, journalists | Thought leadership and regulatory commentary |
   | Facebook | Industry groups, professional associations | Insurance and risk management professional communities |
   | Instagram | Broader tech/AI awareness, recruiting | Brand building, not direct licensing |

2. **Identify the regulatory urgency angle per sector.** For each target sector, name the specific regulation, the specific gap, and the specific consequence. This becomes the campaign backbone.

3. **Map the awareness funnel.** Social → credibility → inbound inquiry → licensing conversation. Every post should move someone one step down that funnel.

**Output:** `platform_strategy`, `target_communities`

---

### Phase 2: CONTENT ANGLE DEVELOPMENT

**Entry criteria:** Audience map complete.

**Actions:**

1. **Develop 8-12 distinct angles.** Each angle is a different entry point into the same story. Examples for AI governance IP:

   - **The Gap Angle:** "Most AI systems can make decisions. Almost none can prove they governed the learning process. Here's why that's about to matter."
   - **The Regulator Angle:** "EU AI Act Article 9 requires governance of the learning process. Not just outputs — the parameter update pipeline. Most companies have no idea what that means."
   - **The Production Angle:** "We didn't file a patent and wait. We built a live system first. Here's what that looks like."
   - **The Near-Miss Angle:** "The actuarial term for 'almost failed' is near-miss. We built a system that detects them in AI models. Here's why that changes insurance math."
   - **The Rollback Angle:** "If your AI model makes 1,000 bad decisions before anyone notices, can you undo them? Not just the decisions — the learning that caused them?"
   - **The Audit Chain Angle:** "Every decision your AI makes is a liability. What does your audit trail look like for a parameter update?"
   - **The Sector Urgency Angle:** Customize per sector — cyber insurance, autonomous vehicles, medical AI each have a different regulatory clock.
   - **The Comparison Angle:** "Neural Simplex switches AI off when trust breaks. We modulate trust in real time. The difference is whether your system has a circuit breaker or a continuous governor."

2. **Match angles to platforms.** Long-form analysis → LinkedIn. Technical deep-dives → Reddit. Visual explainers → Instagram. Quick regulatory takes → Twitter/X.

3. **Assign angles to the 30-day calendar.** No angle repeats within 10 days. Each week has a theme.

**Output:** `content_angles`, `content_calendar`

---

### Phase 3: PLATFORM-SPECIFIC STRATEGY

**LinkedIn:**
- Voice: Peer-to-peer, technical authority, not promotional
- Formats: Long-form posts (800-1200 words), carousels (5-8 slides), polls, short takes (150 words)
- Frequency: 4-5x per week
- Target: CROs, GCs, Head of AI, VP Risk, Compliance Officers at named target companies
- Tactic: Tag relevant regulatory developments, engage with comments from target company employees, post on Monday/Tuesday/Thursday for max reach
- Hashtags: #AIGovernance #AICompliance #EUAIAct #NAIC #CyberInsurance #AutonomousVehicles (sector-specific)

**Reddit:**
- Voice: Technical, genuine, no marketing language — or it gets removed
- Target communities: r/MachineLearning, r/artificial, r/Insurance, r/cybersecurity, r/AutonomousVehicles, r/AIethics, r/LegalTech
- Formats: Technical explainer posts, "I built X, here's what I learned" posts, responding to relevant threads
- Frequency: 2-3x per week, heavy on engagement/comments
- Rule: Never post the same content to multiple subreddits. Each post must be native to that community.
- Tactic: Answer questions about AI governance in comments before posting original content — build karma and credibility first

**Twitter/X:**
- Voice: Sharp takes, regulatory commentary, technical observations
- Formats: Thread (8-12 tweets), single take (under 280), quote-tweet of regulatory news
- Frequency: Daily — but can be lightweight
- Target: AI researchers, policy accounts, insurance technology journalists
- Tactic: React to EU AI Act news, NAIC announcements, and AI safety research in real time

**Facebook:**
- Target: Professional groups — Insurance Professionals Network, AI in Insurance, Risk Management Society groups
- Voice: Practical, problem-focused, less technical than Reddit
- Formats: Articles, links to LinkedIn posts, group discussion starters
- Frequency: 2x per week

**Instagram:**
- Voice: Visual, conceptual, brand-building
- Formats: Infographic carousels, short reels explaining AI governance concepts visually
- Frequency: 3x per week
- Goal: Brand awareness and recruiting — not direct licensing

**Output:** `platform_strategy` (detailed), `hashtag_sets`

---

### Phase 4: CALENDAR ASSEMBLY

**30-day calendar structure:**

- **Week 1 — The Problem:** Establish the regulatory gap. Why AI governance matters now.
- **Week 2 — The Technical Reality:** What it actually means to govern an AI learning process. Technical credibility.
- **Week 3 — The Production Proof:** Live system, live ecosystem, deployed infrastructure. Not theoretical.
- **Week 4 — The Sector Stories:** Specific applications per sector. Insurance math, autonomous vehicle safety, medical AI compliance.

Each day in the calendar specifies: platform, angle, format, target community, and the hook (opening line).

**Output:** `content_calendar`, `campaign_brief`

---

## Exit Criteria

Done when:
1. Platform strategy defined for all 5 platforms with voice, format, and frequency
2. 8+ distinct content angles developed with platform assignments
3. 30-day calendar populated day-by-day
4. Target communities identified per platform (specific subreddits, LinkedIn groups, Facebook groups)
5. Hashtag sets ready per platform
6. Campaign brief compiled for handoff

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
