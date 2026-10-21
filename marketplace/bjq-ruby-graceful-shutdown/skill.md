# Ruby Worker Graceful Shutdown

**One-line description:** Makes Sidekiq and Bunny consumers shut down without losing jobs: TSTP to quiet and TERM to stop, a Sidekiq `:timeout:` shorter than the platform's kill deadline so unfinished jobs are pushed back to Redis instead of lost to SIGKILL, a direct `bundle exec` container command, and a deploy test that checks no job vanished.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): App root with Dockerfile, Procfile or Kubernetes manifests and `config/sidekiq.yml`.
- `queue_choice` (string, required): `sidekiq` or `rabbitmq` (Bunny consumers).
- `job_duration_profile` (object[], required): Output of `bjq-job-duration-profile`.
- `deploy_platform` (string, required): `kubernetes`, `ecs`, `systemd` or `heroku`.

---

## Outputs

- `ruby_shutdown_config` (object): Signal path, Sidekiq timeout versus platform deadline, Bunny consumer handler, and test transcript.

---

## Phase 1: Signal Path

### Entry Criteria
- The worker process command is known: `rg -n "sidekiq|bunny" <repo_path>/Procfile <repo_path>/Dockerfile* <repo_path>/k8s <repo_path>/config/deploy 2>/dev/null`.

### Actions
1. The container command must be exec form running the worker directly: `CMD ["bundle", "exec", "sidekiq", "-C", "config/sidekiq.yml"]`. Shell form or a wrapper script without `exec` keeps the shell as PID 1, which does not forward TERM.
2. Confirm: `docker exec <container> cat /proc/1/cmdline | tr '\0' ' '` shows `sidekiq` (the process title reads like `sidekiq 7.x.x app [0 of N busy]` in `ps`).
3. Sidekiq signals (Sidekiq "Signals" wiki page): `TSTP` = quiet (stop fetching new jobs, keep running current ones); `TERM` = shut down: stop fetching, wait up to `:timeout:` seconds for running jobs, push unfinished ones back to Redis, exit; `TTIN` = dump thread backtraces to the log (debugging a hang).

### Output
Signal path finding.

### Quality Gate
- `/proc/1/cmdline` shows the Sidekiq or consumer process.

---

## Phase 2: Timeout Versus Deadline

### Entry Criteria
- Signals reach the process.

### Actions
1. Read `:timeout:` from `config/sidekiq.yml` (or `-t` on the command line). Record the Sidekiq default from the wiki if not set.
2. Read the platform deadline D: Kubernetes `terminationGracePeriodSeconds` (default 30), ECS `stopTimeout`, systemd `TimeoutStopSec=`, Heroku's documented shutdown window.
3. Rule: `:timeout:` + push-back time + preStop duration < D. If `:timeout:` reaches D, the platform SIGKILLs Sidekiq before it pushes jobs back, and with open source basic fetch those jobs are lost. Push-back margin is a user input.
4. Jobs whose maximum runtime M (from `job_duration_profile`) exceeds `:timeout:` are pushed back on every deploy and restart from the beginning. List them; each must be idempotent or chunked into shorter jobs.
5. Kubernetes option: a `preStop` hook that sends TSTP gives Sidekiq time to finish current jobs before TERM: `exec: { command: ["sh", "-c", "kill -TSTP 1 && sleep <n>"] }`. The sleep counts against D; recompute the rule with it.
6. Bunny consumers: trap TERM and set a flag (do not do I/O in the trap; Ruby forbids some calls inside trap context), then from the main thread `consumer.cancel`, wait for the in-flight handler to `ack`, and `conn.close`:
```ruby
stop = Queue.new
Signal.trap("TERM") { stop << :term }
consumer = q.subscribe(manual_ack: true) { |di, _p, body| handle(body); ch.ack(di.delivery_tag) }
stop.pop
consumer.cancel
conn.close
```

### Output
Timeout rule result and handler changes.

### Quality Gate
- The inequality shows `:timeout:`, margin, preStop and D with numbers, and holds.
- Each job with M > `:timeout:` is listed with its idempotency status.

---

## Phase 3: Test

### Entry Criteria
- Settings applied in staging.

### Actions
1. Enqueue a job that sleeps longer than `:timeout:` and one that finishes within it.
2. Trigger shutdown: `kubectl delete pod <pod>` (or `kill -TERM <pid>` locally).
3. Read the log: Sidekiq logs `Shutting down`, `Terminating quiet threads`, then for the long job `Pausing to allow jobs to finish...` and a push-back message, then `Bye!`. Check exact wording in your version.
4. Confirm the long job is back in the queue: `bundle exec rails runner 'require "sidekiq/api"; p Sidekiq::Queue.new("default").map(&:jid)'` contains its jid, and it later completes on another process.
5. Exit code of the stopped container: 0 is clean; 137 means SIGKILL hit first.

### Output
`ruby_shutdown_config` with transcript.

### Quality Gate
- The long job's jid is found back in the queue after shutdown.
- The short job completed before exit (log line present).

---

## Worked Example

Illustrative only.

Input: `queue_choice` = `sidekiq`, `deploy_platform` = `kubernetes`, `:timeout: 30`, `terminationGracePeriodSeconds: 30`.

- Phase 1: exec form already used.
- Phase 2: 30 + margin 5 >= 30: fails. Set `:timeout: 25` and `terminationGracePeriodSeconds: 35` (requester margin 5 s each side). `ImportCsvJob` (M = 610 s) exceeds 25 s: listed; it is idempotent per row key.
- Phase 3:
```
INFO: Shutting down
INFO: Terminating quiet threads for default capsule
INFO: Pausing to allow jobs to finish...
INFO: Bye!
$ bundle exec rails runner 'require "sidekiq/api"; p Sidekiq::Queue.new("default").map(&:jid)'
["3b1f0c2a9e7d4b6f8a1c2d3e"]
```

---

## Exit Criteria

DONE when Sidekiq or the Bunny consumer receives TERM directly, `:timeout:` plus margins is below the platform deadline, long jobs are listed as restart-on-deploy, and the test shows push-back with no lost job.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Process manager (foreman, overmind) is PID 1 | **Adjust**: run Sidekiq directly in its own container; process managers vary in signal forwarding. |
| Phase 2 | Platform deadline cannot exceed the timeout plus margins (Heroku) | **Adjust**: lower `:timeout:` to fit and accept more restarts of long jobs. |
| Phase 3 | Long job missing after shutdown | **Stop**: SIGKILL arrived first; recheck the inequality and the container's exit code. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
