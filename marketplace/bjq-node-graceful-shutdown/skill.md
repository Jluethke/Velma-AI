# Node Worker Graceful Shutdown

**One-line description:** Makes BullMQ workers and hand-written SQS or amqplib consumers in Node.js stop taking jobs and finish in-flight ones on SIGTERM with `await worker.close()`, an `AbortController` on the SQS long poll, or `channel.cancel`, run Node directly as the container command so the signal arrives, and size the platform grace period from measured runtimes.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root with Dockerfile and worker entry file.
- `queue_choice` (string, required): `bullmq`, `sqs` or `rabbitmq` (Node consumers).
- `job_duration_profile` (object[], required): Output of `bjq-job-duration-profile`.
- `deploy_platform` (string, required): `kubernetes`, `ecs`, `systemd` or `heroku`.

---

## Outputs

- `node_shutdown_config` (object): Signal path findings, shutdown handler code, the derived grace period, and the shutdown test transcript.

---

## Phase 1: Signal Path

### Entry Criteria
- Worker entry file is known (`rg -n "new Worker\(|ReceiveMessageCommand|\.consume\(" <repo_path>/src`).

### Actions
1. Read the container command: `rg -n "^(CMD|ENTRYPOINT)" <repo_path>/Dockerfile*`.
2. Apply:

| Found | Problem | Fix |
|---|---|---|
| `CMD npm start` or `CMD ["npm", "run", "worker"]` | npm runs Node as a child and signal forwarding is unreliable | `CMD ["node", "dist/worker.js"]` |
| Shell form `CMD node dist/worker.js` | `sh -c` is PID 1 and does not forward SIGTERM | Exec form as above |
| Node is PID 1 with no SIGTERM listener | The kernel does not apply default signal actions to PID 1, so Node ignores SIGTERM and is SIGKILLed at the deadline | Add the handler in Phase 2, and use `docker run --init` or tini to reap children |

3. Confirm: `docker exec <container> cat /proc/1/cmdline | tr '\0' ' '`.

### Output
Signal path finding.

### Quality Gate
- `/proc/1/cmdline` shows `node` (or tini then node), not `npm` or `sh`.

---

## Phase 2: Shutdown Handler

### Entry Criteria
- SIGTERM reaches Node.

### Actions
1. Write one handler for SIGTERM and SIGINT that runs once:

| `queue_choice` | Stop taking work | Wait for in-flight | Release |
|---|---|---|---|
| bullmq | `await worker.close()` (with no argument it waits for active jobs; `close(true)` does not wait) | included in `close()` | `await queue.close()` for any Queue objects; close shared IORedis connections you created |
| sqs | `abort.abort()` on the `AbortController` whose `signal` was passed as `client.send(cmd, { abortSignal: abort.signal })` | `await Promise.allSettled(inFlight)` for handlers already started | `client.destroy()` |
| rabbitmq (amqplib) | `await channel.cancel(consumerTag)` (the tag returned by `consume`) | wait for in-flight handlers to `ack` | `await channel.close(); await conn.close()` |

2. Pattern:
```ts
let stopping = false;
async function shutdown(sig: string) {
  if (stopping) return; stopping = true;
  console.log(`received ${sig}, closing worker`);
  await worker.close();
  process.exit(0);
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
```
3. BullMQ crash case for the record: if the process is SIGKILLed, the active job's lock expires and the job is detected as stalled after `stalledInterval` and moved back to wait (or failed after `maxStalledCount` stalls). The job runs again from the start, so it must be idempotent.
4. Do not call `process.exit()` before `close()` resolves, and do not add a short `setTimeout(process.exit)` fallback that is shorter than the grace period; it kills jobs that would have finished.

### Output
Handler code per worker.

### Quality Gate
- `rg -n "process.on\('SIGTERM'" <repo_path>/src` finds a handler for every worker entry.
- The handler awaits the close call before exiting (read the code).

---

## Phase 3: Grace Period and Test

### Entry Criteria
- Handler in place.

### Actions
1. Grace G > preStop duration + measured maximum runtime M from `job_duration_profile` + close time. Set it in `terminationGracePeriodSeconds` (Kubernetes), `stopTimeout` (ECS, read its documented maximum), `TimeoutStopSec=` (systemd). Heroku's window is fixed by Heroku.
2. If M exceeds the platform's ceiling, record the jobs that will be stalled and rerun on every deploy.
3. Test in staging: start a job lasting several seconds, `kubectl delete pod <pod>`, follow `kubectl logs -f <pod>`. Expect `received SIGTERM, closing worker`, then the job's completion log, then exit. Exit code 137 means SIGKILL; recheck Phase 1 and G.
4. Run the test suite (`npx vitest run` or `npx jest`); do not skip tests.

### Output
`node_shutdown_config`.

### Quality Gate
- G formula shown with values.
- Transcript shows the SIGTERM log line, the in-flight job completing, and a clean exit.

---

## Worked Example

Illustrative only.

Input: `queue_choice` = `bullmq`, `deploy_platform` = `ecs`; `CMD ["npm", "run", "worker"]`; M = 48 s.

- Phase 1: npm found; changed to `CMD ["node", "dist/worker.js"]`; added `"initProcessEnabled": true` in the ECS task definition `linuxParameters` to reap children.
- Phase 2: handler with `await worker.close()`.
- Phase 3: G > 0 + 48 + 2 = 50; ECS `stopTimeout: 60` per requester margin, within the documented maximum.
```
received SIGTERM, closing worker
job 18233 (render-pdf) completed in 41.7s
```

---

## Exit Criteria

DONE when Node is PID 1 (or behind an init) without npm or a shell, each worker type closes and waits for in-flight jobs on SIGTERM, the grace period is derived, and a stop test shows a clean exit.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Build uses `ts-node` at runtime | **Adjust**: compile with `tsc` and run `node dist/...`; record the build change. |
| Phase 2 | `worker.close()` hangs past the grace period | **Adjust**: find jobs without timeouts on their I/O; add timeouts to each call. |
| Phase 3 | Exit code 137 | **Retry**: verify the signal path, then increase G within the platform maximum. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
