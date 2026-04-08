# Five-Level Explainer

**One-line description:** Transform a technical concept into five progressively sophisticated explanations (child, teenager, college, professional, expert) that build on each other.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `technical_concept` (string, required) — The technical concept to explain. Must be specific and unambiguous. Examples: "photosynthesis", "machine learning", "blockchain", "quantum entanglement". Avoid overly broad terms like "science" or "technology".
- `domain` (string, optional) — The field or context (e.g., "biology", "computer science", "physics"). Helps calibrate terminology and reference frameworks. If not provided, will be inferred from the concept.
- `target_audience_notes` (string, optional) — Any specific constraints or prior knowledge to assume (e.g., "child has basic math", "professional works in finance", "expert familiar with recent 2023-2024 literature").

---

## Outputs

- `five_level_explanation_set` (object) — Complete explanation set with the following structure:
  - `concept` (string) — The validated, unambiguous concept statement
  - `domain` (string) — Identified field or context
  - `core_principles` (array of strings) — 2-4 fundamental ideas underlying the concept
  - `explanations` (object) — Contains all five explanations:
    - `child_explanation` (string) — For ages 6-10, 2-3 sentences, analogy-based, jargon-free
    - `teenager_explanation` (string) — For ages 13-17, 3-4 sentences, introduces 2-3 key terms
    - `college_explanation` (string) — For ages 18-22, 4-5 sentences, includes mechanisms and context
    - `professional_explanation` (string) — For practitioners, 5-6 sentences, addresses applications and trade-offs
    - `expert_explanation` (string) — For specialists, 6-8 sentences, acknowledges nuance and open questions
  - `coherence_analysis` (object) — Validation results:
    - `coherence_score` (number, 0-100) — How well the progression flows (70+ = acceptable, 85+ = excellent)
    - `gap_analysis` (array of strings) — Identified gaps or inconsistencies between levels
    - `refinement_suggestions` (array of strings) — Specific, actionable improvements
  - `metadata` (object) — Supporting information:
    - `prerequisites` (array of strings) — What audiences must know before engaging
    - `open_questions` (array of strings) — Areas of ongoing research or debate (from expert level)
    - `common_misconceptions` (array of strings) — Frequently misunderstood aspects of the concept

---

## Execution Phases

### Phase 1: Validate and Extract Core Principles

**Entry Criteria:**
- `technical_concept` is provided and non-empty
- The concept is specific enough to explain (not vague like "science" or "technology")

**Actions:**
1. Parse the technical concept and identify its core principles (the 2-4 fundamental ideas that underpin it).
2. If the concept is ambiguous (e.g., "learning" could mean machine learning, human learning, organizational learning), ask for clarification or explicitly document the interpretation being used.
3. If the concept spans multiple domains (e.g., "photosynthesis" spans biology, chemistry, and physics), identify the primary domain and note secondary domains.
4. Identify the domain if not provided; infer from the concept and context.
5. Document prerequisites: what must the audience know to understand this concept? (e.g., "photosynthesis requires understanding of plants and energy").
6. Identify 2-3 common misconceptions about this concept that will be addressed at the expert level.

**Output:**
- `validated_concept` (string) — Clarified, unambiguous concept statement
- `core_principles` (array of strings) — 2-4 fundamental ideas, distinct and non-overlapping
- `domain` (string) — Primary field or context
- `secondary_domains` (array of strings, optional) — Other relevant fields if interdisciplinary
- `prerequisites` (array of strings) — What the audience must know to understand this
- `common_misconceptions` (array of strings) — 2-3 frequently misunderstood aspects

**Quality Gate:**
- The concept is specific and unambiguous. If ambiguous, the chosen interpretation is explicitly documented.
- Core principles are distinct, non-overlapping, and collectively exhaustive (they cover the concept).
- Prerequisites are realistic and appropriate for the target audiences (child through expert).
- At least 2 common misconceptions are identified.

---

### Phase 2: Generate Child-Level Explanation

