# Post-Publish Registry Verification

**One-line description:** Confirms the published version exists on its public registry, installs from that registry into a clean environment, carries its attestation where the registry supports one, and matches the changelog, with a fix-forward rule when anything is wrong.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `stack` (string, required): `python`, `node`, `go` or `rust`.
- `package_name` (string, required): Registry name or Go module path.
- `release_version` (string, required): The version just published.
- `changelog_entry` (object, required): From `pkg-changelog-entry`.
- `py_publish_record` (object, required): From `pkg-py-trusted-publishing`; empty unless stack is python.
- `npm_publish_record` (object, required): From `pkg-node-provenance-publish`; empty unless stack is node.
- `go_publish_record` (object, required): From `pkg-go-tag-and-proxy`; empty unless stack is go.
- `crate_publish_record` (object, required): From `pkg-rust-cargo-publish`; empty unless stack is rust.

---

## Outputs

- `release_verification` (object): Registry query output, clean-install output, attestation check output, changelog match result, GitHub release link if created, and verdict VERIFIED or DEFECT with the fix-forward action.

---

## Phase 1: Query the Registry

### Entry Criteria
- Exactly the publish record for `stack` is non-empty.

### Actions
1. Run the query for the stack:

   | Stack | Command | Expect |
   |---|---|---|
   | python | `curl -s https://pypi.org/pypi/<name>/<version>/json` | HTTP 200, `info.version` equals the version, `urls` lists wheel and sdist |
   | node | `npm view <name>@<version> version` and `npm view <name> dist-tags` | prints the version; tag points where intended |
   | go | `GOPROXY=https://proxy.golang.org go list -m -versions <module>` | version appears in the list |
   | rust | `cargo info <name>@<version>` | version shown |

2. Registries use CDNs; a brand new version can take a short time to appear. If missing, retry once; if still missing, check the publish record log before anything else.

### Output
Registry evidence.

### Quality Gate
- The command output showing the version is pasted.

---

## Phase 2: Install From the Public Registry

### Entry Criteria
- Phase 1 found the version.

### Actions
1. Install by exact version in a clean place outside the repo:

   | Stack | Commands |
   |---|---|
   | python | `python -m venv /tmp/verify && /tmp/verify/bin/python -m pip install --no-cache-dir "<name>==<version>"` then `cd /tmp && /tmp/verify/bin/python -c "import <pkg>; print(<pkg>.__file__)"` |
   | node | `mkdir /tmp/verify && cd /tmp/verify && npm init -y && npm install <name>@<version>` then the ESM and CJS import commands from `pkg-node-clean-install` |
   | go | `mkdir /tmp/verify && cd /tmp/verify && go mod init example.com/verify && go get <module>@<version>` and build a file that imports it |
   | rust | `cargo new /tmp/verify && cd /tmp/verify && cargo add <name>@<version> && cargo build` |

2. Run the one README example and compare the output.

### Output
Install evidence.

### Quality Gate
- The install command exits 0 and the README example output matches.

---

## Phase 3: Attestation, Changelog and Release Note

### Entry Criteria
- Phase 2 passed.

### Actions
1. Attestation:

   | Stack | Check |
   |---|---|
   | python | `curl -s https://pypi.org/integrity/<name>/<version>/<wheel filename>/provenance` returns JSON with attestation bundles (when published with trusted publishing and attestations) |
   | node | in `/tmp/verify`, `npm audit signatures` reports a verified attestation |
   | go | `go mod verify` in the consumer prints `all modules verified` (checksum database) |
   | rust | no registry attestation; record "not applicable" |

2. Changelog: confirm `CHANGELOG.md` at the release tag contains the entry: `git show <tag>:CHANGELOG.md | grep -n "## \[<version>\]"`.
3. Optional GitHub release: `gh release create <tag> --notes-file <file with the changelog entry text>`.
4. Verdict:

   | Result | Verdict | Action |
   |---|---|---|
   | all checks pass | VERIFIED | none |
   | install fails or example output wrong | DEFECT | fix forward: next patch version; python `yank` on PyPI, node `npm deprecate`, go `retract` in go.mod, rust `cargo yank`; never overwrite or reuse the version |
   | attestation missing where expected | DEFECT (supply chain) | fix the workflow; next release must carry it |

### Output
`release_verification`.

### Quality Gate
- Each table check has pasted output.
- Verdict cites its table row.

---

## Worked Example

Illustrative. `stack = python`, `tinyretry` 1.0.0.

Phase 1:
```
$ curl -s https://pypi.org/pypi/tinyretry/1.0.0/json | python -c "import json,sys;d=json.load(sys.stdin);print(d['info']['version'],[u['packagetype'] for u in d['urls']])"
1.0.0 ['bdist_wheel', 'sdist']
```
Phase 2: install into `/tmp/verify` prints `/tmp/verify/lib/python3.12/site-packages/tinyretry/__init__.py`; README example prints `ok after 2 attempts`.
Phase 3: provenance endpoint returns one attestation bundle; changelog grep prints `5:## [1.0.0] - 2026-10-20`. Verdict VERIFIED.

---

## Exit Criteria

DONE when the version is found on the registry, installs from it, its attestation (where supported) and changelog entry are confirmed, and the verdict names a table row.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No publish record or several records non-empty | **Stop**: the chain branch conditions are wrong. |
| Phase 1 | Version missing after one retry | **Return**: to the stack's publish flow and read its run log. |
| Phase 2 | Install works from file but not from the registry | **Adjust**: compare uploaded filenames with the local ones; a missing wheel or wrong tag is common. |
| Phase 3 | Defect found | **Return**: start a patch release through `pkg-release-version-lock`; mark the bad version per the verdict table. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
