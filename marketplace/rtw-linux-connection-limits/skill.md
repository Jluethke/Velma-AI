# Linux Connection Limits for Realtime Servers and Load Generators

**One-line description:** Checks and raises the Linux limits that cap concurrent long-lived connections (process `nofile`, systemd `LimitNOFILE`, container ulimits, `somaxconn`, conntrack table size, and the load generator's ephemeral port range per destination) before a load test, reading each value from the running process rather than the shell.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `server_hosts` (object[], required): Each host or pod to check: `{ name, role: "server" | "load_generator" | "proxy", access: "ssh" | "kubectl", process_name }`.
- `target_connections` (integer, required): Concurrent connections the test must reach, per server node and in total, from the capacity plan.

---

## Outputs

- `os_limits_report` (object): `{ hosts: [ { name, role, nofile_soft, nofile_hard, somaxconn, conntrack_max | null, port_range | null, max_conns_per_dest | null, changes_made: [] } ], blocking: [] }`.

---

## Phase 1: Read the Real Limits

### Entry Criteria
- Access to each host in `server_hosts`.

### Actions
1. File descriptors of the RUNNING process (each connection is one fd; a proxy uses two per client):
   - `pid=$(pgrep -o <process_name>)` then `grep "Max open files" /proc/$pid/limits`. Record soft and hard.
   - Do NOT trust `ulimit -n` in your SSH shell; services started by systemd or a container runtime have their own limits.
   - systemd service: `systemctl show <unit> -p LimitNOFILE`.
   - Kubernetes pod: `kubectl exec <pod> -- sh -c 'grep "Max open files" /proc/1/limits'` (assumes the server is PID 1; else find its pid).
2. Listen backlog: `sysctl net.core.somaxconn`. Kernels 5.4 and later default to 4096; older kernels default to 128. A small backlog drops connection bursts after a deploy.
3. Conntrack (only if iptables/nftables NAT or conntrack is active, common on Kubernetes nodes): `sysctl net.netfilter.nf_conntrack_max` and `cat /proc/sys/net/netfilter/nf_conntrack_count`. Check `dmesg | grep -i "nf_conntrack: table full"`.
4. Load generator only: `sysctl net.ipv4.ip_local_port_range` (Linux default `32768 60999`, which is 28232 ports). Each outbound connection to the same destination IP and port needs a distinct local port per source IP, so one source IP can open at most about that many connections to one `ip:port`. Record `max_conns_per_dest = (high - low + 1) * number_of_source_IPs`.
5. Record every value in `hosts`.

### Output
Current limits per host.

### Quality Gate
- Every server-role host has `nofile_soft` read from `/proc/<pid>/limits` (paste the line).
- Every load generator has `port_range` and `max_conns_per_dest`.

---

## Phase 2: Compare and Raise

### Entry Criteria
- Limits recorded.

### Actions
1. Rules (add a `blocking` entry for each failure):
   - Server: `nofile_soft` must exceed per-node `target_connections` plus the process's baseline fds (count with `ls /proc/$pid/fd | wc -l` at idle).
   - Proxy: `nofile_soft` must exceed `2 * connections through it` plus baseline.
   - Load generator: `max_conns_per_dest` must reach the connections it will open to each destination `ip:port`. Otherwise add generator machines, source IPs, or target several ports/IPs.
   - Conntrack: `nf_conntrack_max` must exceed the expected tracked connections on that node.
2. Raise limits in the place that owns them, one host at a time:
   - systemd: `sudo systemctl edit <unit>`, add `[Service]` and `LimitNOFILE=<n>`, then `sudo systemctl daemon-reload && sudo systemctl restart <unit>`.
   - Docker: `docker run --ulimit nofile=<soft>:<hard> ...` or `ulimits:` in Compose.
   - Kubernetes: the container runtime's default nofile applies; change it in the runtime config or node image. There is no pod-spec field for nofile.
   - sysctl: `sudo sysctl -w net.core.somaxconn=<n>` for now, and a file in `/etc/sysctl.d/` to persist. Note that the application's own `listen()` backlog argument also caps the queue (Node `server.listen({backlog})`, uvicorn `--backlog` default 2048, Go uses the system value).
   - Load generator: `sudo sysctl -w net.ipv4.ip_local_port_range="<low> <high>"` within the kernel's allowed range.
3. Every new number must come from `target_connections` and the rule it satisfies; write the arithmetic into `changes_made`.

### Output
Raised limits.

### Quality Gate
- After restart, the `/proc/<pid>/limits` line shows the new value (paste it).
- `blocking` is empty, or each entry names the host and the missing action.

---

## Phase 3: Smoke Test the Limits

### Entry Criteria
- `blocking` is empty.

### Actions
1. Open a small fraction of the target connections from the generator (a short k6 or Artillery run) and watch:
   - Server: `ss -s` (summary of TCP states) and `ss -tan state established '( sport = :<port> )' | wc -l`.
   - Server fds: `ls /proc/$pid/fd | wc -l` grows with connections.
   - Server log: no `EMFILE` / `too many open files`.
   - Generator: no `EADDRNOTAVAIL` / `cannot assign requested address` (port exhaustion).
2. Record peak counts in the report.

### Output
`os_limits_report`.

### Quality Gate
- `ss` established count matches the test's open connections within the test's own reported failures.
- Zero `EMFILE` and zero `EADDRNOTAVAIL` lines in logs (paste the grep).

---

## Worked Example

Illustrative only.

Target 50000 connections per node, two nodes, one generator with one IP.
```
$ grep "Max open files" /proc/$(pgrep -o node)/limits
Max open files            1024                 524288               files
$ sysctl net.ipv4.ip_local_port_range
net.ipv4.ip_local_port_range = 32768	60999
```
Blocking: server nofile 1024 < 50000 + 120 baseline; generator `max_conns_per_dest = 28232` < 50000 per node. Fix: `LimitNOFILE=60000` via `systemctl edit` (50000 + baseline with headroom chosen by owner) and a second generator machine. After restart: `Max open files 60000 60000 files`.

---

## Exit Criteria

DONE when every server, proxy and generator limit is read from the running process or kernel, compared with `target_connections`, raised where it owns the setting, and a smoke run shows no fd or port exhaustion.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No access to the node (managed platform) | **Adjust**: read the platform's documented limits and cite them; mark unverified. |
| Phase 2 | Cannot raise nofile in Kubernetes pod spec | **Adjust**: change the runtime or node image config; record the owner. |
| Phase 3 | `EADDRNOTAVAIL` on generator | **Return** to Phase 2: add source IPs or generator machines. |
| Phase 3 | `EMFILE` on server | **Stop**: the limit did not apply to the running process; recheck `/proc/<pid>/limits`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
