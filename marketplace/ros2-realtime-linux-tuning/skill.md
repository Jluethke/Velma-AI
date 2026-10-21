# ROS 2 Real-Time Linux Setup and Latency Measurement

**One-line description:** Prepares a Linux host for a time-critical ROS 2 C++ control loop (PREEMPT_RT kernel, rtprio and memlock limits, SCHED_FIFO thread, mlockall, no allocation in the loop), measures scheduling latency with cyclictest and loop latency with timestamps, and compares both against a user-supplied budget.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `target_host` (object, required): Hostname, CPU model and core count, distro, and current kernel (`uname -a`).
- `latency_budget_us` (number, required): Maximum allowed loop latency in microseconds, supplied by the user from the control design. This flow never chooses it.
- `cpp_node_source` (object, required): The C++ node containing the control loop.

---

## Outputs

- `rt_config` (object): Kernel version string, limits file lines, scheduler policy and priority used, CPU isolation if any, and code changes made.
- `latency_report` (object): cyclictest command and its Max values per CPU, loop latency histogram summary (min, mean, max) over the stated run duration, and pass or fail against `latency_budget_us`.

---

## Phase 1: Kernel and Limits

### Entry Criteria
- `latency_budget_us` is a number provided by the user.
- The loop runs on a bench; nothing in this flow commands an actuator.

### Actions
1. Run `uname -a`. A PREEMPT_RT kernel shows `PREEMPT_RT` in the string. If absent, install one: on Ubuntu, the real-time kernel offered through Ubuntu Pro, or build per the ROS 2 documentation page "Building a real-time Linux kernel". Reboot and recheck.
2. Create a group and limits as in the ROS 2 real-time documentation: `sudo groupadd realtime`, `sudo usermod -aG realtime $USER`, and in `/etc/security/limits.conf` add `@realtime soft rtprio 98`, `@realtime hard rtprio 98`, `@realtime soft memlock unlimited`, `@realtime hard memlock unlimited`. Log out and in.
3. Verify: `ulimit -r` prints 98 and `ulimit -l` prints `unlimited`.
4. Install `rt-tests` (`sudo apt install rt-tests`).

### Output
RT-capable host.

### Quality Gate
- `uname -a` contains `PREEMPT_RT`.
- `ulimit -r` and `ulimit -l` print the configured values.

---

## Phase 2: Baseline Scheduling Latency

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Run `sudo cyclictest --mlockall --smp --priority=80 --interval=200 --distance=0 --duration=<user-supplied duration>` while generating representative load (for example the full ROS 2 system running, plus `stress-ng` if the user wants a stress case). Confirm option names with `cyclictest --help` for the installed version.
2. Read the per-thread lines: `T: 0 ... Min: x Act: y Avg: z Max: w`. Max is in microseconds.
3. Record the highest Max across threads. If it already exceeds `latency_budget_us`, the host cannot meet the budget; stop and report.

### Output
Baseline worst-case scheduling latency.

### Quality Gate
- The cyclictest command and every per-thread Max are recorded.

---

## Phase 3: Make the Loop Real-Time Safe

### Entry Criteria
- Baseline Max is below `latency_budget_us`.

### Actions
1. At process start, before spinning: `mlockall(MCL_CURRENT | MCL_FUTURE)` (header `sys/mman.h`); check the return value.
2. Run the control loop in its own thread with SCHED_FIFO: set `sched_param p; p.sched_priority = <prio>;` and `pthread_setschedparam(thread, SCHED_FIFO, &p)`; check the return value. Use a priority below 99; leave 99 for kernel threads. Alternatively start the process with `chrt -f <prio> ros2 run <pkg> <exe>`.
3. Give that thread its own executor with only the control callback group, so non-real-time callbacks run on another thread at normal priority.
4. Remove allocation from the loop: preallocate messages and buffers in the constructor; no `std::vector::push_back` growth, `new`, `std::string` building or logging at info level per cycle. Logging and DDS publication are not real-time bounded; the ROS 2 real-time documentation treats them as such.
5. Optional CPU isolation: kernel argument `isolcpus=<core>` and pin the loop thread with `pthread_setaffinity_np`. Only with a measured need.
6. Do not run any braking or emergency-stop path through this tuned loop as a dependency. Stop paths stay in hardware and are never delayed by software.

### Output
`rt_config`.

### Quality Gate
- `chrt -p <tid>` for the loop thread prints `SCHED_FIFO` and the chosen priority.
- `grep -n "push_back\|new \|RCLCPP_INFO" <loop function>` shows no hits inside the loop body, or each remaining one is justified in `rt_config`.

---

## Phase 4: Measure the Loop

### Entry Criteria
- Phase 3 gate passed.

### Actions
1. In the loop, record `std::chrono::steady_clock::now()` at wake, compute wake lateness against the intended period, and store it in a preallocated ring buffer. Dump statistics at shutdown, not per cycle.
2. Alternatively use ros2_tracing: `ros2 trace` with the `ros2` kernel and userspace events, then analyze callback durations with `tracetools_analysis`; check package availability for your distro.
3. Run for the same duration and load as Phase 2.
4. Compare max lateness to `latency_budget_us` and record PASS or FAIL.

### Output
`latency_report`.

### Quality Gate
- `latency_report` has min, mean, max, the run duration, the load description, and the PASS or FAIL against `latency_budget_us`.

---

## Worked Example

Illustrative only. 8 core x86 bench host, `latency_budget_us = 500` supplied by the user.

- Phase 1: `uname -a` shows `PREEMPT_RT`; `ulimit -r` prints `98`.
- Phase 2: `cyclictest` worst Max 41 us across threads under load.
- Phase 3: loop thread at SCHED_FIFO 80, message preallocated.
- Phase 4: 10 minute run, max wake lateness 63 us: PASS.

---

## Exit Criteria

DONE when the host runs an RT kernel with correct limits, the loop runs at SCHED_FIFO without per-cycle allocation, and both cyclictest and loop measurements are recorded against the user's budget.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No budget supplied | **Stop**: the budget is a design input; request it. |
| Phase 2 | Baseline Max above budget | **Return**: report that the host or kernel cannot meet the budget before code changes. |
| Phase 3 | `pthread_setschedparam` returns EPERM | **Adjust**: confirm the rtprio limit and group membership; log out and back in. |
| Phase 4 | Rare spikes above budget | **Adjust**: check for page faults with `perf stat -e page-faults`, logging inside the loop, and power management settings; rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
