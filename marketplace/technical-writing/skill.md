# Technical Writing

Produce clear, accurate technical documentation by identifying the audience, outlining structure, drafting content, validating examples, and publishing in the appropriate format.

## Execution Pattern: Phase Pipeline

```
PHASE 1: AUDIENCE      --> Identify reader (beginner/intermediate/expert), doc type
PHASE 2: OUTLINE       --> Structure sections, choose Diataxis quadrant
PHASE 3: DRAFT         --> Write content following clarity rules
PHASE 4: VALIDATE      --> Check: runnable examples, no assumed knowledge, correct links
PHASE 5: PUBLISH       --> Format, add to docs system, update navigation
```

## Inputs

- `subject_matter`: string -- The topic, feature, API, or system to document
- `audience`: string -- Who will read this (beginner, intermediate, expert, mixed)
- `doc_type`: string -- Tutorial, how-to guide, reference, explanation, README, changelog
- `task_description`: string -- Specific documentation need or general request

## Outputs

- `documentation`: string -- The complete document, formatted and ready to publish
- `templates`: object -- Reusable templates generated during the process (if applicable)
- `style_feedback`: object -- Notes on writing quality issues found and fixed during validation

---

## Execution

### Phase 1: AUDIENCE -- Identify Reader and Document Type

**Entry criteria:** A subject matter to document is identified.

**Actions:**
1. Identify the primary reader: beginner, intermediate, or expert
2. Determine what the reader needs to accomplish:
   - "I'm new, teach me" -> Tutorial
   - "I know the basics, need to do X" -> How-To Guide
   - "I need the exact syntax for X" -> Reference
   - "I want to understand WHY" -> Explanation
3. Choose the Diataxis quadrant (see Reference: Documentation Types):
   - Practical + Learning = Tutorial
   - Practical + Working = How-To Guide
   - Theoretical + Working = Reference
   - Theoretical + Learning = Explanation
4. Identify any existing documentation to update or complement (not duplicate)
5. Determine the technical depth appropriate for the audience

**Output:** Audience profile listing reader level, doc type, Diataxis quadrant, and technical depth.

**Quality gate:** Reader level is explicit (not "everyone"). Doc type is chosen from the four Diataxis quadrants. No documentation will duplicate existing content without reason.

---

### Phase 2: OUTLINE -- Structure Sections

**Entry criteria:** Audience profile is complete.

**Actions:**
1. Select the appropriate document template:
   - README: title, install, quick start, features, usage, API, config, contributing, license (see Reference: README Template)
   - Tutorial: what you'll build, prerequisites, step-by-step, what you've learned, next steps (see Reference: Tutorial Structure)
   - API Reference: function name, description, parameters, returns, throws, example, since (see Reference: API Documentation)
   - How-To Guide: goal, prerequisites, steps, verification
   - Explanation: concept, how it works, why it matters, tradeoffs
2. Structure sections following the template
3. Identify which sections need code examples, diagrams, or tables
4. Identify which diagrams are needed (see Reference: Diagrams)
5. Plan progressive disclosure: start simple, add complexity gradually

**Output:** Document outline with all sections listed, noting which need code examples, diagrams, or tables.

**Quality gate:** Outline follows the appropriate template structure. Every major section is present. Code example locations are identified.

---

### Phase 3: DRAFT -- Write Content

**Entry criteria:** Outline is complete and approved.

**Actions:**
1. Write each section following the clarity rules (see Reference: Writing Rules):
   - Active voice: "The function returns X" not "X is returned by the function"
   - Present tense: "This method creates" not "This method will create"
   - Second person: "You can configure" not "The user can configure"
   - Short sentences: under 25 words, one idea per sentence
   - Short paragraphs: under 5 sentences
   - No jargon without definition
   - Concrete: "Returns in under 50ms" not "Returns quickly"
   - Consistent terms: pick one word and stick with it
