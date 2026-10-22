# Tooling Strategy By Production Rate

Decide the tooling level from the production rate, timeline, and design maturity: soft for prototypes, bridge for low-rate, hard for high-rate.

## Inputs

- `production-plan`: The quantity, rate, and timeline the tooling must support, and how firm the design is
- `part-characteristics`: The part material, process (molding, casting, forming, composite), geometry, and tolerance needs

## Outputs

- `tooling-strategy`: The selected tooling level (soft, bridge, hard) with the volume, timeline, and maturity reasoning
- `tooling-roadmap`: The planned progression of tools across the program, including when to step up from one level to the next

## Process

1. Decide the tooling level primarily from volume and design maturity. Soft tooling suits tens to a few hundred parts and an evolving design; bridge tooling suits hundreds to low thousands while hard tooling is being cut or the design settles; hard tooling suits tens of thousands and up on a frozen design. Committing hard tooling to an unfrozen design is the classic expensive mistake.
2. Weigh lead time against unit cost. Soft tools are available in days to a couple of weeks at low cost but high per-part cost and short life; hard steel tools take many weeks to months and large non-recurring cost but give the lowest per-part cost and the longest life. Pick the level whose total cost over the actual volume is lowest, including the cost of waiting.
3. Plan a tooling progression, not a single tool. Many programs run soft tooling for the first prototypes, bridge tooling to start deliveries and burn down design risk, and hard tooling once the design and rate justify it. The roadmap names the trigger (design freeze, volume threshold) for each step so the program does not jump to hard tooling prematurely or cling to soft tooling too long.
4. Match the tool to the process and the part life expected on it. Injection molding, die casting, sheet-metal forming, and composite layup each have their own soft/bridge/hard spectrum and their own tool-life expectations (an aluminum injection mold may last thousands of shots, a hardened steel mold millions). Set the expected tool life against the volume the tool must cover.
5. Hold tolerance and surface requirements against the tooling level. Soft tools wear and relax tolerances over their short life; hard tools hold tight tolerances and fine finishes over long runs. If the part needs tight tolerances from part one, a soft tool may not be acceptable even at low volume, which forces an earlier bridge or hard tool.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
