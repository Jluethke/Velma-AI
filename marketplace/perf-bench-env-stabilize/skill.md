# Benchmark Environment Stabilization

**One-line description:** Reduces machine noise before benchmarking (CPU frequency governor, turbo boost, core pinning, background load, power source) and records the exact machine state in `perf/bench_env.json` so every later measurement can be compared on equal terms.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `perf_spec` (object, required): From `perf-metric-workload-define`. Used to know the measurement level.
- `repo_path` (string, required): Absolute path to the repository under test.

---

## Outputs

- `bench_env_report` (object): OS, kernel, CPU model, core count, governor, turbo state, pinned cores, load average, tool versions, git commit, and every setting changed with the command that reverts it. Written to `perf/bench_env.json`.

---

## Phase 1: Record the Machine As It Is

### Entry Criteria
- `perf_spec` exists. `repo_path` is a git repository (`git -C <repo_path> rev-parse HEAD` exits 0).

### Actions
1. Detect the OS: `uname -s` (prints `Linux` or `Darwin`); on Windows use PowerShell `$PSVersionTable.OS`.
2. Record, by OS:

   | OS | Command | Field |
   |---|---|---|
   | Linux | `lscpu` | CPU model, cores, threads, max MHz |
   | Linux | `cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor` | governor |
   | Linux | `cat /sys/devices/system/cpu/intel_pstate/no_turbo` (Intel pstate) or `cat /sys/devices/system/cpu/cpufreq/boost` (acpi-cpufreq, AMD) | turbo state; record "not present" if the file does not exist |
   | Linux | `uptime` | load average |
   | macOS | `sysctl -n machdep.cpu.brand_string`, `sysctl -n hw.ncpu`, `pmset -g batt`, `pmset -g therm` | CPU, cores, power source, thermal warnings |
   | Windows | `Get-CimInstance Win32_Processor`, `powercfg /getactivescheme` | CPU, power plan |

3. Record `git -C <repo_path> rev-parse HEAD` and `git -C <repo_path> status --porcelain`. If the porcelain output is not empty, record "dirty tree" and list the files.
4. Record the language toolchain version: `python --version`, `node --version`, `go version`, `rustc --version`, `java -version`, `gcc --version` or `clang --version`.
5. Detect virtualization and CI: `systemd-detect-virt` on Linux (prints `none` on bare metal), and the `CI` environment variable. Record both.

### Output
Machine snapshot.

### Quality Gate
- Every row of the table for the detected OS has a recorded value or "not present".
- Git commit hash is a 40-character hex string.

---

## Phase 2: Apply Noise Controls

### Entry Criteria
- Machine snapshot recorded.

### Actions
1. Apply only the controls for the detected OS, and for each one write the revert command into the report before running it.

   | OS | Control | Command | Revert |
   |---|---|---|---|
   | Linux | Fixed governor | `sudo cpupower frequency-set -g performance` | `sudo cpupower frequency-set -g <old governor>` |
   | Linux, Intel pstate | Turbo off | `echo 1 \| sudo tee /sys/devices/system/cpu/intel_pstate/no_turbo` | write the old value back |
   | Linux, acpi-cpufreq | Boost off | `echo 0 \| sudo tee /sys/devices/system/cpu/cpufreq/boost` | write the old value back |
   | Linux, Python stack | All of the above in one tool | `python -m pyperf system tune` (check with `python -m pyperf system show`) | `python -m pyperf system reset` |
   | macOS | Power | Plug in AC power; confirm `pmset -g batt` says "AC Power" | none |
   | Windows | Power plan | `powercfg /setactive SCHEME_MIN` (the built-in High performance plan) | `powercfg /setactive <old GUID>` |

2. Pick one core for single-threaded benchmarks on Linux and run every later benchmark under `taskset -c <core>`. Do not use core 0, which handles more interrupts on many systems. Record the core. Skip pinning for multi-threaded workloads and `server` load tests, and record why.
3. Close or stop background load you control: browsers, IDE indexers, file sync, other test runs, Docker containers not needed (`docker ps`). Do not kill processes you did not start on a shared machine.
4. If `systemd-detect-virt` printed anything other than `none`, or `CI` is set, write `"shared_or_virtual": true`. Results from such machines are noisier; later flows interleave A and B runs to compensate.

### Output
Controls applied, each with a revert command.

### Quality Gate
- On Linux, `cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor | sort -u` prints one line `performance`, or the report says why it could not be set.
- Every applied control has a revert command in the report.

---

## Phase 3: Verify Quiet and Save

### Entry Criteria
- Controls applied.

### Actions
1. Wait until the 1-minute load average from `uptime` is below the number of cores you are not using for the benchmark. Record the value. This is a check that nothing else is busy, not a tuning constant.
2. Write `perf/bench_env.json` with the snapshot, the controls, the pinned core and `shared_or_virtual`.
3. Validate: `python -m json.tool perf/bench_env.json`.
4. Tell the user which controls must be reverted after the chain finishes and print the revert commands.

### Output
`bench_env_report`.

### Quality Gate
- `perf/bench_env.json` parses with exit code 0.
- The report contains a `revert` list (empty is allowed only when no control was applied).

---

## Worked Example

Illustrative. Linux laptop, Intel CPU, Python stack.

- Phase 1: `lscpu` shows "11th Gen Intel(R) Core(TM) i7-1185G7", 4 cores, 8 threads. Governor `powersave`. `no_turbo` = `0`. `systemd-detect-virt` = `none`. Commit `3b1e0c9...`, clean tree. `python --version` = `Python 3.12.6`.
- Phase 2: `python -m pyperf system tune` sets governor `performance` and disables turbo. Revert recorded: `python -m pyperf system reset`. Pinned core: `2`.
- Phase 3: `uptime` load average `0.41` with 3 unused cores. `perf/bench_env.json` written; `python -m json.tool` exits 0.

---

## Exit Criteria

DONE when `perf/bench_env.json` exists, parses, records the machine, the toolchain, the commit, every noise control with its revert command, and whether the machine is shared or virtual.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `repo_path` is not a git repository | **Stop**: A/B comparison later needs commits; ask the user to initialize git. |
| Phase 2 | No sudo rights | **Adjust**: skip governor and turbo controls, set `shared_or_virtual: true`, record "not controlled". |
| Phase 2 | `cpupower` not installed | **Adjust**: install the distro package (`linux-tools-common` and `linux-tools-$(uname -r)` on Ubuntu, `kernel-tools` on Fedora) or write the governor via `/sys/devices/system/cpu/cpu*/cpufreq/scaling_governor`. |
| Phase 2 | Laptop on battery | **Stop**: plug in; battery mode throttles the CPU. |
| Phase 3 | Load average stays high | **Retry**: find the process with `top -o %CPU` and stop it if you own it; else record the load and continue with `shared_or_virtual: true`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
