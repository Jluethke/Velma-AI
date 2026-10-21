# Cyclictest Under Load

**One-line description:** Runs cyclictest pinned to the isolated real-time CPUs while stress-ng and hackbench load the housekeeping CPUs with CPU, memory, I/O and scheduler stress, and compares the result to the idle baseline to show what isolation and tuning achieved.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `baseline_summary` (object, required): From `rtl-cyclictest-baseline`.
- `isolation_config` (object, required): From `rtl-cpu-isolation-bootargs`.
- `power_config` (object, required): From `rtl-power-cstate-tuning`.
- `irq_thread_priorities` (object[], required): From `rtl-threaded-irq-priority`.
- `test_duration` (string, required): Run length, `-D` syntax.
- `rt_priority` (integer, required): Same priority as the control loop.
- `rt_cpus` (string, required): CPUs to measure.

---

## Outputs

- `loaded_histogram` (string): Path to `loaded_hist.txt` and the exact cyclictest and load command lines.
- `loaded_summary` (object): Per RT CPU min, avg, max and overflows under load, the baseline values beside them, and the tuning state in effect (copied from `isolation_config`, `power_config`, `irq_thread_priorities`).

---

## Phase 1: Start The Load

### Entry Criteria
- Isolation is active: `cat /sys/devices/system/cpu/isolated` prints `rt_cpus`, or the cpuset partition is in place.
- No actuator-commanding software is running. On a vehicle computer, park and disable actuator outputs, or use the bench.

### Actions
1. Install `stress-ng` (`sudo apt install stress-ng`) and confirm `hackbench` from rt-tests (`hackbench --help`).
2. Start load pinned to housekeeping CPUs with `taskset -c <housekeeping list>` so the loads cannot be scheduled onto RT CPUs even if isolation is incomplete. Check option names with `stress-ng --help`:
   - `taskset -c <hk> stress-ng --cpu <n> --vm 2 --vm-bytes <size> --io 2 --timeout <duration> &`
   - `taskset -c <hk> hackbench -l <loops> -g <groups> &` in a shell loop for the duration (hackbench exits when done).
3. If the control loop uses the network or CAN, add traffic on that path from another machine (for example `iperf3 -c <host>` for Ethernet, or `cangen can0 -g <gap_ms>` from can-utils on a separate bus node), since device interrupt load is a common real-world cause.
4. Record every load command verbatim.

### Output
Running load with recorded commands.

### Quality Gate
- `top -b -n1` or `mpstat -P ALL 1 1` shows housekeeping CPUs busy and RT CPUs idle before cyclictest starts.

---

## Phase 2: Measure

### Entry Criteria
- Load is running.

### Actions
1. Run cyclictest on RT CPUs only, with the same interval and histogram range as the baseline:
   `sudo cyclictest --mlockall --affinity=<rt_cpus> --threads=<count of rt_cpus> --priority=<rt_priority> --interval=<baseline interval> --distance=0 --duration=<test_duration> --histogram=<N> --histfile=loaded_hist.txt --quiet`
   Check that `--affinity` with a list is supported (`cyclictest --help`); some versions require `-a` and `-t` together for one thread per listed CPU.
2. Also run with `--laptop` once, if `power_config` changed idle states, to measure without cyclictest's own PM QoS request.
3. Stop the load: `kill %1 %2` or `pkill stress-ng; pkill hackbench`.

### Output
`loaded_hist.txt`.

### Quality Gate
- The file contains `# Max Latencies` and `# Histogram Overflows` lines.
- Overflows are 0; otherwise increase `-h` and repeat.

---

## Phase 3: Compare To Baseline

### Entry Criteria
- Histogram saved.

### Actions
1. Extract per-CPU min, avg, max, overflows as in `rtl-cyclictest-baseline` Phase 3.
2. Put each RT CPU's loaded values beside the baseline values for the same CPU.
3. Interpret:

| Result | Reading |
|---|---|
| Loaded max on RT CPUs at or below the idle baseline max | Isolation holds under this load |
| Loaded max above the idle baseline max with no network or CAN traffic running | Check `rtl-cpuset-partition` Phase 3 and `rtl-irq-affinity` deltas during load |
| Max rises only with network or CAN traffic | Device interrupt or softirq path; check `rtl-threaded-irq-priority` |
| Max rises only with `--vm` or `--io` | Memory bandwidth, cache or I/O contention shared at hardware level; record it |

4. Write `loaded_summary`.

### Output
`loaded_histogram`, `loaded_summary`.

### Quality Gate
- Each RT CPU row shows baseline max and loaded max read from the two files.
- The interpretation row chosen is cited.

---

## Worked Example

Illustrative. `rt_cpus` = `2-3`, housekeeping `0-1`, `rt_priority` = 80.

```
$ taskset -c 0-1 stress-ng --cpu 2 --vm 2 --vm-bytes 512M --io 2 --timeout 1h &
$ (while :; do taskset -c 0-1 hackbench -l 10000 -g 8; done) &
$ sudo cyclictest --mlockall -a 2-3 -t 2 -p 80 -i 1000 -d 0 -D 1h -h 400 --histfile=loaded_hist.txt -q
$ grep -E '^# Max Latencies' loaded_hist.txt
# Max Latencies: 00014 00016
```
Baseline CPU 2/3 max: 23 / 57 us idle and untuned. Loaded and tuned: 14 / 16 us. Row 1 applies.

---

## Exit Criteria

DONE when cyclictest ran pinned to RT CPUs under recorded housekeeping load for `test_duration`, with zero overflows, and every RT CPU has loaded and baseline values side by side.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | stress-ng runs on RT CPUs | **Stop**: isolation is not active; return to `rtl-cpu-isolation-bootargs`. |
| Phase 2 | Out-of-memory killer fires | **Adjust**: lower `--vm-bytes`; rerun. |
| Phase 2 | RT throttling message in `dmesg` | **Return**: a task spun at RT priority; see `rtl-sched-fifo-chrt` on `sched_rt_runtime_us`. |
| Phase 3 | Loaded max above user budget | **Return**: pass `loaded_histogram` to `rtl-cyclictest-histogram-read` and then tracing flows. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
