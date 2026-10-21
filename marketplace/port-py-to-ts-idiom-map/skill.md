# Port Python to TypeScript Idiom Map

**One-line description:** Produces the project-specific Python to TypeScript translation table (collections, truthiness, equality, None versus null and undefined, classes and dataclasses, generators, context managers, imports, async, sorting, slicing) with the strict `tsconfig.json` settings that make the TypeScript compiler catch the translation mistakes, filled in only for constructs the source actually uses.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_repo` (string, required): Path to the Python repository at the reference commit.
- `dependency_map` (object[], required): Output of `port-dependency-equivalence-map`.
- `integer_findings` (object[], required): Output of `port-integer-semantics-audit`; decides `number` versus `bigint`.

---

## Outputs

- `py_ts_idioms` (object): `tsconfig` (the compiler options to use), `rules` (one row per construct used by the source: Python form, TypeScript form, trap, example source location), and `lint` (ESLint rules that enforce the table).

---

## Phase 1: Count the Constructs Used

### Entry Criteria
- Source at the reference commit.

### Actions
1. Run each search and record the hit count. A construct with zero hits is left out of the table.
   - Truthiness on containers: `rg -n "if (not )?\w+:|while \w+:" --type py`
   - Comprehensions and generators: `rg -n "\[[^]]+ for |\{[^}]+ for |yield" --type py`
   - Dataclasses and named tuples: `rg -n "@dataclass|NamedTuple|namedtuple|TypedDict|Enum\)" --type py`
   - Context managers: `rg -n "^\s*with |__enter__|contextmanager" --type py`
   - Default and keyword arguments: `rg -n "def \w+\(.*=|\*\*kwargs|\*args" --type py`
   - Slicing and negative indexes: `rg -n "\[-\d|\[[^]]*:[^]]*\]" --type py`
   - Sorting: `rg -n "sorted\(|\.sort\(" --type py`
   - Equality on containers: `rg -n "== \[|== \{|== \(" --type py`
   - Dict and set: `rg -n "\{\}|dict\(|set\(|defaultdict|Counter|OrderedDict" --type py`
   - Async: `rg -n "async def|await |asyncio\." --type py`
   - Type hints in use: `rg -n "-> |: (int|str|float|bool|list|dict|Optional|Union)" --type py | wc -l` (high counts make the port much easier)

### Output
Construct counts.

### Quality Gate
- Every search above has a recorded count.

---

## Phase 2: Fill the Translation Table

### Entry Criteria
- Counts exist.

### Actions
1. Copy the rows for constructs with nonzero counts from this table into `rules`, each with one real source location as the example.

| Python | TypeScript | Trap |
|---|---|---|
| `list[T]` | `T[]` | `arr[i]` out of range gives `undefined`, not an error; with `noUncheckedIndexedAccess` the type is `T \| undefined` and the compiler makes you handle it |
| `tuple[A, B]` | `readonly [A, B]` | tuples are arrays; `===` compares identity |
| `dict[str, V]` | `Map<string, V>` | a plain object breaks on keys like `__proto__` and `constructor`, and integer-like keys iterate first in numeric order; use `Map` when keys come from data |
| `dict[K, V]` with tuple or object keys | `Map<string, V>` keyed by `JSON.stringify(k)` or a `${a}\|${b}` key | `Map` compares object keys by identity |
| `set[T]` of primitives | `Set<T>` | sets of arrays or objects do not dedupe by value; key by a string |
| `defaultdict(list)` | `m.get(k) ?? (m.set(k, []), m.get(k)!)` helper `getOrInit` | do not use `\|\|` for defaults: `0` and `""` are falsy |
| `Counter` | `Map<K, number>` with an increment helper | `Counter.most_common` orders ties by insertion; reproduce with a stable sort |
| `None` | `null` (pick one; use `undefined` only for absent optional properties) | `== null` matches both; `===` does not |
| `if items:` (container) | `if (items.length > 0)` / `if (m.size > 0)` | `[]` and `{}` are truthy in JS |
| `if x:` (number or string) | `if (x !== 0)` / `if (x !== "")` written out | `NaN` is falsy in JS and truthy in Python |
| `a == b` on lists, dicts | `isDeepStrictEqual(a, b)` from `node:util` | `===` on arrays is identity |
| `@dataclass` | `class` with `constructor` fields, or `interface` plus a factory | `@dataclass` generates `__eq__` and `__repr__`; write `equals` and a repr helper if output or comparisons use them |
| `@dataclass(frozen=True)` | `readonly` fields plus `Object.freeze(this)` | `readonly` is compile-time only |
| `Enum` | `const` object with `as const` and a union type | TS `enum` emits runtime code and is not allowed under `erasableSyntaxOnly`; numeric enums accept any number |
| `[f(x) for x in xs if p(x)]` | `xs.filter(p).map(f)` | order of side effects changes: Python calls `p` then `f` per element; filter-then-map calls all `p` first |
| generator, `yield` | `function*`, `yield` | `yield from g` is `yield* g` |
| `with open(p) as f:` | `const text = await readFile(p, "utf8")` or `try/finally` | Python `open` uses locale encoding unless `encoding=` given; Node needs the encoding argument or returns a Buffer |
| `def f(a, b=[])` | `function f(a: A, b: B[] = [])` | Python's default is created once and shared (a bug the source may depend on); TS creates it per call |
| `**kwargs`, keyword arguments | options object `function f(a: A, { b = 1, c }: Opts = {})` | positional calls `f(1, 2)` break: check all call sites |
| `s[a:b]`, `s[-1]` | `s.slice(a, b)`, `s.at(-1)` | indexes are UTF-16 units; see `unicode_findings` |
| `sorted(xs, key=k)` | `[...xs].sort((a, b) => cmp(k(a), k(b)))` | default `sort()` compares as strings: `[10, 9, 1].sort()` gives `[1, 10, 9]`; always pass a comparator; sort is stable since ES2019 like Python |
| `sorted(xs, reverse=True)` | comparator with operands swapped | `.sort().reverse()` breaks stability for equal keys |
| `a // b`, `a % b` | see `integer_findings` | never `Math.floor` on `bigint` |
| `int` beyond 2^53 | `bigint` | `JSON.stringify` throws on `bigint` |
| `isinstance(x, T)` | `x instanceof T` for classes; `typeof x === "string"` for primitives | `instanceof` fails across realms; not an issue in one Node process |
| `raise ValueError(m)` | `throw new InvalidArgumentError(m)` | see `error_mapping` |
| `async def` / `await` | `async function` / `await` | a coroutine not awaited in Python never runs; a Promise not awaited in JS runs and its rejection is unhandled |
| `package/__init__.py` | `package/index.ts` | with `"module": "NodeNext"`, relative imports need the `.js` extension in the source text |
| f-string `f"{x:.2f}"` | template literal plus `float_findings` helper | `toFixed` rounding differs |

