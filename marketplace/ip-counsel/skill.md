# IP Counsel

Systematic intellectual property analysis for AI agents. This skill enforces disciplined IP management: inventory before generation, prior art before novelty claims, gap analysis before filing.

**Why this exists:** An AI agent once scanned a codebase and generated 7 patent claim drafts without checking existing drafts, searching prior art, or deduplicating against work already done. The result was speculative garbage that could have caused real legal and financial harm. This skill prevents that.

**Core principle:** Never generate IP documentation in a vacuum. Every claim must be grounded in what already exists, what the prior art shows, and what actually needs protection.

## Execution Pattern: Phase Pipeline

```
PHASE 1: INITIALIZE  --> Scan for existing IP documents, build inventory, flag duplicates
PHASE 2: ANALYZE     --> Scan codebase for patentable innovations, cross-reference against inventory
PHASE 3: RESEARCH    --> Prior art search across all sources, novelty assessment per innovation
PHASE 4: DRAFT       --> Generate provisional patent drafts using uniform template, quality check
PHASE 5: REVIEW      --> Filing readiness checklist, priority ordering, action plan
```

## Inputs

- `codebase_path`: string -- Path to the project codebase to scan for patentable innovations
- `existing_drafts_path`: string -- Path to existing IP documents (patents, drafts, claims, trade secrets)
- `invention_description`: string -- Optional description of a specific invention to analyze (if not scanning the full codebase)
- `patent_families`: list[object] -- Known patent families with names and codes. Each: `{code, name, domain, core_novelty}`
- `applicant_entity`: string -- The legal entity that will be listed as applicant (natural person, trust, or corporation)
- `filing_budget`: number -- Budget available for filing fees and attorney costs (affects priority ordering)

## Outputs

- `ip_inventory`: object -- Complete inventory of existing IP documents: titles, families, statuses, claims counts, duplicates, reconciliation guides
- `innovation_list`: list[object] -- Patentable innovations found in the codebase with novelty classification and coverage status
- `gap_analysis`: object -- Unprotected inventions, stale drafts, contradictions, disclosure risks, trade secret candidates
- `prior_art_report`: list[object] -- Per-family prior art report: search queries, closest prior art, novelty assessment, recommendations
- `provisional_drafts`: list[object] -- Filing-ready provisional patent drafts following the uniform template
- `filing_checklist`: object -- Per-family readiness status with priority ordering, timeline, and cost estimates
- `action_plan`: object -- Prioritized next steps with urgency flags (public disclosure risk first)

---

## Execution

### Phase 1: INITIALIZE -- Build IP Inventory

**Entry criteria:** At least one of `codebase_path` or `existing_drafts_path` is provided.

**Actions:**

1. **Scan for existing IP documents.** Search these locations (relative to project root) for existing IP documents:
   - `Documents/IP*/`, `IP/`, `patents/`, `drafts/`, `.ip/`, `governance/`
   - File extensions: `*.patent`, `*.claims`, `*.invention`
   - Any directory containing "patent", "claim", "invention", "provisional" in its name
   - Word documents (`.docx`), PDFs (`.pdf`), and markdown (`.md`) files with IP-related titles

2. **Extract metadata from each document.** For every existing document found, record: title, family/group, status (draft/reconciled/filed/abandoned), claims count (independent + dependent), last modified date, applicant entity, one-line summary of each independent claim.

3. **Build the inventory table.** Organize by patent family with all drafts, reconciliation guides, and corrections listed under each family. List unfiled inventions separately.

4. **Check for reconciliation documents.** Look for documents that correct, override, consolidate, or supersede earlier drafts. These take priority over the drafts they reference.

5. **Detect duplicates.** Check for drafts covering the same invention, overlapping subject matter across families, or explicitly abandoned inventions being re-drafted without acknowledgment.

**Output:** Complete IP inventory organized by family with duplicate and reconciliation flags.

**Quality gate:** Every existing IP document is cataloged. Duplicates are flagged with specific overlap descriptions. Reconciliation documents are linked to the drafts they affect. Applicant entity is consistent across all documents (or inconsistencies are flagged).