**Entry Criteria:**
- `validated_concept` and `core_principles` are defined
- Target audience is children ages 6-10

**Actions:**
1. Identify 1-2 everyday objects or experiences the child knows (toys, animals, food, weather, body parts, family roles, sports).
2. Map each core principle to a simple analogy using those objects. Ensure analogies are concrete and relatable.
3. Write 2-3 sentences using only words from a 1000-word basic vocabulary. Avoid all jargon and technical terms.
4. Keep sentences short: no sentence longer than 15 words.
5. Include a relatable "why should I care" element (e.g., "This is why plants are green" or "This is how your body gets energy").
6. Read aloud to verify simplicity and flow.

**Output:**
- `child_explanation` (string) — 2-3 sentences, analogy-based, jargon-free, age-appropriate
- `analogies_used` (array of strings) — List of objects/experiences referenced
- `vocabulary_level_check` (string) — Confirmation that all words are in basic 1000-word vocabulary

**Quality Gate:**
- No technical jargon or domain-specific terms appear in the explanation.
- Every sentence is under 15 words.
- At least one analogy is concrete and relatable to a 6-year-old's experience.
- The explanation answers "what is this?" in the simplest possible terms.

---

### Phase 3: Generate Teenager-Level Explanation

**Entry Criteria:**
- `child_explanation` is complete and passes quality gate
- Target audience is teenagers ages 13-17

**Actions:**
1. Build on the child explanation by introducing 2-3 key domain-specific terms (the vocabulary a teenager should learn).
2. Add one layer of mechanism: not just "what" but "how it works" at a basic level.
3. Write 3-4 sentences; assume the teenager has general science knowledge from school (basic biology, chemistry, physics).
4. Maintain the analogy from the child level but add technical names alongside it (e.g., "Like a factory (analogy), plants use photosynthesis (technical term) to...").
5. Define new terms implicitly through context, not with parenthetical definitions.
6. Verify that the explanation builds visibly on the child explanation: a reader should see the progression.

**Output:**
- `teenager_explanation` (string) — 3-4 sentences, introduces 2-3 key terms, builds on child level
- `new_terms_introduced` (array of strings) — Technical vocabulary added at this level
- `progression_check` (string) — Confirmation that this visibly builds on the child explanation

**Quality Gate:**
- Each new term is used in context and defined implicitly (no parenthetical definitions).
- The explanation is still accessible without prior domain knowledge.
- It visibly builds on the child explanation: the analogy is referenced or echoed, and new information is added.
- Vocabulary is appropriate for a 13-17 year old with general science knowledge.

---

### Phase 4: Generate College-Level Explanation

**Entry Criteria:**
- `teenager_explanation` is complete and passes quality gate
- Target audience is college students ages 18-22 with foundational domain knowledge

**Actions:**
1. Assume the student has taken introductory courses in the domain (e.g., high school biology, algebra, introductory physics).
2. Explain the mechanism in detail: causation, feedback loops, mathematical relationships if relevant.
3. Add context: where does this concept fit in the broader field? What problems does it solve? What are its applications?
4. Write 4-5 sentences; use standard technical terminology without defining every term (assume familiarity with domain basics).
5. Include one concrete example of how the concept applies in practice (not generic; specific enough to illustrate the mechanism).
6. Verify that the teenager-level terminology is used (not redefined) and that new information is added.

**Output:**
- `college_explanation` (string) — 4-5 sentences, explains mechanisms and context, includes one concrete example
- `context_and_applications` (string) — Where this fits in the field and what problems it solves
- `concrete_example` (string) — One specific, real-world instance of the concept in action

**Quality Gate:**
- The explanation assumes foundational domain knowledge without being condescending.
- Mechanisms are explained with sufficient detail for a student to understand the "why" and "how".
- At least one concrete, specific example is included (not generic).
- Terminology from the teenager level is used consistently and not redefined.

---

### Phase 5: Generate Professional-Level Explanation

