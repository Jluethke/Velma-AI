# Incident Safe Production Debug Access on Kubernetes

**One-line description:** Gets read-only diagnostic access to a misbehaving pod with an ephemeral debug container (`kubectl debug --target`), optionally quarantines the pod out of the Service by relabeling it, and captures pod state before anything is restarted, under written safety rules.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `hypothesis_table` (object[], required): From `inc-hypothesis-draft`; names the tests that need in-pod access.
- `k8s_namespace` (string, required): Namespace of the pod.
- `target_pod` (string, required): Name of one affected pod. If unknown, Phase 1 picks one.

---

## Outputs

- `debug_access` (object): {pod, container, node, pid_of_app, debug_container_name, debug_image, profile, quarantined (bool), quarantine_restore_command, captured_state_files, safety_rules_acknowledged_by}.

---

## Phase 1: Capture State Before Touching Anything

### Entry Criteria
- `hypothesis_table` has at least one row whose test needs in-pod access.

### Actions
1. If `target_pod` is absent, pick the pod with the most errors or restarts: `kubectl get pods -n <ns> -l <selector> --sort-by='.status.containerStatuses[0].restartCount'` and choose the last line.
2. Save state into a local folder named after the incident:
   ```
   kubectl get pod <pod> -n <ns> -o yaml > pod.yaml
   kubectl describe pod <pod> -n <ns> > describe.txt
   kubectl logs <pod> -n <ns> -c <container> --timestamps > logs-current.txt
   kubectl logs <pod> -n <ns> -c <container> --previous --timestamps > logs-previous.txt
   kubectl top pod <pod> -n <ns> --containers > top.txt
   ```
   `--previous` fails if the container never restarted; that is fine, record it.
3. Read `describe.txt` for `Last State: Terminated` with `Reason: OOMKilled` or `Error` and the exit code. Exit code 137 means SIGKILL (often OOM); 143 means SIGTERM.
4. Safety rules, read aloud in the channel and acknowledged by the IC:
   - Read-only commands only, unless a hypothesis row marked changes_state is approved.
   - No package installs in the application container. Tools go in the debug container.
   - No restarts, deletes or `kill` until runtime evidence is captured.
   - No copying of secrets or customer data out of the pod.

### Output
State files and acknowledged rules.

### Quality Gate
- `pod.yaml`, `describe.txt` and `logs-current.txt` exist and are non-empty (`wc -c`).
- `safety_rules_acknowledged_by` has the IC's name.

---

## Phase 2: Quarantine (Optional)

### Entry Criteria
- State is captured.

### Actions
1. Quarantine when the pod is still serving failing requests and debugging could take a while. Skip it when the failure is in every pod and removing one would not reduce impact.
2. Find the label used by the Service selector: `kubectl get svc <svc> -n <ns> -o jsonpath='{.spec.selector}'`.
3. Relabel the pod so the Service and the ReplicaSet both stop selecting it:
   `kubectl label pod <pod> -n <ns> <key>=<value>-quarantine --overwrite`
   The ReplicaSet releases the pod and starts a replacement; the quarantined pod keeps running with its state for debugging.
4. Record the restore: the pod must be deleted after debugging with `kubectl delete pod <pod> -n <ns>`, because the ReplicaSet no longer owns it.
5. Do NOT relabel if the Deployment selector and the Service selector use different labels without checking both; read `kubectl get deployment <name> -n <ns> -o jsonpath='{.spec.selector.matchLabels}'` as well.

### Output
Pod quarantined or skip recorded.

### Quality Gate
- If quarantined: `kubectl get endpoints <svc> -n <ns> -o yaml` (or `kubectl get endpointslices -n <ns> -l kubernetes.io/service-name=<svc> -o yaml`) no longer lists the pod IP.

---

## Phase 3: Attach an Ephemeral Debug Container

### Entry Criteria
- Rules are acknowledged.

### Actions
1. Pick the debug image by the tool the hypothesis needs: a small shell image (`busybox`) for files and network, a Python image with py-spy installed for Python, a JDK image matching the app's major version for jcmd, the Go toolchain image for `go tool pprof`, or `nicolaka/netshoot` for network tools. Pin a tag, never `latest`.
2. Attach to the app container's process namespace:
   ```
   kubectl debug -it <pod> -n <ns> --image=<image:tag> --target=<container> --profile=<profile> -- sh
   ```
   `--target` shares the target container's process namespace so the app's PID is visible (requires container runtime support). For tools that attach to a process (py-spy, jcmd, gdb), the debug container needs SYS_PTRACE; check `kubectl debug --help` for which `--profile` values your kubectl version supports and which adds it.
3. Inside, find the app PID: `ps -ef` (or `ls /proc` and `cat /proc/<pid>/cmdline | tr '\0' ' '`). Record pid_of_app.
4. The app's filesystem is at `/proc/<pid>/root/` from the debug container.
5. Ephemeral containers cannot be removed from a pod; they stay listed until the pod is deleted. Record the name.
6. If Pod Security admission rejects the profile, use a less privileged profile, or run `kubectl debug node/<node> -it --image=<image:tag>` only with IC approval since it gives host access.

### Output
`debug_access`.

### Quality Gate
- `ps -ef` output inside the debug container shows the application process.
- `kubectl get pod <pod> -n <ns> -o jsonpath='{.spec.ephemeralContainers[*].name}'` lists the debug container.

---

## Worked Example

Illustrative only. Namespace `shop`, pod `checkout-7d9f8b-xk2lp`, Python app.

- Phase 1: Files saved. `describe.txt` shows `Restart Count: 0`. `logs-previous.txt` fails with "previous terminated container not found" (recorded). IC acknowledges the rules.
- Phase 2: Service selector `app=checkout`. `kubectl label pod checkout-7d9f8b-xk2lp -n shop app=checkout-quarantine --overwrite`. EndpointSlice no longer lists 10.42.3.17. Restore: delete the pod after debugging.
- Phase 3: `kubectl debug -it checkout-7d9f8b-xk2lp -n shop --image=python:3.12-slim --target=app --profile=general -- sh`, then `pip install py-spy` inside the debug container. `ps -ef` shows PID 1 `gunicorn app:wsgi`. Debug container `debugger-8kx2q` recorded.

---

## Exit Criteria

DONE when pod state is saved, rules are acknowledged, the debug container sees the application PID, and quarantine (if used) has a restore step.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No RBAC for pods/log | **Stop**: request access; do not borrow credentials. |
| Phase 2 | Replacement pod fails to start | **Adjust**: restore by relabeling back; capacity matters more than quarantine. |
| Phase 3 | "ephemeral containers are disabled" or rejected by admission | **Adjust**: use `kubectl exec` with read-only commands that exist in the image, and record the limitation. |
| Phase 3 | App PID not visible | **Retry**: confirm `--target` names the app container exactly as in `pod.yaml`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
