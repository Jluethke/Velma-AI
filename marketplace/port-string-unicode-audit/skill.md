# Port String and Unicode Audit

**One-line description:** Finds every string operation in the source whose result depends on the string model (code points in Python, UTF-16 code units in JavaScript and Java, UTF-8 bytes in Go, Rust and C), including length, indexing, slicing, case mapping, sorting, regex classes, splitting and normalization, and records the exact target call that reproduces the source result on a fixed set of hostile strings.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_repo` (string, required): Path to the source repository at the reference commit.
- `stack` (string, required): Port pair (`py-ts`, `py-go`, `js-ts`, `java-kotlin`, `c-rust`).
- `behavior_inventory` (object[], required): Output of `port-behavior-surface-inventory`.

---

## Outputs

- `unicode_findings` (object[]): One row per site: `id` (U-001 style), `location`, `operation`, `source_unit` (code point, UTF-16 unit, byte, grapheme), `target_call`, `differs_on` (probe strings), `behaviors` (B-ids).

---

## Phase 1: Know the String Models

### Entry Criteria
- `stack` is one of the five allowed values.

### Actions
1. Read the rows for both languages of the pair.

| Operation | Python `str` | JS / TS `string` | Go `string` | Java / Kotlin `String` | C `char*` | Rust `String` / `&str` |
|---|---|---|---|---|---|---|
| Storage unit | code point | UTF-16 code unit | byte (UTF-8 by convention, not enforced) | UTF-16 code unit | byte | UTF-8 byte, always valid UTF-8 |
| `len("é")` precomposed U+00E9 | 1 | 1 | 2 | 1 | 2 (`strlen`) | 2 (`.len()`) |
| length of U+1F600 | 1 | 2 | 4 | 2 | 4 | 4 |
| Count code points | `len(s)` | `[...s].length` | `utf8.RuneCountInString(s)` | `s.codePointCount(0, s.length)` | loop with `mbrtowc` or a UTF-8 decoder | `s.chars().count()` |
| `s[i]` | i-th code point | i-th code unit (half a surrogate pair possible) | i-th byte | `charAt(i)` code unit | i-th byte | not allowed; `s.as_bytes()[i]` or `s.chars().nth(i)` |
| Slice `s[a:b]` | by code point | `slice(a,b)` by code unit | `s[a:b]` by byte (may cut a character) | `substring(a,b)` by code unit | pointer arithmetic by byte | `&s[a..b]` by byte; panics if not on a char boundary |
| Uppercase `"ß"` | `"SS"` | `"SS"` | `strings.ToUpper` keeps `"ß"` (simple case mapping) | `"SS"` (`toUpperCase`; locale-sensitive unless `Locale.ROOT`; Kotlin `uppercase()` uses `Locale.ROOT`) | `toupper` per byte, ASCII only in "C" locale | `"SS"` (`to_uppercase`) |
| Lowercase `"İ"` U+0130 | `"i̇"` (2 code points) | `"i̇"` | check probe | locale `tr` gives `"i"`; `Locale.ROOT` gives `"i̇"` | n/a | `"i̇"` |
| Case-insensitive compare | `casefold()` | no casefold; `toLowerCase` or `localeCompare` with `sensitivity: 'base'` | `strings.EqualFold` (simple folding) | `equalsIgnoreCase` (per char) | `strcasecmp` ASCII | `eq_ignore_ascii_case` ASCII only; `caseless` crate for full folding |
| Default sort order | code point | UTF-16 code unit (differs from code point for U+E000..U+FFFF vs astral characters) | byte order (equals code point order for valid UTF-8) | UTF-16 code unit | `strcmp` byte order | byte order (equals code point order) |
| `\w`, `\d` in regex | Unicode | ASCII (`u` flag does not change `\w`) | ASCII (RE2) | ASCII unless `UNICODE_CHARACTER_CLASS` | per regex library | Unicode by default |
| `split()` no args | splits on any whitespace run, drops empty strings | no equivalent; `s.trim().split(/\s+/)` (empty string gives `[""]`) | `strings.Fields` | `trim().split("\\s+")` (ASCII whitespace) | `strtok` | `split_whitespace()` |
| `strip()` whitespace set | Unicode whitespace | `trim()` Unicode whitespace plus line terminators | `strings.TrimSpace` Unicode | `trim()` only chars at or below U+0020; `strip()` (Java 11) Unicode | `isspace` per locale | `trim()` Unicode |
| Normalization | none implicit; `unicodedata.normalize("NFC", s)` | none implicit; `s.normalize("NFC")` | `golang.org/x/text/unicode/norm` | `java.text.Normalizer` | none | `unicode-normalization` crate |
| Invalid sequences | lone surrogates allowed in `str` | lone surrogates allowed | invalid UTF-8 allowed; `range` yields U+FFFD | lone surrogates allowed | anything | impossible in `String`; use `Vec<u8>` or `OsString` |
| Byte decode errors | `bytes.decode()` raises `UnicodeDecodeError` | `TextDecoder` replaces with U+FFFD unless `{fatal: true}` | conversion never fails | `new String(bytes, UTF_8)` replaces | n/a | `String::from_utf8` returns `Err`; `from_utf8_lossy` replaces |

2. Copy only the rows where the two languages of `stack` differ.

### Output
Pair-specific difference list.

### Quality Gate
- Every copied row names both languages and differs between them.

---

## Phase 2: Find the Sites

### Entry Criteria
- Difference list exists.

### Actions
1. Grep the source:
   - Python: `rg -n "len\(|\[[^]]*:[^]]*\]|\.(upper|lower|casefold|title|capitalize|split|strip|lstrip|rstrip|ljust|rjust|center|zfill|startswith|endswith|find|index|encode|decode)\(|sorted\(|\.sort\(|re\.|unicodedata" --type py`
   - JavaScript: `rg -n "\.length|\.(slice|substring|substr|charAt|charCodeAt|codePointAt|toUpperCase|toLowerCase|split|trim|padStart|padEnd|localeCompare|normalize)\(|\.sort\(|new RegExp|/[^/]+/[gimsuy]*" --type js`
   - Java: `rg -n "\.length\(\)|\.(substring|charAt|codePointAt|toUpperCase|toLowerCase|split|trim|strip|equalsIgnoreCase|compareTo|getBytes)\(|Pattern\.compile|Collections\.sort|new String\(" --type java`
   - C: `rg -n "strlen|strncpy|strcpy|strcmp|strncmp|strcasecmp|toupper|tolower|isalpha|isspace|isdigit|mbstowcs|wcslen|\[[a-z_]+\] *=" --type c`
2. For each hit, decide whether non-ASCII text can reach it:

| Evidence | Decision |
|---|---|
| String comes from user input, files, network, or environment | finding |
| String is a literal or built only from ASCII literals and digits | `safe`, with the proof |
| Length or index is written to output or used to cut text | finding |
| Cannot decide | finding |

### Output
Site list with decisions.

### Quality Gate
- Every grep hit has a decision.
- Every `safe` decision names the literal or ASCII-only source.

---

## Phase 3: Choose the Target Call and Probe It

### Entry Criteria
- Findings exist.

### Actions
1. Use this fixed probe set for every finding: `""`, `"a"`, `"é"` (U+00E9), `"é"` (e plus combining acute), `"😀"` (U+1F600), `"👍🏽"` (thumbs up plus skin tone modifier), `"👨‍👩‍👧"` (ZWJ family sequence), `"ß"`, `"İ"` (U+0130), `"ﬁ"` (U+FB01 ligature), `" "` (no-break space), `"﻿"` (byte order mark), `"\u0000"`, `"a\r\nb"`, `"שלום"` (right-to-left), `"١٢٣"` (Arabic-Indic digits), `"１２３"` (full-width digits), `""` and `"😀"` together (sort order test).
2. Pick the target call that matches the source unit, not the target's default:

| Source semantics to preserve | TypeScript | Go | Kotlin | Rust |
|---|---|---|---|---|
| Code point length / index (Python) | `[...s].length`, `Array.from(s)[i]` | `[]rune(s)` | `s.codePointCount(0, s.length)`, `s.offsetByCodePoints(0, i)` | `s.chars().count()`, `s.chars().nth(i)` |
| Code point slice | `Array.from(s).slice(a, b).join("")` | `string([]rune(s)[a:b])` | `s.substring(s.offsetByCodePoints(0,a), s.offsetByCodePoints(0,b))` | `s.chars().skip(a).take(b - a).collect::<String>()` |
| UTF-16 semantics (JS or Java source) | native | `utf16.Encode([]rune(s))` | native | `s.encode_utf16()` |
| Python full case mapping | `toUpperCase()` (full mapping, matches for ß) | `golang.org/x/text/cases` `cases.Upper(language.Und)` | `uppercase()` | `to_uppercase()` |
| Python sort of `str` (code point) | `arr.sort((a, b) => cmpCodePoints(a, b))` helper iterating `codePointAt`; never the default `sort()` | `sort.Strings` / `slices.Sort` (byte order equals code point order) | helper comparing `codePoints()` | `sort()` (byte order equals code point order) |
| Python `\w` Unicode regex | `/[\p{L}\p{N}_]/u` (check against probe; Python `\w` also matches some marks) | `[\p{L}\p{N}_]` | `Regex("(?U)\\w")` (embedded flag for `UNICODE_CHARACTER_CLASS`) | `\w` |
| Python `str.split()` | `s.split(/\s+/u).filter(x => x !== "")` | `strings.Fields` | `s.split(Regex("\\s+")).filter { it.isNotEmpty() }` | `split_whitespace()` |
| Grapheme clusters (what users call characters) | `Intl.Segmenter` with `granularity: "grapheme"` | `github.com/rivo/uniseg` | `java.text.BreakIterator.getCharacterInstance()` | `unicode-segmentation` crate |
| C byte semantics (C to Rust) | n/a | n/a | n/a | `&[u8]` and `Vec<u8>`; convert to `str` only where the C code assumed UTF-8 and the corpus proves it |

3. Write a probe in both languages that applies the source operation and the chosen target call to every probe string, prints the result with each string escaped (Python `ascii(x)`, JS `JSON.stringify(x)`, Go `%+q`, Kotlin a helper printing `\\uXXXX`, Rust `{:?}`), and `diff` the outputs.

### Output
`unicode_findings` with the probe diff per finding.

### Quality Gate
- After the chosen target calls are applied, `diff` of the two probe outputs is empty for every finding, or each remaining line is an open question naming the probe string.
- No finding uses the target's `length`, `len`, or default `sort()` where the source unit differs.

---

## Worked Example

Illustrative. `stack=py-go`, source `truncate.py`:
```python
def truncate(s: str, n: int) -> str:
    return s if len(s) <= n else s[: n - 1] + "…"
