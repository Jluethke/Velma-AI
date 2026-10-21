# Dma Measurement Run

Run dynamic mechanical analysis to measure storage modulus, loss modulus, and tan delta as a function of temperature.

## Inputs

- `sample-prep-protocol`: Sample geometry and preparation
- `dsc-parameters`: Known transition temperatures to guide the DMA temperature range

## Outputs

- `dma-curves`: Storage modulus, loss modulus, and tan delta vs temperature
- `dma-parameters`: Glassy and rubbery modulus, Tg by tan delta peak, damping characteristics

## Process

1. Mount the specimen in the appropriate clamp geometry (single cantilever, dual cantilever, tension, three-point bend).
2. Set oscillation frequency, strain amplitude, and temperature ramp rate.
3. Run the temperature sweep and record storage modulus (E'), loss modulus (E''), and tan delta.
4. Identify the Tg as the tan delta peak and note any secondary relaxations.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
