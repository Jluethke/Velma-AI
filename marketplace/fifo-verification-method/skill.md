# Fifo Verification Method

Verify FIFO correctness through targeted simulation, formal properties, and corner-case testing for empty/full transitions, pointer wrap-around, and simultaneous read/write.

## Inputs

- `fifo-rtl`: Complete FIFO implementation
- `resource-utilization-estimate`: Expected resource usage for synthesis verification

## Outputs

- `fifo-verification-report`: Test results covering: data integrity across all fill levels, empty/full flag correctness, pointer wrap-around, simultaneous read/write, underflow/overflow protection, and async clock relationship sweep
- `fifo-verified-status`: Signoff status: pass/fail with any known limitations or operating restrictions

## Process

1. Data integrity test: write a known sequence (incrementing pattern), read it back, verify order and values match. Run at every fill level from 1 to depth. This catches address generation errors and memory corruption.
2. Empty/full flag test: fill the FIFO completely, verify full asserts and write is blocked. Read one entry, verify full deasserts. Empty the FIFO completely, verify empty asserts and read is blocked. Write one entry, verify empty deasserts. This catches off-by-one errors in pointer comparison.
3. Pointer wrap-around test: write exactly depth entries (pointer wraps from max to 0), then read depth entries. Verify data integrity across the wrap boundary. This catches gray-code conversion errors at the MSB transition.
4. Simultaneous read/write test: with FIFO partially filled, assert both read and write on the same cycle. Verify fill level remains constant, data integrity is maintained, and flags update correctly. Repeat at empty and full boundaries.
5. For async FIFO: sweep the clock frequency ratio from 1:10 to 10:1 in simulation. At each ratio, run a sustained data transfer and verify zero data loss. Add random jitter to both clocks to exercise worst-case synchronizer timing.
6. Almost-full/almost-empty threshold test: fill the FIFO to threshold minus one, verify flag is deasserted. Write one more, verify flag asserts. Read to go below threshold, verify flag deasserts. Test at multiple programmable threshold values if supported.
7. Overflow and underflow protection test: attempt to write to a full FIFO, verify the write is ignored and existing data is not corrupted. Attempt to read from an empty FIFO, verify the read returns no valid data and pointers do not change.
8. Formal verification: if available, prove the properties: (a) data written is always read in the same order, (b) full and empty flags are never simultaneously asserted, (c) fill level is always between 0 and depth inclusive, (d) no data is lost or duplicated.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