2. Set `tsconfig` options and record why each is on:

| Option | Value | Catches |
|---|---|---|
| `strict` | `true` | null misuse, implicit `any` |
| `noUncheckedIndexedAccess` | `true` | Python `IndexError` and `KeyError` sites becoming silent `undefined` |
| `exactOptionalPropertyTypes` | `true` | confusion between missing and `undefined` |
| `noImplicitReturns` | `true` | Python functions that fall off the end return `None` |
| `module` / `moduleResolution` | `NodeNext` / `NodeNext` for Node | import path mistakes |
| `target` | the ES version your Node supports (check node.green) | down-level emit changing semantics |

3. Set `lint`: `@typescript-eslint/no-explicit-any`, `@typescript-eslint/strict-boolean-expressions` (forces explicit truthiness checks), `@typescript-eslint/require-array-sort-compare`, `@typescript-eslint/no-floating-promises`.

### Output
`py_ts_idioms`.

### Quality Gate
- Every construct with a nonzero count from Phase 1 has a row with a real source location.
- A scratch project with the chosen `tsconfig.json` compiles an empty file: `npx tsc --noEmit -p .` exits 0 (proves the options are valid for the installed TypeScript version).

---

## Phase 3: Prove Three Rules on Real Code

### Entry Criteria
- Table filled.

### Actions
1. Pick the three rules with the highest counts. For each, port the example location's function by hand into a scratch `.ts` file following the rule, and port it once "naively" (direct syntax translation).
2. Run the golden records for that function's behavior against both (a few lines of code reading the JSONL records with that `behavior` id). The rule version must pass; the naive version should fail on at least one record. If the naive version passes everything, the rule is still kept, but its example is replaced with one that shows the difference, or the trap is marked "not exercised by corpus".

### Output
Evidence per rule.

### Quality Gate
- For each of the three rules, the pass and fail counts of both versions are recorded.

---

## Worked Example

Illustrative. Source `inventory.py`:
```python
def low_stock(items: dict[str, int], threshold: int = 5) -> list[str]:
    return sorted(k for k, v in items.items() if v < threshold)
```
Phase 1 counts: sorting 14, dict 22, truthiness 31.

Naive port:
```ts
export function lowStock(items: Record<string, number>, threshold = 5): string[] {
  return Object.keys(items).filter(k => items[k] < threshold).sort();
}
```
Rule-based port:
```ts
export function lowStock(items: Map<string, number>, threshold = 5): string[] {
  return [...items].filter(([, v]) => v < threshold).map(([k]) => k).sort(cmpCodePoints);
}
```
Phase 3 replay against B-004 (37 records): naive 35 pass, 2 fail (records B-004/0019 and B-004/0020 contain keys `""` and `"😀"`; Python sorts by code point, default `sort()` compares UTF-16 code units, so the order flips); rule-based 37 pass.

---

## Exit Criteria

DONE when every construct the source uses has a row with a real example, the `tsconfig` options compile on the installed TypeScript, and the top three rules are proven against golden records.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Source uses metaprogramming (`__getattr__`, metaclasses, `setattr` loops) | **Adjust**: add a row per pattern with an explicit TypeScript design (usually a `Proxy` or generated code); mark for user review. |
| Phase 2 | A `tsconfig` option is unknown to the installed TypeScript | **Adjust**: check `npx tsc --version` and the TypeScript release notes; drop the option and record it. |
| Phase 3 | Rule-based port fails a record | **Stop**: the rule is wrong; fix the rule before anyone ports with it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
