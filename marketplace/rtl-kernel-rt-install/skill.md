# Install A PREEMPT_RT Kernel

**One-line description:** Installs and boots a PREEMPT_RT kernel from the distribution's own packages where they exist, or builds one from source, while keeping the current kernel as a selectable fallback boot entry.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `kernel_report` (object, required): From `rtl-kernel-rt-check`. Must show `preempt_rt` = false.
- `distro` (string, required): Output of `. /etc/os-release; echo "$ID $VERSION_ID"`, for example `ubuntu 24.04`, `debian 13`, `rhel 9.4`.

---

## Outputs

- `rt_kernel_status` (object): `method` (package name or `source`), `installed_release` (uname -r after reboot), `preempt_rt` (re-checked boolean), `fallback_entry` (name of the old kernel's boot entry), `out_of_tree_modules` (list of DKMS or vendor modules and whether each built for the new kernel).

---

## Phase 1: Choose The Install Method

### Entry Criteria
- `kernel_report.preempt_rt` is false.
- You have console or out-of-band access (serial console, KVM, or physical keyboard and screen) in case the new kernel does not boot. Do not proceed over SSH alone.

### Actions
1. List out-of-tree modules: `dkms status 2>/dev/null` and `lsmod | awk '{print $1}' | while read m; do modinfo -F filename $m 2>/dev/null; done | grep -v '/kernel/'`. Each listed module (GPU driver, vendor CAN driver, etc.) must also build for the RT kernel. Record them.
2. Pick the method from this table using `distro` and `kernel_report.arch`:

| Distro | Method | Command (check the vendor docs for the current form) |
|---|---|---|
| Ubuntu with Ubuntu Pro attached | Canonical real-time kernel | `sudo pro enable realtime-kernel` |
| Debian | Debian RT flavor | `sudo apt install linux-image-rt-amd64` or `linux-image-rt-arm64` |
| RHEL / Alma / Rocky | RT repository | enable the RT repo for your release, then `sudo dnf install kernel-rt` (and `tuned-profiles-realtime` if wanted) |
| NVIDIA Jetson Linux | Vendor RT kernel | follow the Jetson Linux developer guide section for the real-time kernel for your exact L4T release |
| Anything else, or a vendor BSP kernel | Source build | Phase 2 |

3. If the method is a package, run it, then go to Phase 3. Do not mix packages from a different distro release.

### Output
Chosen method and recorded module list.

### Quality Gate
- The chosen method is a row of the table, and the package command exited 0 (`echo $?` prints 0), or the source path was chosen.
- `out_of_tree_modules` lists every module from step 1.

---

## Phase 2: Build From Source (Only When No Package Fits)

### Entry Criteria
- Phase 1 chose `source`.

### Actions
1. Decide the source: PREEMPT_RT is selectable in mainline Linux from 6.12 for x86, arm64 and riscv. For those architectures on 6.12 or newer, use the mainline or vendor tree unpatched. For older trees, download the matching patch from `https://cdn.kernel.org/pub/linux/kernel/projects/rt/<major.minor>/` with the exact version suffix (`-rtN`) that matches the tree, and apply it with `xzcat patch-<ver>.patch.xz | patch -p1 --dry-run` first, then without `--dry-run`. A dry run with any `FAILED` hunk means the versions do not match: stop.
2. Start from the running config: `cp /boot/config-$(uname -r) .config` then `make olddefconfig`.
3. Enable RT: `scripts/config -e EXPERT -e PREEMPT_RT -d PREEMPT_VOLUNTARY -d PREEMPT_NONE` then `make olddefconfig`. Verify with `grep '^CONFIG_PREEMPT_RT=y' .config`.
4. On Debian or Ubuntu, if the build fails on signing keys, run `scripts/config -d SYSTEM_TRUSTED_KEYS -d SYSTEM_REVOCATION_KEYS`. Do not disable Secure Boot to work around module signing; sign the modules or use the distro package.
5. Build packages, not a loose install: `make -j"$(nproc)" bindeb-pkg LOCALVERSION=-rt` (Debian family) or `make -j"$(nproc)" binrpm-pkg` (RPM family). Install the produced packages with the package manager.

### Output
Installed source-built kernel packages.

### Quality Gate
- `grep '^CONFIG_PREEMPT_RT=y' .config` prints the line.
- The package install command exits 0.

---

## Phase 3: Boot With A Fallback And Re-Check

### Entry Criteria
- An RT kernel package is installed.

### Actions
1. Keep the old kernel. Do not remove or `apt autoremove` it. Record its boot entry name: grub `grep -E "menuentry '" /boot/grub/grub.cfg`, RHEL `sudo grubby --info=ALL | grep -E '^(kernel|title)'`, extlinux `grep -E '^LABEL' /boot/extlinux/extlinux.conf`.
2. For grub, make the menu visible for one boot: set `GRUB_TIMEOUT_STYLE=menu` and a nonzero `GRUB_TIMEOUT` in `/etc/default/grub`, then `sudo update-grub` (Debian family) or `sudo grub2-mkconfig -o` the path your distro documents. For extlinux, add a new `LABEL` for the RT kernel and leave the old `LABEL` in place.
3. Reboot with console access. Select the RT kernel.
4. Re-run `rtl-kernel-rt-check` Phase 1 and 2. Set `rt_kernel_status.preempt_rt` from that result.
5. For each module in `out_of_tree_modules`, run `modinfo <module> | grep vermagic` and confirm it lists the new release and `preempt_rt` (vermagic includes the preempt mode). Load it with `sudo modprobe <module>` and check `dmesg | tail`.
6. Check `dmesg --level=err,warn | head -50` for driver failures.

### Output
`rt_kernel_status`.

### Quality Gate
- `uname -r` after reboot equals `installed_release`, and `/sys/kernel/realtime` reads 1 or the config shows `CONFIG_PREEMPT_RT=y`.
- `fallback_entry` names an entry present in the bootloader config.
- Every module in `out_of_tree_modules` loads, or is listed as failing.

---

## Worked Example

Illustrative. `distro` = `debian 13`, arch x86_64, no out-of-tree modules except `peak_usb`, which is in-tree.

Phase 1: table row Debian. `sudo apt install linux-image-rt-amd64` exits 0.

Phase 3:
```
$ uname -r
6.12.43+deb13-rt-amd64
$ cat /sys/kernel/realtime
1
$ modinfo peak_usb | grep vermagic
vermagic:       6.12.43+deb13-rt-amd64 SMP preempt_rt mod_unload modversions
```
`rt_kernel_status` = `{method: "linux-image-rt-amd64", installed_release: "6.12.43+deb13-rt-amd64", preempt_rt: true, fallback_entry: "Debian GNU/Linux, with Linux 6.12.43+deb13-amd64", out_of_tree_modules: []}`.

---

## Exit Criteria

DONE when the machine boots the RT kernel, `rtl-kernel-rt-check` reports `preempt_rt` true, the old kernel remains bootable, and every needed module loads.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No console access | **Stop**: a kernel that fails to boot cannot be recovered over SSH. |
| Phase 1 | Vendor GPU or CAN driver has no RT build | **Return**: report the module; the user decides whether the machine can run without it. Do not force-load a module built for another kernel. |
| Phase 2 | Patch dry run shows FAILED hunks | **Stop**: get the patch whose version exactly matches the tree. |
| Phase 3 | RT kernel panics or hangs at boot | **Adjust**: boot `fallback_entry` from the menu, collect the console log, and report it. |
| Phase 3 | `preempt_rt` still false after reboot | **Retry**: the default entry probably still points at the old kernel; select the RT entry explicitly and re-check. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
