# Link Checking With lychee

**One-line description:** Checks every link in the Markdown sources and the built docs site with lychee, splitting a fast offline pass (local files and anchors, gates every pull request) from an online pass (external URLs, scheduled), with exclusions only for documented reasons and every broken link fixed at its source file.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `readme_path` (string, required): README from `dfc-readme-structure`; it is always in scope because it is the most-linked page and is rendered by package registries outside the docs site.
- `site_dir` (string, optional): Built site directory from `dfc-mkdocs-strict-build`, `dfc-docusaurus-build` or `dfc-py-sphinx-autodoc`. When absent, only Markdown sources are checked. The site builders already fail on internal broken links; this pass adds anchors in generated pages and external URLs.

---

## Outputs

- `link_report` (object[]): Per pass (offline, online): links checked, broken count before and after, excluded patterns with reasons.
- `link_fixes` (object[]): Per broken link: source file and line, URL, status or error, fix applied (corrected, replaced with archive URL, removed with reason, excluded with reason).

---

## Phase 1: Offline Pass on Sources and Site

### Entry Criteria
- `lychee --version` prints a version (install from the lychee releases page, `cargo install lychee`, `brew install lychee`, or use the `lycheeverse/lychee` Docker image).

### Actions
1. Check Markdown sources for local file links and anchors only:
   `lychee --offline --include-fragments --no-progress './**/*.md' --exclude-path node_modules --exclude-path .venv`
   `--offline` skips network requests; `--include-fragments` checks `#anchor` targets.
2. If `site_dir` is given, check the built HTML, where root-relative links (`/docs/x`) need a root:
   `lychee --offline --include-fragments --no-progress --root-dir "$(pwd)/<site_dir>" <site_dir>`
   Check `lychee --help` for `--root-dir` and `--base` on your version; `--root-dir` resolves root-relative paths against a local directory.
3. Read the output: each failure line shows status, URL and, in the summary, the source file. Exit code 0 means no broken links; exit code 2 means link check failures; other non-zero codes mean a config or runtime error, which is not a link result.
4. Fix local breakage at the source `.md` file, never in the built HTML.

### Output
Offline results and fixes.

### Quality Gate
- Both offline commands print `0 Errors` in the summary and `echo $?` prints `0`.

---

## Phase 2: Online Pass With Caching and Rate Limits

### Entry Criteria
- Offline pass clean.

### Actions
1. Create `lychee.toml` at the repository root:
   ```toml
   cache = true
   max_cache_age = "1d"
   max_retries = 3
   no_progress = true
   include_fragments = false
   exclude_path = ["node_modules", ".venv", "target"]
   ```
   Confirm each key in the lychee documentation for your version; lychee rejects unknown keys. Fragment checks on external pages are off here because many sites build anchors with JavaScript.
2. Run: `lychee --config lychee.toml './**/*.md'`. The cache file `.lycheecache` is written to the working directory; add it to `.gitignore`.
3. Classify each failure:

   | Result | Action |
   |---|---|
   | 404 / 410 | Find the moved page on the same site; if gone, replace with a Wayback Machine snapshot URL or remove the link with the sentence adjusted |
   | 301/302 chain to a different page | Update the link to the final URL |
   | 429 Too Many Requests | Not broken; rerun later with the cache, or add `--accept` for 429 only for that host with a reason |
   | 403 from a site that blocks bots | Open it in a browser; if it loads, add the host to `.lycheeignore` with a comment |
   | Timeout / DNS error | Retry once; if it persists, treat as 404 |
   | `localhost`, `example.com`, placeholder URLs in samples | Exclude with `exclude = ["^https?://localhost", "^https?://example\\.com"]` in `lychee.toml` |

4. `.lycheeignore` takes one regular expression per line; put a `#` comment above each line saying why.
5. Do NOT exclude a URL because it is broken. Exclusions are only for hosts that block automated checks or for placeholder URLs.

### Output
`link_fixes` with online results.

### Quality Gate
- `lychee --config lychee.toml './**/*.md'; echo $?` prints `0` last.
- Every non-comment line of `.lycheeignore` has a comment line above it (`grep -c -v '^#' .lycheeignore` is at most `grep -c '^#' .lycheeignore`).

---

## Phase 3: Gate Placement

### Entry Criteria
- Both passes clean.

### Actions
1. Decide where each pass runs:

   | Pass | When | Why |
   |---|---|---|
   | Offline | Every pull request | Deterministic; broken internal links are always this repo's fault |
   | Online | Scheduled (for example weekly) and on release branches | External sites change without a commit here; failing PRs for them blocks unrelated work |

2. For GitHub Actions, use `lycheeverse/lychee-action` with `args:` holding the same flags as Phases 1 and 2, and `fail: true`. Pin the action to a release tag or commit SHA.
3. For a Sphinx site, `sphinx-build -b linkcheck docs docs/_build/linkcheck` is an alternative online pass; it writes `output.txt` and `output.json` in the output directory.

### Output
`link_report` with gate placement.

### Quality Gate
- The CI workflow file contains the offline command on `pull_request` and the online command on `schedule` (`grep -n -E 'pull_request|schedule|lychee' .github/workflows/*.yml`).

---

## Worked Example

Illustrative only. Phase 1:
```
$ lychee --offline --include-fragments --no-progress './**/*.md'
[ERROR] file:///src/tidyconf/docs/how-to/ci-validation.md#exit-codes | Cannot find fragment
[ERROR] file:///src/tidyconf/docs/reference/schema-format.md | Cannot find file
🔍 41 Total ✅ 39 OK 🚫 2 Errors
```
Fixes: heading is `## Exit status`, so the fragment becomes `#exit-status`; `schema-format.md` was renamed `schema.md`.

Phase 2: `https://json-schema.org/understanding-json-schema/reference/string.html` returns 301 to a new path; link updated to the final URL. One `localhost:8080` sample URL excluded by pattern.

---

## Exit Criteria

DONE when the offline pass is clean on sources and the built site, the online pass is clean or each remaining exclusion has a written reason, and the passes are placed on pull requests and schedule respectively.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Every root-relative link fails in the site check | **Adjust**: set `--root-dir` to the absolute site path; if the site uses a `baseUrl` prefix, check that path mapping in the lychee docs. |
| Phase 1 | Exit code 1 or 3 | **Stop**: it is a lychee runtime or config error; read the message before interpreting any link result. |
| Phase 2 | GitHub links hit rate limits | **Adjust**: pass a token with `--github-token` or the `GITHUB_TOKEN` environment variable. |
| Phase 2 | A link is broken but the page is the only source | **Adjust**: use a Wayback Machine snapshot URL and record the original in `link_fixes`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
