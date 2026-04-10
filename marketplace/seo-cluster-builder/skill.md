# SEO Cluster Builder

Builds topic cluster architecture from seed keywords to establish topical authority. Generates keyword clusters, maps pillar-to-cluster-to-support page hierarchies, creates prioritized content calendars, and produces detailed content briefs with internal linking plans.

## Execution Pattern: Phase Pipeline

```
PHASE 1: SEED       --> Input seed keywords, classify search intent, establish topic scope
PHASE 2: EXPAND     --> Generate keyword clusters: head terms, long-tail, questions, modifiers
PHASE 3: MAP        --> Create topic-pillar structure: pillar pages --> cluster pages --> supporting content
PHASE 4: PLAN       --> Content calendar with priority scoring (volume x difficulty x intent match)
PHASE 5: BRIEF      --> Generate content briefs per page (keyword, outline, word count, internal links)
```

## Inputs

- **seed_keywords**: string[] -- Starting keywords (3-10 seed terms that define the topic space)
- **website_url**: string (optional) -- Current website for existing content audit
- **target_audience**: object -- Who the content is for:
  - `persona`: string -- Primary reader description
  - `expertise_level`: string ("beginner" | "intermediate" | "expert")
  - `intent`: string ("learn" | "evaluate" | "buy" | "solve")
  - `industry`: string (optional)
- **existing_content**: array of objects (optional) -- Content already published:
  - `url`: string
  - `title`: string
  - `target_keyword`: string
  - `word_count`: number
  - `current_ranking`: number (optional)
  - `monthly_traffic`: number (optional)

## Outputs

- **keyword_clusters**: array of objects -- Organized keyword groups:
  - `cluster_name`: string
  - `cluster_type`: string ("pillar" | "cluster" | "supporting")
  - `keywords`: array of {keyword, volume, difficulty, intent, priority}
  - `total_volume`: number
- **topic_pillar_map**: object -- Hierarchical content structure:
  - `pillars`: array of {title, target_keyword, cluster_pages: array, supporting_pages: array, internal_linking_plan: array}
- **content_calendar**: array of objects -- Prioritized publishing schedule:
  - `week`: number
  - `content_title`: string
  - `content_type`: string
  - `target_keyword`: string
  - `priority_score`: number
  - `estimated_traffic`: number
- **content_briefs**: array of objects -- Detailed briefs per content piece:
  - `title`: string
  - `target_keyword`: string
  - `secondary_keywords`: string[]
  - `search_intent`: string
  - `outline`: array of {heading_level, heading_text, content_notes}
  - `word_count`: number
  - `internal_links`: array of {anchor_text, target_page}
  - `competitor_gaps`: string[]
  - `schema_markup`: string[]

## Execution

### Phase 1: SEED -- Keyword Analysis and Scope

**Entry criteria:** At least 3 seed keywords provided. Target audience defined with at minimum a persona description.

**Actions:**
1. For each seed keyword, determine:
   - **Search volume** (monthly, estimated range)
   - **Keyword difficulty** (0-100 scale based on domain authority of ranking pages)
   - **Search intent classification:**
     - Informational: "what is X", "how to X", "X guide" -- searcher wants to learn
     - Navigational: "[brand] X", "X login" -- searcher wants a specific page
     - Commercial investigation: "best X", "X vs Y", "X review" -- searcher is evaluating
     - Transactional: "buy X", "X pricing", "X free trial" -- searcher wants to take action
   - **Content format expectation:** What type of content ranks for this keyword? (listicle, tutorial, comparison, tool, video)
2. Assess topic scope:
   - Is this topic broad enough to support a cluster? (need at least 8-12 related subtopics)
   - Is this topic narrow enough to be cohesive? (topics that span 3+ distinct subjects should be split into separate clusters)
   - What's the total addressable search volume across all related keywords?
3. If existing_content is provided, audit for:
   - **Coverage:** Which keywords are already targeted?
   - **Gaps:** Which keywords have no content?
   - **Cannibalization:** Are multiple pages targeting the same keyword? (this hurts rankings)
   - **Orphans:** Are any pages not linked from other content? (isolated content lacks cluster benefit)
4. Define cluster boundaries: which subtopics belong together and which are separate clusters.

**Output:** Seed keyword analysis with intent, volume, difficulty; topic scope assessment; existing content audit (if applicable); cluster boundary definitions.

**Quality gate:** Each seed keyword has intent classification, volume estimate, and difficulty assessment. Topic scope supports at least 2 pillar pages with 4+ cluster pages each. If existing content audit reveals cannibalization, flag for resolution before creating new content.

### Phase 2: EXPAND -- Keyword Cluster Generation

