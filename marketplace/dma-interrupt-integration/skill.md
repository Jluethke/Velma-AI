# Dma Interrupt Integration

Integrate DMA with the interrupt architecture to offload data transfer from the CPU, reduce ISR frequency, and improve determinism.

## Inputs

- `isr-implementations`: Current ISR designs identifying data transfer bottlenecks
- `shared-resource-protocol`: Rules for safe data access

## Outputs

- `dma-configuration`: DMA channel assignments, transfer sizes, circular vs normal mode, and half/full transfer interrupt usage
- `revised-interrupt-load`: Updated interrupt frequency and CPU utilization after DMA offloading

## Process

1. Identify interrupt sources where the ISR primarily moves data: UART RX/TX byte-by-byte, SPI frame transfers, ADC multi-channel scans, memory-to-memory copies. These are candidates for DMA.
2. Assign DMA channels. On STM32, DMA request mapping is fixed per channel/stream. Check the reference manual for which peripheral maps to which DMA channel. Conflicts require arbitration or using a different DMA controller.
3. Configure DMA transfer mode: peripheral-to-memory for RX, memory-to-peripheral for TX. Set data width to match the peripheral register size. Enable circular mode for continuous ADC scanning. Use normal mode for finite-length transfers (SPI block reads).
4. Use half-transfer and transfer-complete interrupts for double-buffering (ping-pong). The CPU processes the first half while DMA fills the second half, and vice versa. This eliminates the latency of waiting for the full buffer.
5. Calculate the new interrupt rate: with DMA handling a 115200 baud UART, interrupts drop from 11,520/sec (one per byte) to roughly 23/sec (one per 512-byte DMA buffer). This frees significant CPU time.
6. Handle DMA error interrupts: transfer error, FIFO overrun. These indicate system problems (bus contention, misconfigured addresses). Log the error, reset the DMA channel, and resume or escalate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
