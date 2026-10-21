# FreeRTOS Priority Inversion Diagnosis and Fix

**One-line description:** Finds shared resources guarded by binary semaphores or unbounded waits, reproduces priority inversion with a three-task test measured by trace or GPIO, and fixes it with priority-inheriting mutexes, bounded timeouts and a fixed lock order, proving inheritance with `uxTaskPriorityGet`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `rtos_design` (object, required): Task and queue table from the FreeRTOS tasks flow.
- `freertos_config` (object, required): Final `FreeRTOSConfig.h` values.

---

## Outputs

- `inversion_findings` (object[]): Per shared resource: guard type before and after, tasks that take it with priorities, measured blocking time of the high-priority task before and after, and the evidence.

---

## Phase 1: Inventory Locks

### Entry Criteria
- `freertos_config` shows `configUSE_MUTEXES` = 1.

### Actions
1. Find all lock objects: `grep -rn "xSemaphoreCreateBinary\|xSemaphoreCreateMutex\|xSemaphoreCreateRecursiveMutex\|xSemaphoreCreateCounting" src/`.
2. For each, find every take and give: `grep -rn "xSemaphoreTake(<name>\|xSemaphoreGive(<name>" src/`.
3. Classify:

| Use | Correct object |
|---|---|
| Mutual exclusion around a shared resource (bus, buffer, peripheral) | Mutex (`xSemaphoreCreateMutex`): has priority inheritance |
| Same task may lock again while holding it | Recursive mutex with `xSemaphoreTakeRecursive` |
| Signaling from ISR or task to task (event) | Binary semaphore or direct task notification |
| Lock taken in an ISR | Not allowed for mutexes; redesign to defer to a task |

4. A binary semaphore used as a lock is a defect: it has no priority inheritance.
5. Mark every take with `portMAX_DELAY` (unbounded wait).

### Output
Lock inventory with classification.

### Quality Gate
- Every create call from the grep has a row; every take/give site is listed by file and line.

---

## Phase 2: Reproduce

### Entry Criteria
- At least one lock is shared by tasks of different priorities.

### Actions
1. Build a test configuration with three tasks: L (low) takes the lock and holds it for a known time; M (medium) becomes ready and runs CPU-bound without touching the lock; H (high) then requests the lock.
2. Measure H's wait: drive a spare GPIO high when H requests the lock and low when it gets it; capture with a logic analyzer. Or record with a trace tool (SEGGER SystemView or Percepio Tracealyzer; follow their FreeRTOS integration guide).
3. With a binary semaphore, H's wait includes M's whole run time. Record the measured wait.

### Output
Measured inversion.

### Quality Gate
- Captured wait time for H is recorded from the analyzer or trace with the test configuration described.

---

## Phase 3: Fix and Prove

### Entry Criteria
- Inversion reproduced or the inventory shows a defect.

### Actions
1. Replace each lock-use binary semaphore with `xSemaphoreCreateMutex()`. Change one lock per commit and rerun the test each time.
2. Replace `portMAX_DELAY` on lock takes with a timeout derived from the caller's deadline in `rtos_design`; handle the `pdFALSE` return (report and recover, do not continue as if locked).
3. Keep the locked region short: no blocking calls, no waiting on queues, no logging over slow I/O inside it.
4. If any task takes two locks, write the global lock order in a comment at both definitions and make every task follow it (prevents deadlock).
5. Prove inheritance: in the test, while H is blocked on the mutex, read `uxTaskPriorityGet(L_handle)` from a debugger watch or log; it must equal H's priority.
6. Rerun the GPIO or trace measurement. H's wait now excludes M's run time.

### Output
`inversion_findings`.

### Quality Gate
- `grep -rn "xSemaphoreCreateBinary" src/` shows no remaining lock-use binary semaphores (event uses are listed as such).
- `uxTaskPriorityGet(L)` read during the block equals H's priority (value recorded).
- After-fix wait time recorded and does not include M's run time.

---

## Worked Example

Illustrative. `spi_lock` guarding SPI1 used by `display` (prio 1) and `imu` (prio 4); `wifi` (prio 2) is CPU-bound for bursts.

- Phase 1: `spi_lock` created by `xSemaphoreCreateBinary` and given once at init: classified as a defect.
- Phase 2: GPIO capture shows `imu` waiting 18.4 ms during a `wifi` burst while `display` held the lock for 0.6 ms.
- Phase 3: changed to `xSemaphoreCreateMutex`; `uxTaskPriorityGet(display)` reads 4 while `imu` waits; `imu` wait drops to 0.6 ms. Takes now use a timeout from the `imu` deadline with an error path.

---

## Exit Criteria

DONE when every lock uses the correct object, lock waits are bounded, inheritance is shown by `uxTaskPriorityGet`, and the high-priority wait no longer includes medium-priority run time.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Mutex taken in an ISR | **Adjust**: move the work to a task signaled by notification. |
| Phase 2 | Inversion not reproducible | **Adjust**: make M CPU-bound for longer than L's hold time; confirm priorities with `vTaskList`. |
| Phase 3 | Deadlock after adding a second lock | **Stop**: write the lock order and fix the task that violates it. |
| Phase 3 | Take times out in normal operation | **Return**: the hold time exceeds the deadline; shorten the locked region. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
