# Path Traversal Fix With Resolve-and-Contain Checks

**One-line description:** Stops user-controlled file paths from escaping their base directory by replacing names with server-generated IDs where possible and otherwise resolving the full path (following symlinks) and checking containment with the correct API per stack (Python `Path.resolve()` plus `is_relative_to`, Node `path.resolve` plus `path.relative`, Go `os.Root` or `filepath.IsLocal`), including archive extraction (zip slip), and proves it with encoded traversal payloads.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `sink_map` (object, required): Output of `ival-sink-class-map`; rows with `class` = `path`.

---

## Outputs

- `path_fixes` (object): `fixed` (file, line, method: `id_lookup` or `contain_check`, base directory), `archive_fixes`, `test_file`, `test_run`.

---

## Phase 1: Choose the Method per Sink

### Entry Criteria
- One or more `path` rows in `sink_map.sinks`, or an archive extraction call found by `rg -n "extractall|ZipFile|tarfile|adm-zip|unzipper|archive/zip|archive/tar"`.

### Actions
1. Decide per sink:

| Situation | Method |
|---|---|
| User refers to a file the app stored (upload, export, avatar) | `id_lookup`: user sends an ID; the server maps ID to a path it generated. The user string never touches the filesystem API. |
| User must choose a name inside a fixed directory (static assets, user's own folder) | `contain_check` |
| User path is used to write | `contain_check` plus a server-generated final file name |
| Archive entries are written to disk | `contain_check` per entry (zip slip) |

2. Record the base directory for each `contain_check` sink as an absolute, resolved path set at startup from configuration.

### Output
Method table.

### Quality Gate
- Every sink has a method and, for `contain_check`, an absolute base directory.

---

## Phase 2: Implement the Check

### Entry Criteria
- Method table exists.

### Actions
1. Python (3.9 or later for `is_relative_to`):

```python
from pathlib import Path
BASE = Path(settings.FILES_DIR).resolve(strict=True)

def safe_path(user_name: str) -> Path:
    if "\x00" in user_name:
        raise ValueError("bad path")
    p = (BASE / user_name).resolve()          # resolves .. and symlinks
    if not p.is_relative_to(BASE):
        raise ValueError("outside base")
    return p
```
   Flask: `send_from_directory(BASE, name)` already applies a safe join; Werkzeug's `safe_join(base, name)` returns `None` on escape. Do not use `os.path.join` alone: an absolute second argument discards the base (`os.path.join("/srv/files", "/etc/passwd")` returns `/etc/passwd`).

2. Node:

```js
const path = require("node:path");
const BASE = fs.realpathSync(process.env.FILES_DIR);

function safePath(userName) {
  if (userName.includes("\0")) throw new BadRequest("bad path");
  const p = path.resolve(BASE, userName);
  const rel = path.relative(BASE, p);
  if (rel === "" || rel.startsWith("..") || path.isAbsolute(rel)) throw new BadRequest("outside base");
  return fs.realpathSync(p);   // then re-check rel against BASE to cover symlinks
}
```
   Do NOT check with `p.startsWith(BASE)` alone: `/srv/files-other` starts with `/srv/files`. Express: `res.sendFile(name, { root: BASE })` rejects `..` when `root` is set; keep `root`.

3. Go:

| Go version (`go version`) | Method |
|---|---|
| 1.24 or later | `root, _ := os.OpenRoot(base)`; `f, err := root.Open(userName)`. `os.Root` refuses paths that escape the root, including through symlinks. |
| 1.20 to 1.23 | `if !filepath.IsLocal(userName) { reject }` then `filepath.Join(base, userName)`; `IsLocal` rejects absolute paths, `..` escapes, empty names, and reserved names on Windows. It does not follow symlinks, so do not let users create symlinks in `base`. |
| older | upgrade, or `filepath.Clean` + `filepath.Rel(base, p)` and reject when the result starts with `..` |

   `http.ServeFile` with a user path is a sink; use `http.FileServer(http.Dir(base))` (it cleans the path) or `http.ServeFileFS` with `os.DirFS(base)`.

4. Archives (zip slip): for each entry, compute the destination with the same contain check before writing; skip or reject entries that are absolute, contain `..`, or are symlinks. Python 3.12 added `tarfile` extraction filters: use `tar.extractall(dest, filter="data")`. Do not call `zipfile.extractall` on untrusted archives without checking names first (`ZipFile.extractall` sanitizes names in current Python, but per-entry checks keep the rule uniform and also cap entry count and total size).
5. Decode before checking: frameworks decode `%2e%2e%2f` in the path segment; if your code decodes again (`unquote`), check after the last decode.
6. One sink per change; run tests after each.

### Output
Contain checks or ID lookups in place.

### Quality Gate
- `rg -n "startsWith\(\s*BASE|startswith\(\s*BASE" <src>` prints nothing (prefix checks replaced).
- Every `contain_check` sink calls the single `safe_path` helper (count of call sites equals count of sinks).

---

## Phase 3: Traversal Payload Tests

### Entry Criteria
- Checks in place.

### Actions
1. Create a test base directory with `a.txt`, a sibling directory `base-other/secret.txt`, and a symlink inside base pointing outside (`os.symlink("/etc", base/"link")` or equivalent; skip the symlink case on Windows without privileges and say so).
2. Assert each payload is rejected with 400 or 404 and never returns the outside file's contents:

```
../base-other/secret.txt
..%2fbase-other%2fsecret.txt
%2e%2e/%2e%2e/etc/passwd
....//....//etc/passwd
/etc/passwd
..\..\windows\win.ini
a.txt%00.png
link/passwd
```
3. Assert `a.txt` still loads (no over-blocking).
4. Archive test: build a zip containing `../../evil.txt` in the test and assert extraction rejects it and nothing is written outside dest.
5. Run, record summary. Mutation check: replace the helper body with plain `join`, rerun, confirm failures, revert.

### Output
`path_fixes`.

### Quality Gate
- Test summary shows 0 failed, `a.txt` case passes.
- Mutation run fails at least the `../base-other/secret.txt` case; reverted run passes.

---

## Worked Example

Illustrative. `stack` = `python`, Flask route `GET /orders/export?path=...` (EP-002) did `open(os.path.join(EXPORT_DIR, request.args["path"]))`.

Phase 1: exports are files the app generated, so method = `id_lookup`. The route becomes `GET /orders/export/<uuid:export_id>`; the handler loads the row and opens `EXPORT_DIR / f"{export_id}.csv"`.

Phase 3:
```
$ python -m pytest tests/test_export_paths.py -q
.........                                                  [100%]
9 passed in 0.18s
```

---

## Exit Criteria

DONE when every path sink uses an ID lookup or the single resolve-and-contain helper, archive extraction checks every entry, and traversal tests pass, `a.txt` loads, and the mutation fails.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Base directory is not set in config (relative path) | **Adjust**: add a config value and resolve it at startup; fail startup if missing. |
| Phase 2 | Users legitimately create symlinks in the base | **Return**: report that containment needs `os.Root` (Go 1.24) or `O_NOFOLLOW` style opening; ask the owner before allowing symlinks. |
| Phase 2 | Windows host | **Adjust**: also reject drive letters, UNC prefixes (`\\`), and alternate data streams (`:`) in names; Go `filepath.IsLocal` covers reserved names. |
| Phase 3 | Test passes with plain `join` | **Stop**: the test is not hitting the route or helper. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
