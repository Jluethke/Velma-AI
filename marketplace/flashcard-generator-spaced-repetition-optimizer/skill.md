# Flashcard Generator: Spaced Repetition Optimizer

**One-line description:** Transform study material into optimized spaced repetition flashcard sets using interleaving, elaboration, and concrete examples to maximize retention.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `study_material`: string (required) -- The source material to convert: textbook excerpts, lecture notes, research papers, or study guides. Can be plain text, markdown, or structured outline. Must be at least 100 characters and contain identifiable concepts.
- `material_domain`: string (required) -- Academic or professional domain (e.g., "biology", "Spanish vocabulary", "software architecture"). Helps calibrate example selection and concept granularity.
- `target_audience`: string (optional, default: "undergraduate") -- Learner level: "high-school", "undergraduate", "graduate", "professional". Affects example complexity and prerequisite assumptions.
- `deck_size_preference`: string (optional, default: "medium") -- Desired deck size: "small" (20-40 cards), "medium" (40-80 cards), "large" (80-150 cards). Influences concept granularity and may trigger deck splitting.
- `interleaving_style`: string (optional, default: "mixed") -- Spaced repetition approach: "blocked" (grouped by topic), "mixed" (random order respecting prerequisites), "contextual" (linked by relationships).
- `include_elaboration`: boolean (optional, default: true) -- Whether to generate elaboration cards showing concept relationships.
- `include_examples`: boolean (optional, default: true) -- Whether to add concrete examples to each concept.

## Outputs

