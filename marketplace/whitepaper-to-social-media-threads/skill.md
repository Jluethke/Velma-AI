# Whitepaper to Social Media Threads

**One-line description:** Convert a technical whitepaper into a series of engaging social media threads, each highlighting one key insight with a hook, supporting evidence, and a call to action.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `whitepaper_content` (string, required): The full text or markdown content of the whitepaper to be converted.
- `target_audience` (string, required): Description of the intended audience (e.g., "data scientists", "product managers", "C-suite executives").
- `platform` (string, optional, default: "Twitter/X"): Social media platform(s) for threads. Supported: "Twitter/X" (280 chars/tweet), "LinkedIn" (3000 chars/post), "Bluesky" (300 chars/post), or "multi-platform" (adapt for all three).
- `num_threads` (number, optional, default: 4): Number of key insights to extract and convert into threads (3-5 recommended).
- `tone` (string, optional, default: "professional-engaging"): Desired tone for threads. Options: "technical" (use domain terminology, assume expertise), "accessible" (explain concepts, use analogies), "provocative" (challenge assumptions, use contrarian takes), "professional-engaging" (balance authority with approachability).
- `campaign_goal` (string, optional, default: "awareness"): Primary goal of the thread campaign. Options: "awareness" (maximize reach and impressions), "lead_generation" (drive signups or downloads), "community_building" (encourage replies and discussion), "thought_leadership" (establish authority and credibility).
- `include_cta` (boolean, optional, default: true): Whether to include a call-to-action tweet in each thread.
- `include_visual_recommendations` (boolean, optional, default: false): Whether to generate visual asset recommendations (charts, diagrams, screenshots) for each thread.

---

## Outputs

- `threads` (object[], required): Array of thread objects, each containing:
  - `thread_id` (number): Sequential ID (1, 2, 3, ...)
  - `insight_title` (string): Title of the key insight
  - `insight_summary` (string): 1-2 sentence summary of the insight
  - `hook_tweet` (string): Opening tweet designed to attract engagement
  - `body_tweets` (string[]): Array of 3-7 body tweets developing the insight (length varies by complexity)
  - `cta_tweet` (string): Call-to-action tweet (if include_cta is true; null otherwise)
  - `hashtags` (string[]): 2-4 relevant hashtags
  - `thread_length` (number): Total number of tweets in the thread
  - `estimated_engagement_hooks` (string[]): Specific elements designed to drive engagement (e.g., "surprising statistic: X% of [audience] don't realize...", "contrarian take: conventional wisdom about X is wrong", "practical example: [company] applied this by...")
  - `visual_asset_recommendations` (object[], optional): If include_visual_recommendations is true, array of recommended visual assets with: asset_type ("chart", "diagram", "screenshot", "infographic"), description, suggested_placement ("hook", "body", "cta"), and rationale.
- `publishing_schedule` (object, required):
  - `total_threads` (number): Number of threads generated
  - `recommended_cadence` (string): Suggested posting frequency with justification (e.g., "one thread per day for 4 days, posting at 9 AM UTC to reach peak audience engagement")
  - `platform_notes` (string): Platform-specific adaptations and recommendations
  - `publishing_checklist` (string[]): Pre-publishing verification steps
- `quality_report` (object, required):
  - `accuracy_check` (string): Confirmation that threads accurately represent whitepaper content, with specific claims verified
  - `tone_consistency` (string): Assessment of tone consistency across threads with examples of consistent voice
  - `engagement_potential` (string): Qualitative assessment of engagement likelihood with specific engagement hooks identified
  - `revision_notes` (string[]): Any suggested revisions or improvements, each with specific tweet ID and recommended change

---

## Execution Phases

### PHASE 1: Analyze Whitepaper and Extract Key Insights

**Entry Criteria:**
- Whitepaper content is provided in full
- Target audience is defined
- Number of threads to create is specified