**Entry criteria:** Seed keywords analyzed. Cluster boundaries defined. Topic scope validated.

**Actions:**
1. Expand each seed keyword into a full keyword cluster:
   - **Head terms** (1-2 words, high volume, high difficulty): The broad terms that define the topic. Usually the pillar page target.
   - **Long-tail keywords** (3-5 words, lower volume, lower difficulty): Specific queries that cluster pages will target. These are where you win first.
   - **Question keywords** ("how to...", "what is...", "why does..."): FAQ and educational content targets. High featured snippet potential.
   - **Modifier keywords** (with adjectives: "best", "free", "for beginners", "vs"): Commercial and comparison content.
   - **LSI (Latent Semantic Indexing) keywords**: Semantically related terms that Google expects to see on a page about this topic.
2. For each keyword, determine:
   - Volume (monthly searches)
   - Difficulty (0-100)
   - Search intent (informational / commercial / transactional)
   - Content format fit (blog post, comparison page, tool page, video, FAQ)
   - Cluster assignment (which pillar does it belong under?)
3. Group keywords by semantic similarity:
   - Keywords that Google ranks the same pages for should be on the same page (not separate pages)
   - Keywords with distinct SERP results should be separate pages
4. Calculate cluster-level metrics:
   - Total cluster volume (sum of all keyword volumes)
   - Average difficulty (determines how hard the cluster is to rank for)
   - Intent distribution (what percentage is informational vs. commercial vs. transactional?)
5. Identify keyword gaps: high-volume keywords in the topic space that no competitor is comprehensively covering.

**Output:** Complete keyword clusters with per-keyword metrics, cluster-level summaries, and gap analysis.

**Quality gate:** Each cluster contains at least 8 keywords. Head terms, long-tail, questions, and modifiers are all represented. Every keyword has volume, difficulty, and intent. Total keyword coverage represents at least 70% of estimated topic search volume.

### Phase 3: MAP -- Topic-Pillar Architecture

**Entry criteria:** Keyword clusters complete with at least 2 clusters containing 8+ keywords each.

**Actions:**
1. Designate pillar pages:
   - One pillar page per major cluster (targeting the highest-volume head term)
   - Pillar pages are comprehensive, long-form content (2,500-5,000 words)
   - Pillar pages cover the topic broadly and link to cluster pages for depth
   - Format: definitive guide, ultimate resource, comprehensive overview
2. Designate cluster pages:
   - 4-8 cluster pages per pillar (targeting mid-volume long-tail keywords)
   - Each cluster page covers one subtopic in depth (1,500-2,500 words)
   - Each cluster page links back to its pillar page AND to related cluster pages
   - Format: tutorials, comparisons, how-tos, case studies
3. Designate supporting content:
   - FAQ pages, glossary entries, news commentary, data studies
   - Supporting content targets question keywords and very long-tail terms
   - Supporting content links to relevant cluster pages (building internal link equity)
4. Design the internal linking architecture:
   - **Hub-and-spoke model:** Each pillar page is the hub; cluster pages are spokes
   - Every cluster page links to its pillar with the pillar's target keyword as anchor text
   - Every pillar page links to all its cluster pages with each page's target keyword as anchor
   - Cross-cluster links where topically relevant (a cluster page in Pillar A can link to a cluster page in Pillar B if the topic naturally connects)
   - Breadcrumb structure: Home > Pillar Topic > Cluster Topic
5. Identify content types for each position:
   - Top-funnel (informational): guides, tutorials, explainers
   - Mid-funnel (commercial): comparisons, reviews, case studies
   - Bottom-funnel (transactional): product pages, pricing pages, free trial CTAs
6. If existing content was audited, map it into the new structure:
   - Which existing pages can serve as pillar/cluster pages (with updates)?
   - Which existing pages should be consolidated (cannibalization fix)?
   - Which existing pages should be redirected (outdated or off-topic)?

**Output:** Complete topic-pillar map with page hierarchy, internal linking plan, content type assignments, and existing content integration plan.

**Quality gate:** Every pillar has at least 4 cluster pages. Internal linking plan connects every cluster page to its pillar and at least one sibling cluster page. No orphan pages. Content types cover at least informational and commercial intents.

### Phase 4: PLAN -- Content Calendar

**Entry criteria:** Topic-pillar map complete with all pages defined and prioritized.