2. Avoid the forbidden words (see Reference: Words to Avoid): "simply", "obviously", "just", "easy", "note that", "in order to", "utilize", "leverage", "facilitate"
3. Write code examples following the golden rules (see Reference: Code Examples):
   - Complete (all imports and setup included)
   - Runnable (copy-paste into a fresh file and it works)
   - Realistic (real variable names and data, not foo/bar)
   - Progressive (simple first, then complexity)
   - Annotated (comments explain the non-obvious parts)
4. Create diagrams where planned in the outline (see Reference: Diagrams)
5. For tutorials: every step has a verification ("Run X -- you should see Y")
6. For API docs: every public function has parameters, returns, throws, and example (see Reference: API Documentation)
7. Follow docs-as-code principles (see Reference: Versioning Documentation)

**Output:** Complete draft document with all sections written, code examples included, and diagrams created.

**Quality gate:** All clarity checklist items pass. Every code example has imports and is self-contained. No forbidden words remain. No sections are marked "TODO."

---

### Phase 4: VALIDATE -- Check Quality

**Entry criteria:** Draft is complete with all sections written.

**Actions:**
1. Verify every code example is runnable:
   - All imports present
   - All variables defined
   - Copy-paste into a fresh file produces the shown output
2. Verify no assumed knowledge:
   - Every technical term is defined or linked on first use
   - Prerequisites list exact versions with check commands
   - No steps are skipped because they're "obvious"
3. Verify all links are valid (internal cross-references and external URLs)
4. Check for common documentation mistakes (see Reference: Common Documentation Mistakes):
   - Outdated examples
   - Missing prerequisites
   - Wall of text (no headers, no code, no bullets)
   - No search optimization (uses words readers would search for)
   - Incomplete error documentation
5. For tutorials: follow every step from scratch to verify the flow works
6. For changelogs: verify the format follows Keep a Changelog (see Reference: Changelog Format)
7. Review against the clarity checklist one final time

**Output:** Validation report listing any issues found and their fixes.

**Quality gate:** All code examples run successfully. No assumed knowledge gaps. All links resolve. No forbidden words. Clarity checklist passes.

---

### Phase 5: PUBLISH -- Format and Deliver

**Entry criteria:** Validation passes with all issues resolved.

**Actions:**
1. Format the document for its target system:
   - Markdown for GitHub/GitLab
   - MDX for Docusaurus
   - RST for Sphinx
2. Select the appropriate tooling (see Reference: Documentation Tooling)
3. Add to the documentation system:
   - Update navigation/sidebar configuration
   - Add to search index
   - Set up versioning if applicable
4. For README: ensure it's in the repo root
5. For API docs: verify auto-generation integration works (if applicable)
6. Add frontmatter/metadata (title, description, keywords for search)
7. Update changelog if this documents a new feature or change

**Output:** Published documentation, integrated into the docs system with navigation and search.

**Quality gate:** Document renders correctly in the target system. Navigation links work. Search finds the document using expected keywords. No rendering artifacts.

---

## Exit Criteria

The skill is DONE when:
- Documentation matches the chosen Diataxis quadrant and template
- All code examples are runnable and self-contained
- Clarity checklist passes (active voice, short sentences, no jargon, no forbidden words)
- No assumed knowledge gaps
- All links are valid
- Document is formatted and integrated into the docs system

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| AUDIENCE | Cannot determine audience level | **Escalate** -- ask who will read the document |
| AUDIENCE | Subject matter is unclear | **Escalate** -- ask for specific feature/API/system to document |
| OUTLINE | No appropriate template exists | **Adjust** -- combine elements from multiple templates |
| DRAFT | Cannot make code example self-contained (requires running service) | **Adjust** -- add a "Setup" prerequisite section with instructions |
| DRAFT | Subject is too complex for a single document | **Adjust** -- split into multiple documents (overview + detailed pages) |
| VALIDATE | Code example no longer works (API changed) | **Retry** -- update the example to match current API, max 2 retries |
| VALIDATE | Prerequisites are complex (5+ tools required) | **Adjust** -- provide a Docker setup or devcontainer as alternative |
| PUBLISH | Docs system not available | **Adjust** -- deliver as standalone markdown files |