---

### Phase 2: ANALYZE -- Innovation Scan and Gap Analysis

**Entry criteria:** IP inventory is complete.

**Actions:**

1. **Scan codebase for patentable innovations.** Identify novel algorithms, methods, architectures, and system compositions. For each, classify: what it does, what is novel about it, where it lives in the codebase, whether it is publicly visible or server-side only.

2. **Cross-reference innovations against inventory.** For each innovation, determine: is it covered by an existing draft? Is the existing draft current or stale? Are there gaps where no draft exists?

3. **Flag stale drafts.** Identify drafts that cover removed functionality, reference non-existent components, or are based on a superseded architecture.

4. **Detect contradictions across families.** Check for claims in one family that conflict with claims in another (e.g., Family A claims trust is computed as a weighted sum while Family B claims it is a neural network output).

5. **Assess disclosure risks.** Identify code that is publicly visible (open source, on-chain) but drafted as a trade secret, published blog posts that disclose unpublished inventions, or conference presentations that created prior art against your own filing.

6. **Apply the Trade Secret vs Patent Decision Matrix.** For each unprotected innovation, evaluate: can competitors reverse-engineer it? Is it publicly visible? Is the value in the algorithm or the implementation? What is the competitive timeline? Can you afford enforcement?

**Output:** Innovation list with coverage status, gap analysis (unprotected inventions, stale drafts, contradictions, disclosure risks), trade secret vs patent recommendations.

**Quality gate:** Every innovation has a coverage status (covered/gap/stale). All contradictions across families are documented. Disclosure risks are flagged with urgency level. Trade secret vs patent recommendation is justified for each unprotected innovation.

---

### Phase 3: RESEARCH -- Prior Art Search

**Entry criteria:** Gap analysis is complete with a list of innovations needing protection.

**Actions:**

1. **Build search queries.** For each patent family, define 3-5 search queries using varied terminology: technical terms AND layman's terms, synonyms, problem-focused queries, component queries, and combination queries.

2. **Execute searches in priority order.** Search Google Patents (with CPC codes), USPTO (granted + published applications), Academic literature (arXiv, IEEE, Google Scholar, ACM), then Open Source/Industry (GitHub, blog posts, standards, product docs).

3. **Document every search.** For each query: record source, query string, filters, date searched, results found, results reviewed, top results with relevance ratings, and assessment.

4. **Analyze prior art.** For each MEDIUM or HIGH relevance result: record source, date, assignee/author, abstract, what it covers, what it does NOT cover, which claims it affects, and the specific technical differentiation.

5. **Apply the "So What" test.** For each piece of prior art, answer: does it teach the same technical solution (102 risk)? A similar solution to a different problem (likely novel)? Components but not the combination (combination claim is likely novel)? Would a skilled person combine this with other art to arrive at our invention (103 risk)?

6. **Identify closest prior art per claim.** For each independent claim, document the single closest reference, the overlap, the differentiation, and how an examiner might use it.

7. **Produce Prior Art Report per family.** Include: search queries used, closest prior art entries, novelty assessment table (claim, closest art, what is novel, "So What" result, confidence), and recommendations (strong/narrow/remove/add-dependents).

**Output:** Prior art report per family with citations, novelty assessment table, and filing recommendations.

**Quality gate:** At least 3 search queries per family executed across at least 2 source types. Every independent claim has a closest prior art reference identified. Novelty assertions use "no prior art was found" language (never "no prior art exists"). The "So What" test is applied to every MEDIUM/HIGH relevance result.

---

### Phase 4: DRAFT -- Generate Provisional Applications

**Entry criteria:** Prior art search is complete with novelty assessments.

**Actions:**

1. **Select innovations for drafting.** Based on prior art results and trade secret analysis, determine which innovations should be filed as provisionals. Skip innovations where prior art fully anticipates the claim.

