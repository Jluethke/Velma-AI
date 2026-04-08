# Voice Analyzer: Writing Style Guide Generator

**One-line description:** Analyze a user's writing sample to extract tone, vocabulary, and sentence patterns, then generate a reusable style guide for consistent AI-assisted writing.

**Execution Pattern:** Phase Pipeline with validation feedback loop

---

## Inputs

- `writing_sample` (string, required): Raw writing sample to analyze. Minimum 500 words recommended for reliable analysis. Can be email, article, blog post, social media, or any prose.
- `sample_context` (string, optional): Brief description of the writing's original purpose (e.g., "professional emails," "blog posts," "social media"). Helps calibrate analysis.
- `focus_areas` (string[], optional): Specific aspects to emphasize in the style guide. Valid values: "tone", "vocabulary", "sentence_structure", "punctuation". If omitted, all areas analyzed with equal weight.
- `target_audience` (string, optional): Who will use the style guide. Valid values: "AI writing assistant", "human editor", "content team", "individual writer". Affects guide format and detail level.

---

## Outputs

- `analysis_report` (object): Structured analysis with the following fields:
  - `tone_profile` (object): Contains formality_score (integer 0-100), emotional_valence (string: "positive"|"neutral"|"negative"|"mixed"), confidence_level (integer 0-100), audience_awareness_score (integer 0-100), consistency_assessment (string: "consistent"|"shifts_by_section"|"highly_variable"), tone_markers (array of strings: representative phrases from sample)
  - `vocabulary_profile` (object): Contains complexity_grade_level (number), unique_word_ratio (number 0-1), domain_terms (array of strings), signature_words (array of objects with fields: word (string), frequency_per_1000 (number)), word_choice_patterns (string), slang_or_informal_usage (array of strings), consistency_assessment (string: "consistent"|"shifts_by_topic"|"highly_variable")
  - `syntax_profile` (object): Contains average_sentence_length (number), sentence_variety_breakdown (object with fields: simple_percent (number), compound_percent (number), complex_percent (number)), punctuation_preferences (object with fields: em_dashes (number), semicolons (number), colons (number), parentheses (number), exclamation_marks (number)), paragraph_structure_patterns (string), transition_usage (string), distinctive_patterns (array of strings)
  - `voice_signature` (object): Contains distinctive_phrases (array of objects with fields: phrase (string), context (string)), recurring_metaphors (array of strings), characteristic_structures (array of strings), unique_markers (array of strings), voice_essence_summary (string)
- `style_guide` (string): Markdown-formatted style guide with sections: Tone Guidelines, Vocabulary Rules, Sentence Structure Preferences, Punctuation Conventions, Examples (Do's and Don'ts), AI Prompting Tips. Minimum 1500 words, maximum 2500 words.
- `validation_report` (object): Contains confidence_score (integer 0-100), test_content_sample (string: 200-word generated text), gap_analysis (array of strings: missing or misrepresented elements), refinement_recommendations (array of strings: specific actionable suggestions), confidence_by_dimension (object with fields: tone_confidence (integer 0-100), vocabulary_confidence (integer 0-100), syntax_confidence (integer 0-100))
- `metadata` (object): Contains sample_word_count (integer), sample_character_count (integer), sample_paragraph_count (integer), sample_sentence_count (integer), analysis_timestamp (string: ISO 8601 format), confidence_level (integer 0-100), language_detected (string: "English" or other language code)

---

## Execution Phases

### Phase 1: Sample Collection and Validation

**Entry Criteria:**
- `writing_sample` is provided and is a non-empty string
- `writing_sample` length is at least 50 characters (minimum for any analysis)

**Actions:**
1. Receive and store the writing sample as-is
2. Count total words (split on whitespace) and total characters (including spaces and punctuation)
3. Detect language using standard language detection (if not English, flag in metadata and proceed with caveat)
4. Segment sample into sentences using sentence boundary detection (period, question mark, exclamation mark followed by space and capital letter)
5. Segment sample into paragraphs using double-newline or paragraph break detection
6. Remove common metadata (page numbers, headers, footers, timestamps) if clearly present
7. Store all metadata: word_count, character_count, paragraph_count, sentence_count, language_detected, timestamp
8. Validate that sample contains at least 50 words; if 50-499 words, set validation_status to "warn_low_confidence"; if 500+ words, set to "proceed"; if < 50 words, set to "abort"

