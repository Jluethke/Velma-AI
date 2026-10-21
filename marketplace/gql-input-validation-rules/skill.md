# GraphQL Input Validation Beyond the Type System

**One-line description:** Enforces value rules the GraphQL type system cannot express (length, format, range, cross-field) on every mutation input with a schema validator per stack (zod, pydantic, go-playground/validator), and returns failures as `BAD_USER_INPUT` errors or typed user errors by a fixed rule.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `validated_schema` (string, required): Contract schema.
- `project_dir` (string, required): Server root.
- `stack` (string, required): `apollo`, `yoga`, `python` or `go`.
- `validation_rules` (object[], required): User-supplied rules per input field (for example `CreateOrderInput.note` max length, `email` format). This flow does not invent limits.

---

## Outputs

- `validation_code` (string[]): Paths of validator definitions and the resolvers that call them.
- `validation_tests` (string): Path to tests and their passing run output.

---

## Phase 1: Separate What GraphQL Already Checks

### Entry Criteria
- `validation_rules` covers every field of every `input` type, or the user confirmed "no rule" for the rest.

### Actions
1. Know what the server already rejects before your resolver runs: unknown fields, wrong scalar types, missing non-null arguments, invalid enum values. These fail in the validation phase with `GRAPHQL_VALIDATION_FAILED` (Apollo) or a validation error (others). Do NOT re-check them in code.
2. Classify each rule:

| Rule | Mechanism |
|---|---|
| Fixed set of values | change the field to an `enum` (schema change) |
| Format reused across many fields (email, URL, UUID) | custom scalar with `parseValue`/`parseLiteral` that throws (Node: `graphql-scalars` provides `EmailAddress`, `URL`, `UUID`; check its list) |
| Length, range, regex on one field | validator schema in resolver |
| Cross-field (`endDate` after `startDate`) | validator schema refinement |
| Needs the database (unique email, stock available) | resolver logic after validation, returned as a user error |

3. Decide the error channel once for the API with this rule: if the schema's mutation payloads have a `userErrors: [UserError!]!` field, return business and validation failures there; otherwise throw `BAD_USER_INPUT` errors. Do not mix both for the same mutation.

### Output
Classified rule list and the chosen error channel.

### Quality Gate
- Every `validation_rules` row has exactly one mechanism.
- The error channel decision is recorded with the reason (payload has `userErrors` or not).

---

## Phase 2: Implement Validators

### Entry Criteria
- Classification done.

### Actions
1. Write validators per stack:

| `stack` | Library and pattern |
|---|---|
| `apollo`, `yoga` | `zod`: `const CreateOrderInput = z.object({ note: z.string().max(NOTE_MAX).optional() })`; in the resolver `const r = CreateOrderInput.safeParse(args.input); if (!r.success) ...`; read `r.error.issues` (each has `path` and `message`) |
| `python` | `pydantic` v2: `class CreateOrderIn(BaseModel): note: str \| None = Field(default=None, max_length=NOTE_MAX)`; `CreateOrderIn.model_validate(strawberry.asdict(input))`; catch `ValidationError` and read `e.errors()` (each has `loc`, `msg`). Strawberry also offers `strawberry.experimental.pydantic` types; use them only if the team accepts an experimental API |
| `go` | `github.com/go-playground/validator/v10`: tag a request struct `Note *string \`validate:"omitempty,max=NOTE_MAX"\``; `err := validate.Struct(in)`; type-assert `validator.ValidationErrors` and read `Field()`, `Tag()` |

`NOTE_MAX` stands for the value from `validation_rules`; write the actual number from the rule, never a guess.
2. Map each issue to the chosen channel: `BAD_USER_INPUT` with `extensions: { code: 'BAD_USER_INPUT', field: 'input.note' }`, or a `UserError { field: ["input","note"], message }` entry.
3. Validate at the top of the resolver, before any database write.
4. Do not echo the rejected value into the error message when the field may hold personal data.

### Output
Validators wired into resolvers.

### Quality Gate
- Build or import passes: `npx tsc --noEmit`, `python -c "import app.schema"`, or `go build ./...`.
- Each mutation with rules has its validator call as the first statement block (check by reading each resolver).

---

## Phase 3: Test Boundaries

### Entry Criteria
- Validators wired.

### Actions
1. For each length or range rule write three cases: at the limit (accepted), one past the limit (rejected), and empty or missing where optional.
2. For each cross-field rule write one accepted and one rejected case.
3. Assert the rejected cases return the chosen channel with the right `field` path, and that no row was written (query the test database).
4. Run the suite: `npx vitest run`, `pytest -q`, or `go test ./... -run Validation -v`.

### Output
`validation_code`, `validation_tests`.

### Quality Gate
- Test run exits 0.
- Number of boundary tests is at least 3 per length or range rule.

---

## Worked Example

Illustrative only. `stack = yoga`; rule: `CreateOrderInput.note` max 500 characters (from the product spec); payload has no `userErrors`.

Phase 2:
```ts
const r = CreateOrderInput.safeParse(args.input);
if (!r.success) {
  const i = r.error.issues[0];
  throw new GraphQLError(i.message, { extensions: { code: 'BAD_USER_INPUT', field: ['input', ...i.path].join('.') } });
}
```
Phase 3 response for 501 characters:
```json
{"errors":[{"message":"String must contain at most 500 character(s)","path":["createOrder"],"extensions":{"code":"BAD_USER_INPUT","field":"input.note"}}],"data":{"createOrder":null}}
```
`Tests 3 passed (3)`.

---

## Exit Criteria

DONE when every input rule is enforced by the type system, a scalar, a validator or resolver logic, errors use one channel per mutation, and boundary tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A rule has no number (for example "short note") | **Return**: ask the user for the limit; do not pick one. |
| Phase 2 | Validator message leaks the input value | **Adjust**: replace with a fixed message plus `field`. |
| Phase 3 | Rejected input still wrote a row | **Stop**: move validation before the write and rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
