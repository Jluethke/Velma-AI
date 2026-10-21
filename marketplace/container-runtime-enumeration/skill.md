# Container Runtime Enumeration

Enumerate the container runtime, configuration, and capabilities.

## Inputs

- `target-container`: Container or cluster to test
- `authorization-scope`: Written authorization for escape testing

## Outputs

- `runtime-profile`: Container runtime, version, and configuration details
- `capability-list`: Linux capabilities and security module settings

## Process

1. Identify the container runtime: Docker, containerd, CRI-O, Podman
2. Enumerate Linux capabilities: CAP_SYS_ADMIN, CAP_NET_RAW, CAP_SYS_PTRACE
3. Check security module status: AppArmor profile, SELinux context, seccomp filter

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
