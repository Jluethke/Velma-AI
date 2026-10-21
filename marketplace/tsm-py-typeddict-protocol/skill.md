# Python TypedDict and Protocol Modeling

**One-line description:** Replaces `dict[str, Any]` payloads with `TypedDict` (with `NotRequired`, `Required`, `ReadOnly` and `Literal` fields) and replaces concrete-class or `Any` parameters that are used by duck typing with `typing.Protocol`, choosing between TypedDict, dataclass, Protocol and ABC with a fixed decision table.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `py_annotated_modules` (object[], required): From `tsm-py-annotate-module`; its open questions and `dict[str, Any]` notes point at candidates.

---

## Outputs

- `py_structural_types` (object[]): One row per new type: name, kind (`TypedDict`, `Protocol`, `dataclass`, `Literal` alias), file, the `Any` or loose type it replaced, the call sites updated, and the checker result after.

---

## Phase 1: Find Candidates

### Entry Criteria
- The modules to change are annotated (rows exist in `py_annotated_modules`).

### Actions
1. Search:
   - `grep -rnE "dict\[str, ?Any\]|Dict\[str, ?Any\]|Mapping\[str, ?Any\]" src`
   - `grep -rnE ":\s*Any\b|-> Any\b" src`
   - `grep -rnE "Union\[[A-Za-z]+, ?[A-Za-z]+, ?[A-Za-z]+" src` (wide unions of classes)
   - `grep -rnE ": str\b.*# (one of|either)" src` (string fields that are really enums)
2. For each hit, read how the value is used and classify with this table. First matching row wins:

   | How the value is used | Use |
   |---|---|
   | A dict with a fixed set of string keys, created outside your code (JSON, YAML, an API, kwargs passed through) and consumed as a dict | `TypedDict` |
   | A record your code creates and owns, accessed by attribute | `@dataclass(frozen=True, slots=True)` (slots needs 3.10+) |
   | Untrusted external data that must be checked at runtime | pydantic model, in `tsm-py-pydantic-boundaries` |
   | A parameter that only needs certain methods or attributes, and callers pass unrelated classes | `Protocol` |
   | Classes you own that share implementation and must register as subtypes explicitly | `abc.ABC` with `@abstractmethod` |
   | A string or int with a small fixed set of values | `Literal["draft", "sent", "paid"]` alias, or `enum.Enum` if it has behavior |
   | A dict with arbitrary keys of one value type | `dict[str, V]` or `Mapping[str, V]` (read-only parameter) |

3. Record each candidate with its row.

### Output
Classified candidate list.

### Quality Gate
- Every grep hit is classified or marked not-applicable with a reason.

---

## Phase 2: Write the Types

### Entry Criteria
- Candidates classified.

### Actions
1. TypedDict, one type per commit:
   ```python
   from typing import Literal, NotRequired, TypedDict   # NotRequired: 3.11+, else typing_extensions

   class InvoicePayload(TypedDict):
       id: str
       status: Literal["draft", "sent", "paid"]
       total_cents: int
       memo: NotRequired[str]
   ```
   - `NotRequired[...]` marks a key that may be absent. A key that may be present with value `None` is `memo: str | None`. These are different; read the producer to decide.
   - `total=False` makes all keys optional; prefer per-key `NotRequired` so required keys stay required.
   - `ReadOnly[...]` (3.13+, or `typing_extensions`) marks keys consumers must not assign; check the checker version supports it before use.
   - TypedDict values are plain dicts at runtime: no validation, no methods, and `isinstance(x, InvoicePayload)` is an error. Runtime checks belong to the boundary flow.
   - Accessing an optional key: `payload.get("memo")` returns `str | None`; pyright reports `payload["memo"]` on a `NotRequired` key (rule `reportTypedDictNotRequiredAccess`) while mypy does not by default, so use `.get` or `"memo" in payload` narrowing consistently.
2. Protocol:
   ```python
   from typing import Protocol

   class SupportsSend(Protocol):
       def send(self, to: str, body: bytes) -> None: ...
   ```
   - Include only the members the consuming function uses. Find them by reading the function body.
   - Do not inherit from the Protocol in implementing classes unless you want explicit subclassing; structural matching works without it.
   - `@runtime_checkable` enables `isinstance`, but that only checks that the attribute names exist, not their signatures. Use it only when the code already does `isinstance` dispatch, and note the limit in a comment.
   - Protocol attributes declared as `name: str` are mutable; an implementing class with a read-only property does not match. Declare `@property def name(self) -> str: ...` in the Protocol when implementers use properties.
3. Literal aliases: `InvoiceStatus = Literal["draft", "sent", "paid"]` (3.12+: `type InvoiceStatus = Literal[...]`). Narrow `str` input to it at the boundary; inside the program pass the alias.
4. Replace the loose annotation at every use site of the value in the touched module. Run the checker; fix only errors in this module. Errors that appear in other modules show real places that build or read the dict differently: fix them in the same commit if they are in already-annotated modules, otherwise record them.
5. Run `test_command`. Commit `types(structural): InvoicePayload`.

### Output
`py_structural_types`.

### Quality Gate
- Checker error count for the touched modules is 0 and the project count did not rise.
- `grep -rn "runtime_checkable" src` hits only Protocols used with an existing `isinstance` dispatch, each with a comment.
- No TypedDict is used with `isinstance`: the checker reports this as an error, so a clean checker run proves it.
- `test_command` result equals the intake baseline.

---

## Worked Example

Illustrative only. `billing.webhooks.handle(event: dict[str, Any])` and `billing.notify.deliver(channel: Any, msg: bytes)`.

Phase 1: `event` comes from a JSON webhook and is read as `event["type"]`, `event["data"]["invoice_id"]`, optional `event["livemode"]`: TypedDict (validation separately at the boundary). `channel` receives `SmtpClient` or `SlackClient`, unrelated classes, and only `.send(to, body)` is called: Protocol.

Phase 2:
```python
class InvoiceEventData(TypedDict):
    invoice_id: str

class WebhookEvent(TypedDict):
    type: Literal["invoice.paid", "invoice.voided"]
    data: InvoiceEventData
    livemode: NotRequired[bool]
```
mypy reports `billing/webhooks.py:58: error: TypedDict "WebhookEvent" has no key "created"  [typeddict-item]`; the code read a key the producer never sends. Recorded as a BUG for the user. `deliver(channel: SupportsSend, msg: bytes)`; both client classes match without changes. Checker 0 in touched modules; tests pass.

---

## Exit Criteria

DONE when every classified candidate uses the type its table row names, the touched modules check clean, and tests match the baseline.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | The dict's keys vary by a tag field | **Adjust**: write one TypedDict per variant with a `Literal` tag and a union alias; checkers narrow on `if event["type"] == "invoice.paid":`. |
| Phase 2 | An implementing class does not match the Protocol | **Adjust**: read the checker note listing the mismatched member; fix the Protocol if it is stricter than the consumer needs, otherwise the class has a real signature bug to record. |
| Phase 2 | `NotRequired` import fails | **Adjust**: import from `typing_extensions` (add it pinned) for Python below 3.11. |
| Phase 2 | Change ripples into many unannotated modules | **Return**: stop at the module boundary and record the remaining sites for their turn in the order. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
