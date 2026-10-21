# Incident Python Live Stacks With py-spy

**One-line description:** Attaches py-spy to a running Python process (including every Gunicorn or Uvicorn worker) to take repeated thread stack dumps and a short flame graph without restarting it, and reads the output to say whether workers are blocked on I/O, a lock, the GIL or CPU.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `debug_access` (object, required): From `inc-k8s-safe-debug-access`; supplies the shell location, pid_of_app and confirmation of SYS_PTRACE. On a VM, this is a shell on the host with `sudo` and the PID.
- `hypothesis_table` (object[], required): From `inc-hypothesis-draft`; the rows this evidence must confirm or refute.

---

## Outputs

- `python_runtime_evidence` (object): {pids, dump_files, flamegraph_file, worker_states (count per state), top_frames, hypotheses_affected (row id and supports or refutes)}.

---

## Phase 1: Find the Processes

### Entry Criteria
- A shell with ptrace permission over the app process exists.
- `py-spy --version` prints a version.

### Actions
1. List Python processes: `ps -eo pid,ppid,etime,rss,cmd | grep -E 'python|gunicorn|uvicorn|celery' | grep -v grep`.
2. Gunicorn and Celery run a master and worker children. Requests are served by workers, so dump the workers, or pass the master PID with `--subprocesses` to cover all of them.
3. If py-spy prints a permission error, the container lacks SYS_PTRACE; go back to `inc-k8s-safe-debug-access` and pick a profile that grants it. Do NOT run the app container as privileged to fix this.

### Output
List of PIDs to sample.

### Quality Gate
- Each PID in the list is a worker, or the master with `--subprocesses` planned.

---

## Phase 2: Dump Stacks Repeatedly

### Entry Criteria
- PIDs are known.

### Actions
1. Take three dumps a few seconds apart so a stuck frame can be told apart from a busy one:
   ```
   for i in 1 2 3; do py-spy dump --pid <PID> --subprocesses > dump-$i.txt; sleep 5; done
   ```
   `py-spy dump` briefly pauses the process to read memory. Add `--nonblocking` to avoid pausing at the cost of possibly inconsistent stacks; use it when the process is latency-critical and still serving.
2. Do NOT add `--locals` unless a hypothesis needs a variable value; locals can contain tokens and customer data. If used, keep the file out of the channel.
3. Read each dump. Every thread prints with its name and frames, innermost first. Classify the top frame of each request-handling thread:

| Top frames contain | State |
|---|---|
| `recv`, `recv_into`, `read` in `socket.py` or `ssl.py`, `getaddrinfo` | waiting on network I/O |
| `acquire` (threading), `_wait_for_tstate_lock`, `wait` in `threading.py` | waiting on a lock or condition |
| `select`, `poll`, `epoll` in `selectors.py` with no app frames below | idle |
| App or library frames that change between the three dumps | running CPU work |
| The same app frame in all three dumps for one thread | stuck in that frame |

4. Count threads per state across workers.

### Output
Three dump files and state counts.

### Quality Gate
- Three dump files exist for each PID.
- Every request thread has a state from the table.

---

## Phase 3: Record a Short Profile and Map to Hypotheses

### Entry Criteria
- Dumps are read.

### Actions
1. If the state counts show CPU work, record a flame graph for a fixed duration chosen by the ops lead:
   `py-spy record --pid <PID> --subprocesses --duration <seconds> --format speedscope --output profile.speedscope.json`
   Use `--format flamegraph --output profile.svg` for an SVG. Add `--idle` only when you need to see idle threads.
2. Read the profile: the widest frames near the top of the stacks are where time is spent. Note the three widest app frames as top_frames.
3. For asyncio services, py-spy shows only the coroutine running at that instant, not awaiting tasks. If every dump shows the loop in `select`, but requests hang, the tasks are awaiting something; on Python 3.14 and later `python -m asyncio ps <PID>` lists tasks (check the asyncio docs for your version).
4. For each hypothesis row that names Python runtime evidence, write supports or refutes with the line from the dump that decides it.

### Output
`python_runtime_evidence`.

### Quality Gate
- Every hypothesis row that requested Python evidence has supports or refutes plus a quoted frame.
- If a profile was recorded, the file exists and top_frames lists three frames from it.

---

## Worked Example

Illustrative only. Gunicorn master PID 1 with 4 sync workers (PIDs 8, 9, 10, 11). Hypothesis H3: worker exhaustion from slow calls.

- Phase 1: `ps` shows `gunicorn app:wsgi --workers 4`. Plan: `--subprocesses` on PID 1.
- Phase 2: All three dumps show, for each of the 4 workers:
  ```
  Thread 8 (idle): "MainThread"
      recv_into (ssl.py:1251)
      readinto (socket.py:720)
      _send_request (pricing_client.py:44)
      get_price (pricing/service.py:91)
  ```
  The same frame in all three dumps: 4 of 4 workers waiting on network I/O in `pricing_client.py:44`.
- Phase 3: No CPU work, no profile needed. H3 supported: all workers blocked calling pricing; H2 (pricing slow) still to test.

---

## Exit Criteria

DONE when repeated dumps are saved, every request thread is classified, and each relevant hypothesis row has a decision backed by a quoted frame.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | "Permission denied" or "Operation not permitted" | **Return**: to `inc-k8s-safe-debug-access` for a SYS_PTRACE profile. |
| Phase 2 | "Failed to find python version" | **Adjust**: the binary may be statically linked or very new; upgrade py-spy in the debug container and retry. |
| Phase 2 | Process exits during the dump | **Stop**: record the exit; read `kubectl logs --previous` instead. |
| Phase 3 | Profile shows only native frames | **Adjust**: add `--native` to see C extension frames, if supported on the platform. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
