# Social Media Content Planner

Takes your business or personal brand, target audience, platforms (Instagram, TikTok, LinkedIn, X, Facebook, YouTube), and content goals, then generates a month of content ideas with captions, hashtags, posting schedule, and content pillars. Not generic -- tailored to your niche and voice. Includes content repurposing strategy (one idea becomes 5 posts across platforms). Designed for solopreneurs and small business owners who know they should post but stare at blank screens.

## Execution Pattern: Phase Pipeline

```
PHASE 1: BRAND DNA      --> Extract your voice, audience, and what makes you worth following
PHASE 2: PILLARS        --> Define 4-5 content pillars that balance value, personality, and promotion
PHASE 3: CALENDAR       --> Build a 30-day content calendar with specific post ideas per platform
PHASE 4: CONTENT PACK   --> Write captions, hashtags, and hooks for every post in the calendar
PHASE 5: REPURPOSE MAP  --> Turn each core idea into 5+ pieces across platforms
```

## Inputs
- brand: object -- What you do, who you help, what makes you different. Business name, industry, key products/services, brand personality (professional, casual, funny, edgy, inspirational). Include examples of posts you've liked or that felt "like you."
- audience: object -- Who you're trying to reach: demographics (age, gender, location), psychographics (values, pain points, aspirations, what keeps them up at night), where they hang out online, what content they already consume and engage with
- platforms: array -- Which platforms you're active on or want to be: Instagram (feed, stories, reels), TikTok, LinkedIn, X (Twitter), Facebook, YouTube (long-form, shorts). Include current follower counts if known.
- goals: object -- What you want from social media: brand awareness, lead generation, direct sales, community building, thought leadership, hiring, or "I just need to be consistent." Include any specific targets (followers, leads per month, sales from social).
- current_state: object -- (Optional) What you're doing now: posting frequency, what's worked before (any viral or high-engagement posts), what flopped, biggest frustrations (no ideas, no time, no engagement, inconsistent posting)
- resources: object -- (Optional) What you can produce: can you shoot video (phone is fine), take photos, write long-form, create graphics (Canva counts), record audio. Available time per week for content creation.

## Outputs
- brand_voice_guide: object -- Your content voice distilled into guidelines: tone words, vocabulary to use and avoid, sentence style, emoji usage, how formal or casual, example phrases that sound "like you"
- content_pillars: array -- 4-5 themed categories your content rotates through, each with a description, content ratio, and 10 starter ideas
- monthly_calendar: object -- 30-day posting schedule with specific post ideas assigned to dates and platforms, including optimal posting times
- content_pack: array -- Ready-to-post content for every calendar slot: caption, hashtags, hook/first line, call to action, visual direction (what image or video to pair with it)
- repurpose_playbook: object -- Strategy for turning 1 content idea into 5+ platform-specific pieces, with transformation templates

## Execution

### Phase 1: BRAND DNA
**Entry criteria:** At least brand description, audience, and platforms provided.
**Actions:**
1. Extract the brand voice from provided examples and descriptions. Identify: are you the expert teaching down, the peer sharing the journey, the entertainer who educates, or the provocateur who challenges? Most small business owners don't know their voice -- help them find it by analyzing what they naturally gravitate toward.
2. Define the audience avatar in painful detail. Not "women 25-45 interested in fitness." Try: "Sarah, 32, works a desk job, has a gym membership she uses twice a week, follows fitness influencers but feels intimidated, wants to feel strong but doesn't want to become a bodybuilder, will scroll past anything that feels like a gym bro talking at her."
3. Audit current content if provided. Identify what worked (high engagement relative to followers) and why, what flopped and why, and patterns in posting behavior (bursts of activity followed by weeks of silence).
4. Map platform-specific opportunities. LinkedIn rewards long-form text and industry takes. Instagram rewards visual storytelling and reels. TikTok rewards authenticity and trends. X rewards hot takes and threads. YouTube rewards depth. Don't post the same thing everywhere -- adapt.
5. Identify the "content moat" -- what can this person talk about that most competitors can't? Unique experience, contrarian opinion, specific niche expertise, behind-the-scenes access, or a distinctive personality. This is what makes people follow you instead of the other 10,000 accounts in your niche.

**Output:** Brand voice guide with tone descriptors and example phrasing, detailed audience avatar, content audit findings, platform strategy notes, content moat statement.
**Quality gate:** Voice guide is specific enough that someone else could write in this voice. Audience avatar includes pain points, not just demographics. Content moat is identified.

### Phase 2: PILLARS
**Entry criteria:** Brand DNA established.
**Actions:**
1. Define 4-5 content pillars. These are recurring themes that structure your content so you never stare at a blank screen. Standard pillar framework:
   - **Educate (30-40%):** Teach something useful. Tips, how-tos, frameworks, mistakes to avoid, industry insights. This is your credibility builder.
   - **Relate (20-25%):** Share the journey. Behind-the-scenes, struggles, wins, day-in-the-life, vulnerable moments. This is your connection builder.
   - **Entertain (15-20%):** Memes, trends, hot takes, humor, cultural references related to your niche. This is your reach builder -- shareable content that brings new eyeballs.
   - **Promote (10-15%):** Your product, service, offer, testimonials, case studies, results. This is your revenue builder. Most people either promote too much (annoying) or too little (broke).
   - **Community (10%):** Ask questions, run polls, respond to comments, feature followers, collaborate. This is your retention builder.