**Output:**
- cleaned_writing_sample (string): Original sample with metadata removed
- sample_metadata (object): word_count, character_count, paragraph_count, sentence_count, language_detected, validation_status
- segmented_sentences (array of strings): Individual sentences for downstream analysis
- segmented_paragraphs (array of strings): Individual paragraphs for downstream analysis

**Quality Gate:**
Pass if and only if ALL of the following are true:
- cleaned_writing_sample is a non-empty string
- sample_metadata contains all required fields (word_count, character_count, paragraph_count, sentence_count, language_detected, validation_status)
- word_count value matches actual word count in cleaned_writing_sample (verified by recount)
- segmented_sentences array has length >= 1
- segmented_paragraphs array has length >= 1
- validation_status is one of: "proceed", "warn_low_confidence", "abort"

**Exit Criteria:**
- Sample is cleaned and ready for analysis
- Metadata is complete and accurate
- If validation_status is "abort", stop execution and return error message: "Sample is too short (< 50 words). Minimum 50 words required."
- If validation_status is "warn_low_confidence", continue to next phase but flag in final metadata that results have low confidence

---

### Phase 2: Tone and Emotional Register Analysis

**Entry Criteria:**
- cleaned_writing_sample is available
- segmented_sentences array is available
- validation_status is not "abort"

**Actions:**
1. Scan sample for formality markers: count contractions ("don't", "it's", etc.), colloquialisms ("gonna", "kinda", etc.), formal register words ("utilize", "facilitate", "endeavor"), and formal sentence starters ("Furthermore", "Moreover", "In conclusion")
2. Calculate formality_score on 0-100 scale: (formal_marker_count - informal_marker_count) / total_words * 100, clamped to 0-100. Use reference scale: 0-20 very informal, 21-40 informal, 41-60 neutral, 61-80 formal, 81-100 very formal
3. Identify emotional tone by scanning for positive words ("excellent", "wonderful", "love"), negative words ("terrible", "hate", "awful"), and neutral/objective language. Assign emotional_valence as: "positive" if positive_words > negative_words * 1.5, "negative" if negative_words > positive_words * 1.5, "mixed" if within 1.5x ratio, "neutral" if both counts are low
4. Assess confidence_level for emotional tone (0-100): higher if emotional words are frequent and clear, lower if sample is neutral or ambiguous
5. Evaluate audience_awareness by counting second-person pronouns ("you", "your"), first-person plural ("we", "our"), and direct address phrases. Score 0-100: 0 = no audience awareness, 100 = frequent direct address
6. Assess confidence and authority by counting hedging language ("perhaps", "might", "could", "seems", "appears") vs. declarative statements. Calculate as: (declarative_count - hedging_count) / total_sentences * 100, clamped to 0-100
7. Evaluate tone consistency by dividing sample into thirds and comparing formality_score and emotional_valence across thirds. If scores vary by > 20 points, set consistency_assessment to "shifts_by_section"; if vary by > 40 points, set to "highly_variable"; otherwise "consistent"
8. Extract tone-setting phrases: identify sentences or phrases that exemplify the tone (up to 10 examples)

**Output:**
- tone_profile (object): formality_score (integer 0-100), emotional_valence (string), confidence_level (integer 0-100), audience_awareness_score (integer 0-100), consistency_assessment (string), tone_markers (array of up to 10 strings: direct quotes from sample)

**Quality Gate:**
Pass if and only if ALL of the following are true:
- formality_score is an integer between 0 and 100 (inclusive)
- emotional_valence is one of: "positive", "negative", "neutral", "mixed"
- confidence_level is an integer between 0 and 100 (inclusive)
- audience_awareness_score is an integer between 0 and 100 (inclusive)
- consistency_assessment is one of: "consistent", "shifts_by_section", "highly_variable"
- tone_markers array contains 1-10 strings, each of which is a direct quote from cleaned_writing_sample
- Each tone_marker quote is at least 3 words long

**Exit Criteria:**
- tone_profile is complete with all required fields
- All scores are justified by specific word/phrase counts from the sample

---

### Phase 3: Vocabulary and Word Choice Analysis

