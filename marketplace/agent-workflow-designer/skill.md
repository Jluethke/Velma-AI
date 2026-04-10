# Agent Workflow Designer

Design multi-agent systems from goal definition to deployment-ready specifications. Decompose objectives into agent roles and responsibilities, design inter-agent communication and state management, generate agent definitions with tool configurations and routing rules, and validate execution paths including failure modes and recovery.

## Execution Pattern: Phase Pipeline

```
PHASE 1: GOAL       --> Define what the agent system should accomplish
PHASE 2: DECOMPOSE  --> Break into agent roles, responsibilities, handoff points
PHASE 3: DESIGN     --> Design agent communication, state management, error recovery
PHASE 4: IMPLEMENT  --> Generate agent definitions, tool configs, routing rules
PHASE 5: VALIDATE   --> Trace execution paths, verify completeness, test failure modes
```

## Inputs

- `goal_description`: string -- What the agent system should accomplish, including success criteria
- `constraints`: object (optional) -- Budget limits (API calls, tokens), latency requirements, security boundaries, human-in-the-loop requirements
- `available_tools`: string[] (optional) -- Tools/APIs available for agents to use (code execution, web search, file I/O, databases, etc.)
- `existing_agents`: object (optional) -- Already-defined agents to incorporate or build upon
- `performance_history`: object (optional) -- Metrics from previous versions of this workflow for optimization

## Outputs

- `goal_decomposition`: object -- Task breakdown with dependencies, complexity estimates, and skill requirements per task
- `agent_architecture`: object -- Topology diagram, agent roles, communication channels, state management approach
- `workflow_design`: object -- Execution flow with handoff protocols, error recovery, and human-in-the-loop points
- `agent_definitions`: object -- Per-agent specs: system prompt, tools, input/output schemas, routing rules
- `validation_report`: object -- Execution path traces, completeness check, failure mode analysis, performance estimates

---

## Execution

### Phase 1: GOAL -- Define the System Objective

**Entry criteria:** A goal description is provided that describes what the agent system should accomplish.

**Actions:**

1. **Clarify the goal:**
   - What is the input to the system? (what triggers it)
   - What is the output? (what does "done" look like)
   - What are the success criteria? (measurable outcomes)
   - What are the constraints? (budget, time, quality, security)

2. **Scope the system:**
   - Is this a one-shot workflow (triggered, runs, completes) or a persistent system (always running, responding to events)?
   - What is the expected input volume? (1/day vs 1000/minute)
   - What is the required latency? (seconds, minutes, hours)
   - Is determinism required? (same input must produce same output)

3. **Identify human-in-the-loop requirements:**
   - Which decisions require human approval? (see Reference: Human-in-the-Loop Decision Framework)
   - What is the escalation path when an agent is uncertain?
   - What is the maximum autonomous action scope? (can agents make irreversible changes?)
   - Where should humans be notified vs where must they approve?

4. **Define the acceptance test:**
   - Write 3-5 concrete scenarios the system must handle correctly
   - Include: happy path, edge case, error case, adversarial input
   - These become the validation scenarios in Phase 5

**Output:** Goal specification: input/output definition, success criteria, constraints, scope, human-in-the-loop requirements, and acceptance test scenarios.

**Quality gate:** Success criteria are measurable. At least 3 acceptance test scenarios are defined. Human-in-the-loop boundaries are explicit (not "as needed").

---

### Phase 2: DECOMPOSE -- Break Into Agent Roles

**Entry criteria:** Goal specification is complete.

**Actions:**

1. **Task decomposition:**
   - Break the goal into sub-tasks using functional decomposition
   - For each sub-task: what skills does it require? what data does it need? what does it produce?
   - Identify dependencies: which tasks must complete before others can start?
   - Build a task dependency graph (DAG)

2. **Agent role definition:**
   - Group related sub-tasks into agent roles (see Reference: Role Design Principles)
   - Each agent should have a clear, bounded responsibility
   - Apply the single-responsibility principle: each agent does one category of work
   - Name agents by their function: "researcher", "analyst", "writer", "reviewer", "coordinator"

3. **Select agent topology** (see Reference: Multi-Agent Topologies):
   - **Pipeline**: Agent A -> Agent B -> Agent C (sequential, each transforms data)
   - **Swarm**: Coordinator assigns tasks to a pool of worker agents (parallel)
   - **Hierarchy**: Manager agent delegates to specialist agents (tree structure)
   - **Peer**: Agents communicate directly, no central coordinator (mesh)
   - **Hybrid**: Combination (e.g., pipeline of swarm stages)