**Actions:**
1. Read the whitepaper end-to-end, identifying main arguments, supporting evidence, and novel claims. Document the whitepaper structure (sections, key findings, methodology).
2. Segment the whitepaper into logical sections (introduction, methodology, findings, implications, conclusion).
3. For each section, extract 1-2 candidate insights: claims that are novel, actionable, or surprising to the target audience. For each candidate, record: title, core claim, supporting evidence (data point, quote, or example), relevance score (1-10: how much does the target audience care?), and actionability score (1-10: can the audience do something with this?).
4. Rank candidate insights by: (relevance_score + actionability_score) / 2, with ties broken by novelty (how new is this idea compared to existing knowledge in the field?).
5. Select the top `num_threads` insights. For each, create a summary with: title, core claim, supporting evidence (minimum 1 data point or quote), relevance justification, and actionability justification.

**Output:**
- `extracted_insights` (object[]): Array of selected insights, each with: title, core claim, supporting evidence (array of data points, quotes, or examples), relevance_score (1-10), actionability_score (1-10), and justification for selection.

**Quality Gate:**
- At least `num_threads` distinct insights are extracted and ranked by combined relevance + actionability score.
- Each insight has at least one piece of supporting evidence (data point, quote, or example) directly from the whitepaper.
- Insights are ranked by measurable scores; top-ranked insights are selected.
- No insight is a generic statement (e.g., "the whitepaper is important"); all are specific, falsifiable claims.
- Relevance and actionability scores are justified with reference to the target audience and campaign goal.

---

### PHASE 2: Design Thread Structure for Each Insight

**Entry Criteria:**
- Key insights are extracted and ranked.
- Platform and tone are specified.

**Actions:**
1. For each insight, determine the optimal thread length based on complexity and platform:
   - **Simple insights (single data point or claim):** 3-4 tweets
   - **Moderate insights (2-3 supporting points):** 5-6 tweets
   - **Complex insights (multiple evidence points, implications):** 7-8 tweets
   - **Platform adjustments:** Twitter/X: use lower end of range (3-5 tweets); LinkedIn: use higher end (6-8 tweets); Bluesky: use Twitter/X guidelines (3-5 tweets)
2. Design the thread arc based on insight type:
   - **Data-driven insights:** Hook (surprising statistic) → Context (why this matters) → Evidence (additional data, trends) → Implication (what this means) → CTA
   - **Contrarian insights:** Hook (challenge assumption) → Context (why conventional wisdom is wrong) → Evidence (data/examples proving the point) → Implication (new way to think about it) → CTA
   - **Practical insights:** Hook (problem statement or question) → Context (why this problem matters) → Evidence (solution or best practice) → Example (real-world application) → CTA
3. Identify the strongest engagement hook for each insight by type:
   - **Data-driven:** Surprising statistic ("X% of [audience] don't realize..."), trend reversal ("What was true 5 years ago is no longer true"), or benchmark comparison ("[Company A] does X, but [Company B] does Y")
   - **Contrarian:** Challenge assumption ("Everything you know about X is wrong"), myth-busting ("The conventional wisdom about X is actually..."), or question that reveals gap ("Why do we assume X when evidence shows Y?")
   - **Practical:** Problem statement ("[Audience] struggles with X"), actionable insight ("Here's one thing you can do today to..."), or personal story ("I learned this the hard way when...")
4. Determine if the insight requires visual support: Does the insight involve complex data (recommend chart/graph), process or workflow (recommend diagram), or specific tool/interface (recommend screenshot)? Note visual asset type and placement.
5. Adapt tone and language for the target audience: For "technical" tone, use domain terminology and assume expertise; for "accessible" tone, explain concepts and use analogies; for "provocative" tone, use bold claims and challenge assumptions; for "professional-engaging" tone, balance authority with approachability.

**Output:**
- `thread_outlines` (object[]): Array of thread outlines, each with: insight_id, thread_length (number of tweets), arc_structure (ordered list of tweet purposes: hook, context, evidence, implication, cta), primary_engagement_hook (specific hook type and example), tone_notes (how to adapt language for target audience), and visual_support_recommendation (asset type and placement, or "none").