2. **Generate provisional drafts using the uniform template.** Each provisional must include: title, applicant/inventors, cross-references to related applications, field of invention, background, summary, detailed description of preferred embodiments, claims (independent + dependent), abstract (150 words max), and figure list.

3. **Apply drafting rules.** No implementation language (no "Python", "SHA-256"), use abstract terms ("cryptographic hash function", "computing device"), include method + system + computer-readable medium claims, use "a configurable threshold" not specific numbers, cross-reference related families.

4. **Run quality checklist on each draft.** Verify: no product/brand names in claims, no programming language references, no library/framework names, thresholds are configurable, at least 3 independent claims, 15-30 dependent claims, all figures referenced, abstract under 150 words, background cites technical problems, applicant entity is consistent.

5. **Organize into families with cross-references.** Each application references the provisionals of its own family and all related families.

**Output:** Filing-ready provisional patent drafts, organized by family with cross-references.

**Quality gate:** Every draft passes the quality checklist. No implementation-specific language in any claim. Applicant entity is consistent across all drafts. Each family has cross-references to related families. Each draft is clearly labeled "DRAFT -- NOT FILED".

---

### Phase 5: REVIEW -- Filing Readiness and Action Plan

**Entry criteria:** Provisional drafts are generated and quality-checked.

**Actions:**

1. **Complete the filing readiness checklist per family.** Technical preparation (disclosure, claims, specification, figures, abstract), prior art and differentiation (search log, closest art, differentiation, freedom-to-operate), legal and administrative (applicant, inventors, assignment, provisional vs non-provisional, jurisdiction, budget), quality checks (no implementation language, no thresholds, no contradictions, reconciliation review, trade secret analysis, enablement check).

2. **Priority-order families for filing.** Filing priority: (1) publicly visible code -- EMERGENCY, (2) drafts-ready families, (3) core competitive moat, (4) complete documentation, (5) novel architecture, (6) not yet deployed.

3. **Estimate costs.** Provisional: $300 small entity / $150 micro entity. Non-provisional: $1,600-$3,200 filing fees. Attorney: $8,000-$25,000. Total through grant: $15,000-$30,000 per patent.

4. **Generate the action plan.** Prioritized next steps with timeline, cost estimates, and urgency flags. Include: which families to file first, which need attorney review, which need more prior art research, which should remain trade secrets.

**Output:** Per-family filing readiness status, prioritized action plan with timeline and cost estimates.

**Quality gate:** Every family has a complete readiness checklist. Priority ordering reflects disclosure risk (public code first). Cost estimates are within the filing budget or budget overruns are flagged. Action plan has specific next steps with owners and deadlines.

## Exit Criteria

The skill is DONE when:
1. A complete IP inventory exists with all existing documents cataloged
2. Every codebase innovation has a coverage status (covered, gap, or trade secret)
3. Prior art search is documented for every innovation needing protection
4. Provisional drafts pass the quality checklist (no implementation language, no hardcoded thresholds)
5. Filing readiness checklist is complete for every patent family
6. A prioritized action plan exists with timeline and cost estimates

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| INITIALIZE | No existing IP documents found | Adjust -- proceed with empty inventory, note that all innovations are unprotected |
| INITIALIZE | Cannot read .docx or .pdf files | Adjust -- catalog the files by metadata only, flag for manual review |
| INITIALIZE | Applicant entity inconsistent across documents | Escalate -- flag as urgent legal issue, do not proceed to DRAFT until resolved |
| ANALYZE | Codebase too large to scan exhaustively | Adjust -- focus on modules flagged by the user or with recent changes, report coverage percentage |
| ANALYZE | Cannot determine if code is publicly visible | Escalate -- assume worst case (public), flag for verification |
| RESEARCH | Prior art search sources unavailable (paywalled databases) | Adjust -- search available sources, document what was NOT searched and why |
| RESEARCH | Prior art fully anticipates a claimed innovation | Adjust -- narrow the claim scope to the specific combination or abandon the claim |
| DRAFT | Cannot generate claims without implementation language | Adjust -- flag the specific claims for attorney rewrite |
| REVIEW | Budget insufficient for any filings | Adjust -- recommend provisional-only strategy ($150-$300 each), prioritize by disclosure risk |
| REVIEW | User rejects final output | **Targeted revision** -- ask which claim draft, prior art finding, or filing recommendation fell short and rerun only that section. Do not regenerate the full IP analysis. |

