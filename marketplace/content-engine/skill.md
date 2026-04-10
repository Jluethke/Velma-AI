# Content Engine -- Multi-Platform Content Repurposing

Ingest source content, extract key themes via TF-IDF, generate platform-specific variations, validate against platform constraints, and produce a publishing schedule.

## Execution Pattern: Phase Pipeline

```
PHASE 1: INGEST        --> Read source content, identify key themes
PHASE 2: ANALYZE       --> TF-IDF extraction, sentence ranking, topic clustering
PHASE 3: GENERATE      --> Create variations per platform (YouTube, LinkedIn, Twitter, TikTok, Instagram)
PHASE 4: VALIDATE      --> Check platform constraints (char limits, emoji density, hooks)
PHASE 5: DISTRIBUTE    --> Format final output, generate publishing schedule
```

## Inputs

- **content**: string -- Long-form source content to repurpose
- **content_types**: list[string] -- Target platforms (youtube_shorts, linkedin_posts, twitter_threads, tiktok_hooks, instagram_captions)
- **tone**: string (optional) -- Content tone: "professional", "casual", "urgent", "curious" (default: "professional")
- **use_llm**: boolean (optional) -- Use LLM-powered repurposing (StreamShark) vs offline TF-IDF engine

## Outputs

- **repurposed_content**: dict[string, list[object]] -- Platform-keyed variations with text, char_count, compliant flag
- **metadata**: object -- Source word count, key sentences extracted, clusters identified
- **publishing_schedule**: object (optional) -- Optimized 30-day publishing cadence

## Execution

### Phase 1: INGEST -- Read Source Content
**Entry criteria:** Source content provided with at least 5 sentences (minimum for reliable TF-IDF).
**Actions:**
1. Read source content and compute basic statistics (word count, sentence count)
2. Split on sentence boundaries: `re.split(r'[.!?]+', content)`
3. Strip whitespace, remove empty strings
4. Filter sentences < 10 characters (noise)
5. Identify key themes from sentence content
6. If StreamShark mode: extract full narration from VideoScript, truncate to 3000 chars (token budget)
**Output:** Clean sentence list with statistics and theme identification.
**Quality gate:** At least 5 valid sentences extracted. Sentences are clean (no empty strings, no sub-10-char noise). For StreamShark: narration within 3000 char budget.

### Phase 2: ANALYZE -- TF-IDF Ranking & Clustering
**Entry criteria:** Clean sentence list with 5+ sentences.
**Actions:**
1. **TF-IDF Ranking:**
   - Tokenize: lowercase, split on word boundaries, drop tokens < 3 chars
   - Document frequency: count how many sentences contain each term
   - IDF: `log(num_sentences / doc_freq)` per term
   - Score per sentence: `sum(tf[term] * idf[term]) / num_tokens` (length-normalized)
   - Sort descending by score -- top sentences are the most information-dense
2. **Topic Clustering:**
   - Greedy keyword-overlap clustering
   - Extract top 3 keywords (tokens > 3 chars) from each sentence
   - Unassigned sentence starts a new cluster
   - Subsequent sentences with >= 1 keyword overlap join that cluster
   - Result: `{cluster_id: [sentences]}`
3. If StreamShark mode: use LLM for richer analysis instead of TF-IDF
**Output:** Ranked sentence list (by TF-IDF score) and topic clusters.
**Quality gate:** Sentences ranked with valid scores. Clusters formed with keyword overlap. With < 5 sentences, TF-IDF scores flagged as unreliable (IDF needs variation).