**Actions:**
1. Score each content piece on priority using the formula:
   ```
   priority = (normalized_volume × 0.35) + (business_value × 0.30) +
              ((100 - difficulty) / 100 × 0.20) + (intent_match × 0.15)
   ```
   Where:
   - normalized_volume: keyword volume scaled 0-10 relative to the highest in the set
   - business_value: how directly this content relates to the product/service (0-10)
   - difficulty: keyword difficulty (0-100), inverted so easier = higher priority
   - intent_match: how well the keyword intent matches the audience's stage (0-10)
2. Apply sequencing rules:
   - Pillar pages publish before their cluster pages (the hub must exist before spokes point to it)
   - Higher-priority content publishes first within each cluster
   - Mix content types per week: don't publish 4 comparison posts in a row
   - Maintain consistent publishing cadence (2-4 posts per week for aggressive growth, 1-2 for sustainable)
3. Estimate traffic potential per piece:
   - If ranking in position 1-3: capture 15-30% of keyword volume
   - If ranking in position 4-10: capture 3-8% of keyword volume
   - Apply a cluster multiplier: pillar pages with 5+ cluster pages rank 30-50% higher than standalone pages
4. Create monthly and weekly calendar:
   - Month 1: Foundation -- publish pillar pages and highest-priority cluster pages
   - Month 2-3: Expansion -- fill out cluster pages, build internal links
   - Month 4-6: Authority -- supporting content, content updates, link-worthy assets
5. Estimate time-to-rank:
   - New domain: 6-12 months for competitive terms
   - Established domain (DA 30+): 3-6 months
   - Topic authority bonus: once 3+ cluster pages rank, new additions rank faster

**Output:** Prioritized content calendar with weekly assignments, traffic estimates, and time-to-rank projections.

**Quality gate:** Calendar covers at least 12 weeks. Pillar pages scheduled before their cluster pages. Priority scores calculated for every piece. Publishing cadence is sustainable for the stated resources. Traffic projections use conservative click-through estimates.

### Phase 5: BRIEF -- Content Brief Generation

**Entry criteria:** Content calendar finalized. At least the first month's content identified.

**Actions:**
1. For each content piece (starting with the highest priority), generate a detailed brief:
   - **Target keyword**: Primary keyword this page will rank for
   - **Secondary keywords**: 3-5 related keywords to include naturally
   - **Search intent**: What the searcher expects to find
   - **Content format**: Based on what currently ranks (guide, list, comparison, tutorial)
   - **Recommended word count**: Based on competitor content length (match or exceed the average of top 5 results)
   - **Outline**: H1, H2, H3 structure with content notes per section
   - **Questions to answer**: Specific questions from "People Also Ask" and question keywords
   - **Internal links**: Which pages to link to and with what anchor text (minimum 3 internal links per page)
   - **External references**: Authoritative sources to cite (builds E-E-A-T signals)
   - **Schema markup**: FAQ schema, HowTo schema, Article schema as applicable
   - **Competitor gaps**: What the top 3 ranking pages miss that this content should include

2. For pillar pages specifically, add:
   - Table of contents (linked to H2s)
   - Summary/TL;DR section at top
   - "Jump to" navigation for long content
   - Comprehensive FAQ section targeting question keywords (with FAQ schema)

3. For cluster pages specifically, add:
   - Prominent link back to pillar page in introduction
   - "Related reading" section at bottom linking to sibling cluster pages
   - Specific, actionable content (not a watered-down version of the pillar)

4. Store briefs in state for tracking publication status.

**Output:** Detailed content briefs for priority content pieces with outlines, keyword targets, linking plans, and competitive gaps.

**Quality gate:** Each brief has a target keyword, word count recommendation, and outline with at least 4 H2 sections. Internal linking plan includes at least 3 links per brief. Competitor gap analysis identifies at least 1 unique angle not covered by existing top results.

## Exit Criteria

