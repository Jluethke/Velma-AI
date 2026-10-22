# Deterministic Memory Allocator

Design and implement a deterministic memory allocation scheme using memory pools and block allocators, eliminating heap fragmentation and non-deterministic allocation times.

## Inputs

- `mpu-region-table`: MPU configuration constraining where allocations can live
- `heap-elimination-plan`: Strategy for replacing heap with fixed allocators

## Outputs

- `allocator-design`: Memory pool definitions (block size, count, location), allocation API, deallocation API, and overflow handling
- `memory-architecture-document`: Complete memory design: map, linker script, stack/heap analysis, MPU config, allocators, and verification methodology

## Process

1. Profile the application's dynamic memory usage. Log every allocation and deallocation with size and caller. Group allocations into size classes. Typical embedded patterns: many small allocations (16 to 64 bytes for protocol buffers) and a few large ones (512 to 4096 bytes for data buffers).
2. Create a memory pool for each size class. A pool is a static array of fixed-size blocks with a free list (singly-linked list through the blocks themselves, zero overhead when a block is free). Allocation is O(1): pop from free list. Deallocation is O(1): push to free list.
3. Size each pool based on worst-case concurrent usage measured during profiling, plus 20% margin. Compile-time ASSERT that the total pool sizes fit in the allocated RAM region.
4. For allocations that do not fit any pool, use a static scratch buffer with a bump allocator (allocate by advancing a pointer, free by resetting the pointer). This works for request-scoped allocations where everything is freed at once.
5. Make all allocation failures visible and handled. No allocator should return NULL silently. Options: assert (catch in testing), error code (caller handles), or pre-verified design (prove at design time that the pool cannot be exhausted because usage is bounded).
6. Document the complete memory architecture: physical memory map, linker script with ASSERT guards, per-task stack sizes with analysis, MPU region table, memory pool specifications, and the verification approach (static analysis of allocation paths, runtime canary checks, profiling under stress test).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
