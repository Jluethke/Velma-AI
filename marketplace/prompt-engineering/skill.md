# Prompt Engineering

Systematically design, test, and refine LLM prompts by observing task requirements, reasoning about technique selection, planning prompt structure, and iterating until output quality meets acceptance criteria.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Read the task, identify what output is needed, check constraints
REASON  --> Select technique (CoT, few-shot, structured output), choose temperature
PLAN    --> Draft prompt structure (role -> context -> task -> format -> constraints)
ACT     --> Write prompt, test it, evaluate output, iterate if needed
     \                                                              /
      +--- Act may reveal quality issues --- loop back to OBSERVE -+
```

## Inputs

- `task_description`: string -- What the prompt needs to accomplish
- `target_model`: string -- Which LLM the prompt will run on (Claude, GPT, Gemini, etc.)
- `output_requirements`: string -- Expected output format, length, quality bar
- `constraints`: string -- Budget (token limits), latency, safety requirements

## Outputs

- `prompt`: string -- The final prompt (system prompt + user prompt, or combined)
- `evaluation_criteria`: object -- Rubric for scoring prompt output quality
- `iteration_notes`: string -- What was tried, what worked, what failed

---

## Execution

### OBSERVE: Read Task, Identify Output Needs, Check Constraints

**Entry criteria:** A task description exists.

**Actions:**
1. Parse the task: What is the LLM being asked to produce? (classification, generation, analysis, extraction, transformation)
2. Identify the output format: JSON, markdown, plain text, code, structured data
3. Identify quality constraints: accuracy requirements, tone, length limits
4. Identify the target model and its capabilities (see Reference: Model-Specific Tips)
5. Identify context window constraints: how much context is available for the prompt + input + output
6. Check for existing examples of good output (for few-shot candidate selection)
7. Identify failure modes to guard against: hallucination, refusal, format violations, verbosity

**Output:** A task analysis document listing: task type, output format, quality bar, model constraints, available examples, and known failure modes.

**Quality gate:** Task type is classified. Output format is specified. At least one failure mode is identified.

---

### REASON: Select Technique, Choose Parameters

**Entry criteria:** Task analysis is complete.

**Actions:**
1. Select prompting technique using the decision tree (see Reference: Decision Tree):
   - Simple, well-defined task -> zero-shot with format instructions
   - Reasoning/math task -> chain-of-thought (see Reference: Chain-of-Thought Prompting)
   - Good examples available -> few-shot (see Reference: Few-Shot Examples)
   - Complex, multi-step -> detailed system prompt + format template
2. Choose temperature and sampling parameters (see Reference: Temperature and Sampling):
   - Deterministic tasks (code, math, extraction) -> temperature 0.0
   - Technical writing, summarization -> temperature 0.1-0.3
   - Creative tasks, brainstorming -> temperature 0.5-0.7
3. Select output structure (see Reference: Structured Output):
   - JSON for machine consumption
   - XML tags for Claude
   - Markdown tables for comparisons
4. Select failure mitigation techniques (see Reference: Failure Mode Mitigation):
   - Hallucination risk -> add grounding instructions, lower temperature, require citations
   - Over-refusal risk -> add context, reframe task, use system prompt
   - Context window pressure -> compress context, use retrieval
5. For multi-turn applications: plan context management strategy (see Reference: Multi-Turn Strategies)

**Output:** Technique selection document listing: prompting technique, temperature, output structure, failure mitigations, and multi-turn strategy (if applicable).

**Quality gate:** Technique choice is justified by task type. Temperature matches the creativity/accuracy tradeoff needed. At least one failure mitigation is selected.

---

### PLAN: Draft Prompt Structure

**Entry criteria:** Technique selection is complete.

**Actions:**
1. Draft the prompt using the 5-part framework (see Reference: The 5-Part Framework):
   - **ROLE**: Define the AI's expertise, tone, and perspective
   - **CONTEXT**: Provide background information, data, or situation
   - **TASK**: Write the specific, measurable, unambiguous instruction
   - **FORMAT**: Specify output structure, length, and style
   - **CONSTRAINTS**: List what to avoid, edge cases to handle, quality bar
2. If using few-shot: select 3-5 diverse, representative examples (see Reference: Few-Shot Examples)
   - Cover different categories and edge cases
   - Order by difficulty (simple first)
   - Include at least one negative example if relevant
3. If using chain-of-thought: add explicit reasoning steps (see Reference: Chain-of-Thought)
4. If building a system prompt: include identity, behavior, capabilities, guardrails, and fallback (see Reference: System Prompt Design)
5. If structured output: include the exact schema in the prompt

**Output:** A complete draft prompt ready for testing.

**Quality gate:** Prompt has all 5 parts (role, context, task, format, constraints). The most important instruction is placed last (recency bias). Sections are separated with delimiters.

---

### ACT: Write, Test, Evaluate, Iterate

**Entry criteria:** Draft prompt is complete.

**Actions:**
1. Run the prompt against the target model with 3-5 representative test inputs
2. Evaluate each output using the rubric (see Reference: Prompt Evaluation):
   - Accuracy: does it contain only factual information?
   - Completeness: does it address all parts of the question?
   - Clarity: is it easy to understand?
   - Format: does it follow the requested format?
   - Conciseness: appropriately concise without missing key info?
3. Score each output (1-5 on each rubric dimension)
4. If average score < 4.0 on any dimension:
   - Identify which dimension is failing
   - Adjust the relevant prompt section (add constraints, add examples, clarify task)
   - Re-test with the same inputs
5. If format violations occur: add stricter format instructions or a pre-filled response prefix
6. If hallucinations occur: add grounding constraints, lower temperature, add "only use provided information"
7. Document what was tried and what worked/failed

**Output:** Final prompt with evaluation scores and iteration notes.

**Quality gate:** Average score >= 4.0 on all rubric dimensions across test inputs. Format is consistent across all test outputs. No hallucinations on factual tasks.

---

**Loop condition:** After ACT, if the prompt fails on new test inputs or edge cases discovered during testing, loop back to OBSERVE with the new failure cases as additional context.

## Exit Criteria

The skill is DONE when:
- The prompt scores >= 4.0 on all rubric dimensions across at least 5 test inputs
- Output format is consistent (no format violations)
- Known failure modes are mitigated (hallucination, refusal, verbosity)
- The prompt, evaluation criteria, and iteration notes are documented

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Task is too vague to classify | **Escalate** -- ask user for specific output examples |
| OBSERVE | No examples available for few-shot | **Adjust** -- use zero-shot with detailed instructions instead |
| REASON | Target model unknown | **Adjust** -- use cross-model best practices, note model-specific tips to try |
| PLAN | Prompt exceeds context window | **Adjust** -- compress context, remove examples, split into multi-call chain |
| ACT | Output quality is low across all dimensions | **Retry** -- try a fundamentally different approach (switch technique), max 3 major iterations |
| ACT | Model consistently refuses the task | **Adjust** -- reframe task, add legitimate context, use system prompt (see Reference: Refusal Bypass) |
| ACT | User rejects final output | **Targeted revision** -- ask which prompt component, technique, or evaluation criterion fell short and rerun only that iteration. Do not restart from prompt zero. |

## State Persistence

Between runs, this skill saves:
- **Task analysis**: classified task type, output format, constraints
- **Prompt versions**: each prompt iteration with its scores (for A/B comparison)
- **Test inputs**: the test cases used for evaluation (for regression testing)
- **Evaluation scores**: rubric scores per version (to track improvement)

---

## Reference

### The 5-Part Framework

Every effective prompt contains these components, in this order:

```
1. ROLE        Who is the AI? (expertise, tone, perspective)
2. CONTEXT     What background does it need? (data, situation, constraints)
3. TASK        What exactly should it do? (specific, measurable, unambiguous)
4. FORMAT      How should the output look? (structure, length, style)
5. CONSTRAINTS What should it NOT do? (guardrails, limitations, edge cases)
```

#### Template

```
You are a [ROLE] who [key characteristic].

