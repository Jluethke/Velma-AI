# Maintenance Task Selection

Apply the RCM decision logic to each failure mode to select the maintenance task that manages the failure consequence at the lowest total cost.

## Inputs

- `failure-mode-catalog`: Failure modes with effects and consequences
- `failure-distribution-data`: Failure rate or Weibull data

## Outputs

- `maintenance-task-assignments`: For each failure mode: the selected maintenance task (condition monitoring, scheduled restoration, scheduled discard, failure finding, run to failure, or redesign) with the task interval and justification
- `maintenance-schedule`: Consolidated maintenance schedule showing all tasks organized by interval (daily, weekly, monthly, annually, at overhaul)

## Process

1. Apply the RCM decision logic tree to each failure mode. First question: is the failure evident to the operator during normal duties? If no, it is a hidden failure and requires a failure-finding task regardless of consequence. Hidden failures in safety systems (backup power, redundant channels) are the highest priority for scheduled checks.
2. For evident failures, select the task based on consequence and failure pattern:
- Condition-based maintenance (CBM): monitor a parameter that indicates deterioration before functional failure. Effective for wear-out patterns (Weibull beta > 1). Examples: capacitor ESR measurement detects aging before failure, thermal imaging detects hot spots from degraded connections, vibration monitoring detects bearing wear. The P-F interval (time between detectable degradation and functional failure) must be long enough for corrective action.
- Scheduled restoration: restore the item to original condition at a fixed interval. Effective only if the failure mode has a well-defined wear-out age. Rebuilding a fan motor every 5 years is effective if bearings consistently wear out between 6-8 years. Not effective for electronic components with constant failure rates.
- Scheduled discard: replace the item at a fixed interval regardless of condition. The interval must be at the beginning of the wear-out region (Weibull beta > 1, interval set where the reliability curve begins to decline). Effective for items with low replacement cost relative to failure consequence.
- Run to failure: no preventive action; repair when it fails. Default for failures with low consequence and no detectable degradation pattern.
3. Calculate failure-finding task intervals for hidden failures. The interval must produce the required availability of the hidden function. If the safety system must be available 99% of the time: T_interval = 2 * (1 - A_required) * MTBF. For MTBF = 50,000 hours and 99% availability: T = 2 * 0.01 * 50000 = 1000 hours (approximately 42 days).
4. For failure modes where no maintenance task is both applicable and effective, and the consequence is safety-related, the answer is mandatory redesign. Redesign the system to eliminate the failure mode or make it evident. This is the only RCM answer that requires hardware changes rather than maintenance changes.
5. Consolidate all task assignments into a maintenance schedule. Group tasks by interval for efficient execution: combine all weekly checks into one procedure, all monthly checks into another. Align intervals with operational windows (maintenance during planned downtime). Calculate the annual maintenance cost and compare to the current maintenance program cost and the cost of unplanned failures.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
