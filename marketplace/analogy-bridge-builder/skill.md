# Analogy Bridge Builder

**One-line description:** Transform abstract or difficult concepts into intuitive understanding by generating domain-specific analogies from a user's existing knowledge.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `struggling_concept` (string, required): The concept, idea, or skill the user finds confusing or difficult to grasp. Should include what specifically is hard about it.
- `user_knowledge_domains` (string[], required): List of 3-5 domains, fields, or areas where the user has existing expertise or comfort (e.g., "cooking", "software engineering", "gardening", "sports").
- `concept_context` (string, optional): Additional context about why the user needs to understand this concept (learning goal, application domain, motivation).
- `analogy_style_preference` (string, optional): Preferred tone or depth ("simple and quick", "detailed and technical", "playful and creative"). Defaults to "clear and accessible".

## Outputs

- `clarified_concept` (object): Structured understanding of the struggling concept with keys: concept_name (string), core_definition (string), key_attributes (string[]), pain_points (string[]), intended_application (string).
- `domain_inventory` (object[]): User's knowledge domains with keys: domain_name (string), expertise_level (string: novice/intermediate/expert), key_mechanisms (string[]), relevance_score (number: 1-10).
- `analogy_bridges` (object[]): 3-5 analogies, each with keys: source_domain (string), analogy_text (string), boundary_conditions (string[]), confidence_level (string: high/medium/low), confidence_justification (string).
- `integrated_explanation` (string): Synthesized explanation (3-5 paragraphs, readable in 2-3 minutes) that weaves analogies together into a coherent mental model, explicitly returning to the original struggling concept.
- `confidence_assessment` (object): Keys: strongest_analogies (string[]), weakest_analogies (string[]), contradictions_resolved (boolean), overall_readiness (string: ready_to_use/needs_refinement), notes (string).

---

## Execution Phases

### Phase 1: Clarify the Struggling Concept

**Entry Criteria:**
- `struggling_concept` input is provided.
- The concept is stated in plain language (not a single word without context).

**Actions:**
1. Parse the struggling concept statement to identify: the core idea, what makes it hard, what the user wants to do with it.
2. Extract key attributes: Is it abstract or concrete? Does it involve relationships, sequences, hierarchies, or transformations?
3. Identify the user's pain point: Is it the terminology, the underlying logic, the application, or the relationship to other concepts?
4. Restate the concept in multiple ways to ensure clarity.
5. Document the intended application: How will the user use this understanding?

**Output:**
- `clarified_concept` object containing: concept_name, core_definition (1-2 sentences, no jargon), key_attributes (list of 3+), pain_points (explicit descriptions, not vague), intended_application.

**Quality Gate:**
- The clarified concept is stated in 1-2 sentences without jargon, verified by reading aloud to check for technical terms.
- At least 3 key attributes are identified and listed separately.
- Each pain point is explicit and specific (e.g., "user struggles with why X relates to Y", not "user finds it hard").
- Intended application is stated as a concrete use case or learning goal.

---

### Phase 2: Discover User Knowledge Domains

**Entry Criteria:**
- `user_knowledge_domains` input is provided with at least 3 domains.
- Domains are concrete and specific (not "science" or "life", but "biology", "cooking", "music theory").

**Actions:**
1. For each domain, identify: what mechanisms or structures does the user understand in this domain? What are the rules, relationships, or patterns?
2. Probe for implicit domains: Ask "What do you do for fun?", "What was your first job?", "What do you explain to others?" to surface tacit expertise.
3. For each domain, assess expertise level (novice/intermediate/expert) based on depth of understanding.
4. Note which domains have structural parallels to the struggling concept (e.g., if the concept involves hierarchy, look for domains with clear hierarchies).
5. Rank domains by relevance and richness (how much detail can be drawn from each).

**Output:**
- `domain_inventory` array with objects: domain_name, expertise_level, key_mechanisms (list of 2+), relevance_score (1-10 scale, where 10 is highly relevant to the struggling concept).

