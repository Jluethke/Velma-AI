# Vector Benchmark Runner

Benchmark query performance and produce the setup document.

## Inputs

- `loaded-index`: Populated vector index
- `query-patterns`: Expected query patterns

## Outputs

- `benchmark-results`: Latency, throughput, and recall metrics
- `setup-document`: Full vector database setup documentation

## Process

1. Run latency benchmarks at target query volume.
2. Measure recall against a ground truth set.
3. Test under concurrent load.
4. Compile the full setup document with architecture and metrics.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
