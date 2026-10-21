# Runtime Constraint Configurator

Configure health checks, resource limits, read-only filesystem, and seccomp/AppArmor profiles.

## Inputs

- `scan-results`: Vulnerability scan results
- `application-requirements`: Runtime resource requirements

## Outputs

- `runtime-config`: Container runtime configuration (resource limits, health checks, security profiles)
- `security-context`: Kubernetes SecurityContext or Docker security options

## Process

1. Set CPU and memory limits based on the application's resource profile.
2. Configure a health check endpoint for liveness and readiness probes.
3. Apply a read-only root filesystem and define a seccomp or AppArmor profile.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