The skill is DONE when:
1. Keyword clusters contain at least 30 total keywords across all clusters.
2. Topic-pillar map defines at least 2 pillar pages with 4+ cluster pages each.
3. Internal linking architecture connects every page to its pillar and at least one sibling.
4. Content calendar covers at least 12 weeks with priority scores and traffic estimates.
5. Content briefs are generated for at least the first 4 pieces (first month's content).
6. No keyword cannibalization exists between planned pages.

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| SEED | Seed keywords are too narrow (insufficient subtopics for a cluster) | **Adjust** -- broaden the seed keywords. If "Python list comprehension" is too narrow, expand to "Python data structures" |
| SEED | Existing content audit reveals severe cannibalization | **Abort** on new content until cannibalization is resolved. Provide a consolidation plan first. |
| EXPAND | Keyword volume data unavailable | **Adjust** -- use relative difficulty and SERP analysis as proxies. Estimate volume ranges (low/medium/high) from autocomplete suggestions and related searches. |
| MAP | Too few keywords for pillar structure | **Adjust** -- create a single comprehensive page instead of pillar+cluster. Recommend expanding the topic in future iterations. |
| PLAN | Publishing cadence exceeds available resources | **Adjust** -- reduce to 1 post/week and extend the calendar. Prioritize ruthlessly -- do fewer pieces better rather than many pieces poorly. |
| BRIEF | Competitor analysis shows an extremely saturated topic | **Adjust** -- recommend targeting lower-competition long-tail keywords first to build domain authority before attacking head terms. |
| BRIEF | User rejects final output | **Targeted revision** -- ask which keyword cluster, content brief, or publishing calendar entry fell short and rerun only that section. Do not regenerate the full cluster strategy. |

## State Persistence

This skill maintains persistent state across executions:
- **keyword_research**: Full keyword dataset with volumes, difficulty, and intent -- reusable across sessions, refreshed quarterly
- **published_content**: Which content from the calendar has been published -- tracks progress against plan
- **ranking_data**: Keyword position tracking over time -- measures content effectiveness
- **content_gaps**: Keywords identified as gaps in previous analyses -- ensures they get addressed
- **cannibalization_log**: Historical cannibalization issues and resolutions

## Reference

### Topic Cluster Model Explained

The topic cluster model (also called pillar-cluster or hub-and-spoke) is an SEO architecture that signals topical authority to search engines:

```
                    +-----------+
                    | PILLAR    |  (comprehensive, 3-5K words)
                    | PAGE      |  (targets head term)
                    +-----+-----+
                          |
         +--------+-------+-------+--------+
         |        |       |       |        |
    +----v--+ +---v---+ +-v----+ +v-----+ +v------+
    |CLUSTER| |CLUSTER| |CLSTR | |CLSTR | |CLUSTER|
    |PAGE 1 | |PAGE 2 | |PG 3 | |PG 4 | |PAGE 5 |
    +---+---+ +---+---+ +--+--+ +--+--+ +---+---+
        |         |        |       |         |
    +---v---+ +---v---+   ...    ...     +---v---+
    |SUPPORT| |SUPPORT|                  |SUPPORT|
    |CONTENT| |CONTENT|                  |CONTENT|
    +-------+ +-------+                 +-------+
```

**Why it works:** Google's algorithms evaluate topical authority. A site with 1 article about "CRM" ranks lower than a site with 15 interlinked articles covering CRM from every angle. Internal links between cluster pages pass authority to the pillar, lifting the entire cluster.

### Content Format by Search Intent

| Intent | Format | Example | Word Count |
|---|---|---|---|
| Informational (what/how) | Guide, tutorial, explainer | "What is CRM?" | 2,000-4,000 |
| Commercial (best/vs/review) | Comparison, listicle, review | "Best CRM for Small Business" | 2,500-4,000 |
| Transactional (buy/pricing/free) | Product page, pricing page | "CRM Pricing Comparison" | 1,000-2,000 |
| Navigational (brand + topic) | Landing page | "[Brand] CRM Features" | 800-1,500 |

### Priority Scoring Weights Explained

The priority formula `volume(35%) + business(30%) + ease(20%) + intent(15%)` balances:
- **Volume (35%):** Higher volume = more potential traffic. But volume alone chases vanity metrics.
- **Business value (30%):** Content that directly supports the product/service drives revenue, not just traffic.
- **Ease/Difficulty (20%):** Low-difficulty keywords are faster wins. Important for building early momentum.
- **Intent match (15%):** Content that matches where the audience IS (not where you want them to be) converts better.

### Internal Linking Best Practices

1. **Anchor text rules:** Use the target keyword of the destination page as anchor text. Don't use "click here" or "read more."
2. **Link placement:** Links in body copy carry more weight than links in sidebars or footers.
3. **Link depth:** Every page should be reachable within 3 clicks from the homepage.
4. **Reciprocal linking:** Pillar links to cluster AND cluster links back to pillar. This is expected and beneficial (not "link spam").
5. **Natural density:** 3-8 internal links per 1,000 words is a healthy range. More than 10 per 1,000 words starts to feel spammy.

### E-E-A-T Signals for Content

Google's quality evaluator guidelines emphasize Experience, Expertise, Authoritativeness, and Trustworthiness:
- **Experience:** Include first-hand experience, original data, screenshots, real examples
- **Expertise:** Cite credentials, link to authoritative sources, demonstrate depth of knowledge
- **Authoritativeness:** Build topical authority through comprehensive cluster coverage
- **Trustworthiness:** Accurate information, transparent sourcing, clear authorship

Copyright 2024-present The Wayfinder Trust. All rights reserved.