```
Phase 2: `s` comes from user input: finding U-001.

Naive Go port `s[:n-1]` on `"héllo😀"` with n=5:
```
python: 'héll…'
go:     "h\xc3\xa9l\xe2\x80\xa6"   (cut by bytes; the é takes 2 bytes)
```
Phase 3 target: `r := []rune(s); if len(r) <= n { return s }; return string(r[:n-1]) + "…"`. Probe diff after the fix: empty for all probe strings. Note recorded: `"é"` counts as 2 code points in both, so the combining accent can be cut off; this matches the source and is preserved, not fixed.

---

## Exit Criteria

DONE when every string site that non-ASCII text can reach has a target call whose probe output matches the source on the full probe set, or an open question.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Java source runs on JDK 17 or earlier with a non-UTF-8 default charset | **Adjust**: record `file.encoding`; `getBytes()` and `new String(bytes)` without a charset depend on it. |
| Phase 2 | Source mixes bytes and text (Python 2 heritage, C) | **Adjust**: record each boundary where bytes become text and the encoding used. |
| Phase 3 | Source behavior is a bug (cuts surrogate pairs, splits graphemes) | **Return**: preserve it for parity and list it as a candidate intended divergence for the user to approve. |
| Phase 3 | Lone surrogate cannot be represented in the target (Rust `String`) | **Adjust**: record it; the corpus stores such inputs as tagged bytes and the Rust API takes `&[u8]` or rejects them, decided by the user. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
