# Edge Requirements Assessor

Assess the processing requirements for edge computing.

## Inputs

- `use-case`: What the edge computing will do (local inference, data filtering, real-time control)
- `data-volume`: Expected data volume and latency requirements

## Outputs

- `edge-requirements`: Processing, storage, and network requirements for the edge
- `edge-vs-cloud-analysis`: What should run at the edge vs what should run in the cloud

## Process

1. List the processing tasks and their latency requirements.
2. Calculate the compute, memory, and storage needed for each task.
3. Determine which tasks must run at the edge (latency-critical, offline-capable) and which can run in the cloud.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
