# SEO Content Auditor

**One-line description:** Analyze a blog post draft for SEO optimization across keyword density, meta descriptions, header structure, image alt-text, internal and external linking, URL slug, schema markup, readability, and content freshness.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `blog_post_content` (string, required): Full text content of the blog post draft to analyze.
- `blog_post_url` (string, optional): The URL slug or full URL of the blog post for URL audit.
- `target_keywords` (array of strings, optional): Primary and secondary keywords to optimize for. If not provided, keywords will be inferred from content.
- `meta_description` (string, optional): Existing meta description, if any. If absent, audit will flag as missing.
- `existing_internal_links` (array of objects, optional): Current internal links in format `{anchor_text, target_url}`. Defaults to empty array.
- `site_content_inventory` (array of strings, optional): List of available internal pages/URLs for linking recommendations.
- `existing_external_links` (array of objects, optional): Current external links in format `{anchor_text, target_url, domain_authority}`. Defaults to empty array.
- `target_audience_level` (string, optional): Reading level expectation (e.g., "general", "technical", "academic"). Defaults to "general".
- `publish_date` (string, optional): ISO 8601 format (YYYY-MM-DD). Used to flag content freshness issues.
- `last_updated_date` (string, optional): ISO 8601 format (YYYY-MM-DD). Used to assess content recency.
- `competitor_urls` (array of strings, optional): URLs of top-ranking competitors for benchmarking keyword density and header structure.
- `previous_audit_result` (object, optional): Result object from prior audit of this post. Used to generate improvement comparison.

---

## Outputs

- `keyword_analysis` (object): Keyword frequency map, primary keyword, secondary keywords, density percentages, density assessment, competitive benchmark (if competitor data provided).
- `url_slug_audit` (object): URL structure analysis, keyword inclusion, length assessment, format recommendations.
- `meta_description_audit` (object): Presence status, length (characters), keyword inclusion, recommendations.
- `header_structure_audit` (object): H1/H2/H3 count, hierarchy assessment, keyword placement, structural issues.
- `image_alt_text_audit` (object): Image count, alt-text coverage percentage, keyword inclusion in alt-text, missing alt-text list, recommendations.
- `internal_linking_audit` (object): Current link count, recommendations (anchor text + target), opportunity count, distribution assessment.
- `external_linking_audit` (object): Current external link count, domain authority assessment, relevance evaluation, recommendations.
- `schema_markup_audit` (object): Schema presence status, markup type detected, validation results, recommendations for implementation.
- `readability_metrics` (object): Flesch-Kincaid grade level, average sentence length, average word length, overall readability score, specific rewrite suggestions for long/complex sentences.
- `content_freshness_audit` (object): Publication age, last update age, freshness assessment, refresh recommendations (if applicable).
- `seo_audit_report` (object): Comprehensive findings with critical/important/nice-to-have recommendations, overall SEO score (0-100), improvement comparison (if previous audit provided).

---

## Execution Phases

### Phase 1: Keyword Analysis

**Entry Criteria:**
- Blog post content is provided and contains minimum 100 words.
- Target keywords are provided OR workflow will infer them from content frequency.

**Actions:**
1. Tokenize blog post content into words (remove stop words, normalize case).
2. If target keywords provided: count occurrences of each keyword and variants in content.
3. If target keywords not provided: identify top 5-10 most frequent meaningful terms as inferred keywords.
4. Calculate keyword frequency map: {keyword: count, frequency_percentage}.
5. Designate highest-priority keyword as primary; others as secondary.
6. Calculate density percentage for each keyword: (keyword_count / total_word_count) × 100.
7. If competitor_urls provided: fetch and analyze competitor content density for same keywords; record benchmark values.
8. Output keyword analysis object with density assessment (optimal if 1-3% for primary, 0.5-1.5% for secondary; too-high if >3%; too-low if <0.5%).

**Output:**
- Keyword frequency map (dict: keyword → count)
- Primary keyword (string)
- Secondary keywords (array of strings)
- Keyword density percentages (dict: keyword → density %)
- Competitive benchmark (dict: keyword → competitor_average_density, if competitor data provided)
- Density assessment (string: "optimal", "too-high", "too-low")

**Quality Gate:**
- Primary keyword identified and density calculated.
- All density values are numeric, between 0-5%, and sum to ≤10% combined.
- If competitor data provided, benchmark values are present and comparable.

---

### Phase 2: URL Slug and Meta Description Audit

