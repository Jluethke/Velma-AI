# Build a Cross Sysroot from the Target Image

**One-line description:** Extracts a sysroot from the target root filesystem (a mounted image, a running target over rsync, or a container export), then rewrites the absolute symlinks under the sysroot to relative links so the cross linker resolves libraries against the sysroot and not the build host.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `image_source` (string, required): Where the target root filesystem comes from. One of a device or image path to mount (`/dev/sdb2`, `rootfs.img`), an rsync spec (`user@target:/`), or a Docker image reference to export (`arm64v8/debian:12`).
- `sysroot_dir` (string, required): Local directory to populate, for example `/opt/sysroots/aarch64-bookworm`.

---

## Outputs

- `sysroot` (object): The sysroot path, the libc flavor and version found in it, and the absolute-to-relative symlink fix result.
- `sysroot_report` (object): Counts of files copied, dangling symlinks before and after the fix, and the key libraries present.

---

## Phase 1: Copy the Root Filesystem

### Entry Criteria
- `image_source` and `sysroot_dir` are present.
- `sysroot_dir` is empty or does not exist yet.

### Actions
1. Create the sysroot: `mkdir -p "$sysroot_dir"`.
2. Copy by source type:

| Source type | Command |
|---|---|
| Mounted image or device | `sudo mount -o ro <dev> /mnt/t && rsync -aHAX --numeric-ids /mnt/t/{lib,usr,etc} "$sysroot_dir"/ && sudo umount /mnt/t` |
| Running target over rsync | `rsync -aHAX --numeric-ids <spec>/{lib,usr} "$sysroot_dir"/` |
| Docker image | `cid=$(docker create <ref>); docker export $cid | tar -C "$sysroot_dir" -xf - lib usr etc; docker rm $cid` |

3. Use `-a` (archive) so permissions, timestamps and symlinks are preserved, and `-H` so hardlinks are not duplicated. `--numeric-ids` keeps target UIDs instead of mapping to build-host users.
4. Copy at least `/lib`, `/usr/lib`, `/usr/include`. Do not copy `/proc`, `/sys`, `/dev`; they are kernel-populated and copying them wastes space and can hang.

### Output
A populated `sysroot_dir` tree.

### Quality Gate
- `ls "$sysroot_dir"/usr/include/stdio.h` exists (headers were copied).
- `find "$sysroot_dir" -name 'libc.so*' | head` lists at least one match.

---

## Phase 2: Fix Absolute Symlinks

### Entry Criteria
- The sysroot tree is populated.

### Actions
1. Count dangling links first: `find "$sysroot_dir" -xtype l | wc -l`. Many are absolute links like `/usr/lib/.../libc.so -> /lib/aarch64-linux-gnu/libc.so.6`, which resolve against the build host root and so point nowhere or, worse, at a host library.
2. Rewrite absolute symlinks to be relative to the sysroot. Use the `symlinks` tool if available: `symlinks -c -r "$sysroot_dir"` (`-c` converts absolute to relative, `-r` recurses). If `symlinks` is not installed, run `sudo apt-get install symlinks` or use a scripted readlink-and-relink pass.
3. Re-count: `find "$sysroot_dir" -xtype l | wc -l` must be lower, ideally 0. A remaining dangling link means a file the image expected is not in the copied subset; copy that path too.
4. Detect the libc: if `"$sysroot_dir"/lib/ld-linux-aarch64.so.1` exists it is glibc; if `ld-musl-aarch64.so.1` exists it is musl. Read the glibc version with `strings "$sysroot_dir"/lib/aarch64-linux-gnu/libc.so.6 | grep -m1 'GNU C Library'`.
5. Do not symlink sysroot libraries to build-host libraries to clear a dangling link; that reintroduces the host ABI you are trying to avoid.

### Output
`sysroot`, `sysroot_report`.

### Quality Gate
- `find "$sysroot_dir" -xtype l | wc -l` after the fix is less than the count before, and any remaining links are listed in `sysroot_report`.
- `sysroot_report` names the libc flavor and the detected glibc or musl version.

---

## Worked Example

Illustrative. `image_source` = `arm64v8/debian:12`, `sysroot_dir` = `/opt/sysroots/aarch64-bookworm`.

```
$ cid=$(docker create arm64v8/debian:12); docker export $cid | tar -C /opt/sysroots/aarch64-bookworm -xf - lib usr etc; docker rm $cid
$ find /opt/sysroots/aarch64-bookworm -xtype l | wc -l
37
$ symlinks -c -r /opt/sysroots/aarch64-bookworm >/dev/null
$ find /opt/sysroots/aarch64-bookworm -xtype l | wc -l
0
$ strings /opt/sysroots/aarch64-bookworm/lib/aarch64-linux-gnu/libc.so.6 | grep -m1 'GNU C Library'
GNU C Library (Debian GLIBC 2.36-9) ...
```

`sysroot` = `{ "path": "/opt/sysroots/aarch64-bookworm", "libc": "glibc", "glibc_version": "2.36", "dangling_after": 0 }`.

---

## Exit Criteria

DONE when the sysroot holds target headers and libraries, the dangling-symlink count after the fix is at or below what is recorded in `sysroot_report`, and the libc flavor and version are identified.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `rsync` not present on the running target | **Adjust**: use `tar` over ssh (`ssh target 'tar -C / -cf - lib usr' | tar -C "$sysroot_dir" -xf -`). |
| Phase 1 | Image uses a nonstandard layout | **Adjust**: list top-level dirs first (`ls /mnt/t`) and copy the ones that hold libraries and headers. |
| Phase 2 | `symlinks` unavailable and cannot be installed | **Adjust**: relink with a readlink loop that rewrites each absolute link target to a sysroot-relative path. |
| Phase 2 | Dangling link to a missing library remains | **Adjust**: copy the missing path from the source; do not point it at a host library. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
