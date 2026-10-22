# Fifo Pointer And Flag Design

Design the FIFO pointer logic and empty/full flag generation, using gray-code pointers for asynchronous FIFOs and binary pointers for synchronous FIFOs.

## Inputs

- `fifo-specification`: FIFO type, depth, width, and required status signals
- `depth-calculation-worksheet`: Depth derivation and margin analysis

## Outputs

- `pointer-logic-design`: Write pointer, read pointer, and address generation logic with wrap-around handling and gray-code conversion (for async)
- `flag-generation-logic`: Empty and full flag logic with precise generation conditions, plus almost-full/almost-empty threshold logic

## Process

1. For a synchronous FIFO: use binary write and read pointers of width log2(depth)+1 (the extra bit distinguishes full from empty when pointers wrap). Write pointer increments on write-enable when not full; read pointer increments on read-enable when not empty. Empty when write_ptr == read_ptr. Full when write_ptr[MSB] != read_ptr[MSB] and write_ptr[MSB-1:0] == read_ptr[MSB-1:0].
2. For an asynchronous FIFO: use gray-code pointers. Convert binary write pointer to gray code: gray = binary ^ (binary >> 1). Synchronize the gray-coded write pointer to the read clock domain (two-flop synchronizer) and the gray-coded read pointer to the write clock domain.
3. Generate empty flag in the read clock domain: empty when the synchronized write pointer (in gray code) equals the read pointer (in gray code). This comparison is done in gray code directly; no conversion back to binary is needed for the equality check.
4. Generate full flag in the write clock domain: full when the write pointer and synchronized read pointer differ in the top two bits and match in all remaining bits (in gray code). This is the gray-code equivalent of the binary full condition.
5. For almost-full: convert both pointers to binary in the write domain, compute fill level = write_ptr_binary - synced_read_ptr_binary (unsigned subtraction with wrap). Almost-full when fill_level >= (depth - threshold). Note: the fill level in the write domain is conservative (may overcount) because the read pointer is delayed by synchronization.
6. For almost-empty: same approach in the read domain using synced_write_ptr and read_ptr. The fill level may undercount, making the almost-empty flag conservative (asserts slightly early).
7. Address generation: the memory address is the lower bits of the binary pointer (excluding the MSB used for wrap detection). For gray-code pointers in async FIFO, maintain a separate binary counter in each domain for the memory address; the gray-code pointer is used only for flag generation and synchronization.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