2. Customize the pillar ratios based on goals. Lead generation? More educate and promote. Brand awareness? More entertain and relate. Community building? More relate and community.
3. Generate 10 specific content ideas for each pillar. Not vague ("share a tip") but specific ("5 things I wish I knew before starting my bakery -- number 3 still costs me money").
4. Map each pillar to the platforms where it performs best. Education pillars crush on LinkedIn and YouTube. Entertainment pillars crush on TikTok and Instagram Reels. Promotion works best on Instagram Stories and email (not feed posts).
5. Set the content mix rule: the 4-1-1 guideline. For every 6 posts, 4 should be educate/relate/entertain, 1 should be soft promote (testimonial, case study), 1 should be direct promote (offer, CTA). Adjust based on platform norms.

**Output:** 4-5 named content pillars with descriptions, ratios, platform mapping, and 10 starter ideas each. Content mix rule defined.
**Quality gate:** Pillars cover educate, relate, entertain, and promote. No pillar exceeds 40% of content. Promote is 15% or less. Each pillar has 10 specific (not vague) content ideas.

### Phase 3: CALENDAR
**Entry criteria:** Content pillars defined.
**Actions:**
1. Determine posting frequency per platform based on the user's available time:
   - **Minimum viable:** Instagram 3x/week, LinkedIn 2x/week, TikTok 3x/week, X 5x/week, YouTube 1x/week, Facebook 3x/week.
   - **Growth mode:** Instagram 5-7x/week + daily stories, LinkedIn 3-5x/week, TikTok 5-7x/week, X daily + 2 threads/week, YouTube 2x/week, Facebook 5x/week.
   - If the user can only handle 3 posts a week total, pick ONE platform and commit. Better to be great on one than mediocre on five.
2. Assign optimal posting times based on platform data and audience behavior:
   - LinkedIn: Tuesday-Thursday, 8-10 AM or 5-6 PM (business hours bookends).
   - Instagram: Monday-Friday 11 AM-1 PM, Tuesday and Thursday evenings for reels.
   - TikTok: Evenings 7-9 PM, weekends for longer content.
   - X: Mornings 8-9 AM, lunchtime 12-1 PM for engagement, evenings for threads.
   - Adjust for audience timezone if different from the user's.
3. Build the 30-day calendar. Assign a specific content idea to each posting slot. Alternate pillars so followers don't get three educational posts in a row. Front-load the month with the easiest content to create (momentum matters more than perfection in week 1).
4. Mark "tentpole" days: holidays, industry events, seasonal moments, product launches, awareness days relevant to the niche. Build content around these -- they get natural engagement boosts.
5. Build in 2-3 "flex slots" per week for reactive content: trending topics, responding to viral moments in your industry, reposting user-generated content. You can't plan everything.

**Output:** 30-day calendar grid with dates, platforms, posting times, content pillar labels, and specific post ideas assigned to each slot. Tentpole dates marked. Flex slots included.
**Quality gate:** Posting frequency matches user's stated available time. Pillars are distributed evenly across the month. No more than 2 promotional posts in any 7-day stretch. At least 3 tentpole moments identified.

### Phase 4: CONTENT PACK
**Entry criteria:** Calendar built.
**Actions:**
1. Write the hook/first line for every post. This is the most important part -- 80% of people decide whether to keep reading or scrolling based on the first line. Hook formulas:
   - Problem-agitate: "Stop doing [common mistake] -- it's costing you [result]."
   - Curiosity gap: "I tried [thing] for 30 days. Here's what actually happened."
   - Contrarian: "Unpopular opinion: [industry norm] is actually terrible advice."
   - List/number: "3 things I do every morning that doubled my [result]."
   - Story: "Last week a client told me something that made me rethink everything."
2. Write the full caption for each post. Match the brand voice guide. Keep platform norms:
   - Instagram: 150-300 words for feed, punchy for reels (under 50 words on-screen).
   - LinkedIn: 150-300 words, line breaks every 1-2 sentences, end with a question or CTA.
   - TikTok: caption is secondary to video -- write a video script outline instead (hook, body, punchline).
   - X: single tweet (under 280 chars) or thread structure (5-10 tweets with hook and payoff).
3. Add hashtags per platform. Instagram: 5-15 hashtags mixing popular (100K+ posts), medium (10K-100K), and niche (under 10K). LinkedIn: 3-5 hashtags. TikTok: 3-5 trending + niche. X: 1-2 max or none.
4. Include a call to action (CTA) on every post, but vary them: follow for more, save this post, drop a comment, share with someone who needs this, link in bio, DM me the word [X]. Hard sell CTAs only on promote pillar posts.
5. Add visual direction notes: what image, graphic, or video format to pair with the post. "Carousel with 5 slides, text overlay on brand-color background" or "talking-head reel, 30 seconds, film at your desk with natural lighting." Don't assume professional production -- phone content works.