**Entry Criteria:**
- cleaned_writing_sample is available
- validation_status is not "abort"

**Actions:**
1. Extract all words from cleaned_writing_sample (split on whitespace, convert to lowercase, remove punctuation)
2. Count total words and unique words; calculate unique_word_ratio = unique_words / total_words
3. Assess vocabulary complexity using Flesch-Kincaid grade level formula: 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59. Round to nearest 0.5. Map to complexity_grade_level
4. Identify domain-specific terms by comparing against general English vocabulary lists. Categorize by domain (e.g., "medical", "technical", "legal", "business"). List up to 20 domain terms
5. Identify signature words: words used with frequency > 2 per 1000 words. Calculate frequency_per_1000 for each. List up to 15 signature words
6. Assess word choice patterns by analyzing: abstract vs. concrete (count abstract nouns like "concept", "idea" vs. concrete nouns like "table", "person"), technical vs. plain language (count technical terms vs. simple synonyms), descriptive vs. minimal (count adjectives and adverbs per 100 words). Summarize as string description
7. Identify slang, colloquialisms, or informal vocabulary (e.g., "gonna", "wanna", "cool", "awesome"). List up to 10 examples
8. Evaluate vocabulary consistency by dividing sample into thirds and comparing unique_word_ratio and complexity_grade_level across thirds. If scores vary by > 2 grade levels, set consistency_assessment to "shifts_by_topic"; if vary by > 4 grade levels, set to "highly_variable"; otherwise "consistent"

**Output:**
- vocabulary_profile (object): complexity_grade_level (number), unique_word_ratio (number 0-1), domain_terms (array of strings), signature_words (array of objects with fields: word (string), frequency_per_1000 (number)), word_choice_patterns (string), slang_or_informal_usage (array of strings), consistency_assessment (string)

**Quality Gate:**
Pass if and only if ALL of the following are true:
- complexity_grade_level is a number between 0 and 20
- unique_word_ratio is a number between 0 and 1
- domain_terms is an array of 0-20 strings, each a word from cleaned_writing_sample
- signature_words is an array of 0-15 objects, each with word (string from sample) and frequency_per_1000 (number > 2)
- word_choice_patterns is a non-empty string describing patterns
- slang_or_informal_usage is an array of 0-10 strings, each a word from cleaned_writing_sample
- consistency_assessment is one of: "consistent", "shifts_by_topic", "highly_variable"

**Exit Criteria:**
- vocabulary_profile is complete with all required fields
- All word lists contain only words actually present in cleaned_writing_sample

---

### Phase 4: Sentence Structure and Syntax Analysis

**Entry Criteria:**
- cleaned_writing_sample is available
- segmented_sentences array is available