**Quality Gate:**
- Each domain has at least 2 identified mechanisms or structures, listed explicitly.
- At least 2 domains are marked with relevance_score of 6 or higher.
- Domains are diverse (not all technical, not all abstract, not all from the same category).
- No domain is named with abstract terms ("science", "thinking"); all are concrete and specific.

---

### Phase 3: Map Structural Similarities

**Entry Criteria:**
- Clarified concept with key attributes is available.
- Domain inventory with mechanisms is available.

**Actions:**
1. For each key attribute of the struggling concept, search the user's domains for analogous structures or mechanisms.
2. Create candidate bridges: "Concept attribute X is like Domain Y's mechanism Z because both involve [shared structure]."
3. Assess each bridge for structural strength: Does the analogy preserve the essential logic? Are there misleading aspects? Rate as strong/moderate/weak based on structural isomorphism.
4. Identify and document any misleading aspects and mitigation strategies (e.g., "This analogy breaks down when X; we'll address that in Phase 4").
5. Select the 3-5 strongest bridges (prioritize strong and moderate, exclude weak).

**Output:**
- `analogy_bridges` array (preliminary) with: source_domain, concept_attribute_being_mapped, mechanism_in_domain, structural_similarity_explanation, strength_rating (strong/moderate/weak), misleading_aspects (if any).

**Quality Gate:**
- Each bridge has a clear, stated reason for the mapping (structural isomorphism explanation, not intuitive guessing).
- At least 3 bridges are identified and rated strong or moderate.
- All weak bridges are either refined or excluded; no weak bridges proceed to Phase 4.
- Misleading aspects are documented with explicit mitigation strategies.

---

### Phase 4: Construct Detailed Analogies

**Entry Criteria:**
- Analogy bridges are identified, ranked, and filtered (weak bridges excluded).

**Actions:**
1. For each selected bridge, write a full analogy: "In [domain], [mechanism] works like this: [concrete example]. Similarly, in [concept], [attribute] works like this: [concrete example]. The key parallel is [shared structure]."
2. For each analogy, explicitly state where it breaks down: "This analogy doesn't hold when [boundary condition], because [reason]."
3. Identify at least 1 boundary condition per analogy; list multiple if applicable.
4. Add a confidence note: Is this analogy rock-solid (high), or does it require some interpretive leeway (medium/low)?
5. Ensure each analogy is 2-4 sentences of explanation, not a paragraph; test readability with non-expert language.

**Output:**
- `analogy_bridges` array (final) with: source_domain, analogy_text (2-4 sentences, plain language), boundary_conditions (list of 1+), confidence_level (high/medium/low), confidence_justification (e.g., "high confidence: the structures are isomorphic" vs. "medium confidence: requires accepting a simplification").

**Quality Gate:**
- Each analogy is stated in plain language, accessible to someone unfamiliar with the domain (verified by checking for domain-specific jargon).
- Boundary conditions are explicit and numbered (not assumed or vague).
- Confidence levels are justified with specific reasoning, not generic statements.
- No analogy exceeds 4 sentences; all are concise and readable.
- At least 2 analogies are marked high confidence.

---

### Phase 5: Validate and Refine

**Entry Criteria:**
- Detailed analogies are written with boundary conditions and confidence levels.

**Actions:**
1. Test each analogy against the clarified concept: Does it explain the pain point? Does it preserve the core logic? Rate as valid/partially_valid/invalid.
2. Check for contradictions: Do two analogies conflict with each other, or do they complement? Document as complementary or contradictory.
3. For contradictory analogies: Determine if they represent different aspects of the concept (keep both with explicit note) or if one is misleading (refine or remove the weaker one).
4. Identify any analogies marked invalid or low confidence, and either refine them (rewrite boundary conditions, simplify, choose different domain) or remove them.
5. Assign a final confidence level to each analogy after refinement.
6. Confirm that at least 3 analogies remain after validation.

**Output:**
- `confidence_assessment` object with keys: strongest_analogies (list of domain names for high-confidence analogies), weakest_analogies (list of domain names for medium/low-confidence analogies), contradictions_resolved (boolean: true if all contradictions are addressed), overall_readiness (string: ready_to_use or needs_refinement), notes (string describing key strengths and any remaining limitations).