## State Persistence

- IP inventory snapshot (last-known state of all IP documents with dates, statuses, and family assignments)
- Prior art database (all prior art found across sessions with relevance scores, "So What" test results, and claim impact)
- Innovation registry (all innovations identified in the codebase with coverage status and protection recommendations)
- Filing status tracker (per-family filing status: unfiled, provisional filed, non-provisional filed, granted, abandoned)
- Search query log (all prior art search queries with results -- avoids re-running identical searches)
- Disclosure risk watchlist (publicly visible code that has no filing, with dates the clock started ticking)
- Reconciliation history (which drafts have been reconciled, superseded, or abandoned and why)

---

## Reference

### IP Inventory Protocol

**RULE: ALWAYS scan existing drafts before generating anything new.**

Before writing a single word of patent analysis, build a complete inventory of what already exists.

#### Where to look

Scan these locations (relative to project root) for existing IP documents:

- `Documents/IP*/` -- common corporate IP folder
- `IP/` -- project-level IP directory
- `patents/` -- dedicated patents folder
- `drafts/` -- draft documents
- `.ip/` -- hidden IP metadata
- `governance/` -- governance frameworks often contain patentable methods
- `*.patent`, `*.claims`, `*.invention` -- file extensions
- Any directory containing "patent", "claim", "invention", "provisional" in its name
- Word documents (`.docx`), PDFs (`.pdf`), and markdown (`.md`) files with IP-related titles

#### Inventory table format

```
IP INVENTORY -- [Project Name] -- [Date]
============================================

Family A: [Name]
  Draft 1: [title] -- [status] -- [N] claims -- [date]
  Draft 2: [title] -- [status] -- [N] claims -- [date]
  Reconciliation Guide: [filename] -- overrides Draft 1 claims 3-5

Family B: [Name]
  Draft 1: [title] -- [status] -- [N] claims -- [date]

Unfiled Inventions:
  [list of inventions in code with no corresponding draft]

DUPLICATES DETECTED:
  [Draft X] and [Draft Y] cover the same invention -- STOP and reconcile
```

### Prior Art Search Protocol

**RULE: Never assert novelty without a documented search.**

#### Search Sources (in order of priority)

**1. Google Patents (patents.google.com)**
- Search format: `(key_term_1) AND (key_term_2) AND (key_term_3)`
- Use CPC classification codes: G06F (computing), G06N (AI/ML), G06Q (business methods), H04L (network protocols)
- Filter: published after 2010
- Check US and international results (EP, WO, CN, JP)

**2. USPTO (patft.uspto.gov / appft.uspto.gov)**
- Full-text search for granted patents and published applications
- Use PAIR for application status and prosecution history
- Use both keyword and classification (CPC) searches
- Check continuation and divisional chains

**3. Academic Literature**
- arXiv.org: cs.AI, cs.CR, cs.DC, cs.MA sections
- IEEE Xplore: ICML, NeurIPS, AAMAS, IEEE S&P conferences
- Google Scholar: broader academic search
- ACM Digital Library: computing-specific

**4. Open Source / Industry**
- GitHub: public code is prior art from its commit date
- Blog posts and whitepapers from competitors and cloud providers
- Industry standards: NIST, IEEE, W3C, IETF RFCs
- Product documentation and conference talks

#### Search Strategy Per Family

For each patent family, define 3-5 search queries using different terminology:
- Use both technical terms AND layman's terms
- Use synonyms
- Search for the PROBLEM being solved, not just the solution
- Search for individual components AND the combination
- Vary specificity: one broad query and one narrow query per concept

#### Prior Art Analysis Template

