# Version Raw Training Data with DVC

**One-line description:** Puts raw training data under DVC with a configured remote so every experiment can name the exact bytes it trained on by a content hash committed to git.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the git repository of the ML project.
- `raw_data_paths` (string[], required): Files or directories of raw data, relative to `repo_path`, for example `data/raw/orders.parquet`.
- `dvc_remote_url` (string, required): Remote storage URL, for example `s3://bucket/dvcstore`, `gs://bucket/dvcstore`, `azure://container/dvcstore`, or a local/NAS path.

---

## Outputs

- `data_version` (object): For each raw path, the `.dvc` file path and its `md5` (or `etag`) from the `.dvc` file, the remote name, the git commit that records them, and the output of `dvc status -c` showing nothing left to push.

---

## Phase 1: Initialize DVC and the Remote

### Entry Criteria
- `repo_path` is a git repo: `git -C <repo_path> rev-parse --is-inside-work-tree` prints `true`.
- `git status --porcelain` is empty, or the user agrees the existing changes are unrelated.

### Actions
1. Check the tool: `dvc --version`. If missing, install with the remote extra that matches the URL scheme: `pip install "dvc[s3]"`, `"dvc[gs]"`, `"dvc[azure]"`, or plain `dvc` for local paths.
2. If `.dvc/` does not exist, run `dvc init` from `repo_path`. If it exists, do NOT run `dvc init --force`; it rewrites config.
3. Add the remote as default: `dvc remote add -d storage <dvc_remote_url>`. If a remote named `storage` already exists, run `dvc remote list` and reuse the existing one instead of overwriting it.
4. Put credentials in the LOCAL config only, never the committed one: `dvc remote modify --local storage <key> <value>` (keys per remote type are listed in the DVC docs page for that remote; check `dvc remote modify --help`). `--local` writes to `.dvc/config.local`, which is git-ignored.
5. Commit: `git add .dvc/config .dvc/.gitignore .dvcignore` and `git commit -m "Initialize DVC with default remote"`.

### Output
DVC initialized with a default remote.

### Quality Gate
- `dvc remote list` prints `storage` and the URL.
- `git grep -n "secret\|password\|access_key" -- .dvc/config` prints nothing.

---

## Phase 2: Track the Raw Data

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. For each path in `raw_data_paths`, first confirm git is not already tracking it: `git ls-files --error-unmatch <path>`. If this succeeds, run `git rm -r --cached <path>` first, otherwise `dvc add` fails with an "already tracked by SCM" error.
2. Run `dvc add <path>` once per path. This writes `<path>.dvc` and appends the path to the `.gitignore` next to it.
3. Track a directory as ONE unit (`dvc add data/raw`) when files are always used together; track files separately when they change on different schedules.
4. Open each `.dvc` file and read the `outs:` entry: `md5:` (directory hashes end in `.dir`), `size:`, `path:`. Copy these into `data_version`.
5. `git add <path>.dvc <dir>/.gitignore` then `git commit -m "Track raw data with DVC"`.
6. Push the bytes: `dvc push`. Then `dvc status -c`. The expected output is that the cache and remote are in sync (DVC prints a message such as "Cache and remote 'storage' are in sync."). Any file listed as `new` has not reached the remote.

### Output
`.dvc` files committed and data pushed.

### Quality Gate
- `dvc status -c` lists no `new` or `modified` entries.
- `git ls-files "*.dvc"` lists one `.dvc` file per tracked path.
- `git check-ignore <path>` prints the path (the raw data itself is not in git).

---

## Phase 3: Prove a Clean Checkout Restores the Same Bytes

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Clone into a temporary directory: `git clone <repo_path> /tmp/dvc_check && cd /tmp/dvc_check`.
2. Copy the local remote credentials if needed (`.dvc/config.local` is not cloned), then run `dvc pull`.
3. Run `dvc status`. The expected output says data and pipelines are up to date.
4. Compare hashes: for a single file, `md5sum <path>` must equal the `md5:` in its `.dvc` file. For a directory, trust `dvc status` (directory hashes are computed over a manifest, not one md5sum).
5. Record the commit: `git rev-parse HEAD` into `data_version.git_commit`.
6. Delete the temporary clone.

### Output
`data_version`.

### Quality Gate
- `dvc status` in the clean clone reports nothing changed.
- For each single-file path, `md5sum` output equals the `.dvc` `md5:` value.

---

## Worked Example

Illustrative only.

Input: `raw_data_paths` = `["data/raw/orders.parquet"]`, `dvc_remote_url` = `s3://ml-data/dvcstore`.

```
$ dvc init
$ dvc remote add -d storage s3://ml-data/dvcstore
$ dvc add data/raw/orders.parquet
$ cat data/raw/orders.parquet.dvc
outs:
- md5: 3f2a9c0e5b1d4a7c8e6f0b2d1a9c8e7f
  size: 48211934
  hash: md5
  path: orders.parquet
$ git add data/raw/orders.parquet.dvc data/raw/.gitignore && git commit -m "Track raw data with DVC"
$ dvc push
1 file pushed
$ dvc status -c
Cache and remote 'storage' are in sync.
```

`data_version` = `{"orders.parquet": {"dvc_file": "data/raw/orders.parquet.dvc", "md5": "3f2a9c0e...", "remote": "storage", "git_commit": "a1b2c3d"}}`.

---

## Exit Criteria

DONE when every raw path has a committed `.dvc` file, the bytes are on the remote, and a clean clone restores them with `dvc pull`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ERROR: ... is not a git repository` | **Stop**: run `git init` only if the user confirms this is a new project. |
| Phase 1 | Credentials landed in `.dvc/config` | **Adjust**: move them with `dvc remote modify --local`, remove from `.dvc/config`, and rotate the exposed key. |
| Phase 2 | "output ... is already tracked by SCM" | **Adjust**: `git rm -r --cached <path>`, commit, then `dvc add` again. |
| Phase 2 | `dvc push` permission error | **Retry**: once after checking credentials with the cloud CLI; then **Stop** and report the exact error. |
| Phase 3 | `dvc pull` reports missing cache files | **Return**: to Phase 2 step 6; the push did not complete. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
