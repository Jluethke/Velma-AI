# Agent Workflow Designer -- Automated Research Report Pipeline

## Scenario

A consulting firm wants to automate the creation of industry research reports. Given a topic (e.g., "AI adoption in healthcare 2026"), the system should research the topic, analyze findings, produce a structured 10-page report, have it reviewed for accuracy, and deliver as a formatted document. Reports currently take an analyst 2 days; the target is 30 minutes.

## Phase 1: GOAL

### Goal Specification

```
INPUT:  Research topic + scope (industry, geography, timeframe)
OUTPUT: Formatted 10-page research report (PDF/DOCX)

SUCCESS CRITERIA:
  - Report contains at least 15 cited sources
  - All statistics are traceable to a source
  - Report follows the firm's template (executive summary, methodology, findings, recommendations)
  - Total latency < 30 minutes
  - Total cost < $5 per report

CONSTRAINTS:
  - Must cite primary sources (not just AI-generated claims)
  - Human must approve before publishing to clients
  - Cannot access paywalled research databases (only public sources)

HUMAN-IN-THE-LOOP:
  - APPROVAL required: final report before publishing
  - NOTIFY: if fewer than 10 sources found (quality concern)
  - AUTONOMOUS: all research, analysis, and drafting
```

### Acceptance Test Scenarios

1. **Happy path**: Topic "AI adoption in healthcare 2026" with abundant public data -> well-sourced report
2. **Sparse data**: Topic "Quantum computing in agriculture" with limited public data -> report with noted gaps
3. **Controversial topic**: Topic with conflicting data sources -> report presents both sides with evidence
4. **Time-sensitive**: Recent topic where most data is from the last 30 days -> report uses current sources
5. **Error case**: Web search fails during research -> partial report with flagged gaps

## Phase 2: DECOMPOSE

### Task Decomposition

```
1. Research Planning       -> Determine search queries, source types, scope
2. Source Collection       -> Search web, collect articles, extract relevant content
3. Source Verification     -> Check source credibility, cross-reference claims
4. Analysis               -> Synthesize findings, identify trends, draw conclusions
5. Report Writing         -> Produce structured report following template
6. Fact Checking          -> Verify every claim in the report against sources
7. Formatting             -> Convert to final document format
8. Human Review           -> Present to human for approval
```

### Agent Roles

| Agent | Responsibility | Complexity | Tools |
|---|---|---|---|
| Planner | Decompose topic into research queries | Simple | None (reasoning only) |
| Researcher | Execute searches, collect and extract source content | Moderate | web_search, read_url |
| Analyst | Synthesize findings into insights and trends | Complex | code_execution (for data analysis) |
| Writer | Produce the structured report | Complex | text_editor, template_renderer |
| Fact Checker | Verify claims against sources | Moderate | web_search, read_url |
| Formatter | Convert to PDF/DOCX | Simple | document_converter |

### Topology: Pipeline with Parallel Research

```
[Planner] --> [Researcher x3 (parallel)] --> [Analyst] --> [Writer] --> [Fact Checker] --> [Formatter] --> [Human]
```

**Justification**: The workflow is fundamentally linear (research before analysis, analysis before writing). But research itself can be parallelized -- 3 researcher agents can search different subtopics simultaneously.

## Phase 3: DESIGN

### Communication: Message Passing

```json
{
  "message_schema": {
    "from": "researcher_1",
    "to": "analyst",
    "type": "task_result",
    "payload": {
      "subtopic": "AI diagnostic tools in hospitals",
      "sources": [
        {
          "url": "https://example.com/article",
          "title": "...",
          "date": "2026-02-15",
          "key_findings": ["...", "..."],
          "credibility_score": 0.85
        }
      ],
      "summary": "...",
      "confidence": 0.82
    },
    "metadata": {
      "trace_id": "report-2026-03-31-001",
      "timestamp": "2026-03-31T10:05:23Z",
      "token_usage": 1247
    }
  }
}
```

### State Management