Context:
[Relevant background information, data, or situation]

Task:
[Specific instruction - what to produce]

Format:
[Output structure - JSON, markdown, bullet points, etc.]
[Length constraints - "in 2-3 sentences", "under 500 words"]

Constraints:
- [What to avoid]
- [Edge cases to handle]
- [Quality bar]
```

#### Why Order Matters

LLMs process tokens sequentially. Role and context set the "mental frame" before the task arrives. Putting constraints last ensures they're fresh in the model's attention window when it generates output. Scrambling the order degrades quality measurably.

---

### Chain-of-Thought (CoT) Prompting

#### When to Use

- **Use CoT** for: math, logic, multi-step reasoning, analysis, debugging, planning
- **Skip CoT** for: simple Q&A, creative writing, translation, formatting

#### Techniques

**Explicit CoT** -- just ask for reasoning:
```
Think step by step before answering.
```

**Structured CoT** -- define the reasoning steps:
```
Work through this problem:
1. First, identify the key variables
2. Then, determine the relationships between them
3. Next, apply the relevant formula
4. Finally, compute the answer and verify it
```

**CoT with self-verification**:
```
Solve this problem step by step.
After reaching your answer, verify it by working backward.
If the verification fails, try again.
```

#### Performance Impact

CoT typically improves accuracy by 15-40% on reasoning tasks. It adds latency and token cost. For simple tasks, it can actually hurt by overthinking.

---

### Few-Shot Examples

#### How Many

| Task Complexity | Examples Needed | Notes |
|----------------|----------------|-------|
| Simple format change | 1-2 | Just show the pattern |
| Classification | 3-5 | Cover each category |
| Complex reasoning | 3-5 | Show diverse approaches |
| Style/tone matching | 2-3 | Capture the voice |

#### Example Selection Rules

1. **Diverse**: Cover different categories, edge cases, lengths
2. **Representative**: Use realistic inputs, not toy examples
3. **Ordered by difficulty**: Simple first, complex last
4. **Include negative examples**: Show what a wrong answer looks like (sparingly)

#### Template

```
Here are examples of the task:

