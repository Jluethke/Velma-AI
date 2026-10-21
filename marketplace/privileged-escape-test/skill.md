# Privileged Escape Test

Test for escape from privileged or over-permissioned containers.

## Inputs

- `runtime-profile`: Container runtime details
- `capability-list`: Container capabilities

## Outputs

- `privilege-findings`: Escape paths via privileged mode or excessive capabilities
- `capability-abuse-paths`: Specific capabilities that enable escape

## Process

1. Check if the container runs in privileged mode
2. Test each dangerous capability for host access: SYS_ADMIN to mount, SYS_PTRACE to inject
3. Attempt cgroup escape techniques if applicable

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
