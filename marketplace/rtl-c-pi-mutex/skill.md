# Priority Inheritance Mutexes In C And C++

**One-line description:** Finds every lock, condition variable and semaphore shared between the real-time thread and lower-priority threads in C or C++ code, converts mutexes to `PTHREAD_PRIO_INHERIT`, replaces non-PI primitives with PI-aware or lock-free handoffs, and confirms inheritance happens with a `sched_pi_setprio` trace.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_source_dir` (string, required): C or C++ source tree with build and test commands.

---

## Outputs

- `pi_mutex_report` (object): Every synchronization object touched by the RT thread with file, line, type, which other threads use it, the action taken, build and test exit codes, and the trace evidence of priority boosting.

---

## Phase 1: Inventory Shared Synchronization

### Entry Criteria
- Build and tests pass before changes (exit codes recorded).

### Actions
1. Search: `grep -rn -E 'pthread_mutex_t|pthread_mutex_init|PTHREAD_MUTEX_INITIALIZER|std::mutex|std::recursive_mutex|std::timed_mutex|std::shared_mutex|std::condition_variable|pthread_cond_t|sem_t|sem_wait|pthread_rwlock|pthread_spin' <app_source_dir>`.
2. For each object, determine whether the RT loop thread locks or waits on it (follow calls from the loop function), and which other threads use it.
3. Priority inversion happens when the RT thread waits on a lock held by a low-priority thread that a medium-priority thread preempts. Mark each object the RT thread uses and a lower-priority thread also uses as `shared`.

### Output
Inventory table: object, type, location, users, `shared` yes or no.

### Quality Gate
- Every grep hit has a row with a `shared` value.

---

## Phase 2: Convert

### Entry Criteria
- At least one `shared` row.

### Actions
1. Apply this table, one object at a time, rebuilding and running tests after each:

| Type | Action |
|---|---|
| `pthread_mutex_t` | Initialize with an attribute: `pthread_mutexattr_init(&a); pthread_mutexattr_setprotocol(&a, PTHREAD_PRIO_INHERIT); pthread_mutex_init(&m, &a);`. Check every return value. `PTHREAD_MUTEX_INITIALIZER` cannot set the protocol; replace it. |
| `std::mutex`, `std::timed_mutex` | The standard gives no way to set the protocol. Write a small class with `lock()`, `unlock()`, `try_lock()` wrapping a PI `pthread_mutex_t`, so `std::lock_guard` and `std::unique_lock` still work. |
| `std::condition_variable` or `pthread_cond_t` used with that mutex | glibc condition variables are not PI aware. Use `librtpi` (PI-aware mutex and condvar from the Linux real-time community) or redesign to a lock-free handoff. |
| `sem_t` | No owner, so no inheritance is possible. Replace with a PI mutex plus state, or a lock-free queue. |
| `pthread_rwlock_t`, `std::shared_mutex` | No PI on Linux for readers. Replace with a PI mutex or a double-buffer swap. |
| `pthread_spin_lock` in user space | A preempted holder makes the RT thread spin; replace. |
| Data handed one way between one producer and one consumer | Lock-free single-producer single-consumer ring buffer with atomics; no lock at all. |

2. Keep critical sections short: no I/O, no allocation, no logging while holding a lock the RT thread takes.
3. Do not set `PTHREAD_PRIO_PROTECT` (priority ceiling) unless the user asks; it needs a ceiling value per mutex that this flow cannot derive.

### Output
Converted code.

### Quality Gate
- Build and full test suite pass after each conversion (exit 0); no test deleted or weakened.
- Re-running the Phase 1 grep shows no `shared` object remaining as a plain mutex, semaphore, rwlock or spinlock.

---

## Phase 3: Confirm Inheritance Happens

### Entry Criteria
- Converted binary built. If it commands actuators: bench or closed course only, behind an independent hardware emergency stop; otherwise actuator outputs disabled.

### Actions
1. Optional kernel check: run `pi_stress` from rt-tests for a short duration (`pi_stress --help` for options). It exercises kernel PI futexes and reports failure if inversion is detected.
2. Trace the application: `sudo trace-cmd record -e sched:sched_pi_setprio -e sched:sched_switch -P <pid>` (check `trace-cmd record --help` for the PID filter option on your version) while a test drives contention on the converted lock. Then `trace-cmd report | grep sched_pi_setprio`.
3. A `sched_pi_setprio` line showing the low-priority holder's priority raised to the RT thread's priority, and restored after unlock, is the evidence that inheritance works.

### Output
`pi_mutex_report`.

### Quality Gate
- At least one `sched_pi_setprio` line names the low-priority holder thread and the boosted priority, or the report states that no contention occurred in the run and how it was driven.

---

## Worked Example

Illustrative. C++ controller; RT thread `ctl_loop` (FIFO 80) and `can_logger` (normal) share `std::mutex state_mtx` guarding the latest wheel-speed frame.

Phase 1: `src/state.hpp:12 std::mutex state_mtx;` shared yes. `src/state.hpp:13 std::condition_variable cv;` used only by logger threads, shared no.

Phase 2: the data is one-way (CAN reader to controller), so `state_mtx` is replaced with a lock-free SPSC ring of frames (table last row). A second mutex `cfg_mtx`, two-way, becomes `PiMutex` wrapping a PI `pthread_mutex_t`. 51 tests pass.

Phase 3:
```
$ trace-cmd report | grep sched_pi_setprio | head -2
 cfg_writer-6120 [002] 812.44101: sched_pi_setprio: comm=cfg_writer pid=6120 oldprio=120 newprio=19
 cfg_writer-6120 [002] 812.44103: sched_pi_setprio: comm=cfg_writer pid=6120 oldprio=19 newprio=120
```
Kernel `prio` 19 corresponds to user RT priority 80 (kernel prio = 99 - rtprio). The holder was boosted for 20 us and restored.

---

## Exit Criteria

DONE when no lock shared with the RT thread lacks priority inheritance or a lock-free replacement, tests pass, and a trace shows boosting or the run documents no contention.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `pthread_mutexattr_setprotocol` returns ENOTSUP | **Return**: platform lacks PI futex support; report. |
| Phase 2 | Condvar needed with PI mutex | **Adjust**: use librtpi or redesign to lock-free; do not pair a PI mutex with a glibc condvar and call it fixed. |
| Phase 2 | Tests fail after a conversion | **Retry**: revert that one conversion and redo it. |
| Phase 3 | No `sched_pi_setprio` events | **Retry**: force contention in a test (hold the lock in the low-priority thread with a sleep inside the test only). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
