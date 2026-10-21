# Shell Script Requirements Intake

**One-line description:** Turns a one-sentence script goal into a written requirements record: every target host's real `/bin/sh` and bash version, the invoking environment (interactive, cron, CI, systemd), every input, output, side effect and external command, so later flows decide dialect, language and tests from facts instead of guesses.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `script_goal` (string, required): What the script must do, in one or two sentences, including who or what runs it.
- `target_platforms` (string[], required): Every OS the script must run on, as specific as known, for example `["ubuntu-22.04", "alpine-3.20 container", "macOS 14"]`.
- `existing_script` (string, optional): Path to an existing script being hardened or replaced. Empty when writing from scratch.

---

## Outputs

- `script_requirements` (object): Fields `goal`, `platforms[]` (each with `os`, `sh_target`, `bash_version`, `has_gnu_coreutils`), `invoker` (interactive, cron, ci, systemd, other), `inputs[]`, `outputs[]`, `side_effects[]`, `external_commands[]`, `needs_root` (bool), `windows_native` (bool), `open_questions[]`.

---

## Phase 1: Probe Each Target Platform

### Entry Criteria
- `script_goal` and `target_platforms` are present.

### Actions
1. For each platform in `target_platforms` you can reach (a shell, a container image, or a CI runner), run these probes and paste the raw output into the record:
   - `ls -l /bin/sh` and, on Linux, `readlink -f /bin/sh` (shows dash on Debian/Ubuntu, busybox on Alpine, bash on RHEL/Fedora).
   - `bash --version | head -n 1` (prints "command not found" on minimal Alpine; macOS `/bin/bash` reports 3.2.x).
   - `sed --version 2>&1 | head -n 1` (GNU sed prints "sed (GNU sed) ..."; BSD sed on macOS prints a usage error, which means BSD).
   - `uname -s` and, on Linux, `cat /etc/os-release`.
2. For a container image you can pull, run the probes with `docker run --rm <image> sh -c 'ls -l /bin/sh; bash --version 2>&1 | head -n 1; uname -s'`.
3. For a platform you cannot reach, write the value as unknown and add an entry to `open_questions`. Do NOT fill it in from memory.
4. Set `has_gnu_coreutils` to true only when `sed --version` printed "GNU".

### Output
`platforms[]` with probed values.

### Quality Gate
- Every platform in `target_platforms` has a `sh_target` and `bash_version` value or an `open_questions` entry naming it.
- Each value is backed by pasted probe output.

---

## Phase 2: Record the Invoking Environment

### Entry Criteria
- `platforms[]` recorded.

### Actions
1. Read `script_goal` and classify `invoker` with this table:

| Goal says | `invoker` | Consequence to record |
|---|---|---|
| "run by hand", "developer runs" | interactive | Terminal present; colors allowed when stderr is a TTY. |
| "cron", "nightly", "every hour" | cron | `PATH` is minimal (commonly `/usr/bin:/bin`), no TTY, `HOME` may differ, output is mailed or lost. |
| "in CI", "pipeline", "GitHub Actions" | ci | No TTY, runner image decides tool versions. |
| "systemd unit", "service", "timer" | systemd | stdout and stderr go to the journal; environment comes from the unit file. |
| none of the above | other | Add an `open_questions` entry asking who runs it. |

2. Set `needs_root` to true when the goal touches `/etc`, package managers, users, services or ports below 1024.
3. Set `windows_native` to true when any platform is Windows without WSL or Git Bash.

### Output
`invoker`, `needs_root`, `windows_native`.

### Quality Gate
- `invoker` is one of the five table values.
- When `invoker` is cron, the record states the PATH the script must set or the absolute paths it uses.

---

## Phase 3: Inventory Inputs, Outputs, Side Effects and Commands

### Entry Criteria
- Phase 2 complete.

### Actions
1. List every input: positional arguments, options, environment variables, stdin, config files.
2. List every output: stdout data, files written, exit codes the caller reads.
3. List every side effect: files created or deleted, services restarted, network calls, package installs.
4. When `existing_script` is set, extract every external command it runs with `grep -oE '\b[a-z][a-z0-9_.-]+\b' "$existing_script" | sort -u` as a starting list, then remove shell keywords and builtins by reading the list. When it is empty, list the commands the goal implies.
5. For each external command, record whether its flags differ between GNU and BSD (for example `sed -i`, `date -d`, `stat -c`, `readlink -f`, `grep -P`); later flows fix those.
6. Write the whole record as `script_requirements`.

### Output
`script_requirements`.

### Quality Gate
- `inputs`, `outputs`, `side_effects` and `external_commands` are each present (an empty list is allowed only with a one-line reason).
- Every side effect that deletes or overwrites data is listed.

---

## Worked Example

Illustrative only.

Input: `script_goal` = "Nightly cron job that archives logs older than 7 days from /var/log/app into /srv/archive as .tar.gz". `target_platforms` = `["ubuntu-22.04", "alpine-3.20 container"]`. `existing_script` empty.

Phase 1 probes:
```
$ docker run --rm ubuntu:22.04 sh -c 'ls -l /bin/sh; bash --version | head -n 1'
lrwxrwxrwx 1 root root 4 ... /bin/sh -> dash
GNU bash, version 5.1.16(1)-release (x86_64-pc-linux-gnu)
$ docker run --rm alpine:3.20 sh -c 'ls -l /bin/sh; bash --version 2>&1 | head -n 1'
lrwxrwxrwx 1 root root 12 ... /bin/sh -> /bin/busybox
sh: bash: not found
```
Phase 2: `invoker` = cron, so the script sets `PATH=/usr/sbin:/usr/bin:/sbin:/bin` itself. `needs_root` = true (reads `/var/log/app`).

Phase 3: `external_commands` = `find`, `tar`, `gzip`, `date`, `mkdir`, `rm`. `find -mtime +7` is in both GNU and busybox find; `date -d` is GNU only and is flagged. `open_questions` = ["Is bash allowed to be installed in the Alpine image?"].

---

## Exit Criteria

DONE when `script_requirements` lists every platform with probed shell facts, the invoker, and every input, output, side effect and external command, with unknowns in `open_questions`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Platform cannot be probed | **Adjust**: record unknown and add an `open_questions` entry; never guess the shell. |
| Phase 1 | Docker not available locally | **Adjust**: probe in a CI job or ask the user to paste the probe output. |
| Phase 2 | Invoker not stated in the goal | **Return**: ask the user who or what runs the script before continuing. |
| Phase 3 | `existing_script` path does not exist | **Stop**: report the bad path; do not invent the script's contents. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