**Entry Criteria:**
- `college_explanation` is complete and passes quality gate
- Target audience is practitioners actively working in the field

**Actions:**
1. Assume deep domain knowledge and familiarity with standard tools, methods, and debates in the field.
2. Focus on practical implications: how does this concept affect decisions, design, strategy, or implementation?
3. Acknowledge trade-offs, limitations, and alternative approaches. Be explicit about when and why this concept matters in practice.
4. Write 5-6 sentences; use specialized vocabulary and assume the reader knows related concepts.
5. Include at least one consideration of implementation, performance, cost, or real-world constraints (e.g., "In practice, this approach trades off X for Y").
6. Include one concrete, domain-specific example (e.g., a specific tool, technique, or scenario practitioners encounter).
7. Verify that the college-level mechanisms are consistent with the professional-level trade-offs (no contradictions).

**Output:**
- `professional_explanation` (string) — 5-6 sentences, addresses applications and trade-offs, includes practical considerations
- `practical_considerations` (array of strings) — 2-3 implementation notes, constraints, or design decisions practitioners face
- `concrete_professional_example` (string) — One specific, domain-relevant instance (e.g., a tool, technique, or scenario)

**Quality Gate:**
- The explanation addresses "how do I use this?" and "what are the trade-offs?" not just "what is this?"
- Trade-offs or limitations are explicitly mentioned (e.g., "This approach is efficient but requires...").
- Terminology is precise and matches industry standards.
- At least one concrete professional example is included.
- Professional-level trade-offs are consistent with college-level mechanisms (no contradictions).

---

### Phase 6: Generate Expert-Level Explanation

**Entry Criteria:**
- `professional_explanation` is complete and passes quality gate
- Target audience is researchers, specialists, and thought leaders in the field

**Actions:**
1. Assume cutting-edge knowledge of the field, familiarity with recent research (last 3-5 years), and awareness of open questions and debates.
2. Address nuance: edge cases, exceptions, or scenarios where the standard understanding breaks down.
3. Acknowledge areas of active research, debate, or uncertainty. Be explicit about what is known, what is contested, and what is unknown.
4. Write 6-8 sentences; use precise, specialized language and reference frameworks or theories by name.
5. Include at least one forward-looking statement (e.g., "Recent work suggests...", "An open question is...", "Emerging evidence indicates...").
6. Address 2-3 of the common misconceptions identified in Phase 1, explaining why they are misleading.
7. Verify that the expert-level nuance is grounded in the professional-level applications (no contradictions).

**Output:**
- `expert_explanation` (string) — 6-8 sentences, addresses nuance and open questions, includes forward-looking statements
- `open_questions` (array of strings) — 2-3 areas of ongoing research or debate
- `recent_developments` (array of strings) — 2-3 recent advances or shifts in understanding (last 3-5 years)
- `misconceptions_addressed` (array of objects) — For each common misconception: { misconception: string, correction: string }

**Quality Gate:**
- The explanation acknowledges limitations and areas of uncertainty.
- Specialized frameworks or theories are referenced by name (e.g., "X theory", "Y model").
- At least one open question or area of active research is mentioned.
- At least 2 common misconceptions are explicitly addressed and corrected.
- Expert-level nuance is grounded in professional-level applications (no contradictions).

---

### Phase 7: Validate Progression and Coherence

**Entry Criteria:**
- All five explanations are complete and pass their individual quality gates

**Actions:**
1. Read all five explanations in sequence. Does each build logically on the previous?
2. Check for consistency across all levels:
   - Is the child-level analogy referenced or echoed in the teenager explanation?
   - Are teenager-level terms used (not redefined) in the college explanation?
   - Are college-level mechanisms consistent with professional trade-offs?
   - Are professional applications grounded in expert-level nuance?
   - Do any explanations contradict each other?
