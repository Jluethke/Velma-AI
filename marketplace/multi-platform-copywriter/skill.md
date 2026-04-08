# Multi-Platform Copywriter

**One-line description:** Convert a single product description into 10 optimized copy variations for Twitter, LinkedIn, email, landing page, app store, Facebook, Instagram, YouTube, and SMS.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `product_description` (string, required) -- The original product or service description. Must include product name, core benefits, target audience, and unique selling points. Minimum 50 characters. Example: "CloudSync is a real-time file synchronization tool for remote teams, enabling instant collaboration without version conflicts."
- `brand_voice_guidelines` (string, optional) -- Tone, personality, and messaging rules. Specify: (1) tone (e.g., "casual and witty," "enterprise-focused," "eco-conscious"), (2) vocabulary level (e.g., "technical," "accessible," "luxury"), (3) key values (e.g., "innovation," "trust," "sustainability"). Example: "Tone: casual and approachable. Vocabulary: accessible (avoid jargon). Values: transparency, speed, reliability." Defaults to "Tone: professional yet approachable. Vocabulary: accessible. Values: clarity, efficiency, trust."
- `target_audience_override` (string, optional) -- If provided, overrides audience inferred from product description. Specify: role/persona, industry, pain point. Example: "Remote engineering managers at mid-market SaaS companies."
- `include_ctas` (boolean, optional) -- Whether to include explicit calls-to-action in each variation. Defaults to true.
- `keyword_focus` (array of strings, optional) -- SEO or marketing keywords to emphasize in app store and social variations. Example: ["file sync," "remote collaboration," "version control"]. Maximum 8 keywords; will be prioritized by platform relevance.

---

## Outputs

- `variations` (object) -- A structured object containing all 10 platform-specific copy variations:
  - `twitter` (string) -- Tweet, ≤280 characters, with 2-3 hashtags. Tone: casual, benefit-first or curiosity-driven.
  - `linkedin` (string) -- Professional post, 300-1300 characters. Tone: thought-leadership, industry-credible, soft CTA.
  - `email_subject` (string) -- Subject line, 40-50 characters. Tone: curiosity-driven or benefit-focused, no spam triggers.
  - `landing_page_hero` (object) -- {headline (8-12 words, benefit-first), subheadline (15-25 words, supporting detail), cta_text (2-5 words, action-oriented)}.
  - `app_store` (string) -- App store description, 80-160 words, keyword-rich, feature-driven, download incentive.
  - `facebook` (string) -- Facebook post, 100-200 characters, conversational, engagement-focused, CTA.
  - `instagram` (string) -- Instagram caption, 125-150 characters, visual-first, personality-driven, 5-10 hashtags.
  - `youtube_description` (string) -- YouTube video description, 150-300 words, hook in first 55 chars, includes timestamps/links, keyword-optimized.
  - `sms` (string) -- SMS message, ≤160 characters, urgent, direct benefit, CTA or link.
  - `platform_performance_notes` (object) -- {platform_name: "expected_performance_metric and optimization_tip"}. Example: {"twitter": "Expected engagement rate: 2-4%. Tip: Post during peak hours (9am-5pm weekdays)."}.
- `metadata` (object) -- {product_name (string), target_audience (string), brand_voice_used (string), keywords_emphasized (array), generation_timestamp (ISO 8601)}.
- `quality_report` (object) -- {tone_consistency_score (0-100, with rubric applied), brand_alignment_score (0-100, with rubric applied), platform_compliance_flags (array of strings, empty if all pass), consistency_notes (string describing any tone drift and why)}.

---

## Execution Phases

### Phase 1: Parse & Extract Messaging

**Entry Criteria:**
- `product_description` is provided and ≥50 characters
- `brand_voice_guidelines` is either provided or will default to "Tone: professional yet approachable. Vocabulary: accessible. Values: clarity, efficiency, trust."

