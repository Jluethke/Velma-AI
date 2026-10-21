# Depth, Token and Alias Limits in Strawberry (Python)

**One-line description:** Adds Strawberry's built-in `QueryDepthLimiter`, `MaxTokensLimiter` and `MaxAliasesLimiter` schema extensions with values measured from the real client operations, and proves abusive queries are rejected while real ones pass.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `operation_documents` (string, required): Directory of real client operations.
- `project_dir` (string, required): Python server root.

---

## Outputs

- `limit_config` (object): Each limit, value and derivation.
- `limit_tests` (string): Path to tests and passing output.

---

## Phase 1: Measure Real Operations

### Entry Criteria
- `operation_documents` lists every operation clients send.

### Actions
1. Save `scripts/measure_ops.py` (outside the `app` package):
```python
import pathlib
from graphql import parse, visit, Visitor
from graphql.language import TokenKind
from graphql.language.lexer import Lexer
from graphql.language.source import Source

class M(Visitor):
    def __init__(self): super().__init__(); self.d = 0; self.max = 0; self.aliases = 0
    def enter_selection_set(self, *_): self.d += 1; self.max = max(self.max, self.d)
    def leave_selection_set(self, *_): self.d -= 1
    def enter_field(self, node, *_): self.aliases += 1 if node.alias else 0

for f in sorted(pathlib.Path("operations").glob("*.graphql")):
    text = f.read_text(); m = M(); visit(parse(text), m)
    lx = Lexer(Source(text)); n = 0
    while lx.advance().kind != TokenKind.EOF: n += 1
    print(f.name, "depth", m.max, "aliases", m.aliases, "tokens", n)
```
2. Run `python scripts/measure_ops.py`. Record the maximum of each column.
3. Depth conventions differ between tools; Phase 3 confirms the Strawberry limiter accepts the deepest real operation at the chosen value.

### Output
Maxima per measure.

### Quality Gate
- Output line count equals the number of operation files.

---

## Phase 2: Add Extensions

### Entry Criteria
- Maxima recorded.

### Actions
1. Add to the schema:
```python
from strawberry.extensions import QueryDepthLimiter, MaxTokensLimiter, MaxAliasesLimiter
schema = strawberry.Schema(query=Query, mutation=Mutation, extensions=[
    QueryDepthLimiter(max_depth=MAX_DEPTH),
    MaxTokensLimiter(max_token_count=MAX_TOKENS),
    MaxAliasesLimiter(max_alias_count=MAX_ALIASES),
])
```
Check the Strawberry "Extensions" docs page for your installed version; argument names above match current docs. `QueryDepthLimiter` also accepts `callback` and `should_ignore` (for example to skip introspection fields).
2. Values come from Phase 1 maxima. `max_depth` has no default in Strawberry and must be set.
3. Cost analysis: Strawberry has no built-in cost limiter at the time of writing. If the user requires one, record it as an open item; options are a custom graphql-core validation rule added with `strawberry.extensions.AddValidationRules([...])`, or enforcement at a gateway. Do not claim cost limiting is in place without it.
4. Turn off field suggestions when introspection is disabled: check the docs for `DisableValidation`/`DisableIntrospection` style extensions available in your version; if none fits, record as open.

### Output
Limits active.

### Quality Gate
- `python -c "from app.schema import schema; print([type(e).__name__ for e in schema.extensions])"` lists the three limiter classes (instances or classes depending on version).

---

## Phase 3: Prove Limits

### Entry Criteria
- Extensions added.

### Actions
1. Test 1: execute every real operation with `await schema.execute(text, variable_values=..., context_value=...)`; assert no error message mentions depth, tokens or aliases.
2. Test 2: a query one level deeper than `MAX_DEPTH`; assert `result.errors[0].message` contains `exceeds maximum operation depth` (read the real message once and assert on a stable substring).
3. Test 3: `MAX_ALIASES + 1` aliases; assert rejection.
4. Test 4: a document with more than `MAX_TOKENS` tokens; assert rejection.
5. Run `pytest -q tests/test_limits.py`.

### Output
`limit_config`, `limit_tests`.

### Quality Gate
- `pytest` exits 0 with four test groups passing.
- No operation file was removed.

---

## Worked Example

Illustrative only.

Phase 1:
```
CancelOrder.graphql depth 3 aliases 0 tokens 31
CustomerOrders.graphql depth 5 aliases 0 tokens 58
```
`limit_config`: `max_depth 5`, `max_token_count 58`, `max_alias_count`: measured 0; user set 1 so one aliased health query passes (recorded as user input).

Phase 3 depth-6 error: `'CustomerOrders' exceeds maximum operation depth of 5`. `pytest -q`: `4 passed in 0.22s`.

---

## Exit Criteria

DONE when depth, token and alias limits are active with derived values, real operations pass, abusive ones fail, and cost limiting is either implemented or listed open.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `ImportError` for a limiter | **Adjust**: upgrade `strawberry-graphql`; `MaxTokensLimiter`/`MaxAliasesLimiter` are newer than `QueryDepthLimiter`. Check the changelog. |
| Phase 3 | Deepest real operation rejected | **Adjust**: Strawberry counts depth differently from the script; raise the limit to the smallest value that accepts it. |
| Phase 3 | Token limit rejects a real operation | **Adjust**: set it to that operation's count; rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
