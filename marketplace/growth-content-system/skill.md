# Growth Content System

End-to-end content marketing system that defines audience-aligned strategy, generates content ideas with performance predictions, creates multi-format drafts, optimizes for search and social, and plans multi-channel distribution with scheduling and cross-promotion.

## Execution Pattern: Phase Pipeline

```
PHASE 1: STRATEGY   --> Define audience segments, content pillars, distribution channels, brand voice
PHASE 2: IDEATE     --> Generate content ideas per pillar with search/social potential scores
PHASE 3: CREATE     --> Draft content variants: blog, social posts, newsletter, video script
PHASE 4: OPTIMIZE   --> SEO optimization, readability check, CTA placement, platform formatting
PHASE 5: DISTRIBUTE --> Multi-channel publishing plan with scheduling and cross-promotion
```

## Inputs

- **brand_context**: object -- Brand identity and positioning:
  - `brand_name`: string
  - `industry`: string
  - `value_proposition`: string
  - `brand_voice`: object -- {tone: string, style: string, examples: string[]}
  - `product_or_service`: string -- What you sell
  - `competitors`: string[] (optional)
- **audience_segments**: array of objects -- Who you're creating content for:
  - `segment_name`: string
  - `title_or_role`: string
  - `pain_points`: string[]
  - `content_preferences`: string[] -- What formats they consume
  - `channels`: string[] -- Where they spend time
  - `expertise_level`: string ("beginner" | "intermediate" | "expert")
- **content_pillars**: string[] -- Core topics (3-5 thematic areas)
- **distribution_channels**: string[] -- Channels to publish on (blog, LinkedIn, Twitter/X, Instagram, TikTok, newsletter, YouTube, podcast, etc.)
- **performance_data**: object (optional) -- Historical content performance:
  - `top_performing`: array of {title, format, channel, metric, value}
  - `underperforming`: array of same
  - `audience_growth`: object -- Follower/subscriber trends per channel
  - `engagement_rates`: object -- Per-channel engagement benchmarks

## Outputs

- **content_strategy**: object -- Strategic framework:
  - `audience_personas`: array -- Detailed persona definitions
  - `pillar_definitions`: array of {pillar, description, audience_fit, content_types, frequency}
  - `channel_strategy`: array of {channel, purpose, frequency, content_types, tone}
  - `brand_voice_guide`: object -- Codified voice and style rules
  - `content_mix`: object -- Ratio of content types (educational, promotional, community, curation)
- **content_ideas**: array of objects -- Scored ideas:
  - `title`: string
  - `pillar`: string
  - `format`: string
  - `primary_channel`: string
  - `search_potential`: number (0-10)
  - `social_potential`: number (0-10)
  - `combined_score`: number
  - `audience_segment`: string
  - `hook`: string
- **content_drafts**: array of objects -- Per-format drafts:
  - `format`: string
  - `channel`: string
  - `content`: string
  - `word_count`: number
  - `cta`: string
  - `hashtags`: string[] (if applicable)
- **distribution_plan**: object -- Publishing schedule:
  - `calendar`: array of {date, time, channel, content, format, purpose}
  - `cross_promotion`: array of {source_channel, target_channel, adaptation}
  - `repurposing_plan`: array of {original, derivative_format, derivative_channel}

## Execution

### Phase 1: STRATEGY -- Define Content Framework

**Entry criteria:** brand_context provided with at minimum brand_name and value_proposition. At least one audience_segment defined.

**Actions:**
1. Build detailed audience personas from segments:
   - Demographics and psychographics
   - Content consumption habits: when, where, how, how long
   - Decision journey: awareness -> consideration -> decision
   - Content triggers: what makes them click, share, or save?
   - Anti-triggers: what makes them bounce, unfollow, or mark as spam?

2. Define content pillars with strategic intent:
   - Each pillar serves a specific business goal (awareness, trust, conversion, retention)
   - Each pillar maps to audience pain points
   - Each pillar has a content type mix (tutorials, opinion, data, stories, tools)
   - Target ratio: 60% educational, 20% community/thought-leadership, 15% product/promotional, 5% curation
   - This ratio shifts by funnel stage: top-funnel = 80% educational, bottom-funnel = 50% product

