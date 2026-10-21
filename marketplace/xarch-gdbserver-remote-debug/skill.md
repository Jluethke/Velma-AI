# Remote-Debug an aarch64 Binary with gdbserver

**One-line description:** Debugs a cross-built aarch64 binary running on the target by launching `gdbserver` on the target and connecting from the host with the cross `gdb`, with `sysroot` and `solib-search-path` set so symbols and shared-library source resolve, and confirms a breakpoint hits with a readable backtrace.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `binary_path` (string, required): Path to the unstripped aarch64 binary (with debug symbols) on the host.
- `deploy_host` (string, required): The target ssh spec, for example `pi@192.168.1.50`. This flow runs when it is set.
- `sysroot` (object, required): Output of `xarch-sysroot-from-image`, so the host gdb resolves the target's shared libraries.
- `toolchain_prefix` (string, required): Output of `xarch-gcc-toolchain-select`, used to pick the cross gdb (`${toolchain_prefix}gdb` or `gdb-multiarch`).

---

## Outputs

- `debug_session` (object): The gdbserver command, the connect command, and the breakpoint and backtrace result.
- `debug_report` (object): The gdb used, the sysroot settings, and any unresolved symbol warnings.

---

## Phase 1: Launch gdbserver on the Target

### Entry Criteria
- The binary is on the target (via `xarch-remote-deploy-rsync`) and has debug symbols on the host copy.
- `gdbserver` is installed on the target (`ssh "$deploy_host" "which gdbserver"`).

### Actions
1. On the target, start gdbserver listening on a port: `ssh "$deploy_host" "gdbserver :2345 /opt/app/app <args>"`. It prints `Listening on port 2345` and waits. Use a reachable port and confirm no firewall blocks it.
2. The target copy can be stripped; gdbserver does not need symbols. The host copy must keep symbols, because the host gdb reads them. Keep an unstripped `binary_path` on the host for this reason.
3. For attaching to an already-running process instead, use `gdbserver :2345 --attach <pid>`.
4. Do not run the full `gdb` on the target; the target often lacks the debug packages and the CPU to run gdb comfortably. gdbserver is the thin stub; gdb runs on the host.

### Output
gdbserver listening on the target.

### Quality Gate
- `ssh "$deploy_host" "gdbserver :2345 ..."` prints `Listening on port 2345`.
- The port is reachable from the host (`nc -z <target-ip> 2345` or an equivalent check).

---

## Phase 2: Connect from the Host and Confirm a Breakpoint

### Entry Criteria
- gdbserver is listening.

### Actions
1. Pick the cross gdb: `${toolchain_prefix}gdb` if it exists, else `gdb-multiarch`. A plain host `gdb` built only for x86-64 cannot debug aarch64 and will say `architecture not recognized`.
2. Start gdb on the host unstripped binary and set the sysroot so library symbols resolve:

```
gdb-multiarch build-aarch64/app
(gdb) set sysroot /opt/sysroots/aarch64-bookworm
(gdb) set solib-search-path /opt/sysroots/aarch64-bookworm/usr/lib/aarch64-linux-gnu
(gdb) target remote <target-ip>:2345
```

Substitute `sysroot.path`. Without `set sysroot`, gdb loads host libraries or none, and backtraces through library frames show `??`.
3. Set a breakpoint and continue: `(gdb) break main` then `(gdb) continue`. When it stops, run `(gdb) bt` and confirm the backtrace shows function names and source lines, not `??`.
4. Do not connect with `target remote` before `set sysroot`; set the sysroot first so the shared-library symbols load as they are reported.
5. Do not debug a stripped host binary; symbols must be present on the host side.

### Output
`debug_session`, `debug_report`.

### Quality Gate
- `target remote` connects and gdb prints the remote stop with an aarch64 register set.
- A breakpoint at `main` hits and `bt` shows named frames with source lines, not `??`.

---

## Worked Example

Illustrative. `binary_path` = `build-aarch64/app` (unstripped), `deploy_host` = `pi@192.168.1.50`, `sysroot.path` = `/opt/sysroots/aarch64-bookworm`.

```
# on target
$ gdbserver :2345 /opt/app/app
Listening on port 2345
# on host
$ gdb-multiarch build-aarch64/app
(gdb) set sysroot /opt/sysroots/aarch64-bookworm
(gdb) target remote 192.168.1.50:2345
(gdb) break main
(gdb) continue
Breakpoint 1, main (argc=1, argv=0x...) at src/main.c:12
(gdb) bt
#0  main (argc=1, argv=0x...) at src/main.c:12
```

`debug_session` records the breakpoint hit at `src/main.c:12` with a named backtrace.

---

## Exit Criteria

DONE when the host cross gdb connects to gdbserver on the target, a breakpoint hits, and `bt` shows named frames with source lines.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `gdbserver` not on target | **Adjust**: install it (`apt-get install gdbserver`) on the target, or copy a static gdbserver. |
| Phase 2 | `architecture not recognized` | **Adjust**: use `gdb-multiarch` or `${toolchain_prefix}gdb`, not the plain host gdb. |
| Phase 2 | Backtrace shows `??` | **Adjust**: `set sysroot` and `set solib-search-path` to the sysroot, then reconnect. |
| Phase 2 | `Remote connection closed` | **Stop**: port blocked or gdbserver exited; re-launch gdbserver and check the firewall. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
