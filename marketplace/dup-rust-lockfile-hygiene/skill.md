# Rust Lockfile Hygiene

**One-line description:** Makes a Cargo project build from a committed, in-sync `Cargo.lock` with `--locked`, records the MSRV and resolver version that constrain upgrades, and lists duplicate crate versions before any upgrade starts.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `repo_path`, `runtime_version`, `work_dir`.
- `baseline_report` (object, required): From `dup-baseline-snapshot`. Uses `pre_existing_failures`, `flaky_tests`.

---

## Outputs

- `lockfile_status` (object): `tool` (`cargo`), `lock_tracked` (bool), `in_sync` (bool), `rust_version` (MSRV or null), `resolver`, `workspace_members`, `duplicates` (crate to versions), `fixes_committed`, `new_baseline_sha`, `notes`. Also written to `<work_dir>/lockfile.json`.

---

## Phase 1: Read The Lock State

### Entry Criteria
- `upgrade_scope.stack == "rust"` and `Cargo.toml` exists.

### Actions
1. Is the lock tracked? `git ls-files Cargo.lock`. Cargo's current guidance is that committing `Cargo.lock` is a reasonable default for libraries as well as binaries; if it is untracked, ask the user before adding it.
2. Sync check: `cargo metadata --locked --format-version 1 > /dev/null`. With `--locked`, Cargo errors (`the lock file ... needs to be updated but --locked was passed to prevent this`) instead of rewriting the lock.
3. Read constraints from the root `Cargo.toml` (and `[workspace.package]`): `rust-version` (MSRV), `edition`, `resolver` (`"2"` default for edition 2021; edition 2024 defaults to `"3"`, which prefers dependency versions compatible with `rust-version`).
4. List workspace members: `cargo metadata --no-deps --format-version 1 | python -c "import json,sys; print([p['name'] for p in json.load(sys.stdin)['packages']])"`.
5. List duplicate versions: `cargo tree -d --locked -e normal` (`-d` is `--duplicates`). Save the output to `<work_dir>/cargo-dups.txt`.

### Output
`lock_tracked`, `in_sync`, `rust_version`, `resolver`, `workspace_members`, `duplicates`.

### Quality Gate
- The `--locked` metadata command exit code is saved.
- `<work_dir>/cargo-dups.txt` exists (empty is allowed).

---

## Phase 2: Repair Without Upgrading

### Entry Criteria
- `in_sync == false` or the lock is untracked and the user approved adding it.

### Actions
1. Let Cargo make the minimal edit: `cargo metadata --format-version 1 > /dev/null` (without `--locked`). Cargo adds entries for new requirements and keeps every existing locked version that still satisfies `Cargo.toml`. Do NOT run `cargo update` here; it moves every crate to the newest compatible version.
2. Check what moved: `git diff Cargo.lock | grep -E '^[-+]version = '`. Changed versions should belong only to crates whose requirement changed in a `Cargo.toml`. Anything else: `git checkout -- Cargo.lock` and report.
3. Build and test: `cargo build --locked --all-targets && cargo test --locked`. Results must equal the baseline.
4. Commit alone: `git commit -am "deps: sync Cargo.lock (no upgrades)"`. Record `new_baseline_sha`.

### Output
Synced `Cargo.lock`, `fixes_committed`.

### Quality Gate
- `cargo metadata --locked --format-version 1 > /dev/null` now exits 0.
- The version diff contains only crates whose requirement changed.

---

## Phase 3: Rules For The Rest Of The Run

### Entry Criteria
- Lock is in sync.

### Actions
1. Write into `notes`:
   - Semver-compatible bump of one crate: `cargo update -p <crate>` or a precise version `cargo update -p <crate> --precise <x.y.z>`. When two versions of the crate are in the lock, Cargo asks for `<crate>@<version>` to pick one.
   - Incompatible (major) bump: `cargo add <crate>@<major>` in the member that depends on it (changes the requirement), then build.
   - Cargo treats `0.x` minor changes as incompatible: `0.4` to `0.5` is a major bump.
   - Every build and test in this run uses `--locked`.
2. If `rust_version` is set, record that crates whose newer versions raise their own `rust-version` above it are blocked. With resolver `"3"` Cargo avoids them automatically; with resolver `"2"` it does not.

### Output
`lockfile_status`.

### Quality Gate
- `<work_dir>/lockfile.json` parses with `python -m json.tool`.

---

## Worked Example

Illustrative only. Workspace with `api` and `core`, edition 2021, `rust-version = "1.74"`.

- Phase 1: `cargo metadata --locked` fails: `the lock file /srv/app/Cargo.lock needs to be updated but --locked was passed to prevent this` (someone added `thiserror = "1"` to `core`). `cargo tree -d` shows `syn v1.0.109` and `syn v2.0.77`.
- Phase 2: `cargo metadata` adds `thiserror` and `thiserror-impl` only; `git diff Cargo.lock | grep '^[-+]version'` shows two added lines, zero changed. Tests equal baseline. Commit `90c2d71`.
- Phase 3: notes record resolver 2 with MSRV 1.74, so newer crates with higher `rust-version` must be checked by hand.

---

## Exit Criteria

DONE when `Cargo.lock` is tracked (or the user declined), `--locked` builds pass, MSRV and resolver are recorded, and bump rules are written.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Lock untracked and user declines adding it | **Return**: record `lock_tracked=false`; upgrades cannot be reproduced, list as an open question. |
| Phase 2 | Minimal sync moves unrelated versions | **Retry**: revert and confirm no one ran `cargo update`; repeat with `cargo metadata` only. |
| Phase 2 | Build fails with `package X cannot be built because it requires rustc 1.NN` | **Return**: record the crate and required rustc; it goes to the order plan as a runtime blocker. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
