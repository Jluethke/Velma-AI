# Social Content Writer

Takes a campaign strategy and content calendar from the IP Social Campaign Strategist and writes every piece of content — fully formatted, platform-native, ready to post. No placeholders. No "insert your content here." Every post is complete and deployable.

**Why this exists:** Strategy tells you what to say. This skill writes it. The output is copy-paste ready content for every platform, every day of the campaign — formatted exactly as it will appear when posted, including hashtags, line breaks, emojis if the platform calls for it, and the exact hook as the opening line.

**Core rule:** Never use patent language. Never say "license," "royalty," "IP monetization," or "patent pending" in social posts. Talk about the technology, the problem, the regulatory gap, and the production system. Let the credibility and the technical authority do the work. Inbound inquiries will come — that's the goal.

## Inputs

- `campaign_strategy`: object — Full output from ip-social-strategist: platform_strategy, content_angles, content_calendar, hashtag_sets, target_communities
- `patent_families`: list[object] — Patent families: `{family, title, what_it_covers, market_application}`
- `licensor_name`: string — Entity name for attribution (e.g., "Northstar Systems Group")
- `ecosystem_context`: string — Live production deployment details (FlowFabric, TRUST token, GitHub links if shareable)
- `poster_name`: string — Name to write in first person as (e.g., "Jonathan Luethke")
- `poster_title`: string — Title/role for LinkedIn context (e.g., "Founder, Northstar Systems Group")
- `tone_overrides`: object — (Optional) Per-platform tone adjustments

## Outputs

- `linkedin_posts`: list[object] — All LinkedIn posts: `{day, title, body, hashtags, format, estimated_reach_tier}`
- `reddit_posts`: list[object] — All Reddit posts: `{day, subreddit, title, body, post_type}`
- `twitter_threads`: list[object] — All Twitter/X content: `{day, type, tweets}` where tweets is list of strings
- `facebook_posts`: list[object] — All Facebook group posts: `{day, group, title, body}`
- `instagram_content`: list[object] — All Instagram posts: `{day, caption, slide_copy, visual_brief}`
- `full_content_pack`: string — Complete markdown document with all content organized by day and platform, ready for the Playwright builder

---

## Execution

### Phase 1: LINKEDIN CONTENT

**For each LinkedIn post in the calendar:**

1. **Write the hook first.** The first line is the only line most people read before deciding to expand. It must create a pattern interrupt. Examples:
   - "Your AI model just made 10,000 decisions. Can you audit the 3 that were wrong?"
   - "EU AI Act Article 9 enforcement begins in August. Here's the clause nobody is talking about."
   - "We built a governed credit insurance model that produces MTBF on its own decisions. Here's what that means."
   - "The difference between a circuit breaker and a governor is whether your AI can stop itself or just get stopped."

2. **Write the body.** 800-1200 words for long-form. 150-200 for short takes. Structure:
   - Hook (1-2 lines)
   - The problem or observation (2-3 paragraphs)
   - The technical insight (2-3 paragraphs) — this is where credibility is built
   - The production proof or real-world example (1-2 paragraphs)
   - The call to reflection (not a CTA — a question or observation that invites engagement)

3. **Add hashtags.** 5-8 hashtags at the bottom. Mix high-volume (#AI, #MachineLearning) with targeted (#EUAIAct, #AIGovernance, #CyberInsurance).

4. **Format for LinkedIn.** Short paragraphs — never more than 3 lines before a line break. Use line breaks aggressively. LinkedIn rewards dwell time, not density.

**Output:** `linkedin_posts`

---

### Phase 2: REDDIT CONTENT

**For each Reddit post:**

1. **Write for the community, not for the campaign.** Reddit readers are sophisticated and hostile to marketing. The post must be genuinely useful or technically interesting on its own — the connection to the broader work is secondary.

2. **Title is everything on Reddit.** Write 3 title options per post, pick the strongest. Titles that work:
   - "Built a governed credit insurance model — here's what the actuarial output looks like"
   - "EU AI Act Article 9 compliance for adaptive AI systems — what 'governing the learning process' actually requires"
   - "Why rollback in an AI learning governor needs two independent layers (and most implementations only have one)"

3. **Body structure for Reddit:**
   - Context: what you built or observed (1 paragraph)
   - The technical substance: the actual insight, mechanism, or finding (3-5 paragraphs)
   - What you learned or what's unresolved (1 paragraph)
   - Invitation: "Curious if anyone has seen alternative approaches to X"

4. **No links to products or commercial content in body.** If the community allows, add a comment with context after the post gains traction.

5. **Write community-specific.** r/MachineLearning gets the math. r/Insurance gets the actuarial angle. r/cybersecurity gets the audit chain. Same underlying story, completely different framing.

**Output:** `reddit_posts`

---

### Phase 3: TWITTER/X CONTENT

**For each Twitter/X entry:**

1. **Threads (8-12 tweets):**
   - Tweet 1: The hook — must stand alone as a complete thought
   - Tweets 2-9: Each adds one piece of the story. Each tweet must be self-contained.
   - Tweet 10-11: The synthesis — what this means
   - Tweet 12: The question or observation that invites replies

2. **Single takes:**
   - One sharp observation under 280 characters
   - Often the best-performing format for reach
   - Write 5-7 options per slot, pick the sharpest

3. **Quote-tweet responses:**
   - When regulatory news breaks (EU AI Act enforcement, NAIC adoption), draft a 2-3 tweet response that adds a specific technical insight the original post missed

**Output:** `twitter_threads`

---

### Phase 4: FACEBOOK CONTENT

**For each Facebook group post:**
- Practical and problem-focused — less technical than Reddit, less polished than LinkedIn
- Frame as a discussion starter: "We've been working on X — curious how others in the group are thinking about Y"
- 200-400 words
- Always end with a question to drive comments

**Output:** `facebook_posts`

---

### Phase 5: INSTAGRAM CONTENT

**For each Instagram post:**

1. **Caption:** 150-200 words. Hook in the first line (before "more"). Hashtags at the bottom (15-20).

2. **Slide copy (for carousels):**
   - Slide 1: Hook / title
   - Slides 2-6: One concept per slide, max 30 words each
   - Slide 7: The key insight or takeaway
   - Slide 8: CTA (follow, save, share)

3. **Visual brief:** Describe exactly what the visual should show — enough for a designer or AI image tool to execute without interpretation.

**Output:** `instagram_content`

---

### Phase 6: FULL CONTENT PACK ASSEMBLY

Compile all content into a single structured markdown document organized as:

```
# [Campaign Name] — Full Content Pack
## Day 1
### LinkedIn
[full post]
### Twitter/X
[thread or take]
### Reddit
[if applicable]

## Day 2
...
```

This document is the direct input to the Playwright automation builder.

**Output:** `full_content_pack`

---

## Exit Criteria

Done when:
1. Every day in the 30-day calendar has complete content for every assigned platform
2. No placeholders — every post is fully written and ready to post
3. All hashtags included
4. Reddit posts are community-specific (no generic copy-paste across subreddits)
5. Instagram slide copy is written per carousel
6. Full content pack is assembled in the output format

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