4. **Define handoff points:**
   - What data flows from agent A to agent B? (handoff payload schema)
   - What conditions trigger a handoff? (completion, failure, threshold)
   - What happens if a handoff fails? (retry, fallback agent, human escalation)

5. **Estimate complexity per agent:**
   - Simple agent: one tool, one decision, deterministic output
   - Moderate agent: 2-3 tools, conditional logic, structured output
   - Complex agent: many tools, multi-step reasoning, creative output
   - Estimate token budget per agent call (affects cost)

**Output:** Task dependency graph, agent role definitions with responsibilities, topology selection with justification, handoff specifications, complexity estimates.

**Quality gate:** Every sub-task maps to exactly one agent. The task graph is a valid DAG (no cycles unless explicitly designed as iterative). Each handoff has a defined payload schema. Topology choice is justified by the goal's parallelism and dependency structure.

---

### Phase 3: DESIGN -- Architecture and Communication

**Entry criteria:** Agent roles and topology are defined.

**Actions:**

1. **Design communication channels:**

   **Message passing** (for pipeline/hierarchy):
   ```
   - Agent sends structured message to next agent
   - Message format: {from, to, type, payload, metadata}
   - Types: task_request, task_result, error, escalation
   - Delivery: synchronous (wait for response) or async (fire and forget)
   ```

   **Shared state** (for swarm/peer):
   ```
   - Central state store (database, key-value store, shared memory)
   - Agents read/write to shared state
   - Concurrency control: optimistic locking, version numbers
   - State schema: what fields, who can read, who can write
   ```

   **Event bus** (for decoupled systems):
   ```
   - Agents publish events to topics
   - Other agents subscribe to topics they care about
   - Loose coupling: publisher doesn't know who consumes
   - Event schema: {type, source, timestamp, payload}
   ```

2. **Design state management:**
   - **Workflow state**: what phase is the workflow in? (pending, running, completed, failed)
   - **Agent state**: what is each agent's current status? (idle, working, waiting, error)
   - **Data state**: what data has been produced so far? (intermediate results, final outputs)
   - **History state**: what actions have been taken? (audit trail for debugging)
   - Persistence: in-memory (ephemeral), database (persistent), hybrid

3. **Design error recovery:**
   - **Agent failure**: agent produces wrong output or crashes
     - Retry with same input (idempotent agents only)
     - Retry with modified prompt (if wrong output, not crash)
     - Fallback to alternative agent (backup specialist)
     - Escalate to human
   - **Communication failure**: message lost or delayed
     - Timeout and retry
     - Dead letter queue for failed messages
     - Idempotency keys to prevent duplicate processing
   - **Workflow failure**: entire pipeline fails
     - Checkpoint and resume (from last successful stage)
     - Full restart with clean state
     - Partial result delivery (return what was completed)

4. **Design context window management** (see Reference: Context Window Strategies):
   - How much context does each agent need?
   - How to avoid exceeding token limits?
   - Summarization strategies for long conversations
   - What to keep in working memory vs long-term storage

5. **Design observability:**
   - Logging: what each agent receives, processes, and produces
   - Metrics: latency per agent, error rate per agent, token usage per agent
   - Tracing: end-to-end request ID through all agents
   - Alerting: what triggers human notification

**Output:** Communication design (channels, message formats), state management architecture, error recovery procedures, context management strategy, observability plan.

**Quality gate:** Every agent pair with a dependency has a defined communication channel. Error recovery covers agent failure, communication failure, and workflow failure. Context window budget is estimated for each agent and fits within model limits.

---

### Phase 4: IMPLEMENT -- Generate Agent Definitions

**Entry criteria:** Architecture and communication design are complete.

**Actions:**