**Quality Gate:**
- No analogy is marked low confidence without a clear reason documented in the notes.
- At least 2 analogies are marked high confidence after refinement.
- All contradictions between analogies are resolved (either removed, refined, or explicitly noted as complementary).
- At least 3 analogies remain after validation.
- overall_readiness is set to "ready_to_use" only if at least 3 analogies are high or medium confidence and no unresolved contradictions exist.

---

### Phase 6: Synthesize into Integrated Explanation

**Entry Criteria:**
- Validated analogies with confidence assessments are available.
- At least 3 analogies are marked ready for use.

**Actions:**
1. Order the analogies from simplest to most detailed, or from most intuitive to most precise, depending on the user's learning style and the analogy_style_preference input.
2. Write a synthesis that: (a) introduces the struggling concept and its pain point, (b) uses the analogies progressively to build understanding, (c) concludes with the core insight.
3. Use transitions that show how each analogy adds to the previous one ("Building on that...", "Similarly...", "Taking this further...", "In contrast...").
4. End with a summary statement that explicitly ties the analogies back to the original struggling concept and the intended application.
5. Verify readability: The explanation should be understandable in 2-3 minutes of reading; count words and adjust if necessary (target: 300-600 words).

**Output:**
- `integrated_explanation` string: A 3-5 paragraph explanation (300-600 words) that weaves analogies together, uses clear transitions, and explicitly returns to the original struggling concept and its application.

**Quality Gate:**
- The explanation is readable in 2-3 minutes (approximately 300-600 words).
- A reader unfamiliar with the concept can articulate the core idea in their own words after reading (verified by asking "What is the main point?" or similar).
- The explanation explicitly returns to the original struggling concept by name and references the intended application.
- All high-confidence analogies are included; medium-confidence analogies are included with appropriate caveats.
- Transitions between analogies are smooth and show how each builds on the previous one.

---

## Exit Criteria

The skill is complete when:
1. The struggling concept is clarified with explicit pain points and intended application.
2. User knowledge domains are inventoried with identified mechanisms and relevance scores of 6+.
3. At least 3 analogy bridges are constructed, validated, and marked ready for use.
4. Each analogy has explicit boundary conditions (1+) and a confidence level (high/medium/low) with justification.
5. An integrated explanation synthesizes the analogies into a coherent mental model (3-5 paragraphs, 300-600 words).
6. The integrated explanation explicitly returns to the original struggling concept and intended application.
7. A reader unfamiliar with the concept can articulate the core idea in their own words after reading the integrated explanation.
8. The confidence_assessment confirms overall_readiness as "ready_to_use" with no unresolved contradictions.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Struggling concept is too vague (e.g., "I don't get quantum mechanics") | **Adjust** -- Ask for a specific aspect: "What part confuses you? The superposition? The measurement problem? The math?" Narrow to one attribute and re-run Phase 1. |
| Phase 2 | User provides fewer than 3 knowledge domains | **Adjust** -- Prompt for additional domains: "What hobbies, sports, or professional skills do you have? What do you explain to others?" Expand to at least 3 concrete domains. |
| Phase 2 | User's domains are too abstract or vague (e.g., "science", "thinking") | **Adjust** -- Request concrete domains: "Instead of 'science', do you mean biology, chemistry, or physics? What have you actually worked with?" Restate domains specifically. |
| Phase 3 | No structural similarities found between concept and domains (fewer than 3 bridges identified) | **Adjust** -- Revisit the concept's key attributes: Are they stated correctly? Are there hidden attributes? Revisit the domains' mechanisms: Are they detailed enough? If still no match, request additional domains or clarify the concept further. |
| Phase 4 | Analogies are too complex or require domain expertise to understand | **Adjust** -- Simplify the analogy by removing technical details, or choose a different domain. Test with a non-expert: Can they understand the analogy without domain knowledge? |
| Phase 5 | Two analogies contradict each other and cannot be reconciled | **Adjust** -- Determine if they represent different aspects of the concept (complementary) or if one is misleading. Remove or refine the weaker one (lower confidence level). Confirm at least 3 analogies remain. |
| Phase 5 | Fewer than 3 analogies remain after validation | **Abort** -- Insufficient analogies to proceed. Return to Phase 3 and identify additional bridges, or request additional user knowledge domains. |
| Phase 6 | Integrated explanation exceeds 5 paragraphs or 600 words | **Adjust** -- Consolidate analogies. Remove the lowest-confidence analogy or merge two related ones. Rewrite for conciseness. |
| Phase 6 | Integrated explanation does not explicitly return to the original struggling concept | **Adjust** -- Add a closing paragraph that names the original concept, restates the core insight, and connects it to the intended application. |
| ACT | User rejects the analogies or says they don't help them understand the concept | **Adjust** -- Incorporate specific feedback (e.g., the source domain is unfamiliar, the boundary conditions are too restrictive, the explanation is too long), replace the weakest analogy with one from a different knowledge domain, and regenerate only the integrated explanation; do not restart from Phase 1 unless the struggling concept was misidentified |
| ACT | User rejects final output | **Targeted revision** -- ask which analogy, knowledge domain, or bridge explanation fell short and rerun only that section. Do not regenerate all analogies. |