**Entry Criteria:**
- Blog post URL (if provided) available for slug analysis.
- Blog post content available.
- Meta description (if present) provided in input.

**Actions:**
1. If blog_post_url provided: extract URL slug (path component after domain).
2. Analyze slug for: (a) primary keyword inclusion, (b) length (optimal: 3-5 words, <75 characters), (c) format (hyphens vs underscores; hyphens preferred), (d) readability (no numbers, dates, or special characters unless necessary).
3. Generate URL slug recommendations if issues found.
4. Check if meta description is present in input.
5. If present: measure character count (target: 150-160 characters for full display in search results).
6. Check if primary keyword appears naturally in meta description.
7. Assess clarity, call-to-action presence, and uniqueness.
8. If missing: flag as critical issue and generate recommended meta description (include primary keyword, value proposition, CTA).
9. Generate recommendations for improvement or creation.

**Output:**
- URL slug audit object: {slug_present: boolean, slug_value: string, keyword_included: boolean, length_assessment: string, format_assessment: string, recommendations: array}
- Meta description audit object: {present: boolean, character_count: number, keyword_included: boolean, issues: array, recommendations: array}

**Quality Gate:**
- URL slug status (present/absent) is clear; if present, all assessments are specific (e.g., "keyword included", "length 45 characters, optimal").
- Meta description status (present/missing) is clear.
- If present, character count is accurate (verified by character count algorithm).
- Recommendations are actionable and specific (e.g., "Add primary keyword 'SEO audit' to slug", "Expand meta description to 155 characters").

---

### Phase 3: Header Structure Analysis

**Entry Criteria:**
- Blog post content with header markup (H1, H2, H3 tags) is provided.

**Actions:**
1. Parse content and extract all headers with their levels and text content.
2. Count H1, H2, H3 occurrences.
3. Verify hierarchy: H1 should appear exactly once at top; H2s should follow H1; H3s should follow H2s; no level skipping (e.g., H1 → H3 is invalid).
4. Check if primary keyword appears in H1 or first H2.
5. Check if secondary keywords appear in H2 or H3 headers.
6. Assess logical flow and readability of header structure.
7. Identify missing headers or structural gaps (e.g., long sections without subheaders).
8. If competitor_urls provided: compare header structure (count, keyword placement) against competitors.
9. Generate recommendations for header optimization.

**Output:**
- Header structure audit object: {h1_count: number, h2_count: number, h3_count: number, hierarchy_valid: boolean, hierarchy_issues: array, primary_keyword_in_headers: boolean, secondary_keywords_in_headers: boolean, header_list: array of {level, text, keyword_match}, competitive_benchmark: object (if competitor data provided), issues: array, recommendations: array}

**Quality Gate:**
- Header counts are accurate (verified by parsing algorithm).
- Hierarchy assessment is clear and specific: valid ("H1 present, H2s follow H1, no skipping") or invalid with specific issues listed (e.g., "Multiple H1s detected", "H3 appears before H2").
- Keyword placement in headers is identified with specific header text.
- If competitor data provided, benchmark shows competitor header count and keyword placement.

---

### Phase 3.5: Image Alt-Text Audit

**Entry Criteria:**
- Blog post content with image tags (img elements with src and alt attributes) is provided.

**Actions:**
1. Parse content and extract all image elements.
2. Count total images in blog post.
3. For each image: check if alt attribute is present and non-empty.
4. Calculate alt-text coverage percentage: (images_with_alt / total_images) × 100.
5. For images with alt-text: check if primary or secondary keywords appear naturally in alt-text.
6. Assess alt-text quality: is it descriptive (>5 characters), specific to image content, and keyword-relevant without stuffing?
7. Identify images missing alt-text or with low-quality alt-text (e.g., "image", "photo", generic filenames).
8. Generate specific alt-text recommendations for each image (include keyword if relevant, describe image content).
9. Output list of missing alt-text images with suggested replacements.

**Output:**
- Image alt-text audit object: {total_images: number, images_with_alt: number, alt_text_coverage_percentage: number, keyword_in_alt_text_count: number, missing_alt_text: array of {image_src, suggested_alt_text}, low_quality_alt_text: array of {image_src, current_alt_text, suggested_alt_text}, recommendations: array}

**Quality Gate:**
- Image count is accurate.
- Alt-text coverage percentage is numeric, between 0-100%.
- All missing alt-text images are listed with specific, keyword-relevant suggestions.
- All low-quality alt-text items are identified with current and suggested versions.
- Recommendations are actionable (e.g., "Add alt-text 'SEO audit checklist screenshot' to image at /images/audit-checklist.png").

