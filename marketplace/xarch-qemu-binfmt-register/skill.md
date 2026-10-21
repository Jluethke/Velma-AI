# Register qemu-user-static via binfmt_misc

**One-line description:** Registers the aarch64 qemu-user-static interpreter with the kernel binfmt_misc handler so the build host can transparently run aarch64 binaries, using the `F` (fix-binary) flag needed inside containers, and verifies the registration and a hello-world run.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `qemu_mode` (string, optional): How to register. One of `package` (install the distro static qemu and binfmt), `container` (register via the `tonistiigi/binfmt` image for Docker use), or `manual`. If absent, default to `package`.

---

## Outputs

- `binfmt_state` (object): The registered interpreter path, the flags, and whether the `F` flag is set.
- `binfmt_report` (object): The verification run result and the kernel registration contents.

---

## Phase 1: Register the Handler

### Entry Criteria
- The build host is x86-64 Linux with the `binfmt_misc` filesystem available (`ls /proc/sys/fs/binfmt_misc`).

### Actions
1. Register by mode:

| `qemu_mode` | Command |
|---|---|
| package | `sudo apt-get install -y qemu-user-static binfmt-support` (Debian/Ubuntu) or the distro equivalent; the package registers the handler |
| container | `docker run --privileged --rm tonistiigi/binfmt --install arm64` |
| manual | Install `qemu-user-static`, then register with `update-binfmts` or write the magic to `/proc/sys/fs/binfmt_misc/register` |

2. The static qemu is required because binfmt runs the interpreter in a context without the host dynamic loader; a dynamically linked `qemu-aarch64` would fail. Install `qemu-user-static`, not `qemu-user`.
3. For running inside containers, the registration must use the `F` (fix binary) flag so the kernel opens the interpreter once at registration and keeps the file descriptor; without `F`, a container that lacks the qemu binary at its own path fails with `No such file or directory`. The `tonistiigi/binfmt` image sets `F`.
4. Do not register on a host that is already aarch64; it is native there and binfmt is unnecessary.

### Output
The registered handler.

### Quality Gate
- `cat /proc/sys/fs/binfmt_misc/qemu-aarch64` exists and starts with `enabled`.
- The interpreter line in that file points at a `qemu-aarch64-static` path.

---

## Phase 2: Verify a Transparent Run

### Entry Criteria
- The handler is registered.

### Actions
1. Read the registration: `cat /proc/sys/fs/binfmt_misc/qemu-aarch64`. Record the `interpreter`, the `flags` line, and confirm `F` is present if containers are a target.
2. Run an aarch64 binary directly. If you built one in a prior flow, run it: `./app-arm64`. Otherwise fetch or build a tiny static aarch64 hello and run it. It must execute and exit 0 with no `Exec format error`.
3. If a dynamically linked aarch64 binary fails with `No such file or directory`, that is the loader not being found, not a binfmt failure; it needs `QEMU_LD_PREFIX` set to a sysroot, which is `xarch-qemu-user-run-tests`.
4. Do not conclude binfmt is broken from a dynamic-binary failure; test a static binary first to isolate the handler from the loader.

### Output
`binfmt_state`, `binfmt_report`.

### Quality Gate
- `cat /proc/sys/fs/binfmt_misc/qemu-aarch64` shows `enabled`.
- A static aarch64 binary runs and exits 0 under the handler.

---

## Worked Example

Illustrative. `qemu_mode` = `container` (host used for Docker buildx).

```
$ docker run --privileged --rm tonistiigi/binfmt --install arm64
installing: arm64 ...
$ cat /proc/sys/fs/binfmt_misc/qemu-aarch64
enabled
interpreter /usr/bin/qemu-aarch64
flags: OCF
$ ./hello-arm64-static
hello from aarch64
```

`binfmt_state` = `{ "interpreter": "/usr/bin/qemu-aarch64", "flags": "OCF", "fix_binary": true }`.

---

## Exit Criteria

DONE when the aarch64 binfmt handler is enabled, the flags are recorded, and a static aarch64 binary runs under it and exits 0.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `/proc/sys/fs/binfmt_misc` missing | **Adjust**: mount it (`sudo mount binfmt_misc -t binfmt_misc /proc/sys/fs/binfmt_misc`) or load the `binfmt_misc` module. |
| Phase 1 | Installed `qemu-user` not `-static` | **Adjust**: install `qemu-user-static`; the dynamic build cannot serve as the binfmt interpreter. |
| Phase 2 | Container run fails with no such file | **Adjust**: re-register with the `F` flag via `tonistiigi/binfmt`. |
| Phase 2 | Static binary still fails | **Stop**: the handler is not enabled; re-read Phase 1 and confirm the registration file. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
