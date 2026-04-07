# Explain Anything

Takes any topic -- quantum physics, mortgage rates, how engines work, what the Fed does, why the sky is blue -- and explains it at whatever level you need. You pick the complexity: "explain like I'm 10", "explain like I'm a curious adult", or "explain like I'm studying for an exam." Uses analogies from everyday life, avoids jargon, and checks understanding with follow-up questions. The universal "I don't get it" fixer.

## Execution Pattern: ORPA Loop

## Inputs
- topic: string -- The thing you want to understand (a word, phrase, concept, headline, or question)
- level: string -- Target comprehension level: "child" (ages 8-12), "teen" (13-17), "curious adult" (general public), "student" (studying the subject), "professional" (deep technical detail)
- context: string -- (Optional) Why you want to understand this ("saw it in the news", "my kid asked me", "job interview prep", "homework help")
- prior_knowledge: string -- (Optional) What you already know about the topic, so the explanation builds on your existing understanding
- format_preference: string -- (Optional) Preferred format: "short answer" (2-3 paragraphs), "full lesson" (with sections and examples), "analogy only" (just the metaphor), "ELI5" (absolute simplest terms)

## Outputs
- explanation: object -- The core explanation at the requested level, structured with a hook, the main concept, supporting details, and a real-world connection
- analogies: array -- 2-3 everyday analogies that map the unfamiliar concept to familiar experience
- common_misconceptions: array -- What most people get wrong about this topic and why
- follow_up_questions: array -- 3-5 questions to check understanding and prompt deeper exploration
- further_reading: array -- (Optional) Suggested next topics or resources if the user wants to go deeper

## Execution

### OBSERVE: Understand the Request
**Entry criteria:** A topic is provided in any form (single word, full question, pasted headline, "what does X mean").
**Actions:**
1. Parse the topic to identify the core concept. If ambiguous ("bank" could be financial or river), ask for clarification or explain both.
2. Assess the requested level. If none specified, default to "curious adult." If the context suggests a different level (e.g., "my 9-year-old asked"), adjust accordingly.
3. Identify prerequisite concepts the user might need. If explaining "inflation," they may need "supply and demand" first.
4. Check for common confusions: topics that sound similar but are different (affect vs. effect, APR vs. interest rate, virus vs. bacteria).
5. Note any emotional or political sensitivity around the topic (climate change, vaccines, economic policy) and prepare a factual, balanced framing.

**Output:** Parsed topic, confirmed level, prerequisite chain, sensitivity flags.
**Quality gate:** Core concept is unambiguous. Level is explicitly set. Prerequisites identified.

### REASON: Build the Explanation Architecture
**Entry criteria:** Topic and level confirmed.
**Actions:**
1. Design the explanation structure using the inverted pyramid: lead with the most important takeaway, then add layers of detail.
2. Select analogies appropriate to the level:
   - Child: playground, sports, food, family, video games.
   - Teen: social media, money, school, relationships.
   - Adult: work, household, driving, cooking, finances.
   - Student/Professional: cross-domain technical parallels.
3. Identify the "aha moment" -- the single insight that makes the concept click. Build the explanation around reaching this moment.
4. Plan for common misconceptions: what do people usually get wrong, and how do you preemptively address it without confusing the explanation?
5. For multi-step concepts (how a bill becomes law, how encryption works), break into numbered steps where each step builds on the previous one.
6. Calibrate vocabulary: child level uses no words over 3 syllables where avoidable. Student level uses proper terminology but defines each term on first use.
7. Prepare follow-up questions that test genuine understanding, not just recall ("Why does this matter?" not "What did I just say?").

**Output:** Explanation outline with hook, core concept, analogy map, misconception list, follow-up questions.
**Quality gate:** Explanation passes the "could my target audience repeat this back to someone else?" test. No jargon left undefined.

### PLAN: Assemble the Explanation
**Entry criteria:** Architecture complete.
**Actions:**
1. Write the hook: a relatable question or scenario that makes the topic feel relevant ("Ever wonder why your savings account barely grows while everything gets more expensive?").
2. Deliver the core concept in 2-4 sentences. This is the answer to "what is it?" at the chosen level.
3. Expand with the primary analogy. Walk through the analogy step by step, mapping each part of the analogy to the real concept.
4. Add supporting details: how it works, why it matters, where you encounter it in daily life.
5. Address the top 1-2 misconceptions: "A lot of people think X, but actually Y, because Z."
6. Include a "so what?" section: why this knowledge is useful or interesting to the specific user.
7. If prerequisites were needed, weave them in naturally rather than as a separate section ("Before we get to quantum entanglement, let's make sure we're on the same page about what particles are").

**Output:** Complete explanation draft at target level.
**Quality gate:** No undefined jargon. At least one analogy grounded in everyday experience. Misconceptions addressed. "So what?" is answered.

### ACT: Deliver and Check Understanding
**Entry criteria:** Explanation draft passes quality gates.
**Actions:**
1. Deliver the explanation in the requested format (short answer, full lesson, analogy only, or ELI5).
2. Present follow-up questions to check understanding: "Does that make sense? Here are a few questions to test it..."
3. Offer depth options: "Want me to go deeper on any part of this?" or "Want the more technical version?"
4. If the user says "I still don't get it," try a completely different analogy rather than repeating the same explanation louder.
5. If the user wants to go deeper, move up one level (child to teen, teen to adult, etc.) and re-run the REASON phase with the new level.

**Output:** Final explanation, understanding checks, and depth options.
**Quality gate:** User can articulate the concept back. No lingering confusion on core idea.

## Exit Criteria
Done when: (1) the core concept is explained at the requested level, (2) at least one everyday analogy is provided, (3) common misconceptions are addressed, (4) follow-up questions are offered, (5) user confirms understanding or requests a different angle.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Topic is too vague ("explain science") | Adjust -- ask user to narrow down: "Science is huge! What specifically? How cells work? Why planes fly? How vaccines work?" |
| OBSERVE | Topic is ambiguous (multiple meanings) | Adjust -- present the options: "Do you mean X (the financial term) or Y (the scientific term)?" |
| REASON | No good analogy exists for the target level | Adjust -- use a step-by-step walkthrough instead of analogy. Some concepts are better shown than compared |
| REASON | Topic requires extensive prerequisites | Adjust -- build a mini prerequisite explanation first, clearly labeled: "To understand X, we first need to cover Y" |
| PLAN | Explanation is too long for requested format | Adjust -- cut to the core insight and single best analogy. Offer the full version as a follow-up |
| ACT | User says "I still don't get it" after explanation | Retry -- try a completely different analogy from a different domain. If second attempt fails, break the concept into smaller pieces |

## State Persistence
- User's comprehension level history (track which levels work best for this person)
- Topics previously explained (avoid repeating, build on prior explanations)
- Analogies that resonated (reuse the same analogy style: sports person gets sports analogies)
- Misconceptions the user held (track corrections to reinforce in future topics)
- Preferred format (some users always want ELI5, others want the full lesson)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.