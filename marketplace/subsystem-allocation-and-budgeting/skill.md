# Subsystem Allocation And Budgeting

Allocate system requirements to subsystems and create performance budgets that sum to the system-level requirement with margin.

## Inputs

- `system-requirements`: Verified system-level requirements
- `derived-requirements`: Requirements derived from design decisions

## Outputs

- `allocation-matrix`: Each system requirement mapped to the subsystem(s) responsible for meeting it, with allocated performance values
- `performance-budgets`: Quantitative budgets for error, power, weight, latency, and reliability allocated across subsystems such that the sum (RSS for uncorrelated, arithmetic for correlated) meets the system requirement with defined margin
- `interface-requirements`: Requirements on the interactions between subsystems, derived from the allocation: signal levels, data formats, timing, mechanical interfaces

## Process

1. Map each system requirement to the subsystem architecture. Some requirements allocate to a single subsystem (e.g., 'display brightness shall exceed 500 nits' goes to the display subsystem). Others span multiple subsystems and must be budgeted (e.g., system latency budget split across sensor, processor, and actuator subsystems).
2. Create performance budgets using the appropriate combination method. For independent error sources, use root-sum-square (RSS): if system accuracy is 1%, allocate subsystems 0.5%, 0.5%, 0.5%, 0.5% which RSS to 1.0%. For correlated sources (e.g., temperature drift in the same direction), use arithmetic sum. For power and weight, arithmetic sum is always correct.
3. Include margin in every budget. Margin policy depends on program phase: conceptual design holds 20-30% margin, preliminary design holds 10-20%, detailed design holds 5-10%. As the design matures and uncertainties resolve, margin is consumed by actual performance. Track margin remaining as a program health metric.
4. Derive interface requirements from the allocation. If subsystem A must pass sensor data to subsystem B within 10ms, the interface requirement specifies the communication protocol, data format, update rate, latency allocation for the link itself, and error handling for missed messages.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