## State Persistence

Between runs, this skill saves:
- **Audience profile**: reader level, doc type, Diataxis quadrant for the project
- **Document inventory**: what docs exist, what gaps remain
- **Style decisions**: terminology choices, formatting conventions
- **Validation results**: which examples were tested and when (to detect staleness)

---

## Reference

### Documentation Types (The Diataxis Framework)

```
                    PRACTICAL                THEORETICAL
                    (doing)                  (understanding)
  LEARNING      Tutorial                 Explanation
                "Follow these steps"     "How X works under the hood"

  WORKING       How-To Guide             Reference
                "How to do X"            "API for X"
```

#### When to Use Each

| Doc Type | Reader's State | Structure | Example |
|----------|---------------|-----------|---------|
| Tutorial | "I'm new, teach me" | Step-by-step, hand-holding | "Getting Started with React" |
| How-To Guide | "I know the basics, need to do X" | Goal-oriented steps | "How to deploy to AWS" |
| Reference | "I need the exact syntax for X" | Alphabetical/logical, complete | "API documentation" |
| Explanation | "I want to understand WHY" | Narrative, conceptual | "How garbage collection works" |

---

### README Template

Every README needs these sections, in this order:

```markdown
# Project Name

One-sentence description of what this does and who it's for.

[![CI](badge-url)](ci-url) [![License](badge-url)](license-url)

## Install

(Single command. The most copy-pasted section.)

## Quick Start

(3-5 lines of code that do something useful. Runnable as-is.)

## Features

(Bullet list of key capabilities. Sell the project.)

## Usage

(Detailed examples for each major feature.)

## API

(Public functions, their parameters, return values, and examples.
 Skip if there's a separate API reference.)

## Configuration

(Environment variables, config files, defaults.)

## Contributing

(How to set up dev environment, run tests, submit PRs.)

## License

(Name + link. MIT, Apache 2.0, etc.)
```

#### README Anti-Patterns

```
BAD:  "See INSTALL.md for installation instructions"
      (If they can't install from the README, they leave)

BAD:  "Prerequisites: Node.js 18+, Python 3.11+, Docker, Redis, PostgreSQL"
      (Five prerequisites before the first line of code = abandonment)

BAD:  Table of Contents for a 50-line README
      (Overhead without value)

BAD:  Screenshot of terminal output
      (Can't copy-paste, breaks on version change, accessibility nightmare)
```

---

### API Documentation

#### Every Public Function Needs

```
Name:        What the function is called
Description: What it does (one sentence)
Parameters:  Each one: name, type, required/optional, default, description
Returns:     Type and description
Throws:      What errors/exceptions and when
Example:     Complete, runnable, copy-pasteable
Since:       Version it was introduced (for libraries)
```

#### Python Example (Google Style Docstrings)

```python
def retry(
    fn: Callable[[], T],
    max_attempts: int = 3,
    backoff_base: float = 2.0,
    retry_on: tuple[type[Exception], ...] = (Exception,),
) -> T:
    """Execute a function with exponential backoff retry.

    Retries the given function up to max_attempts times, sleeping
    between attempts with exponential backoff. Only retries on
    exceptions matching retry_on.

    Args:
        fn: Zero-argument callable to execute.
        max_attempts: Maximum number of attempts (default 3).
        backoff_base: Base for exponential backoff in seconds (default 2.0).
            Sleep time = backoff_base ** attempt_number.
        retry_on: Tuple of exception types to retry on (default: all).

    Returns:
        The return value of fn() on the first successful call.

    Raises:
        Exception: The last exception raised by fn() if all attempts fail.
        ValueError: If max_attempts < 1.

    Example:
        >>> result = retry(lambda: requests.get("https://api.example.com/data").json())
        >>> print(result)
        {"status": "ok"}
    """
```

#### TypeScript Example (TSDoc)

