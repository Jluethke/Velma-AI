# Dsp Resource Optimization

Optimize the DSP implementation for FPGA resource usage: map operations to DSP primitives, share multipliers across time slots, and use distributed arithmetic for coefficient-fixed filters.

## Inputs

- `pipeline-architecture`: Pipeline block diagram with stage boundaries
- `throughput-analysis`: Required throughput and achievable clock rate

## Outputs

- `optimized-rtl`: Resource-optimized RTL with DSP primitive instantiations, multiplier sharing, and memory usage annotations
- `resource-report`: DSP block count, BRAM count, LUT count, and register count with comparison to the target device's available resources

## Process

1. Map multiplications to DSP primitives. Each DSP48E2 (Xilinx UltraScale+) provides a 27x18 multiply with 48-bit accumulator. If the operand widths exceed the primitive width, decompose into partial products: (A_hi * 2^18 + A_lo) * B = A_hi*B*2^18 + A_lo*B, using two DSP blocks and a shifted addition.
2. Use the DSP block's pre-adder for symmetric FIR filters. A symmetric FIR has coefficients h[k] = h[N-1-k]. The pre-adder computes x[n-k] + x[n-N+1+k] before multiplication, cutting the multiplier count in half. Enable the pre-adder in the DSP primitive configuration.
3. Share multipliers when throughput allows. If the pipeline runs at 500 MHz but the sample rate is 100 MSps, each multiplier can be time-shared across 5 operations. Implement a multiplexer on the multiplier inputs and a demuxer on the output, controlled by a phase counter synchronized to the sample clock.
4. For coefficient-fixed filters: consider distributed arithmetic. Instead of multiplying each sample by a coefficient, decompose the sample bit-by-bit and use lookup tables (LUTs) addressed by the sample bits. The LUT outputs are pre-computed partial sums of the coefficients. This replaces multipliers with BRAM or distributed ROM.
5. Use BRAM for delay lines longer than ~32 samples. A shift register implemented in flip-flops consumes one register per bit per tap. BRAM provides 1024+ locations in one block. Write the incoming sample and read the delayed sample from BRAM in the same clock cycle using a simple dual-port configuration.
6. Estimate total resources and compare against the target device. If the design exceeds available DSP blocks, reduce parallelism (more time-multiplexing) or switch to a larger device. If it exceeds BRAM, convert short delay lines back to SRL (shift register LUT) primitives.
7. Verify that resource optimization does not change the numerical result. Run the optimized implementation against the bit-accurate reference model and confirm zero output difference.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