1. **For each agent, generate:**

   a. **System prompt:**
   ```
   You are the [ROLE] agent in a [PURPOSE] workflow.

   YOUR RESPONSIBILITY:
   [One clear statement of what this agent does]

   YOUR INPUTS:
   [What data you receive and from whom]

   YOUR OUTPUTS:
   [What you must produce and in what format]

   YOUR TOOLS:
   [List of tools you can use and when to use each]

   YOUR CONSTRAINTS:
   [What you must NOT do, boundaries of your authority]

   HANDOFF CONDITIONS:
   [When and how to pass work to the next agent]
   [When and how to escalate to a human]
   ```

   b. **Tool configuration:**
   - Which tools this agent can access
   - Tool parameters and defaults
   - Tool usage limits (max calls per task)

   c. **Input/output schema:**
   ```json
   {
     "input_schema": {
       "type": "object",
       "properties": {
         "task": {"type": "string", "description": "..."},
         "context": {"type": "object", "description": "..."}
       },
       "required": ["task"]
     },
     "output_schema": {
       "type": "object",
       "properties": {
         "result": {"type": "string"},
         "confidence": {"type": "number", "minimum": 0, "maximum": 1},
         "handoff_to": {"type": "string", "enum": ["agent_b", "human", "done"]}
       },
       "required": ["result", "confidence", "handoff_to"]
     }
   }
   ```

   d. **Routing rules:**
   ```
   IF confidence >= 0.8 AND handoff_to == "done":
     -> Return final result
   IF confidence >= 0.5 AND handoff_to == "agent_b":
     -> Route to agent_b with result as input
   IF confidence < 0.5:
     -> Escalate to human with result + reasoning
   IF error:
     -> Retry once, then escalate
   ```

2. **Generate the coordinator/orchestrator:**
   - Workflow entry point: receive input, determine first agent
   - Routing logic: map agent outputs to next agents
   - Termination logic: when is the workflow complete?
   - Timeout logic: max workflow duration, per-agent timeout
   - Result aggregation: combine outputs from multiple agents

3. **Generate configuration:**
   - Environment variables needed
   - API keys and credentials (reference only, not values)
   - Model selection per agent (e.g., fast model for simple tasks, powerful model for complex)
   - Token budgets per agent
   - Retry and timeout settings

**Output:** Complete agent definitions: system prompts, tool configs, I/O schemas, routing rules, coordinator logic, and configuration.

**Quality gate:** Every agent has a system prompt with clear responsibility, inputs, outputs, and constraints. Input/output schemas are valid JSON Schema. Routing rules cover all possible agent outputs (success, failure, escalation). Coordinator handles all workflow paths.

---

### Phase 5: VALIDATE -- Trace and Test

**Entry criteria:** All agent definitions and routing rules are generated.

**Actions:**

1. **Trace execution paths:**
   - For each acceptance test scenario from Phase 1:
     - Walk through the workflow step by step
     - Identify which agents are invoked in what order
     - Identify what data flows between agents at each step
     - Verify: does the path reach a valid terminal state?
   - Build execution path diagram for each scenario

2. **Verify completeness:**
   - Every sub-task from Phase 2 is covered by at least one agent
   - Every agent is reachable from the workflow entry point
   - Every agent output maps to a routing rule
   - No orphan agents (defined but never invoked)
   - No dead-end paths (agent produces output but nothing handles it)

3. **Test failure modes:**
   - **Agent timeout**: what happens if an agent takes too long? (timeout -> retry -> escalate)
   - **Agent error**: what happens if an agent produces invalid output? (validate -> retry -> fallback)
   - **Infinite loop**: can the routing rules create a cycle? (max iteration count)
   - **Token exhaustion**: can a single request exhaust the token budget? (per-agent limits)
   - **Cascading failure**: if one agent fails, does it bring down the entire workflow? (isolation)
   - **Data corruption**: can one agent's bad output corrupt another agent's state? (validation)

4. **Estimate performance:**
   - **Latency**: sum of per-agent latency along the critical path
   - **Cost**: sum of per-agent token usage * model pricing
   - **Throughput**: concurrent capacity based on rate limits
   - **Reliability**: compound agent success rates (0.95^n for n agents in series)

5. **Generate validation report:**
   - Execution path diagrams for all acceptance test scenarios
   - Completeness check results
   - Failure mode analysis with mitigations
   - Performance estimates (latency, cost, throughput, reliability)
   - Recommendations for optimization

**Output:** Validation report: execution traces, completeness verification, failure mode analysis, performance estimates, optimization recommendations.

**Quality gate:** All acceptance test scenarios trace successfully to completion. No orphan agents or dead-end paths. Every failure mode has a defined mitigation. Performance estimates are within the constraints defined in Phase 1.

---

## Exit Criteria

