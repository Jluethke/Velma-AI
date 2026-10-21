# DMA Peripheral Transfer Setup

**One-line description:** Configures a DMA transfer between a peripheral and memory by finding the exact request mapping, placing the buffer in memory the DMA master can reach, handling Cortex-M7 data cache maintenance, and verifying the transferred bytes and error flags on the target.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `elf_path` (string, required): Firmware image with the DMA code.
- `reference_manual` (string, required): MCU reference manual (DMA, DMAMUX, bus matrix and memory map chapters).
- `dma_peripheral` (string, required): Peripheral and direction, for example "USART2 RX, peripheral to memory, circular".

---

## Outputs

- `dma_record` (object): DMA controller, stream or channel, request ID, buffer address and region, cache handling, test pattern result, and error flag readings.

---

## Phase 1: Request Mapping and Buffer Placement

### Entry Criteria
- `dma_peripheral` names one peripheral instance and one direction.

### Actions
1. Find the request mapping in the reference manual:

| DMA type | Where the mapping is |
|---|---|
| Fixed stream/channel matrix (for example STM32F2/F4/F7 DMA1/DMA2) | "DMA request mapping" table: stream number and channel select value |
| DMAMUX (for example STM32G4, L4+, H7) | DMAMUX "request ID" table; any DMA channel, request ID in DMAMUX config |
| Other vendors | DMA chapter trigger or request source table |

2. Record the controller, stream/channel and request value with the table name and page.
3. Find the buffer's address: `arm-none-eabi-nm <elf_path> | grep <buffer name>`.
4. Check the bus matrix figure: the DMA master must reach that address. Known traps: STM32F4 CCM RAM (0x10000000) is not reachable by DMA; on STM32H7 DTCM is not reachable by DMA1/DMA2. If unreachable, move the buffer with a section attribute to a reachable RAM region and confirm with `nm` again.

### Output
Request mapping and verified buffer address.

### Quality Gate
- Request value cites a reference manual table.
- Buffer address lies in a region the bus matrix figure shows the DMA master can access (figure cited).

---

## Phase 2: Cache Maintenance (Cortex-M7 and other cores with a data cache)

### Entry Criteria
- Core has a data cache enabled (`SCB->CCR` DC bit set; check with `x/1xw 0xE000ED14` in GDB, bit 16). If no cache, record "no data cache" and pass this phase.

### Actions
1. Choose one approach and apply it consistently:

| Approach | Steps |
|---|---|
| Maintenance calls | Align the buffer to the cache line (32 bytes on Cortex-M7) and make its size a multiple of 32. Before memory-to-peripheral: `SCB_CleanDCache_by_Addr(buf, len)`. After peripheral-to-memory completes: `SCB_InvalidateDCache_by_Addr(buf, len)` before the CPU reads. |
| Non-cacheable region | Configure an MPU region over the buffer as non-cacheable and place the buffer there. |

2. Never invalidate a buffer that shares a cache line with other variables; invalidation discards their pending writes. This is why the alignment and size rule exists.

### Output
Cache approach recorded.

### Quality Gate
- Buffer address modulo 32 is 0 and size modulo 32 is 0 (for the maintenance approach), or the MPU region covering the buffer is listed with its attributes.

---

## Phase 3: Configure and Verify

### Entry Criteria
- Mapping and buffer placement settled.

### Actions
1. Configure: direction, peripheral address (the data register, for example `&USART2->DR` or `->RDR`), memory address, item count (the count register counts data items of the configured width, not bytes), peripheral and memory data width, memory increment on, peripheral increment off, circular or normal mode, interrupts for transfer complete, half transfer (circular mode) and transfer error.
2. Clear all stale flags for that stream before enabling it. Enable the stream, then enable the peripheral's DMA request bit (for USART: `CR3` `DMAR` for RX, `DMAT` for TX).
3. Test with a known pattern: for TX, send bytes 0x00 to 0xFF and capture with a logic analyzer; for RX, send the pattern from a host adapter and dump the buffer in GDB (`x/256xb <buf>`).
4. After the test, read the DMA interrupt status register in GDB. Transfer error flag must be clear. For FIFO-based DMA, also read the FIFO error flag.

### Output
`dma_record`.

### Quality Gate
- All 256 pattern bytes match in order (capture or GDB dump attached).
- Transfer error flag reads 0 after the test (register value recorded).

---

## Worked Example

Illustrative. STM32F407 USART2 RX by DMA, circular, 64-byte buffer.

- Phase 1: reference manual "DMA1 request mapping" table: USART2_RX on DMA1 Stream 5, Channel 4. `nm` shows `rx_buf` at 0x20000400 (SRAM1, reachable by DMA1).
- Phase 2: Cortex-M4, no data cache.
- Phase 3: host sends 0x00..0xFF; with half/complete callbacks copying out, the collected 256 bytes match. `x/1xw &DMA1->HISR` shows TEIF5 = 0.

---

## Exit Criteria

DONE when the request mapping is cited, the buffer is reachable and cache-safe, the pattern test matches all bytes, and error flags are clear.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Buffer in a region DMA cannot reach | **Adjust**: move it with a linker section; recheck the address with `nm`. |
| Phase 2 | Received data stale or partly old on Cortex-M7 | **Adjust**: add invalidate after completion and enforce 32-byte alignment and size. |
| Phase 3 | Transfer error flag set | **Stop**: the address or width is wrong; recheck the peripheral data register address and data widths. |
| Phase 3 | Nothing transfers | **Adjust**: confirm the peripheral DMA request bit is set and the request value is correct. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