```
Workflow state (in database):
  report_id: "report-2026-03-31-001"
  status: "researching" | "analyzing" | "writing" | "fact_checking" | "formatting" | "human_review" | "complete"
  started_at: timestamp
  current_agent: "researcher_2"
  token_budget_remaining: 45000
  sources_collected: [{url, title, credibility}]
  report_draft: "..."
  fact_check_results: [{claim, verified, source}]
```

### Error Recovery

| Failure | Detection | Recovery |
|---|---|---|
| Researcher timeout (search takes >2 min) | Agent timeout | Retry once, then skip subtopic and note gap |
| Researcher finds no sources | Empty source list | Planner generates alternative queries, retry |
| Analyst produces unsupported claims | Fact checker flags claim without source | Writer removes or caveats the claim |
| Writer exceeds page limit | Output > 10 pages | Writer re-runs with "condense" instruction |
| Fact checker finds false claim | Source contradicts claim | Writer receives correction, revises section |
| Token budget exceeded | Running total > budget | Complete current agent, skip remaining agents, deliver partial report with notice |

### Context Management

```
Strategy: Progressive summarization

Planner output:     ~500 tokens  (search queries)
Researcher output:  ~3000 tokens (sources + summaries) x3 researchers = ~9000 tokens
Analyst input:      9000 tokens (all research) + 500 tokens (plan)
Analyst output:     ~2000 tokens (insights + trends)
Writer input:       2000 tokens (analysis) + 500 tokens (template) = 2500 tokens
Writer output:      ~8000 tokens (full report draft)
Fact checker input: 8000 tokens (draft) + 9000 tokens (sources) = 17000 tokens  ← LARGEST

Total per report:   ~40K tokens ≈ $1.20 at typical pricing (within $5 budget)
```

## Phase 4: IMPLEMENT

### Planner Agent Definition

```
SYSTEM PROMPT:
You are the Research Planner agent. Given a research topic, you decompose it
into 3-5 specific subtopics that can be researched independently.

YOUR RESPONSIBILITY:
Break a broad research topic into specific, searchable subtopics.

YOUR INPUTS:
- topic: The research topic (e.g., "AI adoption in healthcare 2026")
- scope: Geographic and temporal scope

YOUR OUTPUTS:
{
  "subtopics": [
    {
      "name": "string",
      "search_queries": ["string", "string"],
      "expected_source_types": ["academic", "news", "industry_report"],
      "priority": "high" | "medium"
    }
  ]
}

YOUR CONSTRAINTS:
- Generate exactly 3-5 subtopics
- Each subtopic must be independently researchable
- Prioritize breadth over depth (depth comes from the analyst)
- Do not invent facts or statistics
```

### Researcher Agent Definition (runs 3x in parallel)

```
SYSTEM PROMPT:
You are a Research Agent. Given a subtopic and search queries, you find,
read, and extract relevant information from public web sources.

YOUR RESPONSIBILITY:
Collect high-quality, citable sources for your assigned subtopic.

YOUR TOOLS:
- web_search(query, max_results=10): Search the web for articles
- read_url(url): Read and extract content from a URL

YOUR OUTPUTS:
{
  "subtopic": "string",
  "sources": [{
    "url": "string",
    "title": "string",
    "author": "string | null",
    "date": "string",
    "key_findings": ["string"],
    "relevant_quotes": ["string"],
    "credibility_score": 0.0-1.0
  }],
  "summary": "string (300 words max)",
  "confidence": 0.0-1.0,
  "gaps": ["string"]  // What you couldn't find
}

YOUR CONSTRAINTS:
- Minimum 3 sources per subtopic, target 5
- Every finding must be traceable to a specific source URL
- Credibility scoring: 0.9+ for academic/gov, 0.7-0.9 for major news, 0.5-0.7 for industry blogs, <0.5 for unknown
- Maximum 10 web searches per subtopic (budget control)
- Do not include sources older than 2 years unless they are foundational
```

### Routing Rules