- `flashcard_set`: object[] -- Array of flashcard objects, each with: {id (string), question (string), answer (string), type ("recall"|"elaboration"|"example"), difficulty (1-5 integer), related_card_ids (string[]), review_interval_days (integer), mastery_threshold (integer)}.
- `deck_metadata`: object -- {total_cards (integer), concept_count (integer), elaboration_card_count (integer), example_card_count (integer), estimated_study_hours (float), recommended_daily_cards (integer), difficulty_distribution (object with keys 1-5), deck_split_info (object or null)}.
- `learning_sequence`: string[] -- Ordered list of card IDs representing optimal presentation order for first study session, respecting all prerequisite constraints.
- `spaced_repetition_schedule`: object -- {day_1 (string[]), day_3 (string[]), day_7 (string[]), day_14 (string[]), day_30 (string[])} showing which card IDs to review on each day.
- `quality_report`: object -- {coverage_percentage (float 0-100), gap_analysis (string[]), redundancy_flags (string[]), improvement_suggestions (string[], mastery_criteria (object)}.

---

## Execution Phases

### Phase 1: Concept Extraction

**Entry Criteria:**
- Study material is provided and is non-empty (minimum 100 characters)
- Material domain is specified
- Material is in readable text format (plain text, markdown, or outline)

**Actions:**
1. Parse study material and identify all atomic concepts (definitions, principles, facts, procedures). Atomic means: cannot be meaningfully subdivided without losing core meaning.
2. Extract explicit definitions and implicit concepts from context. For each concept, record: name, definition (1-2 sentences), context (where it appears in material), and domain relevance.
3. Determine concept granularity based on deck_size_preference: small decks use broader concepts (e.g., "photosynthesis" as one concept), large decks use finer-grained concepts (e.g., "light-dependent reactions", "light-independent reactions" as separate concepts).
4. Create concept inventory with: id (unique identifier), name, definition, context (source location in material), prerequisites (list of concept IDs that must be understood first), difficulty_estimate (1-5 based on complexity).
5. Build prerequisite graph: for each concept, identify which other concepts must be learned first. Flag circular dependencies (if A requires B and B requires A, flag for manual resolution).
6. Validate that all major topics from study material have at least one concept. If coverage <80%, flag missing topics.

**Output:**
- `concept_inventory`: array of {id (string), name (string), definition (string), context (string), prerequisites (string[]), difficulty_estimate (1-5)}.
- `concept_count`: integer (total concepts extracted).
- `prerequisite_graph`: object mapping concept IDs to arrays of dependent concept IDs.
- `coverage_estimate`: float (percentage of study material topics represented).

**Quality Gate:**
- Every major topic from study material has at least one concept (verified by manual review or topic matching).
- Concepts are atomic: each concept name is a single noun phrase; definition does not contain "and" connecting independent ideas.
- Definitions are complete and unambiguous: a learner unfamiliar with the domain could understand the definition without external context.
- Prerequisite relationships are identified and acyclic: no circular dependencies exist.
- Coverage estimate ≥80% (if <80%, flag missing topics in output).

---

### Phase 2: Base Flashcard Generation

**Entry Criteria:**
- Concept inventory is complete and validated
- Concept count is within deck_size_preference bounds (small: 20-40, medium: 40-80, large: 80-150)
- No unresolved circular dependencies in prerequisite graph

**Actions:**
1. For each concept, generate a primary recall question using one of these templates: "What is [concept]?", "Define [concept]", "Explain how [concept] works", "Describe [concept]". Choose template that best fits concept type.
2. Write a concise, complete answer (2-3 sentences): includes definition + key context + one distinguishing characteristic. Answer must be self-contained and readable without reference to other cards.
3. Assign difficulty level (1-5) using this heuristic: difficulty = 1 + (number of prerequisites) + (complexity_factor). Complexity factor: 0 for simple facts, 1 for principles, 2 for procedures or relationships.
4. Assign initial review interval based on difficulty: difficulty 1-2 → 1 day, difficulty 3 → 3 days, difficulty 4-5 → 7 days.
5. Assign mastery threshold (number of consecutive correct recalls required for mastery): difficulty 1-2 → 2 correct, difficulty 3 → 3 correct, difficulty 4-5 → 4 correct.
6. Create card ID (format: "card_[concept_id]_base") and establish relationships to prerequisite cards (list prerequisite card IDs).
7. Validate that all cards are independent: no card's answer references another card's content.

**Output:**
- `base_flashcards`: array of {id (string), question (string), answer (string), type: "recall", difficulty (1-5), prerequisite_card_ids (string[]), initial_review_day (integer), mastery_threshold (integer)}.
- `base_card_count`: integer.
- `difficulty_distribution_base`: object {1: count, 2: count, 3: count, 4: count, 5: count}.

**Quality Gate:**
- Every concept has exactly one base recall card (verified by count: base_card_count = concept_count).
- Every answer is self-contained: readable without context, contains definition + distinguishing detail, 2-3 sentences.
- Difficulty assignments are consistent: concepts with same prerequisite count and complexity have same difficulty (variance <1 level).
- No circular dependencies in prerequisite relationships (verified by topological sort).
- Mastery thresholds are assigned for all cards.
- Difficulty distribution is non-empty for at least 3 levels (no level has 0 cards unless deck is very small).

---

### Phase 3: Elaboration and Example Enrichment

**Entry Criteria:**
- Base flashcards are generated and validated
- include_elaboration and include_examples flags are evaluated

**Actions:**

**Elaboration cards** (if include_elaboration = true):
1. Identify concept pairs with meaningful relationships. Relationship types: (a) prerequisite (A must be learned before B), (b) contrast (A and B are opposites or alternatives), (c) analogy (A is like B in structure), (d) application (A is used to solve problems involving B), (e) synthesis (A, B, C work together).
2. For each relationship, generate an elaboration question using templates: "How does [A] relate to [B]?", "Contrast [A] and [B]", "When would you use [A] instead of [B]?", "How do [A] and [B] work together?", "[A] is to [B] as [C] is to [D]".
3. Write answer explaining the relationship (2-3 sentences): state the relationship type, explain why it matters, give one concrete example.
4. Link elaboration card to both related base cards (store both card IDs in related_card_ids).
5. Assign difficulty = max(difficulty of related concepts) + 1 (elaboration is harder than its component concepts).
6. Assign review offset: elaboration cards reviewed 1 day after the later of the two related base cards.
7. Assign mastery threshold = max(mastery threshold of related cards) + 1.
8. Create card ID (format: "card_[concept1_id]_[concept2_id]_elab").

**Example cards** (if include_examples = true):
1. For each concept, identify 1-2 concrete, memorable examples from real-world context. Examples must be: (a) specific and tangible (not abstract), (b) domain-appropriate (relevant to learner's field), (c) memorable (unusual, surprising, or emotionally resonant), (d) illustrative (clearly demonstrates the concept).
2. Generate example questions using templates: "Give an example of [concept]", "Which of these is an example of [concept]?", "How would you apply [concept] to [domain-specific scenario]?", "[Concept] is exemplified by..."
3. Write answer with the example (1-2 sentences) + brief explanation of why it illustrates the concept (1 sentence). Total 2-3 sentences.
4. Link example card to base card (store base card ID in related_card_ids).
5. Assign difficulty = base concept difficulty (examples are same difficulty as base concept).
6. Assign review offset: example cards reviewed same day as base cards (offset = 0).
7. Assign mastery threshold = mastery threshold of base card.
8. Create card ID (format: "card_[concept_id]_example_[n]").

3. Validate elaboration cards: each connects two distinct concepts (not self-referential), relationship is meaningful (not arbitrary), answer explains why the relationship matters.
4. Validate example cards: each example is concrete and domain-appropriate, explanation clearly links example to concept, no generic or abstract examples.

**Output:**
- `elaboration_flashcards`: array of {id (string), question (string), answer (string), type: "elaboration", difficulty (1-5), related_card_ids (string[]), review_offset_days (integer), mastery_threshold (integer)}.
- `example_flashcards`: array of {id (string), question (string), answer (string), type: "example", difficulty (1-5), related_card_ids (string[]), review_offset_days (integer), mastery_threshold (integer)}.
- `elaboration_card_count`: integer.
- `example_card_count`: integer.
- `enrichment_card_count`: integer (elaboration_card_count + example_card_count).

**Quality Gate:**
- Elaboration cards connect concepts meaningfully: each card's answer explains a specific relationship type (prerequisite, contrast, analogy, application, or synthesis). No arbitrary links.
- Examples are concrete and memorable: each example is a specific instance (not abstract), domain-appropriate, and illustrates the concept without ambiguity.
- No elaboration card duplicates base card content: elaboration cards add new information (the relationship), not repetition.
- Example cards add value: each example teaches something new about the concept (not just restating the definition).
- All elaboration and example cards have valid related_card_ids pointing to existing cards.
- Difficulty assignments are consistent: elaboration cards are 1 level harder than base cards; example cards match base card difficulty.

---

### Phase 4: Interleaving and Schedule Design

**Entry Criteria:**
- All flashcard types (base, elaboration, example) are generated and validated
- interleaving_style is specified
- Total card count is determined

**Actions:**
1. Merge all flashcard types into a unified set. Total card count = base_card_count + elaboration_card_count + example_card_count.
2. If total card count exceeds 150 and deck_size_preference = "large", apply deck splitting logic: divide cards into sub-decks ("Fundamentals", "Intermediate", "Advanced") based on difficulty and prerequisite structure. Each sub-deck should have 50-100 cards. Create deck_split_info object with sub-deck names and card counts.
3. Apply interleaving strategy based on interleaving_style:
   - **blocked**: Group cards by concept/topic. Within each topic, order by difficulty (easiest first). Review all cards for one topic before moving to next.
   - **mixed**: Randomize card order while respecting prerequisite constraints. Prerequisite cards always come before dependent cards. Interleave example cards with base cards (pattern: base, example, base, example).
   - **contextual**: Order cards by relationship graph. Cards are presented in clusters of related concepts. Within each cluster, order by difficulty.
4. Assign review intervals using spaced repetition algorithm:
   - Day 1: All new cards (in interleaved order)
   - Day 3: Cards with difficulty 1-2 + all elaboration cards
   - Day 7: Cards with difficulty 3-4
   - Day 14: Cards with difficulty 5 + complex elaborations (elaborations connecting 3+ concepts)
   - Day 30: All cards (comprehensive review)
5. Validate that all cards appear in the schedule exactly once per review cycle. No card appears on multiple days in the same cycle.
6. Calculate estimated study time: (total_cards × 30 seconds per card) / 60 minutes. Add 20% buffer for elaboration and example cards (they take slightly longer).
7. Calculate recommended daily card load: total_cards / 14 days (assuming 2-week initial learning cycle). If load >30 cards/day, extend cycle to 21 or 30 days and recalculate.
8. Validate study load: recommended_daily_cards should be 15-25 cards/day for optimal retention. If outside this range, flag in output.

**Output:**
- `complete_flashcard_set`: merged array of all flashcards with assigned review schedules. Each card includes: id, question, answer, type, difficulty, related_card_ids, review_interval_days, mastery_threshold.
- `spaced_repetition_schedule`: {day_1 (string[]), day_3 (string[]), day_7 (string[]), day_14 (string[]), day_30 (string[])} with card IDs.
- `estimated_study_hours`: float (total hours to reach mastery on all cards).
- `recommended_daily_cards`: integer (cards per day for optimal learning).
- `study_load_validation`: object {is_optimal (boolean), daily_card_count (integer), recommended_cycle_days (integer), note (string)}.
- `deck_split_info`: object or null. If deck is split: {sub_decks (array of {name, card_count, difficulty_range}), progression_order (string[])}. If not split: null.

**Quality Gate:**
- All cards appear in the schedule: sum of cards across all days = total_card_count.
- Prerequisite cards appear before dependent cards in day 1 sequence: topological sort validation passes.
- Review intervals are spaced: no two reviews of same card on same day; each card appears on exactly one day per cycle.
- Estimated study time is reasonable: 1-3 hours for small decks, 3-8 hours for medium decks, 8-20 hours for large decks.
- Study load is within acceptable range: 15-25 cards/day (or note if outside range with recommended adjustment).
- If deck is split, each sub-deck has clear progression and no circular dependencies between sub-decks.

---

### Phase 5: Learning Sequence Optimization

**Entry Criteria:**
- Complete flashcard set with schedules is ready
- Prerequisite relationships are validated and acyclic
- Interleaving strategy is applied

**Actions:**
1. Build optimal learning sequence for day 1 (first study session):
   - Start with lowest-difficulty cards (difficulty 1)
   - Proceed to higher difficulties (2, 3, 4, 5)
   - Respect prerequisite constraints: if card A is prerequisite for card B, A comes before B
   - Interleave example cards with base cards using pattern: base concept → example → base concept → example (provides cognitive variety and reinforcement)
   - Interleave elaboration cards after both related base cards have been introduced (so learner understands both concepts before seeing the relationship)
2. Create learning sequence as ordered array of card IDs.
3. Estimate time to complete first session: (card_count × 30 seconds) / 60 minutes. Add 10% buffer.
4. Validate sequence: confirm all prerequisite constraints are satisfied (topological sort passes).
5. Generate session breakdown: describe structure as "Study X cards in Y minutes: Z cards difficulty 1 (A min), W cards difficulty 2 (B min), etc."
6. Identify cognitive load checkpoints: after every 15-20 cards, suggest a 5-minute break.

**Output:**
- `learning_sequence`: array of card IDs in optimal order for day 1.
- `first_session_duration_minutes`: integer (estimated time to complete day 1).
- `session_breakdown`: string describing structure and time allocation (e.g., "Study 45 cards in 28 minutes: 12 difficulty-1 cards (6 min), 18 difficulty-2 cards (9 min), 15 difficulty-3 cards (13 min). Suggested breaks after cards 15 and 30.").
- `sequence_validation`: object {prerequisites_satisfied (boolean), no_circular_dependencies (boolean), alternation_pattern_applied (boolean)}.

**Quality Gate:**
- Learning sequence respects all prerequisite constraints: for every card, all prerequisite cards appear earlier in sequence (verified by topological sort).
- Sequence alternates between concept types: pattern follows base → example → base → example (or base → elaboration → base if no examples). At least 60% of transitions follow this pattern.
- First session is completable in under 90 minutes: first_session_duration_minutes <90.
- Cognitive load is managed: no more than 20 consecutive cards without a suggested break.
- All cards from day 1 schedule appear in learning sequence (verified by set equality).

---

### Phase 6: Quality Validation and Reporting

**Entry Criteria:**
- All previous phases complete
- Complete flashcard set and schedules are ready
- Learning sequence is optimized

**Actions:**
1. **Coverage analysis**: Check that all concepts from study material are represented in flashcards. Calculate coverage_percentage = (concepts_with_cards / total_concepts_extracted) × 100. If coverage <85%, flag missing concepts.
2. **Gap analysis**: Identify concepts mentioned in study material but not yet in flashcards. For each gap, note: concept name, where it appears in material, why it was omitted (e.g., "too vague", "no clear definition"), suggestion for inclusion.
3. **Redundancy check**: Identify cards with duplicate or near-duplicate content. For each redundancy: list card IDs, describe the duplication, recommend consolidation or differentiation.
4. **Difficulty distribution**: Verify difficulty levels are spread across 1-5 range. Calculate distribution as {1: count, 2: count, 3: count, 4: count, 5: count}. Flag if any level has 0 cards (unless deck is very small <20 cards).
5. **Relationship validation**: Confirm elaboration cards actually connect distinct concepts (not self-referential). For each elaboration card, verify: (a) related_card_ids contains exactly 2 cards, (b) both cards are base cards, (c) cards are not identical.
6. **Example quality**: Verify examples are domain-appropriate and memorable. For each example card, check: (a) example is concrete (specific instance, not abstract), (b) example is relevant to domain, (c) explanation clearly links example to concept, (d) example is not generic (not "for example, X is an example of X").
7. **Mastery criteria validation**: Confirm mastery thresholds are assigned and reasonable. Verify: (a) all cards have mastery_threshold, (b) thresholds increase with difficulty, (c) thresholds are 2-5 (not 1 or >5).
8. **Schedule validation**: Confirm spaced repetition schedule is complete and balanced. Verify: (a) all cards appear in schedule, (b) no card appears twice in same day, (c) day 1 has most cards, day 30 has all cards, (d) review intervals follow spacing effect principles.
9. Generate improvement suggestions: for each identified issue (gap, redundancy, weak example, prerequisite gap, unbalanced difficulty), create actionable suggestion (e.g., "Add 3 cards for [missing concept]", "Consolidate cards X and Y", "Replace example in card Z with [better example]").

**Output:**
- `quality_report`: object with:
  - `coverage_percentage`: float (0-100)
  - `gap_analysis`: array of {concept_name (string), location_in_material (string), reason_omitted (string), inclusion_suggestion (string)}
  - `redundancy_flags`: array of {card_ids (string[]), description (string), consolidation_suggestion (string)}
  - `difficulty_distribution`: object {1: count, 2: count, 3: count, 4: count, 5: count}
  - `improvement_suggestions`: array of {category (string: "missing_concept"|"redundancy"|"weak_example"|"prerequisite_gap"|"unbalanced_difficulty"), description (string), action (string), priority (string: "high"|"medium"|"low")}
  - `mastery_criteria`: object {all_assigned (boolean), distribution (object with threshold values as keys), validation_notes (string)}
  - `schedule_validation`: object {all_cards_included (boolean), no_duplicates_per_day (boolean), spacing_follows_principles (boolean), validation_notes (string)}
- `deck_metadata`: object with:
  - `total_cards`: integer
  - `concept_count`: integer
  - `elaboration_card_count`: integer
  - `example_card_count`: integer
  - `estimated_study_hours`: float
  - `recommended_daily_cards`: integer
  - `difficulty_distribution`: object {1: count, 2: count, 3: count, 4: count, 5: count}
  - `deck_split_info`: object or null
  - `generation_timestamp`: string (ISO 8601 format)

**Quality Gate:**
- Coverage ≥85% (if <85%, gap_analysis must list all missing concepts with inclusion suggestions).
- No more than 2 redundant card pairs (if >2, flag as high-priority improvement).
- Difficulty distribution is non-zero for at least 3 levels (or note if deck is too small to require all levels).
- All improvement suggestions are actionable: each includes specific concept/card reference and concrete action.
- Mastery criteria are assigned for all cards and increase with difficulty.
- Schedule validation passes: all cards included, no duplicates, spacing follows principles.

---

## Exit Criteria

The skill is complete when:
1. All concepts from study material are extracted and represented in flashcards (coverage ≥85%).
2. Base recall cards exist for every concept (base_card_count = concept_count).
3. Elaboration cards (if enabled) connect related concepts meaningfully (each elaboration card's answer explains a specific relationship type).
4. Example cards (if enabled) provide concrete, memorable illustrations (each example is specific, domain-appropriate, and clearly linked to concept).
5. Spaced repetition schedule is assigned with review intervals (day 1, 3, 7, 14, 30) and all cards appear exactly once per cycle.
6. Learning sequence respects prerequisite constraints (topological sort passes) and alternates between concept types (base → example → base pattern).
7. Quality report shows ≥85% coverage with actionable improvement suggestions for any gaps.
8. Estimated study time is realistic for deck size (1-3 hours for small, 3-8 hours for medium, 8-20 hours for large).
9. Mastery thresholds are assigned for all cards (2-5 consecutive correct recalls depending on difficulty).
10. A learner unfamiliar with the original material could use the deck to learn the concepts: verified by checking that all answers are self-contained, all examples are concrete, and all elaborations explain relationships clearly.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Concept Extraction | Study material is too vague or lacks clear concepts (<5 concepts identified) | **Adjust** -- request more detailed material or ask user to provide concept list manually. Return partial concept inventory with note: "Material is too vague. Please provide more detailed source material or manually specify key concepts." |
| Concept Extraction | Circular prerequisite dependencies detected (A requires B, B requires A) | **Adjust** -- identify bootstrap concepts (concepts with no prerequisites) and reorder; flag circular dependency for user review. Output: "Circular dependency detected: [concept A] ↔ [concept B]. Recommend treating [concept X] as bootstrap. Please verify prerequisite relationships." |
| Concept Extraction | Coverage <70% (major concepts missing) | **Adjust** -- flag missing topics in output. Request supplementary material or ask user to identify missing concepts. Output: "Coverage is 65%. Missing topics: [list]. Please provide additional material or specify missing concepts." |
| Base Flashcard Generation | Difficulty assignment is inconsistent (similar concepts have very different difficulties) | **Adjust** -- normalize difficulty levels using concept complexity heuristics. Recalculate difficulty = 1 + (prerequisite count) + (complexity factor). Output: "Difficulty levels normalized. Review assignments for concepts: [list]." |
| Elaboration Enrichment | Cannot find meaningful relationships between concepts (elaboration cards <5% of base cards) | **Adjust** -- reduce elaboration card count; focus on strongest relationships only (prerequisite and contrast relationships). Output: "Few meaningful relationships found. Generated [N] elaboration cards focusing on prerequisite and contrast relationships." |
| Elaboration Enrichment | Examples are too generic or not domain-appropriate | **Adjust** -- request domain-specific examples from user or use more abstract examples with clearer explanations. Output: "Examples for [concepts] are too generic. Please provide domain-specific examples or accept more abstract examples." |
| Interleaving Design | Spaced repetition schedule creates impossible study load (>30 cards/day) | **Adjust** -- extend schedule to 21 or 30 days; reduce deck size or split into sub-decks. Output: "Study load is [N] cards/day (exceeds 30). Extending schedule to [X] days. Recommended daily load: [Y] cards/day." |
| Learning Sequence | Prerequisite constraints make optimal ordering impossible (circular dependencies) | **Abort** -- flag circular dependencies; ask user to clarify concept relationships. Output: "Cannot create learning sequence: circular dependencies detected. Please resolve: [dependency list]." |
| Quality Validation | Coverage <70% (major concepts missing) | **Adjust** -- generate additional cards for missing concepts; request supplementary material. Output: "Coverage is [X]%. Missing concepts: [list]. Suggest adding [N] cards or providing supplementary material." |
| Input Validation | Study material is not text format (binary file, corrupted text) | **Abort** -- input is not readable. Output: "Study material is not readable text. Please provide plain text, markdown, or structured outline." |
| Input Validation | Study material is empty or <100 characters | **Abort** -- input is too small. Output: "Study material is too short (minimum 100 characters). Please provide more detailed material." |

---

## Reference Section: Domain Knowledge and Decision Criteria

### Spaced Repetition Principles
- **Spacing effect**: Reviewing material at increasing intervals strengthens long-term retention. Optimal intervals follow Ebbinghaus curve: 1 day, 3 days, 7 days, 14 days, 30 days.
- **Interleaving**: Mixing different types of problems/concepts improves transfer and discrimination. Alternating between base concepts and examples improves retention by 20-30%.
- **Elaboration**: Connecting new information to existing knowledge improves encoding. Elaboration cards that explain relationships increase retention by 15-25%.
- **Concrete examples**: Real-world instances make abstract concepts memorable. Concrete examples improve recall by 30-40% compared to abstract definitions alone.
- **Mastery criteria**: Requiring multiple correct recalls (not just one) ensures durable learning. Threshold of 3-4 correct recalls predicts 90%+ retention after 1 month.

### Difficulty Assignment Heuristic
- **Difficulty 1**: Atomic facts, definitions, simple recall (no prerequisites). Example: "Define photosynthesis."
- **Difficulty 2**: Concepts with 1-2 prerequisites; straightforward application. Example: "Explain how light-dependent reactions produce ATP."
- **Difficulty 3**: Concepts with 3+ prerequisites; requires integration of multiple ideas. Example: "How do light-dependent and light-independent reactions work together?"
- **Difficulty 4**: Complex relationships, synthesis, or domain-specific reasoning. Example: "Why do plants need both light-dependent and light-independent reactions?"
- **Difficulty 5**: Advanced synthesis, edge cases, expert-level discrimination. Example: "How would photosynthesis differ on a planet with different light wavelengths?"

### Review Interval Guidelines (Ebbinghaus-based)
- **Day 1**: First exposure (all new cards). Consolidates initial encoding.
- **Day 3**: Early consolidation (difficulty 1-2, elaboration cards). Prevents rapid forgetting.
- **Day 7**: Intermediate consolidation (difficulty 3-4). Strengthens medium-term retention.
- **Day 14**: Long-term consolidation (difficulty 5, complex relationships). Prepares for long-term storage.
- **Day 30**: Final review and mastery check (all cards). Confirms durable learning.

### Elaboration Card Types
1. **Prerequisite links**: "Before learning X, you must understand Y" -- establishes learning order
2. **Contrast cards**: "How does X differ from Y?" -- highlights distinctions
3. **Application cards**: "When would you use X in practice?" -- connects to real-world use
4. **Analogy cards**: "X is like Y because..." -- uses familiar concepts to explain new ones
5. **Synthesis cards**: "How do X, Y, and Z work together?" -- integrates multiple concepts

### Example Selection Criteria
- **Concrete**: Specific, tangible instances (not abstract or hypothetical). Example: "Mitochondria in muscle cells" vs. "cellular organelles".
- **Memorable**: Unusual, surprising, or emotionally resonant. Example: "Hummingbirds have the highest metabolic rate of any animal" vs. "some animals have high metabolic rates".
- **Domain-appropriate**: Relevant to learner's field or interests. Example: For biology students, use biological examples; for engineers, use engineering examples.
- **Illustrative**: Clearly demonstrates the concept without ambiguity. Example: "Osmosis is like water moving from a cup of pure water into a cup of salt water" (clear) vs. "osmosis involves water" (vague).
- **Diverse**: Multiple examples show range of application. Example: Include examples from different contexts (natural, industrial, medical) to show breadth.

### Quality Metrics
- **Coverage**: % of study material concepts represented in flashcards (target ≥85%). Calculated as: (concepts_with_cards / total_concepts_extracted) × 100.
- **Redundancy**: Duplicate or near-duplicate cards (target <5%). Identified by comparing answer text similarity.
- **Difficulty spread**: Distribution across 1-5 scale (target: no level with 0 cards unless deck <20 cards). Ensures learners encounter appropriate challenge levels.
- **Study load**: Cards per day in spaced schedule (target: 15-25 cards/day). Balances learning efficiency with cognitive load.
- **Estimated time**: Total study hours for full mastery (target: realistic for deck size). Calculated as: (total_cards × 30 seconds) / 3600 seconds/hour × 1.2 buffer.
- **Mastery threshold**: Consecutive correct recalls required for mastery (target: 2-5 depending on difficulty). Ensures durable learning without excessive repetition.

---

## State Persistence (Optional)

For workflows that benefit from memory between runs:
- **Learner progress**: Track which cards have been mastered (met mastery threshold), which need review, which are in progress. Update review intervals based on performance: if card is mastered, move to maintenance schedule (monthly review); if card has <50% recall accuracy, increase review frequency.
- **Performance patterns**: Remember which concept types the learner struggles with (e.g., "elaboration cards", "difficulty 4-5 cards"). Use patterns to adjust future deck generation (e.g., add more examples if learner struggles with abstract concepts).
- **Customization history**: Store user's preferred interleaving style, example types, difficulty adjustments. Apply preferences to future decks automatically.
- **Deck evolution**: Log changes to flashcards based on learner feedback (e.g., "this example was confusing", "this question is ambiguous"). Use feedback to improve card quality over time.
- **Concept mastery tracking**: Maintain a learner profile of mastered concepts across multiple decks. Use profile to identify prerequisite knowledge and avoid redundant learning.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.