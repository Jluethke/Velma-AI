# Rust Real-Time Control Thread

**One-line description:** Builds a dedicated Rust real-time thread that locks memory with `libc::mlockall`, sets SCHED_FIFO with `libc::pthread_setschedparam`, wakes on absolute `CLOCK_MONOTONIC` deadlines with `libc::clock_nanosleep`, and is proven allocation-free in the loop with the `assert_no_alloc` crate.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_source_dir` (string, required): Cargo project root (contains `Cargo.toml`).
- `loop_period_us` (integer, required): Loop period in microseconds.
- `rt_priority` (integer, required): SCHED_FIFO priority for the loop thread.

---

## Outputs

- `rust_rt_patch` (object): Crates added with versions, the module and function changed, the thread setup code, `cargo build` and `cargo test` exit codes, the `assert_no_alloc` test result, and the read-back of policy and fault counts from the running binary.

---

## Phase 1: Inspect The Project

### Entry Criteria
- `cargo build --release` and `cargo test` pass before changes (exit codes recorded).

### Actions
1. Find the loop: `grep -rn -E 'loop \{|thread::spawn|tokio::spawn|sleep\(|interval' <app_source_dir>/src`.
2. Classify:

| Found | Action |
|---|---|
| Loop inside an async runtime (Tokio, async-std) | Move the control loop to its own `std::thread`; async executors and their timers are not designed for bounded wakeup latency. Exchange data with the async side through a lock-free queue. |
| `std::thread::sleep(period)` after the work | Relative sleep; replace with absolute (Phase 2). |
| `std::sync::Mutex` shared with other threads | Linux futex mutex without priority inheritance; replace with a lock-free single-producer single-consumer queue (for example the `rtrb` or `heapless::spsc` crates) |
| Already a dedicated thread | Keep; add the setup in Phase 2 |

3. Check the crates are available offline or online: `cargo search libc`, `cargo search assert_no_alloc`. Read each crate's docs.rs page for the version you add; do not guess function names.

### Output
Classification and loop location.

### Quality Gate
- The loop's location is quoted with file and line, and a table row is cited.

---

## Phase 2: Write The Thread

### Entry Criteria
- Phase 1 complete.

### Actions
1. `cargo add libc` and `cargo add assert_no_alloc`.
2. Process start (in `main`, before spawning threads):
   ```rust
   let rc = unsafe { libc::mlockall(libc::MCL_CURRENT | libc::MCL_FUTURE) };
   if rc != 0 { eprintln!("mlockall: {}", std::io::Error::last_os_error()); std::process::exit(1); }
   ```
3. Spawn with a known stack size and set policy inside the thread:
   ```rust
   let h = std::thread::Builder::new().name("ctl_loop".into()).stack_size(512 * 1024)
       .spawn(move || {
           let p = libc::sched_param { sched_priority: RT_PRIO };
           let rc = unsafe { libc::pthread_setschedparam(libc::pthread_self(), libc::SCHED_FIFO, &p) };
           assert_eq!(rc, 0, "pthread_setschedparam returned {rc}");
           prefault_stack();
           run_loop();
       })?;
   ```
   `pthread_setschedparam` returns the error number (EPERM without rtprio limit). The 512 KiB value in the example is illustrative; use the stack size your loop needs.
4. Prefault: `#[inline(never)] fn prefault_stack() { let mut buf = [0u8; 256 * 1024]; for i in (0..buf.len()).step_by(4096) { buf[i] = 1; } std::hint::black_box(&buf); }` with a size below the thread stack size. Preallocate every buffer the loop uses (`Vec::with_capacity`, fixed arrays) before the loop.
5. Absolute sleep:
   ```rust
   let mut next = libc::timespec { tv_sec: 0, tv_nsec: 0 };
   unsafe { libc::clock_gettime(libc::CLOCK_MONOTONIC, &mut next) };
   loop {
       next.tv_nsec += PERIOD_NS;
       while next.tv_nsec >= 1_000_000_000 { next.tv_nsec -= 1_000_000_000; next.tv_sec += 1; }
       loop {
           let rc = unsafe { libc::clock_nanosleep(libc::CLOCK_MONOTONIC, libc::TIMER_ABSTIME, &next, std::ptr::null_mut()) };
           if rc == 0 { break; }
           if rc != libc::EINTR { /* report rc through a non-allocating path */ break; }
       }
       assert_no_alloc::assert_no_alloc(|| control_step());
   }
   ```
6. Register the allocator guard for debug and test builds as the crate documents: `#[cfg(debug_assertions)] #[global_allocator] static A: assert_no_alloc::AllocDisabler = assert_no_alloc::AllocDisabler;`. In debug builds, an allocation inside `assert_no_alloc` aborts or warns per the crate's feature flags; read its README for the exact behavior of the version added.
7. Do not use `println!`, `format!`, `String`, `Box::new`, `Vec::push` beyond capacity, or `std::sync::Mutex` inside `control_step`.

### Output
Patched code.

### Quality Gate
- `cargo build --release` and `cargo test` exit 0; no test removed or weakened.
- A test that runs `control_step` N times inside `assert_no_alloc` in a debug build passes.

---

## Phase 3: Verify On Target

### Entry Criteria
- Built binary. Limits granted (`ulimit -r`, `ulimit -l`, or systemd `LimitRTPRIO`/`LimitMEMLOCK`).
- If it commands actuators: bench or closed course only, behind an independent hardware emergency stop; braking and emergency stop are never routed through this loop's gating. Otherwise run with actuator outputs disabled.

### Actions
1. Run the release binary. `ps -L -o tid,cls,rtprio,psr,comm -p <pid>`: the `ctl_loop` thread shows `FF` and `rt_priority`.
2. `grep VmLck /proc/<pid>/status` is nonzero.
3. `ps -L -o tid,min_flt,maj_flt -p <pid>` twice 10 seconds apart: the `ctl_loop` deltas are 0.

### Output
`rust_rt_patch`.

### Quality Gate
- Thread policy, `VmLck`, and fault deltas are recorded from command output, with deltas equal to 0.

---

## Worked Example

Illustrative. A Rust CAN decoder and speed controller running on a bench rig, previously a Tokio task with `tokio::time::interval(Duration::from_millis(5))`.

Phase 1: row 1 (async runtime). Phase 2: loop moved to a `std::thread` named `ctl_loop`, data from the Tokio CAN reader passed through `rtrb::RingBuffer::<Frame>::new(256)`. `cargo test` passes, including `no_alloc_in_step` running 10000 steps.

Phase 3:
```
$ ps -L -o tid,cls,rtprio,psr,comm -p 7001
  TID CLS RTPRIO PSR COMMAND
 7001  TS      -   0 speedctl
 7004  FF     80   2 ctl_loop
 7005  TS      -   0 tokio-runtime-w
$ ps -L -o tid,min_flt,maj_flt -p 7001 | grep 7004   # twice, 10 s apart
 7004   212      0
 7004   212      0
```

---

## Exit Criteria

DONE when the loop runs on a dedicated SCHED_FIFO thread with locked memory, absolute deadline sleeps, a passing no-allocation test, and zero fault deltas on target.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Crate not reachable (offline build) | **Return**: ask the user to vendor the crates; do not hand-write a global allocator without review. |
| Phase 2 | `pthread_setschedparam returned 1` (EPERM) | **Adjust**: grant rtprio limits; see `rtl-sched-fifo-chrt`. |
| Phase 2 | `assert_no_alloc` fires | **Retry**: replace the allocating call it points to; never remove the guard. |
| Phase 3 | Nonzero fault delta | **Retry**: prefault or preallocate the touched memory before the loop. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