---

### Phase 4: Internal Linking Audit

**Entry Criteria:**
- Blog post content is available.
- Existing internal links (if any) provided in input.
- Site content inventory (optional) provided for recommendations.

**Actions:**
1. Count existing internal links in blog post.
2. For each internal link: assess anchor text quality (is it descriptive, keyword-relevant, and >3 characters? Avoid "click here", "read more", "link").
3. Identify 2-4 opportunities for additional internal links based on content context and keyword relevance.
4. If site inventory provided: suggest specific target URLs and anchor text for each opportunity.
5. If inventory not provided: suggest anchor text patterns and link placement context.
6. Evaluate link distribution: are links spread throughout content (ideal) or clustered at top/bottom (suboptimal)?
7. Calculate optimal link count based on word count: 2-4 links per 1000 words.
8. Generate recommendations for new internal links with specific anchor text and placement.

**Output:**
- Internal linking audit object: {current_link_count: number, optimal_link_count_range: string, anchor_text_quality: string, distribution_assessment: string, opportunities: array of {suggested_anchor_text, suggested_target_url, context, placement}, recommendations: array}

**Quality Gate:**
- Current link count is accurate (verified by parsing algorithm).
- Optimal link count range is calculated and specific (e.g., "2-4 links for 1500-word post").
- Anchor text quality assessment is specific (e.g., "3 of 5 links use descriptive anchor text; 2 use generic 'click here'").
- Opportunities are specific and contextually relevant with exact anchor text and target guidance.
- Recommendations include anchor text and target guidance; if site inventory provided, specific URLs are suggested.

---

### Phase 4.5: External Linking Audit

**Entry Criteria:**
- Blog post content is available.
- Existing external links (if any) provided in input.

**Actions:**
1. Count existing external links in blog post.
2. For each external link: assess (a) target domain authority (if domain_authority provided in input), (b) relevance to content topic, (c) anchor text quality.
3. Identify links to low-authority domains (<20 DA) or irrelevant sites; flag as potential issues.
4. Assess link distribution: are external links spread throughout or clustered?
5. Evaluate whether external links point to authoritative, trustworthy sources (e.g., .edu, .gov, established publications).
6. Generate recommendations: (a) replace low-authority links with high-authority alternatives, (b) add 1-2 links to authoritative sources if none present, (c) improve anchor text if generic.
7. Calculate external link count and assess whether it's appropriate for post length (typically 1-3 external links per 1000 words).

**Output:**
- External linking audit object: {current_external_link_count: number, optimal_external_link_count_range: string, authority_assessment: string, relevance_assessment: string, low_authority_links: array of {url, domain_authority, suggested_replacement}, recommendations: array}

**Quality Gate:**
- External link count is accurate.
- Optimal external link count range is calculated and specific.
- Authority assessment is specific (e.g., "2 of 3 links point to high-authority domains (DA >50)").
- Relevance assessment is specific (e.g., "All external links are topically relevant to SEO content audit").
- Low-authority links are identified with specific DA scores and replacement suggestions.
- Recommendations are actionable (e.g., "Replace link to example.com (DA 15) with link to moz.com (DA 92) for keyword 'SEO best practices'").

---

### Phase 5: Readability Analysis

**Entry Criteria:**
- Blog post content is provided and contains minimum 100 words.
- Target audience level is provided or defaults to "general".

**Actions:**
1. Calculate total word count, sentence count, and syllable count.
2. Calculate average sentence length: total_words / number_of_sentences.
3. Calculate average word length: total_characters / total_words.
4. Apply Flesch-Kincaid Grade Level formula: 0.39 × (words/sentences) + 11.8 × (syllables/words) − 15.59.
5. Convert grade level to readability score (0-100 scale): score = 206.835 − 1.015 × (words/sentences) − 84.6 × (syllables/words). Clamp to 0-100 range.
6. Compare against target audience level expectations: general (60-70), technical (50-60), academic (40-50).
7. Identify sentences that exceed length thresholds (>20 words) or use complex vocabulary (>3 syllables per word).
8. For each problematic sentence, generate a specific rewrite suggestion that maintains meaning but improves clarity.
9. Identify paragraphs that are too dense (>5 sentences) and suggest breaking into multiple paragraphs.
10. Generate recommendations for improving readability.