```typescript
/**
 * Execute a function with exponential backoff retry.
 *
 * @param fn - Zero-argument async function to execute
 * @param options - Retry configuration
 * @param options.maxAttempts - Maximum number of attempts (default: 3)
 * @param options.backoffBase - Base for exponential backoff in ms (default: 1000)
 * @returns The resolved value of fn() on the first successful call
 * @throws The last error thrown by fn() if all attempts fail
 *
 * @example
 * ```ts
 * const data = await retry(() => fetch("/api/data").then(r => r.json()), {
 *   maxAttempts: 5,
 *   backoffBase: 2000,
 * });
 * ```
 */
```

---

### Tutorial Structure

```
# Tutorial: [Goal Statement]

## What You'll Build
(Screenshot or description of the end result)

## Prerequisites
(Exact versions. Links to install guides. "Run `node -v` to check.")

## Step 1: [Action Verb] the [Thing]
(Explanation of WHY this step is needed)
(Code block -- complete, copy-pasteable)
(Verification: "You should see..." or "Run `X` to confirm")

## Step 2: [Action Verb] the [Thing]
(Same pattern)

## Step 3: ...

## What You've Learned
(Bullet summary of concepts covered)

## Next Steps
(Links to related tutorials, how-to guides, or API docs)
```

#### Tutorial Rules

```
1. EVERY step must have a verification
   "Run `npm test` -- you should see 3 tests passing."

2. NEVER skip a step because it's "obvious"
   The reader is learning. Nothing is obvious.

3. ALWAYS provide the complete file after major changes
   Don't make readers mentally merge 5 diffs.

4. EXPLAIN the why, not just the what
   "We add this middleware BECAUSE it parses JSON bodies.
    Without it, req.body would be undefined."

5. TEST the tutorial yourself
   Follow every step from scratch on a clean machine.
```

---

### Writing Rules

#### Clarity Checklist

```
[ ] Active voice:     "The function returns X" not "X is returned by the function"
[ ] Present tense:    "This method creates" not "This method will create"
[ ] Second person:    "You can configure" not "The user can configure"
[ ] Short sentences:  Under 25 words. One idea per sentence.
[ ] Short paragraphs: Under 5 sentences. Add a blank line between paragraphs.
[ ] No jargon:        Define technical terms on first use. Or link to a glossary.
[ ] Concrete:         "Returns in under 50ms" not "Returns quickly"
[ ] Consistent terms: Pick one word and stick with it. Not "function/method/routine"
```

#### Words to Avoid

```
"Simply"     -> (delete it -- if it were simple, they wouldn't need docs)
"Obviously"  -> (delete it -- it's not obvious to the reader)
"Just"       -> (delete it -- minimizes the reader's difficulty)
"Easy"       -> (delete it -- easy for you, frustrating for them)
"Note that"  -> (delete it -- just state the thing)
"In order to"-> "To"
"Utilize"    -> "Use"
"Leverage"   -> "Use"
"Facilitate" -> "Help" or "Enable"
```

---

### Code Examples

#### The Golden Rules

```
1. COMPLETE:    Include all imports, setup, and teardown
2. RUNNABLE:    Copy-paste into a fresh file and it works
3. REALISTIC:   Use realistic variable names and data, not foo/bar
4. PROGRESSIVE: Start simple, add complexity gradually
5. ANNOTATED:   Comments explain the non-obvious parts
```

#### Bad vs Good Example

```python
# BAD: Incomplete, uses foo/bar, no imports
result = client.query(foo, bar=True)
print(result.data)

# GOOD: Complete, realistic, annotated
import httpx

# Create a client with your API key
client = httpx.Client(
    base_url="https://api.example.com",
    headers={"Authorization": f"Bearer {API_KEY}"}
)

# Search for users by name (returns up to 10 results)
response = client.get("/users/search", params={"q": "alice", "limit": 10})
users = response.json()["data"]

for user in users:
    print(f"{user['name']} ({user['email']})")
# Output:
# Alice Johnson (alice@example.com)
# Alice Wong (awong@example.com)
```