3. Identify gaps: are there concepts introduced at the professional level that should have been hinted at in the college level? Are there transitions that feel abrupt?
4. Score coherence on a scale of 0-100 using this rubric:
   - 90-100: Excellent progression; each level builds seamlessly on the previous; no gaps or contradictions.
   - 80-89: Good progression; minor gaps or one slight inconsistency; overall flow is clear.
   - 70-79: Acceptable progression; one significant gap or inconsistency; reader can still follow the progression.
   - Below 70: Significant gaps or contradictions; progression is unclear; refinement needed.
5. Generate specific, actionable refinement suggestions for any gaps or inconsistencies (not "make it better"; instead, "Add X to the college explanation to bridge the gap to professional level").

**Output:**
- `coherence_score` (number, 0-100) — Score based on the rubric above
- `coherence_rationale` (string) — Explanation of the score
- `gap_analysis` (array of objects) — For each gap: { location: string (e.g., "teenager-to-college transition"), gap_description: string, impact: string }
- `consistency_check` (object) — Results of consistency checks: { analogy_consistency: boolean, terminology_consistency: boolean, mechanism_consistency: boolean, application_consistency: boolean, contradictions_found: boolean }
- `refinement_suggestions` (array of strings) — Specific, actionable improvements (e.g., "Add a sentence to the college explanation explaining feedback loops, which are referenced in the professional level")

**Quality Gate:**
- Coherence score is at least 70 (acceptable progression).
- Any gaps are documented with specific locations and impacts.
- Refinement suggestions are specific and actionable (not vague).
- If contradictions are found, the skill does not proceed to Phase 8; instead, it returns to Phase 1 with an error.

---

### Phase 8: Assemble Final Output

**Entry Criteria:**
- All previous phases are complete
- Validation passes quality gates (coherence score ≥ 70, no contradictions)
- If coherence score is below 70, refinement suggestions have been applied and Phase 7 has been re-run

**Actions:**
1. Compile all five explanations into a single structured object under the `explanations` key.
2. Compile all metadata: validated concept, domain, core principles, prerequisites, open questions, common misconceptions.
3. Compile coherence analysis: coherence score, gap analysis, refinement suggestions.
4. Format for readability: each explanation is clearly labeled with its target audience and age range.
5. Verify that all required fields are populated and the output is valid JSON.
6. Verify that a reader can immediately understand the progression from child to expert.

**Output:**
- `five_level_explanation_set` (object) — Complete, structured output with all fields populated and ready for delivery

**Quality Gate:**
- All fields in the output object are populated (no null or undefined values).
- The output is valid JSON and parseable.
- A reader can immediately understand the progression from child to expert.
- The output includes all supporting metadata (prerequisites, open questions, misconceptions).

---

## Exit Criteria