**Output:**
- Readability metrics object: {flesch_kincaid_grade: number, avg_sentence_length: number, avg_word_length: number, readability_score: number (0-100), assessment: string, target_audience_match: boolean, long_sentences: array of {sentence_text, word_count, suggested_rewrite}, complex_vocabulary: array of {word, syllable_count, suggested_simpler_word}, dense_paragraphs: array of {paragraph_text, sentence_count, break_suggestion}, recommendations: array}

**Quality Gate:**
- All metrics are numeric and within specified ranges: Flesch-Kincaid 0-18, readability score 0-100, avg sentence length 5-30 words, avg word length 3-7 characters.
- Readability score matches target audience expectation (within ±5 points of target range).
- All long sentences (>20 words) are identified with specific rewrites.
- All complex vocabulary items are identified with simpler alternatives.
- All dense paragraphs are identified with break suggestions.
- Recommendations are actionable and specific (e.g., "Rewrite 'The implementation of SEO best practices necessitates comprehensive keyword research' as 'To implement SEO best practices, start with keyword research'").

---

### Phase 6: Schema Markup Validation

**Entry Criteria:**
- Blog post content with potential schema markup (JSON-LD, microdata, RDFa) is provided.

**Actions:**
1. Parse content for structured data markup (JSON-LD, microdata, RDFa).
2. If schema markup present: identify markup type (Article, BlogPosting, NewsArticle, FAQ, HowTo, etc.).
3. Validate markup against schema.org specifications for the detected type.
4. Check for required properties: headline, description, datePublished, author, image (for Article/BlogPosting).
5. Check for recommended properties: dateModified, articleBody, keywords.
6. If markup missing: recommend appropriate schema type based on content (Article for blog posts, FAQ for Q&A sections, HowTo for instructional content).
7. Generate specific schema markup recommendations (JSON-LD format preferred).
8. Assess whether markup would enable rich snippets in search results.

**Output:**
- Schema markup audit object: {markup_present: boolean, markup_type: string (if present), validation_status: string, missing_required_properties: array, missing_recommended_properties: array, rich_snippet_eligible: boolean, recommendations: array, suggested_markup: string (JSON-LD template if markup missing)}

**Quality Gate:**
- Markup presence status (present/absent) is clear.
- If present, markup type is identified and validation results are specific (e.g., "BlogPosting markup valid; missing dateModified property").
- If absent, recommended markup type is specific based on content analysis.
- All missing properties are listed with specific values to add.
- Rich snippet eligibility is assessed (true/false with reason).
- Recommendations include specific JSON-LD template or property additions.

---

### Phase 7: Content Freshness Assessment

**Entry Criteria:**
- Blog post content is provided.
- Publish date and/or last updated date provided (optional).

**Actions:**
1. If publish_date provided: calculate publication age in days from today.
2. If last_updated_date provided: calculate days since last update.
3. Assess freshness: content <6 months old is "fresh", 6-12 months is "aging", >12 months is "stale".
4. If content is stale (>12 months): flag as issue and recommend refresh.
5. Check content for time-sensitive information (e.g., "2024 trends", "current best practices") that may be outdated.
6. Generate recommendations: (a) update last_modified date if minor edits made, (b) comprehensive refresh if major changes needed, (c) add "last updated" date to post for transparency.
7. If content is fresh and regularly updated, note as positive signal.

**Output:**
- Content freshness audit object: {publish_date: string, publication_age_days: number, last_updated_date: string, days_since_update: number, freshness_assessment: string, time_sensitive_content_detected: boolean, recommendations: array}

**Quality Gate:**
- Freshness assessment is specific ("fresh", "aging", "stale") with age threshold clearly stated.
- If dates provided, age calculations are accurate (verified by date math).
- Time-sensitive content is identified with specific examples (e.g., "'2024 SEO trends' section may be outdated").
- Recommendations are actionable (e.g., "Update 'latest algorithm changes' section; add 'Last updated: 2025-01-15' to post header").

---

### Phase 8: Comprehensive SEO Report Compilation

**Entry Criteria:**
- All audit phases (1-7) are complete and outputs available.

**Actions:**
1. Aggregate all findings from keyword, URL, meta, header, image, internal link, external link, readability, schema, and freshness audits.
2. Categorize issues as: Critical (blocks SEO or accessibility), Important (should fix before publishing), Nice-to-Have (optimization).
3. Assign priority scores to recommendations based on SEO impact and effort required.
4. Calculate overall SEO score (0-100) based on weighted audit results:
   - Keyword optimization: 20%
   - URL slug optimization: 5%
   - Meta description: 10%
   - Header structure: 15%
   - Image alt-text: 10%
   - Internal linking: 15%
   - External linking: 5%
   - Schema markup: 5%
   - Readability: 10%
   - Content freshness: 5%