```markdown
### Prior Art [N]: [Patent/Paper Title]
- **Source:** [Patent number / DOI / URL]
- **Date:** [Publication date]
- **Assignee/Author:** [Who]
- **Abstract:** [1-2 sentences]
- **Relevance:** [HIGH/MEDIUM/LOW]
- **What it covers:** [What aspects overlap with our claims]
- **What it DOESN'T cover:** [What our invention adds beyond this]
- **Claim impact:** [Which of our claims does this affect?]
- **Differentiation:** [Specific technical difference that makes our claim novel]
```

#### The "So What" Test

For each piece of prior art, answer:
1. **Does this teach the SAME technical solution?** If yes, 102 rejection risk. Narrow or abandon.
2. **Does this teach a SIMILAR solution to a DIFFERENT problem?** Likely novel. Document the different problem context.
3. **Does this teach COMPONENTS but not the COMBINATION?** Combination claim is likely novel. Emphasize synergistic effect.
4. **Would a skilled person COMBINE this with other art to arrive at our invention?** 103 risk. Document why the combination is non-obvious.

#### Language Discipline

- NEVER say: "No prior art exists" -- ALWAYS say: "No prior art was found using queries [X, Y, Z] across [sources]"
- NEVER say: "This is completely novel" -- ALWAYS say: "No prior art was found that combines [specific elements A, B, C]"
- Absence of evidence is not evidence of absence
- Finding prior art is GOOD -- it helps you write better claims

### Claim Analysis Framework

#### Claim structure

Every patent claim must have:
- **Independent claim**: The broadest formulation of the invention
- **Dependent claims**: Specific implementations that narrow the independent claim

#### Per-claim analysis template

```
CLAIM ANALYSIS -- Claim [N]
============================

Technical problem solved:
  [What pain point or limitation does this address?]

Technical solution:
  [What is the mechanism? How does it work?]

Novel elements (what is new):
  - [Element 1]
  - [Element 2]

Known elements (what is prior art):
  - [Element A] -- known from [citation]
  - [Element B] -- known from [citation]

Closest prior art:
  [Patent/paper number] -- "[title]"
  Overlap: [what it covers]
  Differentiation: [what this claim adds]
  Examiner risk: [how likely is a 102/103 rejection based on this?]

Claim strength: STRONG / MODERATE / WEAK
Recommendation: FILE / REVISE / ABANDON
```

#### Claim drafting rules

**DO:**
- Write claims at the highest level of abstraction that is still defensible
- Use functional language ("a module configured to..." not "a Python class that...")
- Include both method claims and system claims (separately)
- Make dependent claims progressively narrower

**DO NOT:**
- Use implementation language ("using Python", "with React", "via SHA-256") -- instead: "using a cryptographic hash function"
- Include specific threshold values ("when trust score exceeds 0.55") -- instead: "when the computed trust metric exceeds a predetermined threshold"
- Mix method and system claims in the same claim
- Confuse the applicant entity -- all claims in a family must have a consistent applicant

### Gap Analysis

#### What to compare

| Source | Against |
|--------|---------|
| Code in the repository | Existing patent drafts |
| Existing drafts | Current codebase functionality |
| Claims across families | Each other (contradictions) |
| Patented items | Trade secret candidates |

#### Gap categories

- **Unprotected inventions:** Novel algorithms or methods with no corresponding draft, new features since last IP review, architectural innovations not claimed
- **Stale drafts:** Drafts covering removed functionality, claims referencing non-existent components, drafts based on replaced architecture
- **Contradictions:** Claims in Family A conflicting with Family B, different drafts claiming the same invention with different scopes, applicant entity inconsistencies
- **Disclosure risks:** Public code drafted as trade secret, published blog posts disclosing unpublished inventions, conference presentations creating prior art against your own filing

### Trade Secret vs Patent Decision Matrix

