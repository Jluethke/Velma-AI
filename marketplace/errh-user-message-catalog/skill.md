# User-Facing Error Message Catalog

**One-line description:** Writes one reviewed, keyed message per problem type that tells the user what happened and what to do next, never leaks internals (CWE-209), never reveals account existence on authentication failures, and is wired to a message key so translations and tests can reference it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `error_taxonomy` (object, required): From `errh-error-taxonomy`.
- `problem_type_registry` (object[], required): From `errh-rfc9457-problem-type-registry`.
- `locale_policy` (string, optional): Supported locales and the fallback locale, for example `en-US fallback, de-DE`. If absent, the catalog is single-locale `en-US` and translation is an open question.

---

## Outputs

- `message_catalog` (object): `{ locales, messages: [ { key, problem_type, title, detail_template, user_action, placeholders, reviewed_by } ] }`, plus the catalog file path in the repo.

---

## Phase 1: Draft Messages

### Entry Criteria
- `problem_type_registry` has at least one row.

### Actions
1. Create one message per registry row. Key format: `error.<slug>` (for example `error.validation-error`, `error.not-found`).
2. Each message has three parts, each one sentence:
   - `title`: what happened, in the user's terms. Copy the registry `title`.
   - `detail_template`: this occurrence, with named placeholders only for data the user supplied or owns (`{field}`, `{resource}`, `{retry_after_seconds}`).
   - `user_action`: what the user can do now: fix input, sign in, wait and retry, contact support with the `{trace_id}`.
3. Apply these fixed content rules:

| Class | Rule |
|---|---|
| unauthenticated on login | Use one message for wrong user and wrong password ("The username or password is incorrect."); OWASP Authentication Cheat Sheet. |
| forbidden vs not_found for another tenant's resource | Return the not_found message so existence is not revealed, if the API contract allows it; record the choice. |
| bug, dependency_permanent | Generic text plus `{trace_id}`; no cause, no component names. |
| dependency_transient, rate_limited | Say it is temporary and give the wait from `Retry-After` when known. |
| validation | Name the field and the rule; never echo a rejected value that may be a secret. |

4. Forbidden content in any template: stack traces, exception class names, SQL, file paths, hostnames, internal service names, raw upstream messages, and user input echoed without encoding (OWASP Error Handling Cheat Sheet, CWE-209).

### Output
Draft messages.

### Quality Gate
- Every registry row has exactly one message key.
- Running `rg -n -i "exception|traceback|sql|stack|\.py|\.go|null pointer|undefined" <catalog file>` prints nothing.

---

## Phase 2: Store as a Catalog File

### Entry Criteria
- Drafts pass the forbidden-content grep.

### Actions
1. Choose the file format from the stack's existing i18n tool. Use what the repo already has; if none, use the default below.

| stack | Existing tool found | Store in |
|---|---|---|
| python | `babel` or `gettext` (`.po` files) | `locales/<locale>/LC_MESSAGES/errors.po` |
| python | none | `app/errors/messages.<locale>.json` |
| go | `golang.org/x/text/message` or `go-i18n` | that tool's message files |
| go | none | `internal/problem/messages.<locale>.json` embedded with `//go:embed` |
| rust | `fluent` (`.ftl`) | `locales/<locale>/errors.ftl` |
| rust | none | `src/problem/messages.<locale>.json` loaded with `include_str!` |
| typescript | `i18next` | `locales/<locale>/errors.json` |
| typescript | none | `src/errors/messages.<locale>.json` |

2. Placeholders use the tool's syntax (`{field}` for i18next and fluent `{ $field }`; check the tool's docs).
3. Add a single lookup function per stack that takes `key`, `locale`, `params` and falls back to the fallback locale. Do not build messages with string concatenation in handlers.

### Output
Catalog file and lookup function.

### Quality Gate
- `jq -e . <file>` exits 0 for JSON catalogs, or the tool's own check passes (`msgfmt --check` for `.po`).
- Every locale file contains the same key set: `jq -r 'keys[]' a.json | sort > a.keys; jq -r 'keys[]' b.json | sort > b.keys; diff a.keys b.keys` prints nothing.

---

## Phase 3: Review

### Entry Criteria
- Catalog stored.

### Actions
1. Read each message as a user who has never seen the code. Each must answer "what happened" and "what can I do".
2. Record `reviewed_by` (a person or role) for each message; a model may draft but not mark review complete.

### Output
`message_catalog`.

### Quality Gate
- Every message has a non-empty `user_action`.
- `reviewed_by` is filled or the message is marked `OPEN: review`.

---

## Worked Example

Illustrative. `locale_policy=en-US fallback`.

```json
{
  "error.validation-error": {
    "title": "Your request is not valid.",
    "detail": "{count} fields need attention.",
    "action": "Correct the highlighted fields and submit again."
  },
  "error.temporarily-unavailable": {
    "title": "The service is temporarily unavailable.",
    "detail": "Please try again in {retry_after_seconds} seconds.",
    "action": "If this keeps happening, contact support and give reference {trace_id}."
  }
}
```
`rg -n -i "exception|traceback|sql" src/errors/messages.en-US.json` prints nothing.

---

## Exit Criteria

DONE when every problem type has a reviewed or explicitly open message with a user action, stored in a parseable catalog with matching keys across locales.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Product wants to show the raw upstream message | **Stop**: log it with the `trace_id`; the user sees the catalog text. |
| Phase 1 | Class needs different text per endpoint | **Adjust**: add a domain problem type in the registry flow; do not branch inside one key. |
| Phase 2 | Locale files diverge in keys | **Retry**: add the missing keys with the fallback text marked `OPEN: translate`. |
| Phase 3 | No reviewer available | **Return**: ship with `OPEN: review` marks; do not mark reviewed. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