**Quality Gate:**
- Each thread has a clear arc from hook to CTA with 3-8 intermediate steps.
- The primary engagement hook is specific and testable (e.g., "surprising statistic: X% of [audience] don't realize Y" not just "interesting").
- Thread length is justified by complexity (simple insights get 3-4 tweets; complex insights get 7-8 tweets).
- Tone and language adaptations are specific to the target audience and campaign goal.
- Visual asset recommendations are specific (asset type, placement, and rationale).

---

### PHASE 3: Write Hook Tweets

**Entry Criteria:**
- Thread outlines are designed.
- Engagement hooks are identified.

**Actions:**
1. For each thread, write a hook tweet that embodies the primary engagement hook and fits the platform character limit:
   - **Twitter/X:** 280 characters max
   - **LinkedIn:** up to 3000 characters (but keep hook to 1-2 sentences for impact)
   - **Bluesky:** 300 characters max
   - **Multi-platform:** Write for the most restrictive platform (Twitter/X, 280 chars) and note if expansion is needed for LinkedIn
2. Hook tweets should create curiosity ("Did you know...", "New research shows..."), challenge assumptions ("Everything you know about X is wrong"), pose a question ("Why does X happen?"), or present a problem ("[Audience] struggles with X").
3. Avoid clickbait: the hook must accurately represent the insight and be verifiable by the whitepaper content. If the hook makes a claim, that claim must be explicitly supported in the whitepaper.
4. Include a thread indicator ("🧵" or "1/5") to signal a multi-tweet thread.
5. Test the hook for clarity using this rubric: (a) Can someone unfamiliar with the whitepaper understand what the thread is about? (b) Does the hook create curiosity or emotion? (c) Is the hook accurate and not misleading? If any answer is "no", revise.

**Output:**
- `hook_tweets` (string[]): Array of hook tweets, one per thread, indexed by thread ID.

**Quality Gate:**
- Each hook is under character limit for the platform (280 for Twitter/X, 300 for Bluesky, 3000 for LinkedIn).
- Each hook creates curiosity or engagement without misleading or overstating the insight.
- Each hook accurately represents the insight it introduces (verifiable against whitepaper).
- Hook is written in the specified tone (technical, accessible, provocative, or professional-engaging).
- Hook passes clarity test: unfamiliar reader understands topic, hook creates emotion/curiosity, hook is accurate.

---

### PHASE 4: Write Body Tweets

**Entry Criteria:**
- Hook tweets are written.
- Thread outlines specify the arc and supporting evidence.

**Actions:**
1. For each thread, write body tweets that develop the insight along the designed arc. Use the arc structure from Phase 2 (context, evidence, implication, etc.) as a guide, but adapt as needed for the specific insight type.
2. **Context tweet (typically tweet 2):** Explain why this insight matters. What problem does it address? Why should the audience care? Use language that connects to the audience's goals or pain points.
3. **Evidence tweets (typically tweets 3-5):** Present supporting data, quotes, examples, or reasoning. Use specific numbers ("X% of [audience]...", "In [year], [metric] increased by Y%"), real-world scenarios ("When [company] tried X, they saw Y result"), or expert quotes ("According to [expert], ..."). Avoid generic statements like "research shows" without specifics.
4. **Implication tweet (typically tweet 6):** What does this insight mean for the audience? How should they think differently or act differently? Connect the insight to the campaign goal (awareness: "This changes how we should think about X"; lead generation: "Here's how to apply this to your business"; community building: "What's your experience with this?"; thought leadership: "This is a key insight for [industry]").
5. **Ensure each tweet is self-contained** (readable without the others) but also flows naturally into the next. Use formatting (line breaks, bullet points, emojis) to improve readability within character limits.
6. **Avoid repetition:** No tweet repeats information from the hook or previous tweets. Each tweet adds new information or perspective.

