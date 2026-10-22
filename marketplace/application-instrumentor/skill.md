# Application Instrumentor

Instrument the application with custom metrics, structured logging, and distributed tracing.

## Inputs

- `tooling-selection`: Selected observability tools
- `service-catalog`: Services to instrument

## Outputs

- `instrumentation-guide`: Guide for instrumenting each service
- `instrumentation-status`: Status of instrumentation across services

## Process

1. Add metrics instrumentation (RED metrics per endpoint)
2. Implement structured logging with correlation IDs
3. Add distributed tracing spans at service boundaries
4. Verify data flows from each service to the collection backend

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