---

### Diagrams

#### When to Use

```
USE diagrams for:
  - System architecture (how components connect)
  - Request flow (how data moves through the system)
  - State machines (valid states and transitions)
  - Sequence diagrams (multi-party interactions)
  - Decision trees (branching logic)

SKIP diagrams for:
  - Simple CRUD flows
  - Anything a sentence can explain
  - Anything that changes weekly (maintenance burden)
```

#### Mermaid Cheat Sheet

```
Architecture:
  graph LR
    Client --> API[API Gateway]
    API --> Auth[Auth Service]
    API --> Users[User Service]
    Users --> DB[(PostgreSQL)]
    Users --> Cache[(Redis)]

Sequence:
  sequenceDiagram
    Client->>API: POST /login
    API->>Auth: Validate credentials
    Auth->>DB: Query user
    DB-->>Auth: User record
    Auth-->>API: JWT token
    API-->>Client: 200 OK + token

State machine:
  stateDiagram-v2
    [*] --> Draft
    Draft --> Review: Submit
    Review --> Approved: Approve
    Review --> Draft: Request Changes
    Approved --> Published: Publish
    Published --> [*]
```

---

### Versioning Documentation

#### Docs-as-Code Principles

```
1. Docs live in the same repo as code
2. Docs are reviewed in the same PR as code changes
3. Docs are versioned alongside code (tags/branches)
4. Docs are built and deployed in CI
5. Docs have tests (link checking, example validation)
```

#### Changelog Format (Keep a Changelog)

```markdown
## [1.2.0] - 2026-03-31

### Added
- New `retry()` function with exponential backoff
- Support for custom timeout per request

### Changed
- `Client.get()` now returns a `Response` object instead of raw dict

### Fixed
- Connection pool leak when request times out

### Deprecated
- `Client.fetch()` -- use `Client.get()` instead (removal in 2.0.0)

### Removed
- Python 3.9 support (minimum is now 3.10)
```

---

### Common Documentation Mistakes

```
1. OUTDATED EXAMPLES
   The code changed but the docs didn't. The example throws an error.
   Fix: Run examples in CI. If the example breaks, the build breaks.

2. MISSING PREREQUISITES
   "Run `npm start`" -- but they need Node 18, not Node 16.
   Fix: List exact versions. Provide a check command.

3. ASSUMED KNOWLEDGE
   "Configure the IAM role" -- but the reader has never used AWS.
   Fix: Link to prerequisite guides. Know your audience.

4. WALL OF TEXT
   800-word paragraphs with no headers, no code, no bullets.
   Fix: Headers every 3-5 paragraphs. Code examples. Bullet lists.

5. NO SEARCH OPTIMIZATION
   The reader searches "how to configure auth" but your page is titled
   "Security Subsystem Administration Module."
   Fix: Use the words your readers would search for.

6. INCOMPLETE ERROR DOCUMENTATION
   "If the operation fails, an error is returned."
   Fix: What error? What code? What message? How to fix it?
```

---

### Documentation Tooling

#### Decision Matrix

| Tool | Best For | Language | Features |
|------|----------|----------|----------|
| Docusaurus | Product docs, React ecosystem | MDX | Versioning, search, i18n |
| MkDocs + Material | Python projects, clean design | Markdown | Search, nav, API integration |
| Sphinx | Python API docs, academic | RST/MD | Auto-docstring extraction |
| Storybook | Component libraries, UI docs | JSX | Live components, visual testing |
| Mintlify | API-first companies | MDX | Beautiful defaults, API playground |
| GitBook | Team wikis, internal docs | Markdown | WYSIWYG, collaboration |

#### Minimum Viable Documentation Stack

```
For most projects:
1. README.md in the repo root (always)
2. docs/ directory with MkDocs or Docusaurus (when >5 pages)
3. Inline code comments (WHY, not WHAT)
4. CHANGELOG.md (Keep a Changelog format)
5. ADR/ directory for Architecture Decision Records (when >3 devs)
```
