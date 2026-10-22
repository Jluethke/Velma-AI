# Signal Quality Check

Check that the faster signal still tells you what actually worked. A loop can be tightened so far that the signal becomes noise, and reacting to noise creates more mistakes than slow feedback ever did.

## Inputs

- `redesigned-loop`: The tightened loop
- `batching-removed`: What was made continuous

## Outputs

- `signal-validity`: Whether the faster signal still reflects the real result
- `false-signal-risks`: Where the faster signal could mislead

## Process

1. Confirm the faster signal measures the real result and not just an early proxy for it.
2. Check that the signal is stable enough to act on and not dominated by noise.
3. Identify where a continuous signal could trigger overreaction to normal variation.
4. Add a smoothing or confirmation step where the faster signal would otherwise mislead.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