**Actions:**
1. Calculate average_sentence_length = total_words / total_sentences (from metadata)
2. Classify each sentence in segmented_sentences as simple (one independent clause), compound (two or more independent clauses joined by and/but/or/nor/yet), or complex (independent clause + dependent clause). Count each type. Calculate percentages: simple_percent, compound_percent, complex_percent (must sum to 100)
3. Assess sentence variety: if one type comprises > 70% of sentences, note as "low variety"; if one type comprises 40-70%, note as "moderate variety"; if all types are 20-50%, note as "high variety"
4. Identify punctuation preferences by counting occurrences of: em-dashes (--), semicolons (;), colons (:), parentheses (()), exclamation marks (!), question marks (?). Calculate frequency per 100 sentences for each
5. Analyze paragraph structure by calculating average_paragraph_length = total_words / total_paragraphs. Examine first sentence of each paragraph to identify topic sentences (sentences that introduce the paragraph's main idea). Count topic sentences / total paragraphs as topic_sentence_ratio
6. Analyze transitions and connectors by counting: coordinating conjunctions (and, but, or, nor, yet, so), subordinating conjunctions (because, although, while, if, since), and transitional phrases (however, furthermore, in addition, on the other hand). Calculate frequency per 100 sentences
7. Identify distinctive syntactic patterns by examining sentence structures: look for repeated patterns such as "X is not Y, but Z", lists with parallel structure, rhetorical questions, or other recurring structures. List up to 5 distinctive patterns

**Output:**
- syntax_profile (object): average_sentence_length (number), sentence_variety_breakdown (object with simple_percent, compound_percent, complex_percent as numbers summing to 100), sentence_variety_assessment (string: "low"|"moderate"|"high"), punctuation_preferences (object with em_dashes, semicolons, colons, parentheses, exclamation_marks, question_marks as frequencies per 100 sentences), paragraph_structure_patterns (string describing average length and topic sentence usage), transition_usage (string describing frequency and types), distinctive_patterns (array of 0-5 strings describing recurring syntactic patterns)

**Quality Gate:**
Pass if and only if ALL of the following are true:
- average_sentence_length is a positive number
- simple_percent + compound_percent + complex_percent = 100 (within 1% rounding error)
- Each percentage is between 0 and 100
- sentence_variety_assessment is one of: "low", "moderate", "high"
- All punctuation frequencies are non-negative numbers
- paragraph_structure_patterns is a non-empty string
- transition_usage is a non-empty string
- distinctive_patterns is an array of 0-5 strings

**Exit Criteria:**
- syntax_profile is complete with all required fields
- All percentages and frequencies are calculated from actual sample data

---

### Phase 5: Voice Signature Extraction

**Entry Criteria:**
- tone_profile is complete
- vocabulary_profile is complete
- syntax_profile is complete

**Actions:**
1. Cross-reference tone, vocabulary, and syntax profiles to identify overlapping patterns. For example: if formality_score is high AND complexity_grade_level is high AND average_sentence_length is high, note this as a consistent "formal, complex, sophisticated" voice pattern
2. Extract distinctive phrases from cleaned_writing_sample that exemplify the voice. Criteria: phrases that appear 1-2 times (not common enough to be signature words, but distinctive enough to be memorable), phrases that combine tone + vocabulary + syntax in a characteristic way. Extract up to 10 phrases
3. Identify recurring metaphors or analogies by scanning for figurative language (similes with "like" or "as", metaphors, extended metaphors). List up to 5 examples
4. Note characteristic structures that recur: patterns like "X is not Y, but Z", "If X, then Y", lists with parallel structure, or other syntactic patterns that appear 2+ times. List up to 5 structures
5. Synthesize unique markers by identifying what combination of tone + vocabulary + syntax makes this voice recognizable and distinct from generic writing. Markers should be specific to this sample, not generic (e.g., "uses em-dashes for emphasis" is generic; "uses em-dashes to create dramatic pauses in otherwise formal prose" is specific)
6. Create voice_essence_summary: 2-4 sentences that capture the essence of the voice. Summary should be specific enough that someone could recognize writing in this voice, but concise enough to fit on one page

**Output:**
- voice_signature (object): distinctive_phrases (array of objects with fields: phrase (string: direct quote from sample), context (string: 1-2 sentence description of why this phrase is distinctive)), recurring_metaphors (array of strings: direct quotes or paraphrases of metaphors), characteristic_structures (array of strings: descriptions of recurring syntactic patterns), unique_markers (array of strings: specific, distinctive markers that differentiate this voice from generic writing), voice_essence_summary (string: 2-4 sentences)

**Quality Gate:**
Pass if and only if ALL of the following are true:
- distinctive_phrases is an array of 1-10 objects, each with phrase (direct quote from sample) and context (non-empty string)
- Each phrase in distinctive_phrases is at least 3 words long and appears in cleaned_writing_sample
- recurring_metaphors is an array of 0-5 strings, each a direct quote or close paraphrase from sample
- characteristic_structures is an array of 0-5 strings, each describing a pattern that appears 2+ times in sample
- unique_markers is an array of 1-10 strings, each specific and distinctive (not generic)
- voice_essence_summary is a string of 50-200 words (2-4 sentences)
- voice_essence_summary does not use vague language like "good", "nice", "interesting", "unique" without elaboration

**Exit Criteria:**
- voice_signature is complete with all required fields
- All distinctive phrases and metaphors are verifiable in cleaned_writing_sample
- voice_essence_summary is specific and actionable

---

### Phase 6: Style Guide Synthesis

**Entry Criteria:**
- tone_profile is complete
- vocabulary_profile is complete
- syntax_profile is complete
- voice_signature is complete

**Actions:**
1. Create Tone Guidelines section (200-300 words): Describe the formality level using the reference scale (0-20 very informal, etc.). Describe emotional register (positive/negative/neutral/mixed). Describe audience awareness (does the writer address the reader directly?). Provide 3-5 actionable rules in the format "[Action]: [Rationale]". Example: "Use contractions: This creates a conversational tone that matches the informal register of the voice."
2. Create Vocabulary Rules section (200-300 words): Specify the complexity level (grade equivalent). List domain terms to use and avoid (if applicable). List signature words to incorporate (with frequency guidance). Provide 3-5 word choice principles in the format "Prefer [X] over [Y] because [reason]". Example: "Prefer 'use' over 'utilize' because the voice favors simple, direct language."
3. Create Sentence Structure Preferences section (200-300 words): Specify ideal sentence length range (e.g., "8-15 words for punchy style, 15-25 words for flowing style"). Specify sentence variety expectations (e.g., "Mix simple and complex sentences in roughly 40/60 ratio"). Provide 3-5 structural rules in the format "[Structure]: [Frequency/Guidance]". Example: "Use em-dashes for emphasis: Incorporate 1-2 per 500 words to create dramatic pauses."
4. Create Punctuation Conventions section (100-150 words): List preferred punctuation marks and their usage. Format: "[Mark]: [Usage rule]". Example: "Em-dashes: Use for emphasis or to introduce a related thought. Avoid semicolons; use em-dashes or periods instead."
5. Create Examples section (300-400 words): Provide 5-10 "Do" and "Don't" pairs showing correct vs. incorrect application of the style. Format each pair as: "**Do:** [Example sentence in correct style] **Don't:** [Example sentence in incorrect style] **Why:** [Explanation of why Do is correct]"
6. Create AI Prompting Tips section (150-200 words): Provide 3-5 ready-to-use prompt templates or instructions for prompting an AI system to write in this style. Format: "**For [AI tool name]:** [Specific prompt instruction]". Example: "**For ChatGPT:** 'Write in a conversational tone with short sentences (8-15 words). Use contractions and direct address. Avoid jargon and formal register.'"
7. Format entire guide as Markdown with clear section headers (##), bold emphasis (**text**), and code blocks for prompts if needed
8. Ensure total word count is 1500-2500 words

**Output:**
- style_guide (string): Complete Markdown-formatted style guide with all 6 sections

**Quality Gate:**
Pass if and only if ALL of the following are true:
- style_guide is a non-empty string in valid Markdown format
- style_guide contains all 6 required sections: Tone Guidelines, Vocabulary Rules, Sentence Structure Preferences, Punctuation Conventions, Examples, AI Prompting Tips
- Each section has a ## header
- Tone Guidelines section contains 3-5 actionable rules
- Vocabulary Rules section contains 3-5 word choice principles
- Sentence Structure Preferences section contains 3-5 structural rules
- Punctuation Conventions section lists at least 3 punctuation marks with usage rules
- Examples section contains 5-10 Do/Don't pairs, each with explanation
- AI Prompting Tips section contains 3-5 prompt templates
- Total word count is between 1500 and 2500 words (verified by word count)
- All examples and rules are grounded in the profiles and voice signature from previous phases
- No rule uses vague language like "good", "appropriate", "suitable" without elaboration

**Exit Criteria:**
- style_guide is complete and ready for validation
- All sections are present and well-organized
- Guide is written in clear, accessible language suitable for a non-expert audience

---

### Phase 7: Validation and Feedback Loop

**Entry Criteria:**
- style_guide is complete
- All profiles and voice_signature are available

**Actions:**
1. Generate a test prompt based on the original sample's topic or domain. Format: "Write a 200-word paragraph about [topic from original sample]. Follow these style guidelines: [extract 3-5 key rules from style_guide]. Write in the voice of the original author."
2. Execute the test prompt using a language model (GPT-4, Claude, or equivalent). Store the generated test_content_sample (200-word output)
3. Compare test_content_sample against cleaned_writing_sample across three dimensions:
   - **Tone comparison:** Calculate formality_score and emotional_valence for test_content_sample using same method as Phase 2. Compare against original tone_profile. If scores differ by > 15 points, flag as "tone mismatch"
   - **Vocabulary comparison:** Calculate complexity_grade_level and unique_word_ratio for test_content_sample using same method as Phase 3. Compare against original vocabulary_profile. If grade level differs by > 2, flag as "vocabulary mismatch"
   - **Syntax comparison:** Calculate average_sentence_length and sentence_variety_breakdown for test_content_sample using same method as Phase 4. Compare against original syntax_profile. If average sentence length differs by > 5 words, flag as "syntax mismatch"
4. Calculate confidence_score for each dimension (0-100): 100 if no mismatch, 80 if minor mismatch (within tolerance), 50 if moderate mismatch, 0 if major mismatch. Average the three dimension scores to get overall confidence_score
5. Identify gaps: list any aspects of the voice that are missing or misrepresented in the test_content_sample. For example: "Test content lacks the distinctive use of em-dashes for emphasis" or "Test content uses more formal vocabulary than original"
6. Generate refinement_recommendations: for each gap, suggest a specific revision to the style_guide. Format: "[Gap]: Revise [section] to [specific change]. Example: [revised rule]"
7. Generate validation_report with all results

**Output:**
- validation_report (object): confidence_score (integer 0-100), test_content_sample (string: 200-word generated text), gap_analysis (array of strings: 0-10 gaps identified), refinement_recommendations (array of strings: 0-10 specific suggestions), confidence_by_dimension (object with tone_confidence, vocabulary_confidence, syntax_confidence as integers 0-100)

**Quality Gate:**
Pass if and only if ALL of the following are true:
- confidence_score is an integer between 0 and 100
- test_content_sample is a string of approximately 200 words (150-250 words acceptable)
- gap_analysis is an array of 0-10 strings, each describing a specific gap
- refinement_recommendations is an array of 0-10 strings, each with format "[Gap]: Revise [section] to [change]"
- confidence_by_dimension is an object with tone_confidence, vocabulary_confidence, syntax_confidence as integers 0-100
- confidence_score = average of the three dimension confidence scores (within 1 point)
- Each gap and recommendation is specific and actionable (not vague like "improve tone")

**Exit Criteria:**
- validation_report is complete with all required fields
- If confidence_score >= 80, proceed to skill completion
- If confidence_score < 80, flag for refinement: return validation_report with note that style_guide should be refined using refinement_recommendations before final delivery

---

## Exit Criteria

The skill is DONE when ALL of the following conditions are met:
1. Phase 1 validation_status is "proceed" or "warn_low_confidence" (not "abort")
2. analysis_report is complete with all 4 profiles (tone, vocabulary, syntax, voice_signature) and all required fields populated
3. style_guide is generated with all 6 sections and word count between 1500-2500
4. validation_report is complete with confidence_score calculated
5. metadata is complete with all required fields
6. All outputs are properly typed and formatted according to output specifications
7. If confidence_score >= 80, return all outputs as final result
8. If confidence_score < 80, return all outputs with flag: "REFINEMENT_RECOMMENDED: Review refinement_recommendations and revise style_guide sections before using for AI-assisted writing"

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Sample is < 50 words | **Abort** -- Return error message: "Sample is too short (< 50 words). Minimum 50 words required. Please provide a larger sample." Stop execution. |
| Phase 1 | Sample is 50-499 words | **Adjust** -- Set validation_status to "warn_low_confidence". Continue to next phase but add note to final metadata: "Sample size is below recommended minimum (500 words). Analysis results have lower confidence." |
| Phase 1 | Sample is not English (language_detected != "English") | **Adjust** -- Continue analysis but add note to metadata: "Sample is in [language]. Analysis may be less accurate for non-English text. Proceed with caution." |
| Phase 2 | Tone is highly inconsistent (consistency_assessment = "highly_variable") | **Adjust** -- Document tone variation as a feature of the voice. In style_guide, create separate tone profiles for different sections (e.g., "Formal tone in technical sections, conversational tone in examples"). |
| Phase 3 | Vocabulary is highly technical (complexity_grade_level > 16) | **Adjust** -- Note domain expertise requirement in style_guide. Create glossary of domain terms in Vocabulary Rules section. Add note: "This voice requires domain knowledge in [domain]. AI systems may need additional context to replicate this vocabulary." |
| Phase 4 | Syntax is highly irregular (no clear patterns, sentence_variety_assessment = "high" with no dominant pattern) | **Adjust** -- Document irregularity as a feature. In style_guide, note: "This voice intentionally varies sentence structure for effect. Avoid formulaic patterns; prioritize clarity and emphasis over consistency." |
| Phase 5 | Voice signature is too generic (unique_markers contain only common patterns like "uses em-dashes" or "uses short sentences") | **Adjust** -- Dig deeper into distinctive_phrases and recurring_metaphors. If still generic, note in voice_essence_summary: "This voice has a neutral, professional register without distinctive markers. Focus on consistency rather than distinctiveness." |
| Phase 6 | Style guide exceeds 3000 words | **Adjust** -- Prioritize most distinctive elements. Remove least important sections or consolidate examples. Ensure final word count is 1500-2500. |
| Phase 7 | Validation confidence < 70 | **Adjust** -- Return validation_report with flag: "REFINEMENT_RECOMMENDED". List specific sections of style_guide to revise in refinement_recommendations. Do not mark skill as complete; suggest user review recommendations and optionally re-run Phase 7 after revisions. |
| Phase 7 | Test content generation fails (language model error or timeout) | **Retry** -- Attempt test content generation up to 2 times. If both attempts fail, **Adjust** -- Return validation_report with confidence_score = 0 and note: "Validation could not be completed due to test content generation failure. Review style_guide manually or provide feedback on AI-generated content." |

---

## Reference Section

### Formality Spectrum
- 0-20: Very informal (casual, conversational, slang-heavy, frequent contractions)
- 21-40: Informal (conversational, contractions, colloquialisms, friendly tone)
- 41-60: Neutral (balanced, neither formal nor informal, professional but accessible)
- 61-80: Formal (professional, minimal contractions, sophisticated vocabulary, structured)
- 81-100: Very formal (academic, legal, highly technical, formal register throughout)

### Complexity Grades (Flesch-Kincaid)
- 6-8: Easy (conversational, accessible, everyday language)
- 9-12: Moderate (professional, general audience, standard business writing)
- 13-15: Difficult (specialized, educated audience, technical or academic writing)
- 16+: Very difficult (academic, technical, expert audience, specialized jargon)

### Sentence Types
- **Simple:** Single independent clause ("The cat sat.")
- **Compound:** Two or more independent clauses joined by coordinating conjunction ("The cat sat, and the dog ran.")
- **Complex:** Independent clause + dependent clause ("When the cat sat, the dog ran.")

### Voice Analysis Principles
- **Tone** is how the writer feels about the subject and audience (formal, friendly, authoritative, skeptical, etc.). Tone is conveyed through word choice, sentence structure, and punctuation.
- **Vocabulary** reflects education level, domain expertise, and word choice preferences. Vocabulary includes both common words and domain-specific terms.
- **Syntax** (sentence structure) reveals how the writer organizes ideas and paces information. Syntax includes sentence length, variety, and punctuation preferences.
- **Voice** is the combination of tone + vocabulary + syntax: the writer's unique fingerprint. A recognizable voice is consistent across contexts and has distinctive markers.
- **Consistency** matters: a recognizable voice is consistent in tone, vocabulary, and syntax across different pieces of writing.
- **Distinctiveness** matters: a strong voice has markers that differentiate it from generic writing. Generic markers ("uses em-dashes") are less distinctive than specific markers ("uses em-dashes to create dramatic pauses in otherwise formal prose").

### Checklist for Style Guide Completeness
- [ ] Tone Guidelines section includes formality level, emotional register, and audience awareness with 3-5 actionable rules
- [ ] Vocabulary Rules section includes complexity level, domain terms, signature words, and 3-5 word choice principles
- [ ] Sentence Structure Preferences section includes sentence length range, variety expectations, and 3-5 structural rules
- [ ] Punctuation Conventions section lists 3+ punctuation marks with specific usage rules
- [ ] Examples section includes 5-10 Do/Don't pairs with explanations
- [ ] AI Prompting Tips section includes 3-5 ready-to-use prompt templates
- [ ] Guide is written for a non-expert audience (clear, accessible language)
- [ ] Guide is tested against original sample via validation phase
- [ ] All rules are grounded in analysis profiles and voice signature
- [ ] Total word count is 1500-2500 words

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.