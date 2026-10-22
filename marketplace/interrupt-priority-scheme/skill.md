# Interrupt Priority Scheme

Assign interrupt priority levels using the ARM NVIC model (or equivalent), configure priority grouping, and verify that nesting behavior meets latency requirements.

## Inputs

- `interrupt-inventory`: All interrupt sources with latency requirements
- `latency-budget`: Latency budgets per interrupt

## Outputs

- `priority-assignment`: Each interrupt with assigned preemption priority and sub-priority, plus the NVIC priority grouping configuration
- `nesting-analysis`: Worst-case nesting depth and the resulting stack usage on the main stack pointer (MSP)

## Process

1. Configure NVIC priority grouping. ARM Cortex-M splits the priority field into preemption priority (group) and sub-priority. More preemption bits allow more nesting levels but fewer sub-priorities. Common choice: 4 bits preemption, 0 bits sub-priority (NVIC_PriorityGroup_4) for maximum nesting control.
2. Assign preemption priorities: lowest number = highest urgency. Safety-critical interrupts (fault handlers, watchdog) get the highest priority. Time-critical peripheral interrupts (motor control PWM, communication frame sync) get the next tier. Bulk data transfer complete interrupts get lower priority.
3. Reserve priority level 0 for fault handlers that must never be blocked. The RTOS SysTick and PendSV typically get the lowest priority levels so they never delay peripheral ISRs.
4. Calculate worst-case nesting depth: count the maximum number of priority levels where an interrupt at each level could preempt the previous. Each nesting level adds one context frame to the MSP stack (32 bytes on Cortex-M baseline, more with FPU context).
5. Verify that no interrupt with a tight latency budget can be preempted by a longer-running higher-priority ISR. If so, swap priorities or split the long ISR into a short top-half and a deferred bottom-half.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
