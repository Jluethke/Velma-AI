# Deploy an aarch64 Binary to the Target over rsync

**One-line description:** Copies a cross-built aarch64 binary and any bundled libraries to the target over `rsync` on ssh, places shared libraries where the loader will find them, updates the loader cache, and confirms the binary starts on the target without a missing-library error.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `binary_path` (string, required): Path to the aarch64 binary to deploy.
- `deploy_host` (string, required): The target ssh spec, for example `pi@192.168.1.50`. This flow runs when it is set.
- `remote_dir` (string, required): Destination directory on the target, for example `/opt/app`.
- `deps_report` (object, required): Output of `xarch-ldd-shared-deps-audit`, naming the shared libraries the binary needs.

---

## Outputs

- `deploy_report` (object): The files transferred, the loader-cache result, and the start check result.
- `remote_paths` (object): The remote binary path and the library install paths.

---

## Phase 1: Transfer the Binary and Libraries

### Entry Criteria
- `deploy_host` is reachable (`ssh "$deploy_host" true` returns 0).
- `binary_path` is an aarch64 ELF confirmed by `xarch-elf-arch-verify`.

### Actions
1. Create the remote dir: `ssh "$deploy_host" "mkdir -p $remote_dir"`.
2. Copy the binary preserving mode: `rsync -avz --chmod=u+rwx,go+rx "$binary_path" "$deploy_host:$remote_dir/"`. The `-z` compresses over the link; `-a` preserves permissions and the executable bit.
3. From `deps_report`, copy any bundled (non-system) libraries the target lacks. Put them either in a standard dir (`/usr/lib` or `/usr/local/lib`) or alongside the binary with an RPATH of `$ORIGIN`. Record where each went.
4. Do not deploy a binary that failed `xarch-elf-arch-verify`; an x86-64 binary on the target wastes a round trip and fails with `Exec format error`.
5. Do not overwrite a system library on the target with a bundled copy; place private libraries in the app dir or a dedicated path, not `/lib`.

### Output
Transferred files on the target.

### Quality Gate
- `rsync` exits 0 and `ssh "$deploy_host" "ls -l $remote_dir/<binary>"` shows the file with the execute bit.
- Each library named in `deps_report` as missing on the target is now present at a recorded remote path.

---

## Phase 2: Resolve Libraries and Confirm Start

### Entry Criteria
- The binary and libraries are on the target.

### Actions
1. If libraries were installed in a nonstandard dir, add it to the loader search path: write a line with that dir to `/etc/ld.so.conf.d/app.conf` and run `ssh "$deploy_host" "sudo ldconfig"`. If using `$ORIGIN` RPATH, no cache update is needed.
2. Confirm the loader resolves everything on the target: `ssh "$deploy_host" "ldd $remote_dir/<binary>"`. Every line must show a resolved path; a `not found` line names a library still missing.
3. Confirm the binary starts: `ssh "$deploy_host" "$remote_dir/<binary> --version"` (or the lightest no-side-effect flag the program has). A clean start or a normal usage message is success; `error while loading shared libraries` is a missing dependency.
4. Do not run the binary with side effects to test it starts; use `--version`, `--help`, or a dry-run flag.
5. Do not set `LD_LIBRARY_PATH` permanently to paper over a missing library; install the dependency or use an RPATH.

### Output
`deploy_report`, `remote_paths`.

### Quality Gate
- `ssh "$deploy_host" "ldd $remote_dir/<binary>"` shows no `not found` line.
- The binary's `--version` or `--help` runs on the target and exits without `error while loading shared libraries`.

---

## Worked Example

Illustrative. `binary_path` = `build-aarch64/app`, `deploy_host` = `pi@192.168.1.50`, `remote_dir` = `/opt/app`.

```
$ rsync -avz --chmod=u+rwx,go+rx build-aarch64/app pi@192.168.1.50:/opt/app/
app
$ ssh pi@192.168.1.50 "ldd /opt/app/app"
    libstdc++.so.6 => /usr/lib/aarch64-linux-gnu/libstdc++.so.6
    libc.so.6 => /lib/aarch64-linux-gnu/libc.so.6
$ ssh pi@192.168.1.50 "/opt/app/app --version"
app 1.0.0
```

`remote_paths` = `{ "binary": "/opt/app/app" }`. `deploy_report` records ldd clean and start ok.

---

## Exit Criteria

DONE when the binary and its needed libraries are on the target, `ldd` on the target shows no `not found`, and the binary starts without a shared-library error.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `deploy_host` not set | **Skip**: this flow does not apply; emit empty outputs. |
| Phase 1 | ssh refused | **Stop**: confirm the host, port and key; this flow does not alter target security settings. |
| Phase 2 | `ldd` shows `not found` | **Adjust**: copy that library from `deps_report`, then `ldconfig` and re-check. |
| Phase 2 | `error while loading shared libraries` | **Return**: run `xarch-ldd-shared-deps-audit`; a transitive dependency was missed. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