**Output:**
- `body_tweets` (object[]): Array of thread objects, each containing: thread_id, array of body_tweets (3-7 per thread, depending on complexity).

**Quality Gate:**
- Each body tweet is under character limit for the platform (280 for Twitter/X, 300 for Bluesky, 3000 for LinkedIn).
- Body tweets collectively cover: context (why it matters), evidence (specific data/examples/quotes), and implication (what it means for the audience).
- Evidence is specific (numbers, quotes, examples, company names) not generic ("research shows", "studies indicate").
- Tweets flow logically from one to the next, with each tweet building on the previous one.
- No tweet repeats information from the hook or previous tweets; each adds new information.
- Tone is consistent with the hook and the specified tone (technical, accessible, provocative, professional-engaging).

---

### PHASE 5: Write Call-to-Action Tweets

**Entry Criteria:**
- Body tweets are written.
- Campaign goal is specified.
- `include_cta` is true.

**Actions:**
1. For each thread, write a CTA tweet that directs the audience to the next step based on the campaign goal:
   - **Awareness:** "Read the full whitepaper: [link]" or "Share this with your team if you found it valuable." or "Save this thread for later reference."
   - **Lead generation:** "Download the full report and get exclusive insights: [link]" or "Sign up for our newsletter to get more insights like this: [link]" or "Request a demo to see how this applies to your business: [link]"
   - **Community building:** "What's your take? Reply with your thoughts." or "Have you experienced this? Share your story in the replies." or "What's one thing you'd add to this insight?"
   - **Thought leadership:** "This changes how we should think about X. What are your implications?" or "What's your perspective on this trend?" or "This is a key insight for [industry]. How are you responding?"
2. CTAs should be specific and actionable, not vague. "Learn more" is weak; "Download the 15-page research summary" is strong. "Join the discussion" is weak; "Reply with your biggest challenge in [area]" is strong.
3. Include a link if applicable (whitepaper, landing page, discussion forum, newsletter signup). Verify that all links are valid and working.
4. Keep CTA tone consistent with the thread and the specified tone.
5. If `include_cta` is false, set cta_tweet to null.

**Output:**
- `cta_tweets` (string[]): Array of CTA tweets, one per thread, indexed by thread ID. If include_cta is false, array contains null values.

**Quality Gate:**
- Each CTA is specific and actionable (not vague like "learn more" or "get involved").
- CTA aligns with the stated campaign goal (awareness, lead generation, community building, or thought leadership).
- CTA includes a link or clear next step (if applicable).
- CTA tone matches the thread and the specified tone.
- All links are verified and working (or marked as "[link to be added]" if not yet available).

---

### PHASE 6: Add Hashtags and Formatting

**Entry Criteria:**
- All tweets (hook, body, CTA) are written.
- Platform is specified.