3. Codify brand voice:
   - **Tone attributes:** 3-5 adjectives (e.g., "authoritative but approachable, technical but not academic, opinionated but evidence-based")
   - **Voice do's:** Specific phrases, sentence structures, and approaches to use
   - **Voice don'ts:** Things that are off-brand (jargon level, emoji usage, formality)
   - **Example transformations:** Take a generic sentence and show the brand-voice version

4. Define channel strategy:
   - Each channel has a purpose: awareness (social), depth (blog), nurture (email), community (forum/Slack), conversion (product pages)
   - Each channel has a content format fit: LinkedIn = insights + commentary, Twitter/X = threads + tips, blog = long-form, newsletter = curated + original
   - Publishing frequency per channel based on resources and diminishing returns curve
   - Cross-promotion rules: how content flows between channels

5. Set measurable goals:
   - Monthly traffic targets per channel
   - Engagement rate benchmarks per format
   - Conversion metrics (email signups, trials, demos)
   - Timeline for achieving each goal

**Output:** Complete content strategy document with personas, pillar definitions, voice guide, channel strategy, and goals.

**Quality gate:** At least 2 audience personas defined with pain points and content preferences. 3-5 content pillars mapped to business goals. Voice guide has both do's and don'ts with examples. Channel strategy covers at least 3 channels with differentiated purposes. Goals are specific and time-bound.

### Phase 2: IDEATE -- Content Idea Generation

**Entry criteria:** Content strategy complete with pillars, personas, and channels defined.

**Actions:**
1. Generate content ideas using multiple ideation frameworks:
   - **Pain-point mining:** One idea per audience pain point per content format
   - **Question-based:** "How to...", "What is...", "Why does...", "[X] vs [Y]"
   - **Data-driven:** Industry stats, original research, survey results, benchmarks
   - **Trend-jacking:** Current events, trending topics, seasonal relevance
   - **Counter-narrative:** Contrarian takes on industry conventional wisdom
   - **Behind-the-scenes:** Process, failures, lessons learned, building in public
   - **User-generated:** Customer stories, community questions, support ticket patterns

2. Score each idea on two dimensions:
   - **Search potential (0-10):** Keyword volume, difficulty, evergreen vs. timely, content gap
   - **Social potential (0-10):** Shareability, emotional resonance, controversy/novelty, visual appeal, conversation-starting potential
   - **Combined score:** `search × 0.5 + social × 0.5` (adjust weights based on channel strategy)

3. Classify each idea by:
   - Content pillar
   - Target audience segment
   - Funnel stage (awareness, consideration, decision)
   - Content format (blog, thread, carousel, video, newsletter, podcast)
   - Primary distribution channel
   - Effort level (quick: <2 hours, medium: 2-8 hours, deep: 8+ hours)

4. Generate the hook for each idea:
   - The opening line or headline that captures attention in 3 seconds
   - Format-specific: email subject line, tweet first line, video thumbnail concept, blog title
   - Test against the "scroll-stop" criterion: would this stop someone scrolling?

5. Identify content clusters:
   - Group related ideas that can be produced together (economies of scale)
   - Identify "anchor content" that spawns 5-10 derivative pieces
   - Plan content series (multi-part content builds anticipation and retention)

**Output:** Ranked content idea bank with scores, classifications, hooks, and clustering.

**Quality gate:** At least 20 ideas generated across all pillars. Each pillar has at least 3 ideas. Ideas span at least 3 different formats. Combined scores range from 3-10 (not all ideas scored identically). At least 2 "anchor content" pieces identified for repurposing.

### Phase 3: CREATE -- Content Drafting

**Entry criteria:** Top priority ideas selected (at least 3 from the idea bank).

**Actions:**
1. For each selected idea, create the primary content piece:
   - Follow the brand voice guide strictly
   - Match the format expectations of the target channel
   - Include the hook as the opening (validated from Phase 2)
   - Structure for scannability: headers, bullets, short paragraphs
   - Include one clear CTA aligned with the content's funnel stage:
     - Top-funnel: "Subscribe", "Follow", "Share"
     - Mid-funnel: "Download guide", "Join waitlist", "Read case study"
     - Bottom-funnel: "Start free trial", "Book demo", "Buy now"