---

## Reference Section: Domain Knowledge and Decision Criteria

### Analogy Strength Criteria

An analogy is strong if:
- **Structural isomorphism:** The relationships in the source domain mirror the relationships in the target concept. Example: If the concept involves feedback loops, the source domain should have clear feedback mechanisms.
- **Intuitive accessibility:** The user already understands the source domain deeply enough to reason about it without additional explanation.
- **Boundary clarity:** The limits of the analogy are explicit and don't mislead. Example: "This analogy works for X but breaks down for Y because..."
- **Explanatory power:** The analogy directly addresses the user's pain point. Example: If the user struggles with why A relates to B, the analogy should clarify that relationship.

### Analogy Weakness Indicators

An analogy is weak if:
- It requires the user to learn the source domain first (defeats the purpose).
- It preserves surface similarity but not underlying logic (e.g., "a computer is like a brain" because both are complex, but the mechanisms are fundamentally different).
- Its boundary conditions are so restrictive that the analogy becomes unhelpful (e.g., "This works only if you ignore X, Y, and Z").
- It introduces new jargon or complexity without clarifying the original concept.

### Synthesis Principles

- **Layering:** Start with the simplest, most intuitive analogy. Build toward more precise or technical analogies. This scaffolds understanding progressively.
- **Complementarity:** Use multiple analogies to illuminate different facets of the concept. Example: For "recursion", use a mirror analogy (structure) and a Russian nesting doll analogy (self-similarity).
- **Convergence:** End by showing how all analogies point to the same core insight. Example: "All three analogies show that X is fundamentally about Y."

### Common Pitfalls

- **Over-extension:** Pushing an analogy beyond its structural limits (e.g., "a computer is like a brain" breaks down when discussing memory, processing speed, or consciousness).
- **Jargon smuggling:** Using domain-specific terms in the analogy without explaining them (e.g., "like a recursive function" assumes the user knows what recursion is).
- **False precision:** Implying the analogy is exact when it's approximate. Always state boundary conditions.
- **Ignoring contradictions:** Using two analogies that suggest opposite conclusions without reconciling them. Example: "X is like a wave" and "X is like a particle" require explicit explanation of when each applies.

### Feedback Loop for Continuous Improvement

After presenting the integrated explanation, gather feedback:
1. Ask the user: "Which analogy was most helpful? Which was confusing?"
2. Ask: "Can you explain the concept in your own words now?"
3. Use feedback to refine analogies for future runs with the same user or similar concepts.
4. Track which analogies are most effective per concept to build a knowledge base of best analogies.

---

## State Persistence (Optional)

If this skill is used repeatedly with the same user:
- Track which domains and analogy styles are most effective for that user.
- Build a profile of the user's learning preferences (simple vs. detailed, playful vs. technical, visual vs. abstract).
- Over time, accelerate future analogy generation by prioritizing domains and styles that have worked well.
- Maintain a log of analogies generated for each concept to avoid repetition and identify patterns in what works.