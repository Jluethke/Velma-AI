# Summary Writer

> **Starter Skill** — Free to use. Royalties to original creator on derivatives. Build on this.

Foundation pattern for condensing long content into structured summaries at specified detail levels. Takes any content (article, report, meeting transcript, book chapter, email thread) and a target length, then produces a summary that preserves key facts, decisions, action items, and open questions. The hard part of summarizing is not cutting words -- it is deciding what matters. Fork this for: meeting notes, research digests, news briefings, book summaries, legal document summaries, report abstracts, etc.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Analyze the source content, identify structure and key elements
REASON  --> Rank elements by importance, identify what MUST be preserved
PLAN    --> Draft summary at target length, verify nothing critical is lost
ACT     --> Output summary with metadata and omission notes
     \                                                              /
      +--- Critical element missing from summary --- loop REASON --+
```

## Inputs

- `source_content`: string -- The content to summarize (full text or reference)
- `target_length`: string -- Desired summary length: "one-line" (~15 words), "paragraph" (~100 words), "one-page" (~400 words), "executive-brief" (~800 words)
- `audience`: string -- Who will read this summary and what do they care about (optional, improves relevance filtering)
- `preserve_priority`: list[string] -- Optional: types of information to prioritize ("decisions", "action_items", "data_points", "arguments", "conclusions")

## Outputs

- `summary`: string -- The condensed content at the target length
- `key_elements`: object -- Structured extraction: `{decisions, action_items, open_questions, key_facts, notable_quotes}`
- `omission_notes`: list[string] -- Significant content that was cut, so the reader knows what they're missing
- `source_metadata`: object -- `{original_length, compression_ratio, content_type, date_range}`

---

## Execution

### OBSERVE: Analyze Source Content

**Entry criteria:** Source content is provided.

**Actions:**
1. Assess content type and structure. Is this a meeting transcript (chronological, multi-speaker), a report (sections, findings, recommendations), an article (thesis, evidence, conclusion), an email thread (conversation, decisions), or unstructured notes? The content type determines the summarization strategy.
2. Measure the source. Word count, paragraph count, section count. Compute the compression ratio needed: source length / target length. A 10:1 compression requires aggressive prioritization. A 2:1 compression allows nuance.
3. Identify structural elements. Headers, sections, speakers, timestamps, bullet points, numbered lists, bold/italic emphasis. These are the author's own signals about what matters.
4. Extract candidate key elements. Scan for: explicit decisions ("we decided to..."), action items ("John will..."), deadlines, data points (numbers, percentages, metrics), conclusions, recommendations, and open questions.

**Output:** Content type assessment, compression ratio, structural map, candidate key elements.

**Quality gate:** Content type is identified. Compression ratio is computed. At least 3 candidate key elements are extracted.

---

### REASON: Rank by Importance

**Entry criteria:** Content is analyzed with candidate key elements.

**Actions:**
1. Apply the importance hierarchy. In descending order of preservation priority:
   - **Decisions made**: these change the state of the world and must be in any summary
   - **Action items with owners**: someone is supposed to do something -- this must survive
   - **Key conclusions/recommendations**: the "so what" of the content
   - **Supporting data/evidence**: numbers and facts that substantiate conclusions
   - **Context and background**: important for understanding but first to be cut
   - **Process details**: how things were discussed -- almost always cuttable
2. Override with preserve_priority if provided. If the user says "prioritize data_points," elevate data/evidence above conclusions in the hierarchy.
3. Apply audience filter. If audience is specified, boost elements that audience cares about and demote others. An executive cares about decisions and bottom-line impact. An engineer cares about technical details and action items. A lawyer cares about risks and commitments.
4. Cut from the bottom. Starting with the lowest-priority elements, remove until the remaining content can fit the target length. Track what was cut for omission_notes.

**Output:** Ranked element list, cut decisions, audience-adjusted priorities.

**Quality gate:** Decisions and action items are preserved unless target length makes it physically impossible. Cut elements are documented.

---

### PLAN: Draft the Summary

**Entry criteria:** Priority ranking is complete.

**Actions:**
1. Draft the summary at target length. Structure by target:
   - **One-line**: Single sentence capturing the core decision or conclusion. Format: "[Subject] [verb] [object] [because/resulting in] [key context]."
   - **Paragraph**: 3-5 sentences. Lead with the conclusion, follow with key supporting facts, end with most important action item or open question.
   - **One-page**: Opening paragraph (thesis/conclusion), key findings/decisions (bulleted), action items, open questions, brief context.
   - **Executive brief**: Full structured summary with sections: Overview, Key Decisions, Findings, Action Items, Risks/Open Questions, Next Steps.
2. Verify completeness. Check every item in the top priority tier against the draft. Is it represented? If a decision or action item was lost, rewrite to include it.
3. Verify accuracy. Ensure no facts were distorted by compression. Summarization must simplify, not misrepresent. If a nuanced point cannot be accurately captured at the target length, note the simplification.
4. Compile key_elements as a structured object separate from the narrative summary.

**Output:** Draft summary, structured key_elements, accuracy verification.

**Quality gate:** Summary is within 10% of target length. All top-tier elements are represented. No facts are misrepresented.

---

### ACT: Deliver the Summary

**Entry criteria:** Summary draft passes completeness and accuracy checks.

**Actions:**
1. Output the final summary.
2. Output key_elements as a structured extraction (decisions, action items, open questions, key facts).
3. Output omission_notes listing significant content that was cut, so the reader can decide whether to read the original.
4. Output source_metadata: original length, compression ratio, content type.
5. Check for loop trigger: did drafting the summary reveal that a key element was misidentified or that two elements should be merged? If so, loop back to REASON.

**Output:** Complete summary package.

**Quality gate:** Summary reads as a standalone document (not choppy fragments). Key elements are accurately extracted. Omission notes let the reader assess what they might be missing.

## Exit Criteria

The skill is DONE when:
1. Summary is at the target length (within 10%)
2. All decisions and action items from the source are preserved or noted as omitted
3. No facts are distorted by compression
4. Key elements are extracted as structured data
5. Omission notes document what was cut

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Source content is too short to summarize | **Adjust** -- reformat rather than compress, extract key elements only |
| OBSERVE | Source content is illegible or garbled | **Escalate** -- ask for a cleaner source or specify the garbled sections |
| REASON | Target length is too short for mandatory elements | **Adjust** -- produce the shortest possible summary that includes all decisions/action items, note that target was exceeded and why |
| REASON | No clear decisions or action items in source | **Adjust** -- shift priority to key facts and conclusions |
| PLAN | Summary accuracy check fails (distorted by compression) | **Retry** -- expand the summary slightly to preserve nuance, or add a caveat |
| ACT | User rejects final output | **Targeted revision** -- ask whether the issue is length, missing elements, wrong priority, or inaccurate representation, and rerun only the REASON or PLAN phase. Do not re-analyze the full source. |

## State Persistence

Between runs, this skill accumulates:
- **Summarization patterns**: effective structures per content type (what works for meeting transcripts vs. reports vs. articles)
- **Audience profiles**: what different audience types care about, refined by feedback
- **Compression benchmarks**: what compression ratios work well for different content types

---

## Reference

### Importance Hierarchy (Descending Priority)

1. Decisions made — change the state of the world; must survive any compression
2. Action items with owners — someone is responsible; must survive
3. Key conclusions / recommendations — the "so what"
4. Supporting data and evidence — numbers and facts that substantiate conclusions
5. Context and background — important for understanding but first to cut
6. Process details — how things were discussed; almost always cuttable

### Target Length Guides

| Target | Word Range | Structure |
|---|---|---|
| One-line | ~15 words | "[Subject] [verb] [object] [because/resulting in] [context]." |
| Paragraph | ~100 words | Lead with conclusion; 2-3 supporting facts; end with key action or open question |
| One-page | ~400 words | Opening paragraph + key findings (bullets) + action items + open questions |
| Executive brief | ~800 words | Overview / Key Decisions / Findings / Action Items / Risks / Next Steps |

### Compression Ratio Guide

| Ratio | Approach |
|---|---|
| 2:1 | Light editing; can preserve nuance and supporting detail |
| 5:1 | Moderate compression; cut process details and context |
| 10:1 | Aggressive compression; only decisions, actions, and one-line conclusions survive |
| 20:1+ | Extreme compression; essentially a headline + 2-3 bullets |

### Audience Priority Adjustments

| Audience | Boost | Demote |
|---|---|---|
| Executive | Decisions, bottom-line impact, risks | Technical details, process steps |
| Engineer / technical | Action items, technical specifications | Background, context |
| Legal | Commitments, risks, ambiguities | Summary conclusions without evidence |
| General | Conclusions, what changes for them | Jargon, supporting data |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