2. Create derivative content from each primary piece:
   - **Blog post (1,500-3,000 words)** -> Twitter/X thread (8-12 tweets) + LinkedIn post (200-300 words) + Newsletter snippet (150 words) + Video script outline (3-5 min)
   - **For each derivative:** Adapt the tone, length, and structure to the target platform (don't just copy-paste shorter)
   - Apply the "one piece, five platforms" principle: same core idea, platform-native execution

3. Format platform-specifically:
   - **Blog:** SEO-optimized headings, internal links, featured image description, meta description
   - **Twitter/X:** Thread format, no links in first tweet, hooks that create reply bait
   - **LinkedIn:** First line is the hook (visible before "see more"), no external links in body (kills reach), link in first comment
   - **Instagram:** Carousel slide structure (1 hook slide, 3-5 content slides, 1 CTA slide)
   - **Newsletter:** Subject line, preview text, scannable body, one primary CTA
   - **YouTube/Video:** Thumbnail concept, script with timestamps, retention hooks at 0:30 and 3:00

4. Write 2-3 variations for high-priority content (A/B testing):
   - Different hooks/headlines
   - Different CTA approaches
   - Different angles on the same topic

**Output:** Primary content drafts with platform-specific derivatives, formatted for each target channel.

**Quality gate:** Primary content matches brand voice guide. Every piece has a CTA. Platform-specific formatting rules followed. At least 3 derivative pieces per primary content. No piece is a direct copy-paste of another (each is adapted for its channel). Word counts match platform expectations.

### Phase 4: OPTIMIZE -- Search and Performance Optimization

**Entry criteria:** Content drafts complete for all priority pieces.

**Actions:**
1. SEO optimization for blog/web content:
   - Target keyword in H1, first paragraph, and one H2
   - Secondary keywords in body copy (natural placement, not forced)
   - Meta title under 60 characters with primary keyword
   - Meta description under 155 characters with keyword and CTA
   - Alt text on all images (descriptive, keyword-relevant)
   - Internal links to 3+ related pages
   - External links to 1-2 authoritative sources
   - FAQ section with FAQ schema markup if applicable

2. Readability optimization:
   - Flesch-Kincaid score: target grade 7-9 for general audience, 10-12 for technical
   - Sentence length: average under 20 words
   - Paragraph length: maximum 3-4 sentences
   - Active voice: target 80%+ active voice
   - Jargon check: flag industry terms without explanation (unless audience is expert-level)

3. CTA optimization:
   - Each piece has exactly one primary CTA (no CTA overload)
   - CTA is visible without scrolling (above the fold) AND repeated at the bottom
   - CTA language is specific and value-driven ("Get the free template" not "Click here")
   - For longer content: soft CTA at the 30% mark, primary CTA at the bottom

4. Platform algorithm optimization:
   - **Twitter/X:** Engagement in first 30 minutes is critical. Schedule when audience is active. Ask a question in last tweet to drive replies. No external links (kills distribution).
   - **LinkedIn:** Posts with 1,200-1,500 characters perform best. First-person perspective. Line breaks for readability. Engage with comments in first hour.
   - **Instagram:** Carousel posts get 3x the reach of single images. Save > share > like in algorithm weight. Include a "save this" CTA.
   - **Newsletter:** Subject line under 50 characters. Preview text complements (doesn't repeat) subject. One-column layout for mobile.

5. Performance baseline:
   - Set expected metrics per piece based on historical data or benchmarks
   - Define what "success" looks like for each piece (pageviews, shares, conversions)
   - Plan measurement: when to check (24h, 7d, 30d) and what to look for

**Output:** Optimized content with SEO metadata, readability scores, CTA placement, platform-specific tweaks, and performance baselines.

**Quality gate:** Blog content has meta title, description, and 3+ internal links. Readability score within target range. Every piece has exactly one primary CTA. Platform-specific optimizations applied for each channel. Performance baselines set.

### Phase 5: DISTRIBUTE -- Multi-Channel Publishing Plan

**Entry criteria:** Optimized content ready for publishing across all target channels.

**Actions:**
1. Create the publishing calendar:
   - Schedule primary content first, then derivative content staggered over 3-7 days
   - Optimal posting times per channel:
     - Blog: Tuesday-Thursday, 10am-12pm (SEO indexing is time-agnostic, but social sharing peaks mid-week)
     - Twitter/X: 8-10am and 12-1pm weekdays (commute and lunch)
     - LinkedIn: Tuesday-Thursday 8-10am (professional morning routine)
     - Newsletter: Tuesday or Thursday 6-10am (highest open rates)
     - Instagram: Monday-Friday 11am-1pm and 7-9pm
   - Avoid publishing derivative content before primary content (the blog post should exist before the thread about it)

2. Design cross-promotion flows:
   - Blog -> Thread (link in last tweet or bio, not in body)
   - Blog -> LinkedIn (summary post with link in first comment)
   - Blog -> Newsletter (featured in next weekly email)
   - Thread -> Blog (embeddable, adds social proof)
   - Newsletter -> Social (tease exclusive content)
   - Social engagement -> Blog (respond to social comments with links to relevant blog posts)

3. Plan content amplification:
   - Internal amplification: team members share/engage (not fake engagement -- genuine reaction)
   - Community seeding: post to relevant communities (Reddit, Slack groups, Discord) with native framing
   - Influencer/peer sharing: tag relevant people who would genuinely find the content useful
   - Paid boost: identify 1-2 top performers per week for small paid amplification ($20-50)

4. Design the repurposing pipeline:
   - Every "anchor" blog post generates:
     - 1 Twitter/X thread
     - 1 LinkedIn post
     - 1 newsletter feature
     - 2-3 social media quotes/snippets
     - 1 video script (optional)
     - 1 carousel/infographic (optional)
   - Schedule repurposed content 2-4 weeks after initial publication (fresh audience, long tail)
   - "Evergreen refresh" cycle: revisit top-performing content every 90 days, update, and re-promote

5. Set distribution KPIs and review cadence:
   - Weekly: engagement rates, new followers, email signups
   - Monthly: traffic by channel, top-performing content, conversion rates
   - Quarterly: strategy review, pillar performance, audience growth trajectory

**Output:** Complete publishing calendar, cross-promotion plan, amplification strategy, repurposing pipeline, and KPI dashboard.

**Quality gate:** Calendar covers at least 2 weeks of content across all channels. Every primary piece has at least 2 derivative pieces scheduled. Cross-promotion flows are defined for every channel pair. Repurposing pipeline includes at least the blog -> social -> email flow. KPIs are defined and baseline metrics set.

## Exit Criteria

The skill is DONE when:
1. Content strategy defines audience personas, pillars, voice guide, and channel strategy.
2. At least 20 content ideas are generated and scored.
3. Primary content drafts exist for the top priority ideas with platform-specific derivatives.
4. All content is optimized for SEO (blog), readability, and platform-specific algorithms.
5. Distribution calendar covers at least 2 weeks with cross-promotion and repurposing plans.
6. Performance KPIs are defined with baseline metrics.

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| STRATEGY | Brand voice not defined | **Adjust** -- infer voice from any existing content or website copy. If nothing exists, default to "professional but conversational" and flag for refinement. |
| STRATEGY | Only one audience segment | **Adjust** -- proceed with single segment, recommend validating additional segments as data accumulates. |
| IDEATE | Search volume data unavailable | **Adjust** -- score ideas on social potential only, use Google Autocomplete and "People Also Ask" as proxy for search demand. |
| IDEATE | All ideas score similarly | **Adjust** -- apply a tiebreaker based on effort level (lower effort = higher priority for first batch). |
| CREATE | Content exceeds brand voice guide | **Retry** -- regenerate with explicit voice constraints highlighted. Max 2 retries. |
| CREATE | Only one distribution channel | **Adjust** -- create maximum value on that channel with format variety (long-form, short-form, visual, text). |
| OPTIMIZE | Content fails readability check | **Retry** -- simplify sentence structure, break long paragraphs, replace jargon. Max 2 retries. |
| DISTRIBUTE | No historical performance data | **Adjust** -- use industry benchmarks for channel performance, establish baseline tracking from first publication. |
| DISTRIBUTE | User rejects final output | **Targeted revision** -- ask which content piece, audience segment, or channel strategy fell short and regenerate only that section. Do not regenerate the full content calendar. |

## State Persistence

This skill maintains persistent state across executions:
- **brand_voice_profile**: Codified voice guide with examples -- evolves as the brand matures
- **content_performance**: Per-piece metrics over time -- identifies what works and what doesn't
- **audience_insights**: Engagement patterns by segment, format, channel, and topic -- refines targeting
- **idea_bank**: Unused ideas from previous sessions -- prevents rework and ensures no good idea is lost
- **strategy_evolution**: Historical strategy snapshots -- tracks how content approach evolves over time

## Reference

### Content Mix Framework (The 60-20-15-5 Rule)

| Type | Percentage | Purpose | Examples |
|---|---|---|---|
| Educational | 60% | Build trust, demonstrate expertise, attract search traffic | Tutorials, guides, how-tos, explainers |
| Thought Leadership | 20% | Build brand, spark conversation, differentiate | Opinion pieces, trend analysis, contrarian takes, industry commentary |
| Promotional | 15% | Drive conversion, showcase product | Case studies, product updates, testimonials, demos |
| Curated | 5% | Build community, reduce production burden | Industry roundups, tool recommendations, link sharing |

This ratio applies to the total content volume across all channels. Individual channels may skew differently (LinkedIn = more thought leadership, blog = more educational, email = more promotional).

### The 1-to-7 Content Repurposing Model

One anchor piece of content should generate at least 7 derivative pieces:

```
ANCHOR: Blog Post (2,000 words)
  |
  ├── 1. Twitter/X Thread (8-12 tweets)
  ├── 2. LinkedIn Post (300 words + link in comment)
  ├── 3. Newsletter Feature (150 words + "read more")
  ├── 4. Instagram Carousel (5-7 slides)
  ├── 5. Quote Graphics (3 pull quotes as images)
  ├── 6. Video Script (3-5 min, key points only)
  └── 7. Community Post (Reddit/Slack, native framing)
```

Each derivative is NOT a shortened version of the original. Each is a platform-native piece that would stand alone without the original. The anchor provides the research and thinking; derivatives provide the distribution.

### Platform-Specific Content Rules

| Platform | Optimal Length | Key Algorithm Signal | Avoid |
|---|---|---|---|
| Blog (Google) | 1,500-3,000 words | Dwell time, backlinks, topic coverage | Thin content (<500 words), keyword stuffing |
| Twitter/X | Thread: 6-15 tweets; Single: 100-200 chars | Replies and quotes > likes > retweets | Links in first tweet, engagement bait |
| LinkedIn | 1,200-1,500 chars | Comments in first hour, dwell time | External links in body, generic posts |
| Instagram | Carousel: 5-10 slides; Caption: 200-500 chars | Saves > shares > comments > likes | Low-quality images, too many hashtags (5-15 optimal) |
| Newsletter | 500-1,000 words | Open rate, click rate | Long subject lines, multiple CTAs, image-heavy |
| YouTube | 8-15 min (sweet spot) | Watch time, CTR on thumbnail | Clickbait that doesn't deliver, no hook in first 30s |
| TikTok | 30-90 seconds | Watch-through rate, shares | Overproduced content, slow start |

### Content Performance Benchmarks

| Metric | Poor | Average | Good | Excellent |
|---|---|---|---|---|
| Blog pageviews (per post, 30d) | <100 | 200-500 | 500-2,000 | 2,000+ |
| Email open rate | <15% | 20-25% | 25-35% | 35%+ |
| Email click rate | <1% | 2-3% | 3-5% | 5%+ |
| Twitter/X impressions (per post) | <500 | 1K-5K | 5K-20K | 20K+ |
| LinkedIn impressions (per post) | <500 | 1K-5K | 5K-15K | 15K+ |
| Instagram engagement rate | <1% | 2-4% | 4-6% | 6%+ |
| Blog conversion rate (visitor -> email) | <0.5% | 1-2% | 2-4% | 4%+ |

### The Hook Formula (for any format)

Every piece of content needs a hook in the first line/3 seconds. Use one of these proven structures:

| Hook Type | Template | Example |
|---|---|---|
| Contrarian | "[Common belief] is wrong. Here's why." | "Posting every day on LinkedIn is wrong. Here's why." |
| Specific Number | "I [did X] [number] times. Here's what I learned." | "I reviewed 200 cold emails. Here's what the top 1% do differently." |
| Before/After | "I went from [bad state] to [good state] by [method]." | "We went from 0 to 50K monthly visitors with no ad spend." |
| Question | "[Provocative question that implies a surprising answer]?" | "Why does your best content get the least engagement?" |
| Story Opening | "[Specific moment in time that creates curiosity]." | "Last Tuesday at 2am, I almost deleted our entire content strategy." |
| Authority Challenge | "[Authority figure/company] does [surprising thing]. Here's why you should too." | "Stripe writes 5,000-word blog posts. Here's why short-form is dying." |

Copyright 2024-present The Wayfinder Trust. All rights reserved.