The skill is DONE when:
- The goal is decomposed into specific agent roles with bounded responsibilities
- An agent topology is selected and justified
- Communication channels, state management, and error recovery are designed
- Every agent has a complete definition (prompt, tools, I/O schema, routing rules)
- All acceptance test scenarios trace successfully through the workflow
- Failure modes are identified and mitigated
- Performance estimates are within defined constraints

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| GOAL | Goal is too vague to decompose | **Escalate** -- provide a goal clarification template with specific questions |
| GOAL | Goal requires capabilities beyond available tools | **Adjust** -- identify the gap, design the agent to request human assistance for that capability |
| DECOMPOSE | Too many agents needed (>10) | **Adjust** -- look for agents that can be merged, or split into sub-workflows |
| DECOMPOSE | Cannot eliminate circular dependencies | **Adjust** -- introduce an orchestrator that manages the iteration explicitly with a max loop count |
| DESIGN | Context window too small for required data | **Adjust** -- add summarization agents, implement RAG, or split large contexts across multiple calls |
| DESIGN | Error recovery makes the system too complex | **Adjust** -- simplify to "retry once, then escalate to human" for all failure modes |
| IMPLEMENT | Agent prompt too long (>4000 tokens) | **Adjust** -- move reference data to tools (RAG retrieval), keep prompt focused on role and rules |
| VALIDATE | Acceptance test scenario fails to trace | **Retry** -- return to Phase 2, identify the missing agent or handoff, redesign |
| ACT | User rejects the agent architecture or requests significant design changes | **Adjust** -- incorporate specific feedback (e.g., topology change, new agent role, revised handoff rules) and regenerate the affected phases; do not restart from Phase 1 unless the original goal description was wrong |
| ACT | User rejects final output | **Targeted revision** -- ask which agent role, handoff logic, or workflow topology fell short and regenerate only the affected phases. Do not restart from Phase 1. |

## State Persistence

Between runs, this skill saves:
- **Agent architecture snapshots**: topology, roles, communication channels for each workflow designed
- **Performance metrics**: actual latency, cost, and reliability vs estimates (for calibration)
- **Design patterns library**: reusable agent role templates and topology patterns
- **Failure postmortems**: when workflows fail in production, what went wrong and how it was fixed

---

## Reference

### Multi-Agent Topologies

#### Pipeline (Sequential)
```
[Agent A] --> [Agent B] --> [Agent C] --> Output

Best for: linear workflows where each stage transforms data
Example: Research -> Analyze -> Write -> Review
Pros: simple, predictable, easy to debug
Cons: slow (sequential), single point of failure per stage
Latency: sum of all agent latencies
```

#### Swarm (Parallel Workers)
```
              --> [Worker 1] --\
[Coordinator] --> [Worker 2] ---> [Aggregator] --> Output
              --> [Worker 3] --/

Best for: tasks that can be parallelized (analyze multiple docs, process batch)
Example: Coordinator splits 100 documents across 10 workers
Pros: fast (parallel), scalable, fault-tolerant (one worker failing doesn't block)
Cons: needs coordination logic, result aggregation can be complex
Latency: max(worker latencies) + coordinator + aggregator
```

#### Hierarchy (Manager-Specialist)
```
         [Manager]
        /    |    \
  [Spec A] [Spec B] [Spec C]
    |
  [Sub-Spec A1]

Best for: complex tasks requiring different expertise
Example: Manager delegates legal questions to legal agent, technical to technical agent
Pros: clean separation of concerns, easy to add specialists
Cons: manager is a bottleneck, deep hierarchies add latency
Latency: manager + deepest specialist chain
```

#### Peer (Mesh)
```
  [Agent A] <--> [Agent B]
      ^    \   /    ^
      |     \ /     |
      v      X      v
  [Agent C] <--> [Agent D]

Best for: collaborative tasks where agents negotiate/debate
Example: Multiple agents critiquing and improving a document
Pros: rich interaction, emergent behaviors, no bottleneck
Cons: complex to debug, may not converge, expensive (many messages)
Latency: unpredictable (depends on convergence)
```

### Role Design Principles

```
1. SINGLE RESPONSIBILITY:
   Each agent does one type of work.
   Bad:  "ResearchAndWriteAgent" (two responsibilities)
   Good: "ResearchAgent" + "WriterAgent"

2. CLEAR BOUNDARIES:
   Each agent's scope is explicitly defined.
   Bad:  "Handle user requests" (unbounded)
   Good: "Extract structured data from user messages" (bounded)

3. MINIMAL AUTHORITY:
   Each agent has access to only the tools it needs.
   Bad:  Every agent has database write access
   Good: Only the "DataWriter" agent can write to the database

4. EXPLICIT HANDOFFS:
   Agents state what they're passing and to whom.
   Bad:  Agent dumps output and hopes the right agent picks it up
   Good: Agent produces {result, confidence, handoff_to: "reviewer"}

5. STATELESS WHEN POSSIBLE:
   Agents that don't maintain state between calls are easier to
   scale, retry, and debug. Use shared state store instead of
   agent-internal state.
```

### Context Window Strategies