| Factor | Favors Patent | Favors Trade Secret |
|--------|--------------|-------------------|
| Can competitors reverse-engineer it? | YES -- patent before they do | No -- keep it secret |
| Is it publicly visible? | YES -- patenting is your only option | No |
| Is it a server-side algorithm? | Only if independently discoverable | YES -- trade secret is stronger |
| Is the value in the implementation? | No | YES -- trade secret protects details |
| Does disclosing help ecosystem adoption? | YES -- enables licensing | No |
| Is it a core competitive moat? | Consider both carefully | YES -- avoids disclosure |
| How long does the advantage last? | 20+ years -- patent (20-year term) | Indefinite but fragile |
| Is the invention independently discoverable? | YES -- patent first | No -- trade secret is safer |

### Filing Readiness Checklist

#### Technical preparation
- Invention disclosure written
- Claims drafted (at least 1 independent + 3-5 dependent)
- Specification written (enables a skilled person to implement)
- Figures prepared (architecture diagrams, flowcharts)
- Abstract written (150 words max)

#### Prior art and differentiation
- Prior art search completed with documented search log
- Closest prior art identified per independent claim
- Differentiation articulated specifically
- No known blocking patents (freedom-to-operate check)

#### Legal and administrative
- Applicant entity confirmed
- Inventor(s) identified (natural persons who contributed to conception)
- Assignment agreement in place
- Provisional vs non-provisional decision made
- Filing jurisdiction decided
- Budget allocated (provisional: $150-$300, non-provisional: $1,600-$3,200, attorney: $8,000-$25,000, total through grant: $15,000-$30,000)

#### Quality checks
- No implementation-specific language in claims
- No threshold values that enable design-arounds
- No contradictions with other family filings
- Reconciliation review completed
- Trade secret analysis completed
- Enablement check passed

### Provisional Patent Application Template

```
PROVISIONAL PATENT APPLICATION

Title: [Descriptive title of invention]

Applicant: [Entity name]
Inventor(s): [Full legal name(s)]
Correspondence Address: [Address]

CROSS-REFERENCE TO RELATED APPLICATIONS
[Reference any related provisionals or families]

FIELD OF THE INVENTION
[1-2 sentences: technical field]

BACKGROUND OF THE INVENTION
[Problem, prior approaches, why they are insufficient]

SUMMARY OF THE INVENTION
[What the invention does at a high level]

DETAILED DESCRIPTION OF PREFERRED EMBODIMENTS
[How it works with enough detail for reproduction]
[Architecture, algorithms in abstract form, data flows, key formulas]
[Use "in one embodiment" and "in a preferred embodiment"]
[Reference figures by number]

CLAIMS
[Independent claims: broadest formulation]
[Dependent claims: specific refinements]

ABSTRACT
[150 words max]

FIGURES
[List with brief descriptions]
```

### Patent Family Organization

Each patent family should contain:
1. A core provisional application (broadest description)
2. Continuation-in-part (CIP) applications (improvements after initial filing)
3. Divisional applications (when examiner requires restriction)

Cross-reference strategy: every application cites the provisionals of its own family and all related families, creating a web of priority dates.

Filing priority order:
1. Publicly visible code -- EMERGENCY (disclosure clock is ticking)
2. Drafts-ready families -- file immediately ($300 each)
3. Core competitive moat
4. Complete documentation
5. Novel architecture
6. Not yet deployed (lowest urgency)

### Common Mistakes This Skill Prevents

1. **Generating claims without checking existing drafts** -- always run inventory first
2. **Asserting novelty without prior art search** -- always document what you searched
3. **Using implementation language in claims** -- "cryptographic hash function" not "SHA-256"
4. **Including specific thresholds** -- "a predetermined threshold" not "0.55"
5. **Publishing what should be a trade secret** -- use the decision matrix before filing
6. **Filing families with contradictory claims** -- gap analysis catches contradictions
7. **Applicant entity confusion** -- confirm once, use consistently
8. **Generating documents with no legal standing** -- label all drafts "DRAFT -- NOT FILED"

### Limitations

- This is not legal advice. Always consult a registered patent attorney.
- This does not replace a professional patent search (commercial databases find more).
- The claims produced are analytical drafts requiring attorney review before filing.
- This does not provide freedom-to-operate opinions.
- The output is a foundation for informed decisions, not a substitute for professional counsel.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