**Actions:**
1. For each thread, identify 2-4 relevant hashtags that:
   - Relate to the insight topic (e.g., #DataScience, #MachineLearning, #ProductManagement)
   - Target the audience (e.g., #Startups, #Enterprise, #Founders)
   - Are discoverable but not oversaturated. Use this heuristic: if a hashtag has >1M posts on the platform, it's oversaturated; if <10K posts, it may be too niche. Aim for 50K-500K posts.
   - Are specific to the insight, not generic (prefer #LLMs or #GenerativeAI over #AI)
2. Add hashtags to the final tweet (CTA) of each thread, or distribute across tweets if space allows. For Twitter/X, place hashtags at the end of the CTA tweet. For LinkedIn, hashtags can be on any tweet. For Bluesky, hashtags work like Twitter/X.
3. Add emoji accents to improve visual appeal and readability (use sparingly; 1-2 per thread). Emoji should relate to the insight topic (e.g., 📊 for data insights, 🚀 for growth insights, 💡 for ideas).
4. Add thread numbering (1/5, 2/5, etc.) to each tweet to signal it's part of a thread. Place numbering at the beginning or end of each tweet, consistently.
5. Ensure formatting is consistent across all threads (same emoji style, same numbering format, same hashtag placement, etc.).

**Output:**
- `formatted_threads` (object[]): Array of complete threads, each with: thread_id, hook_tweet (with numbering), body_tweets (with numbering), cta_tweet (with numbering and hashtags), hashtags (array), and emoji_accents (array).

**Quality Gate:**
- Hashtags are relevant to the insight topic and target audience.
- Hashtags are discoverable (50K-500K posts on platform) and not oversaturated (>1M posts).
- Hashtags do not exceed 4 per thread.
- Emoji use is consistent across threads (same style, same placement).
- Thread numbering (1/5, 2/5, etc.) is clear, consistent, and placed at the beginning or end of each tweet.
- All tweets remain under character limit for the platform after formatting.

---

### PHASE 7: Review for Accuracy, Tone, and Engagement

**Entry Criteria:**
- All threads are formatted and complete.

**Actions:**
1. **Accuracy check:** For each thread, verify that the tweets accurately represent the whitepaper content. For each claim in the tweets, check: (a) Is this claim explicitly stated in the whitepaper? (b) Is the claim supported by evidence (data, quotes, examples) in the whitepaper? (c) Is the claim overstated or misleading? If any claim fails these checks, flag it for revision.
2. **Tone consistency:** Review all threads for consistent tone. Do they all sound like they're from the same author/brand? Are they appropriate for the target audience? Use this rubric: (a) Does the thread use the specified tone (technical, accessible, provocative, professional-engaging)? (b) Is the voice consistent across all tweets in the thread? (c) Is the voice consistent across all threads? If any answer is "no", flag for revision.
3. **Engagement potential:** For each thread, assess the likelihood of engagement using this rubric:
   - Hook engagement: Does the hook create curiosity or emotion? (Yes/No)
   - Body engagement: Are the body tweets interesting and specific (not generic)? (Yes/No)
   - CTA engagement: Is the CTA clear and compelling? (Yes/No)
   - Overall engagement score: (# of "Yes" answers) / 3 × 100%. Threads scoring <66% (fewer than 2 "Yes" answers) are flagged for revision.
4. **Revision identification:** For each flagged tweet, document: (a) the specific issue (accuracy, tone, engagement), (b) the current text, (c) the recommended revision. Be specific: don't say "make it better"; say "replace 'research shows' with 'a 2024 study found that X% of [audience]...'".
5. **Final approval:** Confirm that all threads are ready for publishing (all accuracy checks pass, tone is consistent, engagement potential is high), or list revisions needed.

**Output:**
- `quality_report` (object):
  - `accuracy_check` (string): Summary of accuracy verification with specific claims verified (e.g., "All claims verified against whitepaper. Claim in thread 2, tweet 3 ('X% of [audience] don't realize Y') verified by page 12, figure 3. No overstatements detected.").
  - `tone_consistency` (string): Assessment of tone consistency with examples (e.g., "All threads maintain professional-engaging tone. Example: 'This changes how we think about X' (thread 1) and 'Here's how to apply this' (thread 2) both use accessible language with authority.").
  - `engagement_potential` (string): Qualitative assessment with engagement scores (e.g., "High engagement potential. Thread 1: hook engagement (Yes), body engagement (Yes), CTA engagement (Yes) = 100%. Thread 2: 66%. Thread 3: 100%.").
  - `revision_notes` (string[]): List of specific revisions needed, each with: thread_id, tweet_id, issue (accuracy/tone/engagement), current_text, recommended_revision. If no revisions needed, return empty array.
  - `approval_status` (string): "Approved for publishing" or "Requires revisions before publishing".

**Quality Gate:**
- All claims in threads are verified against the whitepaper and supported by evidence.
- Tone is consistent across all threads and appropriate for the target audience.
- Engagement potential is assessed for each thread using the rubric (hook, body, CTA).
- Revision notes are specific and actionable (not "make it better"; specific text replacements).
- Approval status is clear and justified.

---

### PHASE 8: Compile Publishing Package

**Entry Criteria:**
- All threads are approved for publishing.
- Quality report is complete.

**Actions:**
1. Organize all threads into a publishing package with:
   - **Thread list:** Thread ID, insight title, thread length (number of tweets), primary engagement hook, and approval status.
   - **Complete thread text:** All tweets in order, ready to copy-paste. Format: "[Thread ID]/[Total threads] [Tweet text] #hashtag1 #hashtag2"
   - **Hashtags and emoji accents:** Clearly marked and separated from tweet text.
   - **Visual asset recommendations:** If include_visual_recommendations is true, list recommended assets (type, description, placement, rationale).
2. Determine optimal posting cadence based on number of threads and audience engagement patterns:
   - **3-4 threads:** One thread per day for 3-4 days, posting at 9 AM UTC (adjust for audience timezone). Rationale: allows audience to engage with each thread before the next one is posted.
   - **5+ threads:** One thread per day for 5+ days, or one thread every other day. Rationale: prevents audience fatigue and allows time for engagement.
   - **Audience timezone adjustment:** If audience is primarily in a specific timezone (e.g., US Pacific), adjust posting time to 9 AM in that timezone.
   - **Platform peak hours:** Twitter/X peak engagement is 8-10 AM and 5-7 PM on weekdays. LinkedIn peak is 7-9 AM and 12-1 PM on weekdays. Schedule posts accordingly.
3. Add platform-specific notes:
   - **Twitter/X:** Mention any threads that would benefit from images/videos. Recommend engagement strategy (reply to comments, retweet replies, pin top-performing thread).
   - **LinkedIn:** Note any threads that could be expanded with longer-form commentary or personal story. Recommend tagging relevant companies or influencers.
   - **Bluesky:** Note any threads that should be adapted for Bluesky's audience (more technical, early-adopter focused).
   - **Multi-platform:** Identify which threads are best suited for each platform (e.g., technical threads for LinkedIn, provocative threads for Twitter/X).
4. Create a publishing checklist with verification steps:
   - [ ] All claims in threads are verified against the whitepaper.
   - [ ] All tweets are under character limit for the platform.
   - [ ] Tone is consistent across all threads.
   - [ ] Hashtags are relevant and discoverable (50K-500K posts).
   - [ ] All links are verified and working.
   - [ ] Thread numbering (1/5, 2/5, etc.) is clear and consistent.
   - [ ] Emoji use is consistent and enhances readability.
   - [ ] CTA is specific and actionable.
   - [ ] Each thread has a clear hook, body, and CTA.
   - [ ] Engagement potential is high for each thread (>66% on engagement rubric).

**Output:**
- `publishing_schedule` (object):
  - `total_threads` (number): Number of threads in the package.
  - `recommended_cadence` (string): Suggested posting frequency with justification (e.g., "One thread per day for 4 days, posting at 9 AM UTC. Rationale: allows audience to engage with each thread before the next one is posted. Adjust posting time to 9 AM [audience timezone] if needed.").
  - `platform_notes` (string): Platform-specific recommendations (e.g., "Twitter/X: Thread 1 would benefit from a chart showing the statistic. Recommend pinning top-performing thread. LinkedIn: Thread 3 could be expanded with a personal story about how this insight was discovered. Bluesky: All threads are suitable; audience is technical and early-adopter focused.").
  - `publishing_checklist` (string[]): Pre-publishing verification steps (checkbox format).

**Quality Gate:**
- Publishing package is organized and easy to navigate.
- Posting cadence is realistic and optimized for audience engagement (accounts for timezone, platform peak hours, and thread count).
- Platform-specific notes are actionable and specific (not generic).
- All links are verified and working (or marked as "[link to be added]" if not yet available).
- All tweets are under character limits.
- Publishing checklist is complete and all items are verified.

---

## Exit Criteria

The skill is DONE when:
1. All `num_threads` threads are written, formatted, and approved for publishing (approval_status = "Approved for publishing").
2. Each thread includes: hook tweet, 3-7 body tweets, CTA tweet (if include_cta is true), and 2-4 hashtags.
3. All tweets are verified for accuracy against the whitepaper (accuracy_check confirms all claims are supported).
4. Tone is consistent across all threads and appropriate for the target audience (tone_consistency confirms consistent voice).
5. Engagement potential is high for all threads (engagement_potential shows >66% engagement score for each thread).
6. A publishing schedule with recommended cadence and platform-specific notes is provided.
7. Quality report confirms all threads are ready for publishing (approval_status = "Approved for publishing").
8. A person unfamiliar with the whitepaper could read the threads and understand the key insights (verified by clarity test in Phase 3 and accuracy check in Phase 7).

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| PHASE 1 | Whitepaper has no clear key insights or is purely background material | **Adjust** -- Reframe the task: extract "interesting findings" or "implications for practitioners" instead of "novel insights". For each reframed insight, verify that it is still specific, falsifiable, and supported by evidence. Document the adjusted scope in the extracted_insights output. |
| PHASE 1 | Whitepaper is too technical for the target audience | **Adjust** -- Add a "translation" step: for each insight, write a technical version and a simplified version. Use the simplified version for threads. Include both versions in extracted_insights with a "translation_needed" flag. |
| PHASE 2 | Insight is too complex to fit into a 5-tweet thread | **Adjust** -- Split the insight into two related threads, or expand to 7-8 tweets. Document the decision in thread_outlines with a "split_insight" flag and cross-reference between the two threads. |
| PHASE 3 | Hook tweet is too vague or doesn't create engagement | **Retry** -- Rewrite the hook using a more specific engagement hook (surprising statistic, contrarian take, practical example). Test the revised hook against the clarity rubric (unfamiliar reader understands topic, hook creates emotion/curiosity, hook is accurate). |
| PHASE 4 | Body tweets lack supporting evidence or are generic | **Retry** -- Add specific data points, quotes, or real-world examples. Replace generic statements like "research shows" with specific claims like "A 2024 study found that X% of [audience]...". Verify that each evidence claim is supported by the whitepaper. |
| PHASE 5 | CTA is unclear or doesn't align with campaign goal | **Retry** -- Rewrite the CTA to be more specific and actionable. Verify alignment with campaign goal by checking: (a) Does the CTA direct the audience to the next step for this goal? (b) Is the CTA specific (not vague like "learn more")? (c) Does the CTA include a link or clear next step? |
| PHASE 7 | Accuracy check reveals claims that overstate or misrepresent the whitepaper | **Adjust** -- Revise the affected tweets to accurately reflect the whitepaper. If necessary, remove the insight and replace with a more defensible one from the extracted_insights list. Document the change in revision_notes. |
| PHASE 7 | Tone is inconsistent across threads | **Retry** -- Rewrite off-tone threads to match the established voice and style. Use the tone_consistency assessment to identify specific examples of inconsistency. Verify that the revised threads match the specified tone (technical, accessible, provocative, or professional-engaging). |
| PHASE 7 | Engagement potential is low for multiple threads (<66% on engagement rubric) | **Adjust** -- Prioritize the highest-engagement threads and remove lower-priority ones. Consider splitting the campaign into two publishing cycles (e.g., 3 high-engagement threads now, 2 lower-engagement threads later). Document the decision in the publishing_schedule. |
| PHASE 8 | Publishing package exceeds 10 threads | **Adjust** -- Prioritize the highest-engagement threads (based on engagement_potential scores) and remove lower-priority ones. Consider splitting into two publishing campaigns (e.g., "Campaign A: Top 5 insights" and "Campaign B: Supporting insights"). Document the decision in publishing_schedule. |

---

## Reference Section

### Domain Knowledge: Social Media Thread Best Practices

**Hook Design by Insight Type:**
- **Data-driven hooks:** "X% of [audience] don't realize...", "In [year], [metric] increased by Y%", "[Company A] does X, but [Company B] does Y"
- **Contrarian hooks:** "Everything you know about X is wrong", "The conventional wisdom about X is actually...", "Why do we assume X when evidence shows Y?"
- **Practical hooks:** "[Audience] struggles with X", "Here's one thing you can do today to...", "I learned this the hard way when..."

**Body Tweet Structure by Insight Type:**
- **Data-driven insights:** Context (why this matters) → Evidence (data, trends, benchmarks) → Implication (what this means) → CTA
- **Contrarian insights:** Context (why conventional wisdom is wrong) → Evidence (data/examples proving the point) → Implication (new way to think about it) → CTA
- **Practical insights:** Context (why this problem matters) → Evidence (solution or best practice) → Example (real-world application) → CTA

**Call-to-Action Alignment by Campaign Goal:**
- **Awareness:** "Read the full whitepaper: [link]" or "Share this with your team if you found it valuable."
- **Lead generation:** "Download the full report and get exclusive insights: [link]" or "Sign up for our newsletter: [link]"
- **Community building:** "What's your take? Reply with your thoughts." or "Have you experienced this? Share your story in the replies."
- **Thought leadership:** "This changes how we should think about X. What are your implications?" or "What's your perspective on this trend?"

**Hashtag Strategy:**
- Use 2-4 relevant hashtags per thread.
- Target topic hashtags (#DataScience, #MachineLearning) and audience hashtags (#ProductManagement, #Startups).
- Avoid oversaturated hashtags (>1M posts); prefer discoverable hashtags (50K-500K posts).
- Place hashtags in the final tweet (CTA) or distribute across tweets if space allows.

**Platform Specifications:**
- **Twitter/X:** 280 characters per tweet; threads are native. Peak engagement: 8-10 AM and 5-7 PM on weekdays.
- **LinkedIn:** Up to 3000 characters per post; threads are less common but effective for thought leadership. Peak engagement: 7-9 AM and 12-1 PM on weekdays.
- **Bluesky:** 300 characters per post; threads are supported. Similar to Twitter/X in audience and engagement patterns.

**Engagement Hooks (Specific Elements That Drive Engagement):**
- Surprising statistic: "X% of [audience] don't realize..."
- Contrarian take: "The conventional wisdom about X is wrong because..."
- Practical example: "Here's how [company/person] applied this insight..."
- Question that challenges assumptions: "Why do we assume X when the evidence shows Y?"
- Personal story or anecdote: "I learned this the hard way when..."
- Actionable insight: "Here's one thing you can do today to..."

**Visual Asset Recommendations:**
- **Charts/graphs:** Use for data-driven insights with multiple data points or trends. Placement: hook or body tweet 2-3.
- **Diagrams/flowcharts:** Use for process or workflow insights. Placement: body tweet 2-4.
- **Screenshots/examples:** Use for practical insights showing tool usage or real-world application. Placement: body tweet 3-5.
- **Infographics:** Use for complex insights with multiple components. Placement: hook or body tweet 2.

### Checklist: Pre-Publishing Verification

- [ ] All claims in threads are verified against the whitepaper.
- [ ] All tweets are under character limit for the platform (280 for Twitter/X, 300 for Bluesky, 3000 for LinkedIn).
- [ ] Tone is consistent across all threads and matches the specified tone (technical, accessible, provocative, professional-engaging).
- [ ] Hashtags are relevant and discoverable (50K-500K posts on platform).
- [ ] All links are verified and working.
- [ ] Thread numbering (1/5, 2/5, etc.) is clear and consistent.
- [ ] Emoji use is consistent and enhances readability.
- [ ] CTA is specific and actionable (not vague like "learn more").
- [ ] Each thread has a clear hook, body, and CTA.
- [ ] Engagement potential is high for each thread (>66% on engagement rubric: hook engagement + body engagement + CTA engagement).
- [ ] Visual assets are identified and ready (if include_visual_recommendations is true).
- [ ] Publishing cadence is realistic and optimized for audience engagement.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.