5. For each category, calculate sub-score (0-100) based on audit findings; multiply by weight to get contribution to overall score.
6. Compile executive summary with top 3 action items (highest impact, lowest effort).
7. If previous_audit_result provided: calculate improvement comparison (delta for each metric, percentage improvement).
8. Generate full report with all findings, recommendations, and improvement tracking.

**Output:**
- SEO audit report object: {overall_seo_score: number (0-100), score_breakdown: object (category → sub_score), summary: string, critical_issues: array of {issue, impact, recommendation}, important_issues: array of {issue, impact, recommendation}, nice_to_have: array of {issue, impact, recommendation}, top_3_actions: array of {action, expected_impact, effort_level}, full_findings: object (all audit results), improvement_comparison: object (if previous audit provided, showing deltas), publication_readiness: string ("Ready to publish", "Address critical issues", "Significant optimization needed")}

**Quality Gate:**
- Overall SEO score is numeric (0-100) and calculated from weighted sub-scores.
- All issues are categorized (critical/important/nice-to-have) with specific impact statements.
- Top 3 actions are specific and actionable (e.g., "Add alt-text to 5 images missing descriptions (5 min effort, +5 SEO points)").
- Report references all audit phases and integrates findings coherently.
- If previous audit provided, improvement comparison shows specific metric deltas (e.g., "Keyword density improved from 1.8% to 2.1%", "Alt-text coverage improved from 40% to 100%").
- Publication readiness is clear and specific (e.g., "Ready to publish after addressing 2 critical issues: add H1 header and meta description").

---

## Exit Criteria

The skill is complete when:
1. All eight phases have executed successfully.
2. Keyword analysis identifies primary and secondary keywords with density calculations and competitive benchmark (if applicable).
3. URL slug audit confirms presence/absence and provides specific recommendations.
4. Meta description audit confirms presence/absence and provides recommendations.
5. Header structure audit validates hierarchy and keyword placement with competitive benchmark (if applicable).
6. Image alt-text audit identifies coverage percentage and provides specific alt-text suggestions for missing/low-quality items.
7. Internal linking audit identifies current links and 2-4 new opportunities with specific anchor text and target guidance.
8. External linking audit assesses authority and relevance with specific replacement suggestions for low-authority links.
9. Readability metrics are calculated with specific rewrite suggestions for long/complex sentences and dense paragraphs.
10. Schema markup audit validates presence and recommends appropriate markup type with JSON-LD template.
11. Content freshness audit assesses publication age and recommends refresh if stale.
12. Comprehensive SEO report is generated with overall score (0-100), prioritized recommendations, top 3 actions, and publication readiness assessment.
13. If previous audit provided, improvement comparison shows metric deltas and percentage improvements.
14. All outputs are populated and ready for user review.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Blog post content is empty or too short (<100 words) | **Abort** -- request minimum 100-word draft for meaningful analysis |
| Phase 1 | Target keywords provided but none found in content | **Adjust** -- flag as critical issue; recommend keyword integration; continue with inferred keywords |
| Phase 2 | Meta description not provided in input | **Adjust** -- mark as missing; generate recommended meta description in output |
| Phase 2 | Blog post URL not provided | **Adjust** -- mark URL slug audit as skipped; note that manual URL review needed |
| Phase 3 | No headers detected in content | **Adjust** -- flag as critical structural issue; recommend adding H1 and H2 headers; continue with other phases |
| Phase 3.5 | No images detected in content | **Adjust** -- mark image audit as N/A; note that post contains no images |
| Phase 4 | Site content inventory not provided | **Adjust** -- provide generic linking recommendations without specific URLs; note that manual review needed for target selection |
| Phase 4.5 | No external links detected in content | **Adjust** -- mark external linking audit as N/A; recommend adding 1-2 authoritative external links |
| Phase 5 | Content too short to calculate reliable readability metrics | **Adjust** -- note limitation; provide metrics with caveat; recommend expanding content to 300+ words for reliable analysis |
| Phase 6 | No schema markup detected | **Adjust** -- mark as missing; recommend appropriate schema type and provide JSON-LD template |
| Phase 7 | Publish date not provided | **Adjust** -- mark freshness audit as incomplete; note that manual date review needed |
| Phase 8 | Conflicting recommendations from different audits | **Adjust** -- prioritize by SEO impact score (keyword optimization > header structure > readability); if tied, prioritize user experience; document decision logic in report |
| Phase 8 | Previous audit result provided but metrics incompatible | **Adjust** -- note incompatibility; skip improvement comparison; generate standard report without delta analysis |