```
Problem: Agent needs more context than the model's window allows.

Strategy 1: SUMMARIZATION
  - Summarize long inputs before passing to agent
  - Use a dedicated "summarizer" agent for this
  - Trade-off: loses detail, may miss critical information

Strategy 2: RETRIEVAL (RAG)
  - Store data in a vector store
  - Agent queries for relevant chunks
  - Trade-off: retrieval quality depends on embedding + query

Strategy 3: CHUNKING
  - Split large input into chunks
  - Process each chunk separately
  - Aggregate results
  - Trade-off: may miss cross-chunk dependencies

Strategy 4: WORKING MEMORY
  - Maintain a "scratchpad" of key facts
  - Agent reads scratchpad instead of full history
  - Update scratchpad after each agent call
  - Trade-off: scratchpad curation is another task

Strategy 5: PROGRESSIVE DISCLOSURE
  - Start with high-level summary
  - Agent requests details on specific areas
  - Tool provides targeted context
  - Trade-off: more round trips, higher latency

Budget calculation:
  model_context_window = 128K tokens (example)
  system_prompt = ~1K tokens
  tools_definition = ~2K tokens
  input_data = variable
  output_reservation = ~4K tokens
  available_for_input = 128K - 1K - 2K - 4K = 121K tokens
  safety_margin = 20%
  practical_limit = 121K * 0.8 = ~97K tokens for input
```

### Human-in-the-Loop Decision Framework

```
ALWAYS require human approval for:
  - Irreversible actions (delete data, send money, publish publicly)
  - High-cost actions (API calls > $10, compute > 1 hour)
  - Actions affecting users (sending emails, modifying accounts)
  - Security-sensitive actions (changing permissions, accessing secrets)
  - Legal/compliance actions (signing agreements, regulatory filings)

NOTIFY humans (don't block) for:
  - Agent confidence < 0.5 (uncertain but not dangerous)
  - Unusual patterns detected (anomaly, unexpected input)
  - Resource usage approaching limits (80% of budget)
  - First-time execution of a new workflow

FULLY AUTONOMOUS for:
  - Read-only operations (search, analyze, summarize)
  - Reversible actions (draft documents, stage changes)
  - Low-cost operations (within token budget)
  - Well-tested workflows with high historical reliability

Escalation protocol:
  1. Agent detects need for human input
  2. Agent packages: current state, what it needs, options it considered
  3. System pauses workflow (or continues with safe default)
  4. Human receives notification with context
  5. Human responds: approve, reject, modify, delegate
  6. Workflow resumes with human input incorporated
```

### Tool Selection Guidelines

```
Give agents the MINIMUM set of tools needed:

Research agents:
  - web_search, read_url, query_database (read-only)

Analysis agents:
  - code_execution (sandboxed), file_read, calculator

Writing agents:
  - text_editor, template_renderer, format_converter

Review agents:
  - diff_viewer, checklist_evaluator, score_calculator

Data agents:
  - database_query, database_write (guarded), file_read, file_write

Communication agents:
  - send_email (with approval), send_notification, create_ticket

Anti-patterns:
  - Giving every agent every tool (confused, unsafe)
  - Giving agents production database write without guardrails
  - Giving agents external API access without rate limiting
  - Not providing a "request_help" tool for escalation
```

### Common Multi-Agent Failure Modes

```
1. INFINITE LOOP:
   Agent A sends to Agent B, B sends back to A, repeat forever.
   Fix: Max iteration count, loop detection, escalation after N rounds.

2. CONTEXT DEGRADATION:
   After many agent handoffs, context is lost or distorted (telephone game).
   Fix: Pass original input + accumulated results, not just latest output.

3. RESPONSIBILITY GAPS:
   No agent handles a particular type of input.
   Fix: Default/catch-all agent that flags unhandled cases.

4. OVER-SPECIFICATION:
   Agent prompts are so detailed they're brittle and can't handle variation.
   Fix: Define WHAT to do, not exactly HOW. Let agents use judgment.

5. TOKEN BUDGET EXPLOSION:
   Each agent adds context, and later agents exceed their context window.
   Fix: Summarize between stages, use RAG, enforce per-agent budgets.

6. CASCADING HALLUCINATION:
   Agent A hallucinates a fact, Agent B builds on it, Agent C treats it as verified.
   Fix: Verification agents, citation requirements, confidence scores.

7. COORDINATOR BOTTLENECK:
   All communication goes through one coordinator that becomes overloaded.
   Fix: Distribute coordination, allow direct peer communication for simple handoffs.
```

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