Input: "The product arrived broken and customer service was unhelpful"
Category: Negative
Reasoning: Product defect + poor service = clearly negative

Input: "Fast shipping but the color was slightly different than pictured"
Category: Mixed
Reasoning: Positive (shipping) + negative (color mismatch) = mixed

Input: "Exactly what I needed, will buy again"
Category: Positive
Reasoning: Satisfaction + intent to repurchase = clearly positive

Now classify this:
Input: "{user_input}"
```

#### Anti-Patterns

- All examples from the same category (model learns to always pick that one)
- Examples that are too simple (model doesn't learn edge case handling)
- More than 7 examples (diminishing returns, wastes context window)

---

### System Prompt Design

#### Anatomy of a System Prompt

```
[Identity]     Who you are, your expertise, your name
[Behavior]     How you communicate, your tone, your style
[Capabilities] What you can do, what tools you have
[Format]       Default output structure
[Guardrails]   What you must never do, safety constraints
[Fallback]     What to do when unsure or out of scope
```

#### Example: Customer Support Bot

```
You are Alex, a customer support specialist for TechCorp.

Behavior:
- Friendly but professional. Never sarcastic.
- Acknowledge the customer's frustration before solving.
- Use the customer's name when available.

Capabilities:
- You can look up orders, process refunds, and escalate to managers.
- You have access to the product catalog and FAQ.

Format:
- Keep responses under 150 words.
- Use bullet points for multi-step instructions.
- End with a clear next step or question.

Guardrails:
- Never share internal policies or pricing logic.
- Never make promises about timelines you can't guarantee.
- If asked about competitors, redirect to TechCorp's features.

Fallback:
- If you don't know the answer: "Let me connect you with a specialist who can help with that."
- If the request is outside your scope: Explain what you can help with instead.
```

---

### Temperature and Sampling

#### Decision Matrix

| Temperature | Use Case | Why |
|-------------|----------|-----|
| 0.0 | Code generation, math, extraction, classification | Deterministic, reproducible |
| 0.1-0.3 | Technical writing, summarization, Q&A | Slight variation, still accurate |
| 0.5-0.7 | Creative writing, brainstorming, marketing copy | Balance of creativity and coherence |
| 0.8-1.0 | Poetry, story generation, diverse idea generation | Maximum creativity, more risk |

#### Top-p (Nucleus Sampling)

- **top_p = 0.9**: Safe default for most tasks
- **top_p = 0.5**: More focused, fewer surprising tokens
- **top_p = 1.0**: Full vocabulary available

**Rule of thumb**: Adjust temperature OR top_p, not both simultaneously. Start with temperature.

---

### Structured Output

#### JSON Mode

```
Respond with valid JSON matching this schema:

{
  "sentiment": "positive" | "negative" | "neutral",
  "confidence": 0.0 to 1.0,
  "key_phrases": ["string", ...],
  "summary": "string (max 100 chars)"
}

Do not include any text outside the JSON object.
```

#### XML Tags (Claude-Preferred)

```
Put your analysis inside XML tags:

<analysis>
<sentiment>positive</sentiment>
<confidence>0.85</confidence>
<key_phrases>
<phrase>fast shipping</phrase>
<phrase>great quality</phrase>
</key_phrases>
<summary>Customer satisfied with product and delivery</summary>
</analysis>
```

#### Markdown Tables

```
Format your comparison as a markdown table:

| Feature | Option A | Option B | Winner |
|---------|----------|----------|--------|
| ...     | ...      | ...      | ...    |