The skill is DONE when:
1. All five explanations are generated and present in the output.
2. Each explanation is appropriate for its target audience (vocabulary, length, depth, complexity).
3. The explanations form a coherent progression (each builds on the previous; coherence score ≥ 70).
4. No contradictions exist between explanations.
5. Coherence validation is complete with a score, gap analysis, and refinement notes.
6. Common misconceptions are identified and addressed at the expert level.
7. Prerequisites and open questions are documented.
8. The output is structured, labeled, and ready for delivery or publication.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Concept is too vague (e.g., "technology", "science", "data") | **Adjust** — Ask for a more specific concept or narrow the scope (e.g., "artificial intelligence" instead of "technology", "photosynthesis" instead of "biology"). Provide 2-3 examples of acceptable specificity. |
| Phase 1 | Concept is ambiguous (multiple meanings, e.g., "learning") | **Adjust** — Document the chosen interpretation explicitly and note which meaning is being explained. Example: "Explaining 'learning' as machine learning, not human learning." |
| Phase 1 | Concept spans multiple domains with equal importance | **Adjust** — Identify the primary domain and note secondary domains. Explain how the concept is being framed (e.g., "Explaining photosynthesis primarily from a biology perspective, with chemistry and physics as secondary contexts"). |
| Phase 2 | Cannot find a relatable analogy for a core principle | **Adjust** — Simplify the principle or break the concept into smaller pieces. Example: Instead of explaining "quantum superposition" directly, explain "being in two places at once" first, then introduce the quantum context. |
| Phase 3 | Teenager explanation is too complex or too simple | **Retry** — Recalibrate vocabulary and sentence length; aim for 3-4 sentences with 2-3 new terms. Test by reading aloud to a teenager or checking against a vocabulary list. |
| Phase 4 | College explanation assumes too much prior knowledge | **Adjust** — Add a brief context sentence (e.g., "Assuming you know basic calculus and introductory biology..."). Alternatively, simplify one mechanism explanation. |
| Phase 5 | Professional explanation lacks practical grounding | **Retry** — Add a concrete example of how the concept affects a real decision, design, or implementation. Example: Instead of "This approach is efficient", say "In practice, this approach reduces latency by 40% but increases memory usage by 20%". |
| Phase 6 | Expert explanation is too speculative or unclear | **Adjust** — Ground it in published research or established frameworks. Reference specific theories, models, or recent papers. If speculating, explicitly label it as such (e.g., "Emerging evidence suggests..."). |
| Phase 7 | Coherence score is below 70 | **Adjust** — Identify the specific gap using the gap analysis. Regenerate the affected explanation(s) using the refinement suggestions. Re-run Phase 7 validation. |
| Phase 7 | Explanations contradict each other | **Abort** — Review the core principles; they may be inconsistent or the concept may be poorly defined. Return to Phase 1 and restart. Example error message: "The child explanation says X is always true, but the expert explanation says X is only true under condition Y. Restart from Phase 1 to clarify the concept." |
| Phase 8 | Output is missing required fields | **Abort** — Verify that all previous phases completed successfully. Check that all outputs from Phases 1-7 are present. |

---

## Reference Section: Domain Knowledge and Decision Criteria

### Vocabulary Progression

- **Child level (ages 6-10):** Use only words from a 1000-word basic vocabulary (common nouns, verbs, adjectives). Avoid all jargon and technical terms. Examples of acceptable words: plant, animal, food, water, sun, energy, grow, move, eat, big, small, fast, slow.
- **Teenager level (ages 13-17):** Introduce 2-3 domain-specific terms. Define implicitly through context (not parenthetical definitions). Assume familiarity with basic science from school. Examples: photosynthesis, glucose, chlorophyll, algorithm, variable, molecule.
- **College level (ages 18-22):** Assume familiarity with introductory domain concepts. Use standard terminology without definition. Assume knowledge of basic math, chemistry, biology, or physics depending on domain. Examples: light-dependent reactions, gradient descent, enzyme kinetics, electromagnetic spectrum.
- **Professional level:** Use specialized vocabulary. Assume the reader knows related concepts and industry standards. Examples: non-photochemical quenching, backpropagation, Michaelis-Menten kinetics, Fourier transform.
- **Expert level:** Use precise, cutting-edge terminology. Reference frameworks and theories by name. Assume familiarity with recent research and ongoing debates. Examples: photoprotection mechanisms, attention mechanisms in transformers, allosteric regulation, quantum decoherence.

### Analogy Selection Criteria

- **Child level:** Analogies should reference objects or experiences a 6-year-old encounters daily: toys, animals, food, weather, body parts, family roles, simple machines, sports. Analogies must be concrete and relatable. Examples: "A plant is like a factory that turns sunlight into food", "Your heart is like a pump that pushes water through pipes".
- **Teenager level:** Analogies can reference school-level knowledge: basic science, sports, technology they use, social dynamics. Analogies should bridge the child-level analogy to technical terminology. Examples: "Like a factory (from child level), plants use photosynthesis (technical term) to convert sunlight into glucose".
- **College and above:** Analogies are optional; focus shifts to mechanisms, context, and applications. If used, analogies should be sophisticated and grounded in domain knowledge. Examples: "Like a lock-and-key mechanism, enzymes bind to specific substrates".

### Mechanism Depth

