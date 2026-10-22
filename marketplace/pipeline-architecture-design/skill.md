# Pipeline Architecture Design

Design the pipeline structure to meet the throughput target, balancing pipeline depth against latency and resource usage.

## Inputs

- `word-length-assignment`: Bit widths for all signals in the processing chain
- `quantization-noise-budget`: Noise allocation across the pipeline

## Outputs

- `pipeline-architecture`: Block diagram showing every pipeline stage, register boundaries, multiplier and adder placement, and data flow with latency annotation
- `throughput-analysis`: Achievable clock frequency from the deepest combinational path in any stage, and the resulting sample throughput

## Process

1. Identify the throughput target. If the DSP must process one sample per clock cycle (fully pipelined), every stage must complete within one clock period. If the DSP can process one sample every N cycles (underclocked or time-multiplexed), the pipeline can be shallower.
2. Map the algorithm to pipeline stages. Each stage must have a combinational delay less than the clock period minus setup time and clock uncertainty. For FPGA: a DSP48 multiply-accumulate runs at the fabric speed grade's maximum (typically 400-700 MHz). A LUT-based adder chain longer than ~4 levels may limit the frequency.
3. Use the FPGA's DSP primitive pipeline registers. The DSP48 (Xilinx) or DSP block (Intel) has internal pipeline registers at the input (A, B, C), multiplier output (M), and accumulator output (P). Enable all pipeline registers to achieve maximum clock frequency. This adds latency (typically 3-4 cycles through the DSP block) but does not affect throughput.
4. For filter implementations: choose between direct form (multiply and accumulate sequentially; uses one multiplier time-shared over N taps; low resource, low throughput) and transpose form (all multiplications in parallel, accumulated through a pipelined adder tree; N multipliers; high throughput). Systolic architecture places a register between each tap, enabling very high clock rates at the cost of latency.
5. Insert pipeline registers between functional blocks: after the input interface, between filter stages, before the output interface. Each register adds one cycle of latency but breaks timing-critical paths. Mark the total pipeline latency (input to output in clock cycles) in the architecture document.
6. For multi-channel DSP: time-multiplex the pipeline across channels. If the pipeline can run at F MHz and the sample rate is Fs, one pipeline can process F/Fs channels. Implement a channel counter that rotates the input data and routes the output to the correct channel.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