### Phase 3: GENERATE -- Create Platform Variations
**Entry criteria:** Ranked sentences and topic clusters available.
**Actions:**
1. For each target platform, pick top N sentences from ranked list (N = platform's max_sentences):
   | Platform | Max Chars | Max Sentences | Hook Required | Emoji Density |
   |---|---|---|---|---|
   | YouTube Shorts | 150 | 2 | Yes | High |
   | LinkedIn Posts | 300 | 3 | No | Medium |
   | Twitter Threads | 280 | 2 | No | Low |
   | TikTok Hooks | 100 | 1 | Yes | High |
   | Instagram Captions | 2200 | 5 | No | High |
2. Generate hooks based on tone:
   ```
   "professional" -> "Key insight: {first_sentence[:50]}..."
   "casual"       -> "Did you know? {first_sentence[:50]}..."
   "urgent"       -> "Warning: You need to know: {first_sentence[:40]}..."
   "curious"      -> "What if {first_sentence[:40]}...?"
   ```
3. Apply 5 different templates per platform (YouTube, LinkedIn, Twitter, TikTok, Instagram templates)
4. Truncate at word boundaries, never mid-word. Add ellipsis when truncated:
   ```python
   truncated = text[:max_chars]
   last_space = truncated.rfind(' ')
   if last_space > 0: truncated = truncated[:last_space]
   return truncated.rstrip() + '...'
   ```
5. Reserve ~20 chars for template overhead (emojis, hashtags)
6. If StreamShark LLM mode: generate richer formats (blog_post, twitter_thread, linkedin_article, email_newsletter, reddit_post) via Claude
**Output:** 5 variations per platform per tone = up to 25 content pieces from 1 source.
**Quality gate:** Each variation has text, char_count, and compliant flag. Truncation at word boundaries. Template overhead accounted for. Content multiplication formula applied: 1 source x 5 platforms x 5 variations = 25 pieces.

### Phase 4: VALIDATE -- Check Platform Constraints
**Entry criteria:** Variations generated for all target platforms.
**Actions:**
1. Check character limits per platform:
   - YouTube Shorts: <= 150 chars
   - LinkedIn Posts: <= 300 chars
   - Twitter Threads: each tweet <= 280 chars
   - TikTok Hooks: <= 100 chars
   - Instagram Captions: <= 2200 chars
2. Check emoji handling:
   - Python `len()` counts emojis as 1 char, but Twitter counts emojis as 2 characters
   - Budget accordingly for Twitter content
3. Check hook presence for platforms that require them (YouTube Shorts, TikTok)
4. Check emoji density matches platform expectations (high for YouTube/TikTok/Instagram, low for Twitter)
5. Mark each variation with `compliant: True/False`
6. For Reddit format: verify no clickbait, mention video only as supplement, end with question
7. For StreamShark LLM output: validate JSON parsing (find first `{` to last `}`)
**Output:** Validated variation list with compliance flags.
**Quality gate:** All compliant variations actually fit within platform limits. Non-compliant variations are flagged (not silently included). Twitter emoji char counting applied.

### Phase 5: DISTRIBUTE -- Format & Schedule
**Entry criteria:** Validated variations with compliance flags.
**Actions:**
1. Format final output per the contract:
   ```python
   {
       "success": True,
       "data": {
           "content_types_processed": N,
           "total_variations": N * 5,
           "repurposed_content": { "platform": [variations] },
           "metadata": { "source_words", "key_sentences_extracted", "clusters_identified" }
       }
   }
   ```
2. Filter to compliant-only variations for publishing
3. If StreamShark mode: save each format as individual JSON file in `output/repurposed/`
4. Generate publishing schedule (if schedule optimization enabled):
   - Analyze pillar performance from analytics
   - Generate optimized 30-day publishing schedule
   - Detect gaps and suggest fill content
5. If multi-platform distribution enabled:
   - Handle platform-specific requirements (shorts flag, etc.)
   - Return manifest with per-platform results
**Output:** Final formatted output with compliant variations, metadata, and optional publishing schedule.
**Quality gate:** Output matches the contract structure. Only compliant variations included in publishable set. Metadata accurately reflects processing stats.

## Exit Criteria

- Source content processed through TF-IDF pipeline (or LLM pipeline for StreamShark)
- Variations generated for all requested platforms
- All variations validated against platform constraints
- Compliant variations formatted for publishing
- Content multiplication achieved (1 source -> N platforms x 5 variations)
- Metadata includes source stats and processing details

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| INGEST | Source content too short (< 5 sentences) | **Adjust** -- proceed with warning that TF-IDF scores are unreliable |
| ANALYZE | All sentences score equally (no differentiation) | **Adjust** -- fall back to first-N selection instead of TF-IDF ranking |
| GENERATE | Template fills exceed platform limits | **Retry** -- reduce content portion, increase template overhead budget |
| VALIDATE | All variations non-compliant for a platform | **Adjust** -- regenerate with shorter content, simpler templates |
| DISTRIBUTE | StreamShark LLM returns invalid JSON | **Retry** -- re-prompt with explicit "Return ONLY valid JSON, no markdown wrapping" (max 2 retries) |
| DISTRIBUTE | Topic bank depleted (StreamShark) | **Adjust** -- regenerate topic bank from content pillars |
| ACT | User rejects final output | **Targeted revision** -- ask which platform or variation format fell short and rerun only that section. Do not regenerate all 25 pieces. |

## State Persistence

- TF-IDF vocabulary (for consistent scoring across runs)
- Topic bank (StreamShark -- topics available for scripting)
- Publishing schedule history (for gap detection)
- Analytics data (for schedule optimization)
- A/B test experiments (CTR comparisons, lift percentages)

## Reference

### Content Multiplication Formula

```
1 source piece x 5 platforms x 5 variations = 25 content pieces
```

### StreamShark Video Pipeline (5-Phase)

```
Research -> Script -> Produce -> Upload -> Track
```

1. **Research**: TopicEngine generates ideas across content pillars
2. **Script**: ScriptWriter produces VideoScript with segments and YouTube metadata
3. **Produce**: TTS audio + slide generation + video assembly
4. **Upload**: YouTube upload (default private) + analytics tracker registration
5. **Track**: AnalyticsTracker + AnalyticsFeedbackLoop for performance metrics

### StreamShark LLM Repurposing Formats

- `blog_post` -- 800-1200 words, H1/H2 structure, SEO meta, reading time
- `twitter_thread` -- 7-12 tweets, each under 280, numbered, hook first, CTA last
- `linkedin_article` -- 600-800 words, thought-leadership, 3-5 takeaways
- `email_newsletter` -- Subject (50 chars), preview (90 chars), 3-5 insights, P.S., CTA
- `reddit_post` -- Discussion-oriented, not promotional, suggest subreddit, end with question

### Advanced Features

- **Resonance Scoring**: PRIN-based content scoring, topics gated by resonance_threshold
- **A/B Testing**: ABTestManager creates experiments from SEO metadata variants
- **Competitor Intelligence**: CompetitorIntel scans and recommends from competitor analysis
- **Schedule Optimization**: 30-day optimized schedule with gap detection
- **Multi-Platform Distribution**: Platform-specific requirements handling with results manifest

### Common Pitfalls

1. Truncate content BEFORE template fill -- reserve ~20 chars for template chrome
2. TF-IDF unreliable with < 5 sentences -- IDF needs document frequency variation
3. StreamShark caps narration at 3000 chars -- long scripts silently truncated
4. `script()` removes topic from bank -- bank needs periodic regeneration
5. LLM JSON extraction uses first `{` to last `}` -- prompt must say "Return ONLY valid JSON"
6. Offline engine includes non-compliant variations -- always check `compliant` flag
7. Emojis are multi-byte: Twitter counts emojis as 2 chars
8. Reddit format must avoid clickbait -- posts get removed by moderators