- **Child level:** "What happens" — Simple, observable outcomes. Example: "Plants turn sunlight into food."
- **Teenager level:** "How it works" at a basic level — Simple causation and basic processes. Example: "Plants use sunlight to turn water and air into sugar."
- **College level:** "Why it works" with mechanisms — Detailed processes, feedback loops, mathematical relationships. Example: "Photosynthesis uses light energy to drive the conversion of CO₂ and H₂O into glucose through the light-dependent reactions (in the thylakoid) and the Calvin cycle (in the stroma)."
- **Professional level:** "How to use it" with trade-offs — Practical applications, constraints, and design decisions. Example: "Photosynthetic efficiency varies by plant type and environmental conditions; C3 plants are more efficient in cool climates (higher Rubisco specificity), while C4 plants in hot climates (reduced photorespiration)."
- **Expert level:** "What we don't know" and nuance — Edge cases, exceptions, open questions, and recent developments. Example: "Recent work on photoprotection mechanisms suggests that non-photochemical quenching plays a larger role in stress response than previously understood, with implications for crop resilience under climate change."

### Coherence Checklist

- [ ] Child-level analogy is referenced or echoed in teenager explanation.
- [ ] Teenager-level terminology is used (not redefined) in college explanation.
- [ ] College-level mechanisms are consistent with professional trade-offs (no contradictions).
- [ ] Professional applications are grounded in expert-level nuance (no contradictions).
- [ ] No explanation contradicts a previous one.
- [ ] Each level adds new information (not repetition).
- [ ] Transitions between levels feel natural and logical.
- [ ] A reader can follow the progression without gaps.

### Example: Photosynthesis Across Five Levels

**Child:** "Plants are like little factories. They use sunlight to turn water and air into food so they can grow."

**Teenager:** "Photosynthesis is the process where plants use sunlight to convert water and carbon dioxide into glucose (sugar) and oxygen. This happens in the green parts of the plant called chloroplasts."

**College:** "Photosynthesis occurs in two main stages: the light-dependent reactions in the thylakoid membrane, where light energy excites electrons in chlorophyll to generate ATP and NADPH, and the light-independent reactions (Calvin cycle) in the stroma, where these energy carriers drive the fixation of CO₂ into glucose. The overall equation is 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂."

**Professional:** "Photosynthetic efficiency varies significantly by plant type and environmental conditions. C3 plants (wheat, rice) have higher Rubisco specificity for CO₂ but suffer from photorespiration in hot, dry conditions. C4 plants (corn, sugarcane) concentrate CO₂ around Rubisco, reducing photorespiration but requiring more ATP. CAM plants (cacti) open stomata at night to minimize water loss. In practice, crop selection and irrigation strategy must account for these trade-offs."

**Expert:** "Recent advances in understanding photoprotection mechanisms reveal that non-photochemical quenching (NPQ) plays a more nuanced role in stress response than the traditional 'excess energy dissipation' model suggests. Emerging evidence indicates that NPQ involves dynamic reallocation of excitation energy between photosystems and may serve regulatory functions beyond photoprotection. This has implications for engineering crop resilience under climate change, as NPQ capacity correlates with drought tolerance. Open questions include the molecular basis of NPQ memory and its interaction with circadian rhythms."

---

## State Persistence (Optional)

If this skill is used repeatedly on different concepts, consider tracking:
- **Successful analogies by domain:** Build a library of analogies that work well for each field (e.g., "factory" works well for photosynthesis, "lock-and-key" for enzymes, "traffic flow" for network protocols).
- **Common gaps:** Track which transitions (e.g., teenager-to-college) are most often flagged for refinement. Use this data to improve the skill's guidance.
- **User feedback:** If explanations are rated by readers (e.g., "Was this explanation clear?"), use ratings to improve future generations and identify domain-specific challenges.
- **Coherence patterns:** Track which domains tend to have coherence issues (e.g., physics concepts may have more nuance at the expert level; biology concepts may have more practical trade-offs at the professional level).

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.