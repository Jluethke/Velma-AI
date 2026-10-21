# Rust ABNF Parser with nom

**One-line description:** Translates the validated ABNF grammar into `nom` parser combinators over `&[u8]` (one function per rule), avoids the `alt` first-match and `streaming` vs `complete` traps, tests every spec example with `cargo test`, and fuzzes the parser for panics with `cargo fuzz`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `grammar_file` (string, required): From `s2i-abnf-extract-validate`.
- `start_rule` (string, required): The ABNF rule a complete input must match.
- `project_dir` (string, required): Cargo crate root.

---

## Outputs

- `parser_module` (string): Path to `src/grammar.rs`.
- `parser_tests` (string): Path to the `#[cfg(test)]` module in `src/grammar.rs` plus `fuzz/fuzz_targets/parse.rs`.

---

## Phase 1: Set Up nom

### Entry Criteria
- `grammar_file` passed its validators.

### Actions
1. Add the crate: `cargo add nom`. Read the version that was added in `Cargo.toml` and open the docs for that exact major version on docs.rs; nom 7 and nom 8 differ (nom 8 moved to a `Parser` trait with `.parse(input)`). Write code for the installed version only.
2. Use the `complete` modules (`nom::bytes::complete::*`, `nom::character::complete::*`) because the whole message is in memory. The `streaming` variants return `Err::Incomplete` at end of input, which looks like a failure and confuses negative tests.
3. Work on `&[u8]`, not `&str`; ABNF is defined over octets and `%x80-FF` is not valid UTF-8 on its own.

### Output
nom dependency and chosen module paths.

### Quality Gate
- `cargo build` exits 0.
- `grep nom Cargo.toml` shows the version whose docs you read.

---

## Phase 2: Translate Rules

### Entry Criteria
- nom builds.

### Actions
1. One function per ABNF rule, `fn rule_name(i: &[u8]) -> IResult<&[u8], &[u8]>`, returning the matched slice (use `recognize(...)`), written bottom-up from core rules.
2. Translate with this table:

   | ABNF | nom (complete) |
   |---|---|
   | `a b` | `(a, b)` tuple parser (nom 8) or `tuple((a, b))` (nom 7) |
   | `a / b` | `alt((a, b))` (ORDERED: first success wins) |
   | `*a` / `1*a` | `many0(a)` / `many1(a)`, or `take_while` / `take_while1` for single-byte classes |
   | `n*m a` | `many_m_n(n, m, a)` |
   | `[a]` | `opt(a)` |
   | `"abc"` (case-insensitive) | `tag_no_case("abc")` |
   | `%s"abc"` | `tag("abc")` |
   | `%x30-39` | `satisfy`-style byte check or `take_while1(\|b: u8\| (0x30..=0x39).contains(&b))` |

3. `alt` is first-match like PEG. For each alternation, write a comment stating whether any alternative can match a prefix of another; if yes, put the longer one first or follow it with a `peek`/`not` check of what must come next.
4. Expose `pub fn parse(input: &[u8]) -> Result<(), SyntaxError>` that calls `all_consuming(start_rule)` (nom combinator) so trailing bytes fail, and maps nom's error to your own `SyntaxError { offset }` computed as `input.len() - remaining.len()`.
5. Do not `unwrap()` inside parser functions; a panic on input is a bug the fuzzer will find.

### Output
`src/grammar.rs`.

### Quality Gate
- `cargo clippy -- -D warnings` exits 0.
- Count of `fn` rule functions equals the count of ABNF rules.

---

## Phase 3: Tests and Fuzzing

### Entry Criteria
- `parse` compiles.

### Actions
1. In `#[cfg(test)] mod tests`, write one `#[test] fn sec_<section>_<name>()` per spec example asserting `parse(b"...").is_ok()`, and negative tests asserting `is_err()` (forbidden byte, missing element, trailing byte).
2. Run `cargo test grammar`. Fix one failing test at a time.
3. Fuzz: `cargo install cargo-fuzz`, then `cargo fuzz init` (creates `fuzz/`), then `cargo fuzz add parse` and set the target body to `let _ = mycrate::grammar::parse(data);`. Run with nightly: `cargo +nightly fuzz run parse -- -max_total_time=<seconds the user chooses>` (`-max_total_time` is a libFuzzer option).
4. A crash writes `fuzz/artifacts/parse/crash-<hash>`. Reproduce with `cargo +nightly fuzz run parse fuzz/artifacts/parse/crash-<hash>`, add it as a regular `#[test]`, fix, rerun.
5. Never mark a failing spec example `#[ignore]` without an `AMB-` reference in the attribute reason.

### Output
`parser_tests`.

### Quality Gate
- `cargo test grammar` reports `0 failed`.
- The fuzz run ends without a crash, or every crash file has a matching regression test that passes.

---

## Worked Example

Illustrative. RFC 5322 `dot-atom-text`, `start_rule` = `dot-atom-text`.

Phase 2: `atext` is a byte class; `dot-atom-text = 1*atext *("." 1*atext)` becomes `recognize((take_while1(is_atext), many0((tag("."), take_while1(is_atext)))))` on nom 8.

Phase 3:
```
$ cargo test grammar
running 14 tests
test grammar::tests::sec_3_2_3_simple ... ok
test grammar::tests::neg_double_dot ... ok
test result: ok. 14 passed; 0 failed
$ cargo +nightly fuzz run parse -- -max_total_time=120
... Done ... runs in 120 second(s)
```
(`120` is the user's chosen budget for this example.)

---

## Exit Criteria

DONE when every ABNF rule is a nom function on `&[u8]` with complete-mode combinators, alternation order is documented, all spec example tests pass, and fuzzing produces no unfixed crash.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Code from examples does not compile against the installed nom | **Adjust**: you are mixing nom 7 and nom 8 APIs; use the docs.rs page for the installed version only. |
| Phase 2 | `many0` error "parser accepts empty input" (infinite loop guard) | **Adjust**: the inner parser can succeed on zero bytes; make it consume at least one. |
| Phase 3 | `cargo fuzz` fails on stable | **Adjust**: run with `+nightly`; install via `rustup toolchain install nightly`. |
| Phase 3 | Spec example fails | **Stop**: compare with the ABNF rule character by character before logging an ambiguity. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