---

## Reference Section: SEO Optimization Criteria

### Keyword Density Guidelines
- Primary keyword: 1-3% of total word count (optimal: 1.5-2%)
- Secondary keywords: 0.5-1.5% each
- Avoid keyword stuffing (>3% = penalty risk)
- Natural language integration is critical
- Keyword variants and synonyms count toward density

### URL Slug Best Practices
- Include primary keyword naturally
- Length: 3-5 words, <75 characters
- Format: lowercase, hyphens between words (not underscores)
- Avoid numbers, dates, special characters unless necessary
- Readable and descriptive (e.g., "seo-content-audit-guide" not "post-123")
- Consistent with site URL structure

### Meta Description Best Practices
- Length: 150-160 characters (displays fully in search results)
- Include primary keyword naturally (once)
- Include call-to-action or value proposition
- Unique per page (no duplicates)
- Compelling and click-worthy language
- Avoid keyword stuffing or misleading claims

### Header Structure Standards
- Exactly one H1 per page (typically the post title)
- H2s organize main sections (2-4 recommended for 1000-word post)
- H3s organize subsections under H2s
- Headers should be descriptive and keyword-relevant
- Logical hierarchy: H1 → H2 → H3 (no skipping levels)
- Headers should be unique and not duplicate meta description

### Image Alt-Text Best Practices
- Alt-text present for all images (100% coverage)
- Descriptive and specific to image content (>5 characters)
- Include primary keyword naturally if relevant (avoid stuffing)
- Avoid "image", "photo", or generic filenames
- Format: "[keyword] [description]" (e.g., "SEO audit checklist screenshot")
- Concise: 8-125 characters optimal

### Internal Linking Best Practices
- 2-4 internal links per 1000 words of content
- Anchor text should be descriptive (avoid "click here", "read more", "link")
- Link to relevant, high-authority internal pages
- Distribute links throughout content (not all at top/bottom)
- Use keyword-rich anchor text when relevant (but natural)
- Link to pages that support user journey and topic depth

### External Linking Best Practices
- 1-3 external links per 1000 words of content
- Link to authoritative, trustworthy sources (DA >40 preferred)
- Relevance to content topic is critical
- Anchor text should be descriptive and relevant
- Open external links in new tab (target="_blank")
- Avoid linking to competitor pages or low-quality sites
- Use nofollow attribute for affiliate or sponsored links

### Schema Markup Best Practices
- Use JSON-LD format (preferred over microdata or RDFa)
- Article/BlogPosting schema for blog posts
- Include required properties: headline, description, datePublished, author, image
- Include recommended properties: dateModified, articleBody, keywords
- Validate markup against schema.org specifications
- Test markup with Google Rich Results Test tool
- Enables rich snippets in search results (increased CTR)

### Readability Targets
- Flesch-Kincaid Grade Level: 8-10 for general web content, 6-8 for popular blogs
- Average sentence length: 15-20 words (optimal: 17 words)
- Average word length: 4.5-5.5 characters
- Readability score: 60-70 (0-100 scale) for optimal engagement
- Paragraph length: 3-5 sentences maximum
- Avoid sentences >20 words; break into multiple sentences
- Use simple vocabulary; avoid jargon unless necessary

### Content Freshness Guidelines
- Fresh: <6 months old (positive SEO signal)
- Aging: 6-12 months old (consider update)
- Stale: >12 months old (recommend refresh)
- Update last-modified date when making significant changes
- Display "Last updated" date to users for transparency
- Regularly review and refresh time-sensitive content

### SEO Score Calculation
- 90-100: Excellent (publish with confidence)
- 75-89: Good (minor optimizations recommended)
- 60-74: Fair (address important issues before publishing)
- Below 60: Poor (significant optimization needed)

---

## State Persistence (Optional)

For workflows that audit multiple posts over time:
- Track keyword performance trends across posts
- Store common internal linking patterns by topic
- Build readability baseline by content type
- Log recurring optimization issues for team training
- Maintain audit history for improvement comparison
- Compare current post metrics against previous versions
- Identify patterns in critical vs. nice-to-have issues by content type

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.