```
WORKFLOW:
  1. Planner produces subtopics
     -> Fan out: create one Researcher task per subtopic (parallel)

  2. All Researchers complete (or timeout after 5 min)
     -> Aggregate: collect all source lists
     -> IF total sources < 10: NOTIFY human, continue
     -> IF total sources < 5: ESCALATE to human, pause

  3. Analyst receives aggregated sources
     -> Produces insights and trends
     -> IF confidence < 0.5: ESCALATE to human

  4. Writer receives analysis
     -> Produces report draft
     -> IF draft > 12 pages: re-run with "condense" instruction

  5. Fact Checker receives draft + original sources
     -> Verifies each claim
     -> IF > 20% claims unverified: return to Writer for revision (max 1 revision)

  6. Formatter receives verified draft
     -> Produces PDF/DOCX
     -> Sends to human for approval

  7. Human approves or requests changes
     -> IF approved: deliver
     -> IF changes requested: return to Writer with feedback (max 2 rounds)
```

## Phase 5: VALIDATE

### Execution Trace: Happy Path

```
10:00:00  [Workflow]    Receive topic: "AI adoption in healthcare 2026"
10:00:01  [Planner]     INPUT: topic + scope
10:00:15  [Planner]     OUTPUT: 4 subtopics (diagnostics, drug discovery, admin, patient care)
10:00:16  [Researcher1] START: "AI diagnostic tools" (parallel)
10:00:16  [Researcher2] START: "AI drug discovery" (parallel)
10:00:16  [Researcher3] START: "AI healthcare admin" (parallel)
10:00:17  [Researcher4] START: "AI patient care" (parallel)
10:04:30  [Researcher1] COMPLETE: 5 sources, confidence 0.85
10:04:45  [Researcher2] COMPLETE: 4 sources, confidence 0.78
10:05:10  [Researcher3] COMPLETE: 6 sources, confidence 0.90
10:05:30  [Researcher4] COMPLETE: 4 sources, confidence 0.72
10:05:31  [Aggregator]  19 total sources (>10, no notification needed)
10:05:32  [Analyst]     INPUT: 19 sources from 4 subtopics
10:10:00  [Analyst]     OUTPUT: 8 key insights, 3 trends, confidence 0.82
10:10:01  [Writer]      INPUT: insights + template
10:18:00  [Writer]      OUTPUT: 10-page draft (within limit)
10:18:01  [FactChecker] INPUT: draft + 19 sources
10:22:00  [FactChecker] OUTPUT: 32/35 claims verified (91%), 3 need caveat
10:22:01  [Writer]      REVISION: add caveats to 3 claims
10:23:30  [Writer]      OUTPUT: revised draft
10:23:31  [Formatter]   INPUT: revised draft
10:24:00  [Formatter]   OUTPUT: report.pdf
10:24:01  [Human]       REVIEW REQUEST sent
--- Human approves at 10:35:00 ---
10:35:01  [Workflow]    COMPLETE. Delivered report.pdf.

Total latency: 24 minutes (autonomous) + human review time
Total cost: ~$1.80 (within $5 budget)
Total sources: 19 (exceeds minimum 15)
```

### Failure Mode Analysis

| Failure Mode | Probability | Impact | Mitigation | Residual Risk |
|---|---|---|---|---|
| Researcher timeout | Medium | Low | Retry + skip subtopic | Thinner coverage on one area |
| All researchers fail | Low | High | Escalate to human immediately | Report not produced |
| Fact checker finds >50% unverified | Low | High | Return to writer, then human review | Delay, possible quality concern |
| Token budget exceeded | Low | Medium | Stop after current agent, deliver partial | Incomplete report |
| Human rejects report | Medium | Low | Writer revises (max 2 rounds) | Third rejection = manual escalation |

### Completeness Check
- [x] All 8 sub-tasks mapped to agents
- [x] All agents reachable from entry point
- [x] All agent outputs have routing rules
- [x] No orphan agents
- [x] No dead-end paths
- [x] Loop bounds defined (max 1 fact-check revision, max 2 human revision rounds)
- [x] Token budget tracked end-to-end

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
