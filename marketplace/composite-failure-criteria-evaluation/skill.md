# Composite Failure Criteria Evaluation

Evaluate the laminate with multiple failure criteria, apply environmental and damage-tolerance knockdowns, and report the margin and governing ply and mode.

## Inputs

- `stacking-sequence`: The ordered ply stack and the ply-level strains under the design loads
- `ply-allowables`: Ply strength values (Xt, Xc, Yt, Yc, S) at the design environment, on the correct statistical basis (A-basis or B-basis)

## Outputs

- `margin-report`: Margin of safety per ply per criterion, naming the critical ply, the governing failure mode, and the first-ply-failure load
- `applied-knockdowns`: The environmental, damage-tolerance, and variability knockdowns applied and the resulting design strain limits

## Process

1. Run at least two independent criteria. Apply Tsai-Wu as the interactive quadratic check, cross-check with maximum strain (which catches simple fiber-direction failure Tsai-Wu can mask), and use Hashin when you need to separate fiber failure from matrix failure for progressive-damage or fatigue reasoning. Report the lowest margin across criteria.
2. Distinguish first-ply-failure from last-ply-failure. First-ply-failure (usually matrix cracking in an off-axis ply) is the conservative static basis for most primary structure; last-ply-failure with progressive-damage ply discounting is used only where the certification approach allows it. State which basis the margin is reported on.
3. Apply the environmental knockdown from qualification data, not a generic factor. Hot-wet compression strength of carbon/epoxy is commonly 60 to 80% of room-temperature-dry; pull the specific retention from the material qualification database for the design temperature and moisture condition.
4. Apply the damage-tolerance knockdown. For primary aerospace structure, design strain is typically capped near 4000 to 5000 microstrain in compression after barely visible impact damage (BVID), driven by open-hole compression and compression-after-impact testing rather than pristine-coupon strength. This usually governs the laminate thickness.
5. Compute margin of safety as (allowable divided by applied) minus 1 for every ply, criterion, and load case, and report the minimum. If any margin is negative, return to the stacking step to add plies or re-split orientations; if margins are large everywhere, consider removing plies to save weight.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