**Output:** Complete content pack for every calendar slot: hook, caption, hashtags, CTA, and visual direction. Platform-specific formatting applied.
**Quality gate:** Every post has a hook that creates curiosity or tension. Captions match the brand voice guide. Hashtag counts are within platform norms. CTAs vary across the month.

### Phase 5: REPURPOSE MAP
**Entry criteria:** Content pack complete.
**Actions:**
1. Identify the 4-5 "anchor pieces" from the month's content. These are the highest-effort, most valuable posts -- a long LinkedIn article, a YouTube video, an in-depth Instagram carousel, or a detailed thread. Everything else flows from these anchors.
2. Build the repurposing chain for each anchor piece:
   - **Long-form video (YouTube)** becomes: 3-5 short clips (Reels/TikTok/Shorts), a blog post (transcript + editing), a Twitter thread (key points), a carousel (5-7 slides of highlights), 2-3 quote graphics.
   - **Blog post or article** becomes: a LinkedIn post (summary + hot take), a Twitter thread, 3-5 quote graphics, an email newsletter section, a video script (read/expand the blog on camera).
   - **Instagram carousel** becomes: individual slides as standalone posts on X, a TikTok explaining the carousel, a LinkedIn text post expanding one slide, a story sequence.
3. Create transformation templates: literal fill-in-the-blank formats for converting one content type to another. "Take slide 3 of the carousel. The headline becomes your tweet. The body becomes the LinkedIn post opening. The visual becomes the Instagram Story."
4. Set up a "content bank" system: unused ideas, partially written posts, engagement data on what worked. Nothing gets thrown away -- a post that flopped on Instagram might crush on LinkedIn with different framing.
5. Define the batch creation workflow: set aside one 2-4 hour block to create all anchor content for the week, then spend 15-minute daily sessions repurposing and scheduling. Batching is 3x more efficient than creating each post individually.

**Output:** Repurposing chain for each anchor piece, transformation templates per platform pair, batch creation workflow, content bank structure.
**Quality gate:** Each anchor piece generates at least 5 derivative posts. Transformation templates are specific enough to follow in under 10 minutes per conversion. Batch workflow fits within the user's stated time availability.

## Exit Criteria
Done when: (1) brand voice guide captures the user's authentic tone with specific guidelines, (2) 4-5 content pillars are defined with 10 ideas each, (3) 30-day calendar has specific posts assigned to dates and platforms, (4) every calendar slot has a complete content pack (hook, caption, hashtags, CTA, visual direction), (5) repurposing strategy turns each anchor piece into 5+ platform-specific posts.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| BRAND DNA | User has no existing content or brand examples to reference | Adjust -- interview mode: ask what accounts they admire, what tone feels natural when texting friends, what topics they could talk about for an hour. Build voice from personality, not portfolio |
| BRAND DNA | User wants to be on 6 platforms with 3 hours per week | Escalate -- be direct: pick 1-2 platforms and do them well. Provide a ranking of which platforms matter most for their specific audience and goals |
| PILLARS | User wants all content to be promotional | Advise -- explain the 80/20 rule: 80% value, 20% promotion. Pure promotion gets unfollowed. Show examples of accounts that sell effectively by leading with value |
| PILLARS | Niche is too broad to define clear pillars | Adjust -- narrow the audience first. "Marketing tips" is not a niche. "Marketing tips for solo therapists building a private practice" is a niche. Help the user find their specific lane |
| CALENDAR | User's available time can't sustain the minimum posting frequency | Adjust -- reduce to 2 posts per week on one platform. Quality and consistency beat volume every time. One great post a week outperforms 7 mediocre ones |
| CONTENT PACK | User can't create video content | Adjust -- focus on text, carousels, and static graphics. Instagram carousels outperform reels for many business accounts. LinkedIn is text-native. Use Canva for visual posts |
| REPURPOSE MAP | User only uses one platform | Adjust -- repurposing becomes reformatting: turn one long post into a story sequence, a thread into a carousel, a reel into a static quote. Still works within a single platform |

## State Persistence
- Brand voice guide (evolves over time as the user finds their voice and gets audience feedback)
- Content performance data (which pillars, hooks, posting times, and formats get the most engagement -- refine future calendars based on this)
- Hashtag performance (which hashtags drive discovery vs. which are dead weight -- rotate and test)
- Content bank (unused ideas, high-performing posts to refresh and repost, seasonal content to recycle annually)
- Audience insights (what topics get saves/shares vs. likes-only, what questions followers ask repeatedly, DM themes)
- Platform-specific learnings (Instagram algorithm shifts, LinkedIn format changes, TikTok trend cycles -- update strategy accordingly)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