**Actions:**
1. Parse the product description to extract: (a) product name, (b) core benefit(s) (what problem it solves), (c) target audience (who uses it), (d) unique selling point(s) (why it's different), (e) any existing calls-to-action or value propositions.
2. Extract 5-7 key messaging elements: headlines (benefit statements), features (concrete capabilities), value propositions (why it matters), and social proof anchors (if present).
3. Apply brand voice: If `brand_voice_guidelines` is provided, parse it into (tone, vocabulary_level, key_values). If not provided, use default. Document the applied voice explicitly.
4. If `keyword_focus` is provided, map each keyword to platforms where it will be emphasized: High-priority (App Store, YouTube), Medium-priority (LinkedIn, Facebook), Low-priority (Twitter, Instagram, SMS due to character constraints). Note any keywords that cannot be naturally integrated.

**Output:**
- `messaging_blueprint` (object with: product_name, core_benefits [array], target_audience, unique_selling_points [array], key_messages [array of 5-7 strings], brand_voice {tone, vocabulary_level, key_values}, keyword_map {high_priority, medium_priority, low_priority})

**Quality Gate:**
- Messaging blueprint contains all 7 required fields (product_name, core_benefits, target_audience, unique_selling_points, key_messages, brand_voice, keyword_map).
- All messaging elements are distinct (no duplicates).
- Brand voice is explicitly stated with tone, vocabulary level, and values.
- Keyword map is complete if keywords were provided; if keywords cannot be integrated, this is noted.
- **Verification method:** Confirm that a user unfamiliar with the product could understand its core value and target audience from the messaging_blueprint alone.

---

### Phase 2: Generate Social & Short-Form Variations

**Entry Criteria:**
- `messaging_blueprint` is complete from Phase 1
- Brand voice is explicitly defined

**Actions:**
1. **Twitter:** Compose a tweet (≤280 chars) following this structure: [Benefit or curiosity hook] + [Supporting detail or proof point] + [2-3 hashtags]. Tone must match brand voice (casual, professional, witty, etc.). If `include_ctas` is true, include a link or call-to-action (e.g., "Learn more: [link]"). Verify character count ≤280 including spaces and hashtags.
2. **LinkedIn:** Write a professional post (300-1300 chars) following this structure: [Opening question or insight] + [1-2 sentences of context or thought leadership] + [Core benefit or value proposition] + [Soft CTA, e.g., "What's your experience?", "Share your thoughts in comments"]. Tone must reflect professional credibility and industry awareness. Vocabulary must match brand guidelines (avoid jargon if brand is "accessible").
3. **Facebook:** Create an engagement-focused post (100-200 chars) with conversational tone, emojis if brand-appropriate, and a clear CTA (e.g., "Learn more", "Get started"). Structure: [Relatable hook or question] + [Benefit] + [CTA]. Tone must be friendly and community-focused.
4. **Instagram:** Write a visual-first caption (125-150 chars) assuming an accompanying image. Include personality (emojis, exclamations if brand-appropriate), 5-10 hashtags, and a soft CTA or engagement prompt (e.g., "Tag someone who needs this"). Tone must match brand voice and be visually-complementary.
5. **SMS:** Compose an SMS message (≤160 chars) with urgency, a clear benefit statement, and a direct CTA or link. Structure: [Benefit or urgency trigger] + [Core value] + [CTA/link]. Tone must be direct and action-oriented.

**Output:**
- `social_variations` (object with: twitter, linkedin, facebook, instagram, sms, each with character_count and tone_descriptor)

**Quality Gate:**
- **Character limits:** Twitter ≤280, Facebook 100-200, Instagram 125-150, SMS ≤160. Any variation exceeding its limit triggers a Retry error.
- **Tone consistency:** Each variation reflects the brand voice defined in messaging_blueprint. Tone descriptors (casual, professional, witty, etc.) are consistent across all variations, with platform-specific adaptations noted (e.g., "Twitter: casual; LinkedIn: professional; both emphasize trust").
- **CTA presence:** If `include_ctas` is true, all 5 variations include a CTA. If false, no CTAs are present.
- **Verification method:** Read all 5 variations aloud; they should sound like they come from the same brand, adapted for different audiences and platforms.

---

### Phase 3: Generate Email & Landing Page Variations

**Entry Criteria:**
- `messaging_blueprint` is complete from Phase 1
- Brand voice is explicitly defined

**Actions:**
1. **Email Subject Line:** Compose a subject line (40-50 chars) optimized for open rates. Structure: [Curiosity gap OR benefit statement] + [Optional personalization token, e.g., {{first_name}}]. Avoid spam trigger words (FREE, ACT NOW, LIMITED TIME, URGENT, GUARANTEE, RISK-FREE, WINNER, CASH, WINNER, CLICK HERE). Tone must match brand voice (e.g., if brand is "casual," use conversational language; if "enterprise," use professional language). Verify character count ≤50 including spaces and tokens.
2. **Landing Page Hero:** Create a three-part hero section:
   - **Headline:** A single, benefit-first statement (8-12 words). Structure: [Benefit or outcome] + [for target audience]. Example: "Sync files instantly across your remote team." Tone must be confident and benefit-focused.
   - **Subheadline:** A supporting statement or social proof (15-25 words). Structure: [Supporting detail OR proof point OR pain point validation]. Example: "No more version conflicts. No more lost work. Join 10,000+ teams."
   - **CTA Text:** A clear, action-oriented button text (2-5 words). Examples: "Start Free Trial", "Get Started", "Learn More", "Request Demo". Tone must be direct and inviting.

**Output:**
- `email_variations` (object with: email_subject, character_count, spam_trigger_check)
- `landing_page_variations` (object with: headline, headline_word_count, subheadline, subheadline_word_count, cta_text, cta_word_count)

**Quality Gate:**
- **Email subject line:** ≤50 chars, no spam trigger words, tone matches brand voice. Verification: Check character count and scan against spam trigger word list.
- **Landing page headline:** 8-12 words, benefit-first, scannable. Verification: Count words; confirm first 3 words convey a benefit.
- **Landing page subheadline:** 15-25 words, supporting detail or proof point. Verification: Count words; confirm it answers "why should I care?" or "why is this different?".
- **CTA text:** 2-5 words, action-oriented (verb + object, e.g., "Start Free Trial"). Verification: Count words; confirm it starts with an action verb.
- **Tone consistency:** Email subject and landing page copy reflect the brand voice defined in messaging_blueprint.

---

### Phase 4: Generate App Store & Video Variations

**Entry Criteria:**
- `messaging_blueprint` is complete from Phase 1
- `keyword_focus` is available (if provided); if not, keyword integration is skipped
- Brand voice is explicitly defined

**Actions:**
1. **App Store Description:** Write a keyword-rich description (80-160 words) following this structure: [Headline: core benefit in 1 sentence] + [Problem statement: pain point the product solves] + [Solution: 3-5 key features, each with a benefit] + [Social proof or credibility statement, if available] + [Download incentive or CTA, e.g., "Download free today", "Start your free trial"]. Integrate keywords from `keyword_focus` naturally into the features and benefits sections (target 2-3 keywords per 100 words; avoid keyword stuffing >3% keyword density). Tone must be feature-rich and benefit-driven. Vocabulary must match brand guidelines (accessible if brand is non-technical).
2. **YouTube Description:** Compose a video description (150-300 words) following this structure: [Hook (first 55 chars): compelling reason to watch] + [Video overview: what the video covers] + [Timestamps: if applicable, list key sections with timestamps] + [Links: relevant product links, related videos, or resources] + [Keywords: naturally integrated into the description] + [CTA: subscribe, like, comment, or visit link]. Tone must be informative and engaging. Optimize for YouTube search by including keywords in the first 55 characters and throughout the description.

**Output:**
- `app_store_variations` (object with: app_store, word_count, keyword_integration_notes, app_store_cta)
- `youtube_variations` (object with: youtube_description, word_count, hook_first_55_chars, keyword_integration_notes, youtube_cta)

**Quality Gate:**
- **App store copy:** 80-160 words, includes 3-5 features with benefits, keyword density ≤3%, no keyword stuffing. Verification: Count words; list features; scan for keyword density.
- **YouTube description:** 150-300 words, hook in first 55 chars, includes timestamps and links, keywords naturally integrated. Verification: Count words; confirm first 55 chars are compelling; check for timestamps and links.
- **Keyword integration:** If `keyword_focus` was provided, confirm all high-priority keywords appear in app store and YouTube descriptions. If a keyword cannot be naturally integrated, note this in keyword_integration_notes.
- **Tone consistency:** Both variations reflect the brand voice defined in messaging_blueprint.

---

### Phase 5: Compile, Validate & Score

**Entry Criteria:**
- All variations from Phases 2, 3, and 4 are complete
- All quality gates from previous phases have passed

**Actions:**
1. **Merge all variations:** Combine all 10 platform copies (twitter, linkedin, facebook, instagram, sms, email_subject, landing_page_hero, app_store, youtube_description) into a single `variations` output object. Include character counts and word counts for each variation.
2. **Generate metadata:** Create a metadata object with: product_name, target_audience, brand_voice_used (tone, vocabulary_level, key_values), keywords_emphasized (array of keywords actually used), generation_timestamp (ISO 8601 format).
3. **Perform tone consistency scoring (0-100):** Compare all 10 variations against the brand voice defined in messaging_blueprint. Apply the following rubric:
   - **90-100:** All variations reflect brand voice with minimal platform-specific drift. Consistent vocabulary, personality, and messaging across all platforms. Any platform-specific adaptations are intentional and documented.
   - **75-89:** 8-9 of 10 variations reflect brand voice. 1-2 variations have minor tone drift, but drift is justified by platform constraints (e.g., Twitter's character limit forces brevity).
   - **60-74:** 6-7 of 10 variations reflect brand voice. 3-4 variations have noticeable tone drift that is not fully justified by platform constraints.
   - **<60:** Fewer than 6 variations reflect brand voice. Significant tone inconsistency across platforms.
   - **Scoring method:** For each variation, assign 0-10 points based on how well it matches the brand voice. Average the 10 scores to get the tone_consistency_score. Document which variations (if any) deviate and why.
4. **Perform brand alignment scoring (0-100):** Compare all 10 variations against the provided `brand_voice_guidelines`. Apply the following rubric:
   - **90-100:** All variations adhere to provided brand guidelines (tone, vocabulary level, key values). No contradictions or deviations.
   - **75-89:** 8-9 of 10 variations adhere to guidelines. 1-2 variations have minor deviations justified by platform constraints.
   - **60-74:** 6-7 of 10 variations adhere to guidelines. 3-4 variations deviate from guidelines without clear justification.
   - **<60:** Fewer than 6 variations adhere to guidelines. Significant misalignment with brand guidelines.
   - **Scoring method:** For each variation, check adherence to tone, vocabulary level, and key values. Assign 0-10 points. Average the 10 scores to get the brand_alignment_score.
5. **Perform platform compliance checks:** For each variation, verify it meets platform constraints:
   - Twitter: ≤280 chars
   - LinkedIn: 300-1300 chars
   - Facebook: 100-200 chars
   - Instagram: 125-150 chars
   - SMS: ≤160 chars
   - Email subject: ≤50 chars
   - Landing page headline: 8-12 words
   - Landing page subheadline: 15-25 words
   - App store: 80-160 words
   - YouTube: 150-300 words
   - If any variation fails a constraint, flag it in platform_compliance_flags with the specific violation (e.g., "Twitter exceeds 280 characters by 15 chars").
6. **Generate platform-specific performance notes:** For each platform, include an expected performance metric and optimization tip based on industry benchmarks:
   - **Twitter:** "Expected engagement rate: 2-4%. Tip: Post during peak hours (9am-5pm weekdays). Retweet rate increases 17% with hashtags."
   - **LinkedIn:** "Expected engagement rate: 1-3%. Tip: Posts with questions get 2x more comments. Thought leadership content performs best on Tuesdays-Thursdays."
   - **Email subject:** "Expected open rate: 15-25% (industry average). Tip: Personalization tokens increase open rate by 26%. A/B test subject lines."
   - **Landing page:** "Expected conversion rate: 2-5% (industry average). Tip: Reduce form fields to 3-5 for best conversion. Test CTA button color and copy."
   - **App store:** "Expected download rate depends on ranking. Tip: Keywords in first 30 words increase visibility 40%. Update description monthly."
   - **Facebook:** "Expected engagement rate: 1-3%. Tip: Video content gets 10x more engagement than static posts. Post 1-2 times daily for best reach."
   - **Instagram:** "Expected engagement rate: 1-5%. Tip: Posts with 5-10 hashtags get 2x more reach. Captions with emojis get 25% more engagement."
   - **YouTube:** "Expected click-through rate: 2-5%. Tip: Hook viewers in first 5 seconds. Include timestamps for videos >5 minutes."
   - **SMS:** "Expected click-through rate: 20-40%. Tip: SMS has highest engagement rate of all channels. Include clear CTA or link. Avoid ALL CAPS."
7. **Generate consistency notes:** Document any tone drift, brand alignment deviations, or platform constraint violations. Explain why each occurred and whether it was intentional (e.g., "Instagram caption is shorter than ideal due to character limit, but maintains brand voice").

**Output:**
- `variations` (complete object with all 10 copies, character/word counts, and platform_performance_notes)
- `metadata` (object with product_name, target_audience, brand_voice_used, keywords_emphasized, generation_timestamp)
- `quality_report` (object with: tone_consistency_score [0-100], brand_alignment_score [0-100], platform_compliance_flags [array, empty if all pass], consistency_notes [string describing any deviations and why])

**Quality Gate:**
- All 10 variations are present and non-empty.
- Tone consistency score is ≥75, OR if <75, consistency_notes explain the deviations and recommend regeneration of specific variations.
- Brand alignment score is ≥75, OR if <75, consistency_notes explain the deviations and recommend regeneration.
- Platform compliance flags are empty (all variations pass constraints), OR all flagged violations are documented with specific measurements.
- Metadata is complete and accurate.
- Performance notes are included for all 10 platforms.
- **Verification method:** A user could review the quality_report and immediately understand whether the variations are ready to publish, or which variations need regeneration.

---

## Exit Criteria

The skill is complete when:
1. All 10 platform variations are generated, validated, and present in the `variations` output object.
2. Each variation respects platform constraints (character limits, word counts, format requirements). Platform compliance flags are empty or all violations are documented.
3. All variations reflect the same core message and brand voice (adjusted for platform norms). Tone consistency score is ≥75.
4. All variations adhere to provided brand guidelines. Brand alignment score is ≥75.
5. Metadata is complete and accurate (product_name, target_audience, brand_voice_used, keywords_emphasized, generation_timestamp).
6. Quality report is complete with tone consistency score, brand alignment score, platform compliance flags, and consistency notes.
7. Platform-specific performance notes are included for all 10 platforms, with expected metrics and optimization tips.
8. A user unfamiliar with the original product could review the variations and quality report, understand the brand positioning, and publish the variations immediately without additional editing (unless quality_report recommends regeneration).

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Product description is <50 characters or lacks key information (product name, core benefit, target audience) | **Abort** -- Request a more detailed description. Provide template: "Product name: [X]. Core benefit: [Y]. Target audience: [Z]. Unique selling point: [W]." |
| Phase 1 | Brand voice guidelines are contradictory (e.g., "casual" and "enterprise-formal") or unclear | **Adjust** -- Use default "Tone: professional yet approachable. Vocabulary: accessible. Values: clarity, efficiency, trust." Document assumption in metadata. |
| Phase 1 | Keyword focus contains >8 keywords | **Adjust** -- Prioritize top 8 keywords by relevance to product. Note in metadata that additional keywords were deprioritized. |
| Phase 2 | Twitter variation exceeds 280 characters | **Retry** -- Shorten by removing non-essential adjectives, articles, or hashtags. Prioritize core benefit. Recount and verify ≤280 chars. |
| Phase 2 | LinkedIn variation is <300 characters (too brief for platform) | **Adjust** -- Expand with supporting details, social proof, or thought leadership angle. Target 300-500 chars for optimal engagement. |
| Phase 2 | Facebook or Instagram variation lacks CTA when `include_ctas` is true | **Retry** -- Add explicit CTA (e.g., "Learn more", "Get started", "Tag a friend"). Recount characters. |
| Phase 3 | Email subject line exceeds 50 characters | **Retry** -- Remove articles (a, the), conjunctions (and, or), or weak adjectives. Use power words instead. Recount and verify ≤50 chars. |
| Phase 3 | Email subject line contains spam trigger words (FREE, ACT NOW, URGENT, etc.) | **Retry** -- Replace trigger words with benefit-focused language. Example: "FREE" → "No cost"; "ACT NOW" → "Start today". |
| Phase 3 | Landing page headline exceeds 12 words or is <8 words | **Retry** -- Condense to 8-12 words. If <8, add supporting detail. If >12, remove non-essential words. Recount and verify. |
| Phase 3 | Landing page subheadline exceeds 25 words or is <15 words | **Retry** -- Adjust to 15-25 words. If <15, add supporting detail or proof point. If >25, remove non-essential words. Recount and verify. |
| Phase 4 | App store description is <80 or >160 words | **Adjust** -- Trim or expand to 80-160 word range. Prioritize features and benefits over marketing fluff. Recount and verify. |
| Phase 4 | App store description contains keyword stuffing (>3% keyword density) | **Adjust** -- Remove or replace repeated keywords. Rewrite sentences to integrate keywords naturally. Recalculate keyword density and verify ≤3%. |
| Phase 4 | Keywords cannot be naturally integrated into app store or YouTube copy | **Adjust** -- Note in metadata that keyword integration was limited for specific keywords. Suggest alternative keywords that fit the product better. |
| Phase 4 | YouTube description is <150 or >300 words | **Adjust** -- Trim or expand to 150-300 word range. Ensure hook is in first 55 chars. Recount and verify. |
| Phase 5 | Tone consistency score is <75 | **Adjust** -- Review variations for brand voice drift. Identify which variations deviate (consistency_notes will flag them). Regenerate outlier variations using stricter brand voice enforcement. Re-score and verify ≥75. |
| Phase 5 | Brand alignment score is <75 | **Adjust** -- Review variations against provided brand guidelines. Identify which variations deviate from tone, vocabulary level, or key values. Regenerate outlier variations. Re-score and verify ≥75. |
| Phase 5 | Platform compliance flags are raised (e.g., Twitter exceeds 280 chars) | **Adjust** -- Fix flagged variations by shortening or expanding to meet platform constraints. Recount and re-validate. Clear platform_compliance_flags if all pass. |
| Phase 5 | More than 3 variations require regeneration (tone consistency or brand alignment <75) | **Adjust** -- Instead of regenerating individual variations, regenerate all variations from Phase 2-4 using stricter brand voice enforcement. Re-score and verify all dimensions ≥75. |

---

## Reference Section

### Platform Constraints & Best Practices

**Twitter:**
- Character limit: 280 (including spaces and hashtags)
- Tone: Casual, conversational, trending-aware
- Best practice: Lead with benefit or curiosity hook; include 2-3 hashtags
- Engagement driver: Urgency, humor, or relatability
- Optimal posting time: 9am-5pm weekdays
- Expected engagement rate: 2-4%

**LinkedIn:**
- Character limit: 1300 (soft limit; posts >300 chars show "see more")
- Tone: Professional, thought-leadership-focused, industry-aware
- Best practice: Open with a question or insight; include soft CTA; posts with questions get 2x more comments
- Engagement driver: Business value, credibility, industry trends
- Optimal posting time: Tuesday-Thursday, 8am-10am
- Expected engagement rate: 1-3%

**Email Subject Line:**
- Character limit: 40-50 (optimal for mobile preview)
- Tone: Curiosity-driven, benefit-focused, urgency-optional
- Best practice: Avoid spam trigger words ("FREE," "ACT NOW", "URGENT", "GUARANTEE", "RISK-FREE", "WINNER", "CASH", "CLICK HERE"); test personalization tokens (increase open rate by 26%)
- Engagement driver: Open rate; A/B test subject lines
- Expected open rate: 15-25% (industry average)

**Landing Page Hero:**
- Headline: 8-12 words, benefit-first, scannable
- Subheadline: 15-25 words, supporting detail or social proof
- CTA: 2-5 words, action-oriented ("Start Free Trial," "Get Started," "Learn More", "Request Demo")
- Tone: Confident, benefit-focused, conversion-optimized
- Engagement driver: Friction reduction; clear value proposition
- Expected conversion rate: 2-5% (industry average)
- Best practice: Reduce form fields to 3-5 for best conversion; test CTA button color and copy

**App Store:**
- Character limit: 80-160 words (varies by platform; iOS ~170 chars, Android ~80 words)
- Tone: Feature-rich, benefit-driven, keyword-optimized
- Best practice: Lead with core benefit; list 3-5 key features; include keywords naturally (target 2-3 keywords per 100 words); end with download incentive; avoid keyword stuffing (>3% keyword density)
- Engagement driver: Search ranking (keywords), download conversion (benefits + social proof)
- Expected download rate: Depends on ranking; keywords in first 30 words increase visibility 40%
- Best practice: Update description monthly for algorithm freshness

**Facebook:**
- Character limit: 100-200 chars (posts >200 chars show "see more")
- Tone: Conversational, community-focused, emoji-friendly
- Best practice: Ask a question or invite engagement; include CTA; video content gets 10x more engagement than static posts
- Engagement driver: Comments, shares, reactions
- Optimal posting frequency: 1-2 times daily
- Expected engagement rate: 1-3%

**Instagram:**
- Character limit: 125-150 chars (optimal for caption preview)
- Tone: Visual-first, personality-driven, hashtag-rich
- Best practice: Assume accompanying image; use emojis; include 5-10 hashtags; captions with emojis get 25% more engagement
- Engagement driver: Visual appeal + caption personality; hashtag reach
- Expected engagement rate: 1-5%

**YouTube Description:**
- Character limit: 150-300 words (first 55 chars visible before "show more")
- Tone: Informative, link-rich, searchable
- Best practice: Hook in first 55 chars; include timestamps (for videos >5 minutes), links, keywords; optimize for YouTube search
- Engagement driver: Click-through rate (links); search ranking (keywords)
- Expected click-through rate: 2-5%

**SMS:**
- Character limit: ≤160 characters (standard SMS length)
- Tone: Urgent, direct, benefit-focused
- Best practice: Lead with benefit or urgency; include direct CTA or link; avoid ALL CAPS
- Engagement driver: Click-through rate; conversion (immediacy)
- Expected click-through rate: 20-40% (highest engagement rate of all channels)

### Tone Consistency Scoring Rubric

- **Score 90-100:** All 10 variations reflect brand voice with minimal platform-specific drift. Consistent vocabulary, personality, and messaging. Any platform-specific adaptations are intentional and documented.
- **Score 75-89:** 8-9 of 10 variations reflect brand voice. 1-2 variations have minor tone drift justified by platform constraints (e.g., Twitter's character limit forces brevity).
- **Score 60-74:** 6-7 of 10 variations reflect brand voice. 3-4 variations have noticeable tone drift not fully justified by platform constraints.
- **Score <60:** Fewer than 6 variations reflect brand voice. Significant tone inconsistency across platforms. Recommend regenerating all variations with stricter brand voice enforcement.

### Brand Alignment Scoring Rubric

- **Score 90-100:** All 10 variations adhere to provided brand guidelines (tone, vocabulary level, key values). No contradictions or deviations.
- **Score 75-89:** 8-9 of 10 variations adhere to guidelines. 1-2 variations have minor deviations justified by platform constraints.
- **Score 60-74:** 6-7 of 10 variations adhere to guidelines. 3-4 variations deviate from guidelines without clear justification.
- **Score <60:** Fewer than 6 variations adhere to guidelines. Significant misalignment with brand guidelines. Recommend regenerating all variations with explicit brand voice enforcement.

### Keyword Integration Strategy

- **High-priority platforms:** App Store, YouTube (search-optimized; target 2-3 keywords per 100 words)
- **Medium-priority platforms:** LinkedIn, Facebook (algorithm-friendly; 1-2 keywords per 100 words)
- **Low-priority platforms:** Twitter, Instagram, SMS (character-constrained; keywords secondary; 0-1 keywords if space allows)
- **Best practice:** Integrate keywords naturally; avoid keyword stuffing (>3% keyword density). If a keyword cannot be naturally integrated, note this in metadata and suggest alternative keywords.

### Performance Benchmarks by Platform

| Platform | Expected Metric | Industry Benchmark | Optimization Tip |
|---|---|---|---|
| Twitter | Engagement rate | 2-4% | Post during peak hours (9am-5pm weekdays). Retweet rate increases 17% with hashtags. |
| LinkedIn | Engagement rate | 1-3% | Posts with questions get 2x more comments. Thought leadership content performs best on Tues-Thurs. |
| Email | Open rate | 15-25% | Personalization tokens increase open rate by 26%. A/B test subject lines. |
| Landing page | Conversion rate | 2-5% | Reduce form fields to 3-5 for best conversion. Test CTA button color and copy. |
| App store | Download rate | Depends on ranking | Keywords in first 30 words increase visibility 40%. Update description monthly. |
| Facebook | Engagement rate | 1-3% | Video content gets 10x more engagement than static posts. Post 1-2 times daily. |
| Instagram | Engagement rate | 1-5% | Posts with 5-10 hashtags get 2x more reach. Captions with emojis get 25% more engagement. |
| YouTube | Click-through rate | 2-5% | Hook viewers in first 5 seconds. Include timestamps for videos >5 minutes. |
| SMS | Click-through rate | 20-40% | SMS has highest engagement rate of all channels. Include clear CTA or link. Avoid ALL CAPS. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.