Include at least 5 comparison points.
```

---

### Failure Mode Mitigation

#### Hallucination Reduction

```
Techniques (stack these):
1. "Only use information from the provided context"
2. "If you're unsure, say 'I don't have enough information'"
3. "Cite the specific section/paragraph for each claim"
4. Lower temperature (0.0-0.2)
5. RAG: Retrieve relevant docs and inject them into the prompt
6. "Do not make up statistics, dates, or names"
```

#### Refusal Bypass (When the Model Over-Refuses)

```
The model refuses a legitimate request:
1. Add context: "I am a security researcher testing our own system"
2. Reframe: Instead of "How to hack X" -> "What security vulnerabilities should I test for in X?"
3. Be specific: Vague requests trigger more refusals than specific ones
4. Use system prompt: "You are a cybersecurity consultant helping a client audit their system"
```

#### Context Window Management

```
When approaching the context limit:
1. Summarize earlier conversation: "Here's a summary of our discussion so far: ..."
2. Drop irrelevant examples: Keep only the most relevant few-shot examples
3. Compress context: "Key facts: [bullet list]" instead of full documents
4. Use retrieval: Only inject the relevant chunks, not entire documents
5. Chain calls: Break the task across multiple API calls
```

---

### Multi-Turn Strategies

#### Context Summarization

After every 5-10 turns, inject a summary:
```
[System: Conversation summary so far:
- User is building a REST API in Python
- We decided on FastAPI + PostgreSQL
- Authentication will use JWT
- We've completed the user model and auth endpoints
Current topic: Setting up the orders endpoint]
```

#### Memory Injection

```
Before responding, consider these relevant facts about the user:
- They prefer TypeScript over JavaScript
- They work at a startup with 5 engineers
- Their system handles ~10K requests/minute
- They previously had issues with Redis connection pooling
```

#### Conversation Steering

```
When the conversation drifts:
1. Acknowledge: "That's a great point about X."
2. Bridge: "That connects to what we were discussing about Y."
3. Redirect: "Let's come back to our main goal of Z. Specifically..."
```

---

### Prompt Evaluation

#### Automated Evaluation with Rubrics

```python
rubric = {
    "accuracy": "Does the response contain only factual information? (1-5)",
    "completeness": "Does it address all parts of the question? (1-5)",
    "clarity": "Is it easy to understand? (1-5)",
    "format": "Does it follow the requested format? (1-5)",
    "conciseness": "Is it appropriately concise without missing key info? (1-5)"
}

# Use a second LLM call to evaluate:
eval_prompt = f"""
Rate the following response on this rubric:
{rubric}

Question: {question}
Response: {response}

Return scores as JSON: {{"accuracy": N, "completeness": N, ...}}
"""
```

#### A/B Testing

```
1. Create two prompt variants (change ONE thing)
2. Run both on the same 50+ test inputs
3. Score outputs with your rubric
4. Use the variant with higher average score
5. Repeat: change the next thing
```

#### Regression Testing

```
Maintain a test suite of (input, expected_output) pairs.
Run it whenever you change the prompt.
If any test regresses, investigate before shipping.
```

---

### Model-Specific Tips

#### Claude (Anthropic)
- Loves XML tags for structured input/output
- Extended thinking with `<thinking>` tags for complex reasoning
- Respects system prompts strongly -- put guardrails there
- Handles very long contexts well (200K tokens)
- Prefill the assistant response to steer format: `Assistant: {"result":`

#### GPT (OpenAI)
- Function calling / tool use for structured output
- JSON mode via `response_format: { type: "json_object" }`
- Seed parameter for reproducibility
- Strong at following detailed instructions in system prompt

#### Gemini (Google)
- Grounding with Google Search for factual queries
- Multimodal: can process images, video, audio natively
- Structured output via response schemas
- Context caching for repeated prefixes

#### General Cross-Model Rules
- Shorter prompts generally work better than longer ones (if equally clear)
- Put the most important instruction last (recency bias)
- Use delimiters (```, ---, XML tags) to separate sections
- Test on your actual use cases, not benchmarks

---

### Decision Tree: Choosing the Right Technique

```
Is the task simple and well-defined?
  YES -> Zero-shot with format instructions
  NO  -> Is it a reasoning/math task?
           YES -> Chain-of-thought
           NO  -> Do you have examples of good output?
                    YES -> Few-shot (3-5 examples)
                    NO  -> Detailed system prompt + format template
```

---

### Common Patterns Quick Reference

| Pattern | When | Example |
|---------|------|---------|
| Role assignment | Always | "You are a senior data engineer" |
| Output format | Always | "Respond as JSON" |
| Step-by-step | Reasoning tasks | "Think step by step" |
| Few-shot | Classification, formatting | "Here are 3 examples:" |
| Negative examples | Common mistakes | "Do NOT include..." |
| Self-verification | Math, logic | "Verify your answer" |
| Confidence scores | Uncertain tasks | "Rate your confidence 1-10" |
| Decomposition | Complex tasks | "Break this into subtasks" |
