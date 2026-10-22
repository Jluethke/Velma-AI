# Soft Tooling For Prototypes

Build soft tooling for prototype and very low volumes: 3D-printed tools, cast urethane, and machined aluminum, accepting short life for speed and low cost.

## Inputs

- `tooling-strategy`: The decision to use soft tooling and the volume and tolerance it must support
- `part-characteristics`: The part geometry, material, and process the soft tool must produce

## Outputs

- `soft-tool-design`: The soft tool design and method (printed mold, silicone/urethane cast, machined aluminum) with expected life and tolerance
- `prototype-parts-plan`: The plan to produce the prototype quantity on the soft tool, including cycle, release, and tool-wear expectations

## Process

1. Pick the soft-tooling method by part material and quantity. Silicone/urethane vacuum casting makes tens of urethane or epoxy parts from a master in days; 3D-printed molds and fixtures suit short runs and low-pressure or low-temperature processes; machined aluminum molds and dies give better tolerance and finish and a few hundred to a few thousand parts for moderate cost.
2. Design to the soft tool's weaknesses. Printed and cast tools soften at temperature and wear quickly under pressure and abrasion; add generous draft, avoid sharp edges that chip, and expect to touch up or replace the tool during the run. Plan features that let you repair the tool rather than scrap it.
3. Set realistic life and tolerance expectations and track them. A printed injection-mold insert may give tens to low hundreds of shots before it degrades; a cast silicone mold a handful to tens of pulls; a machined aluminum mold thousands. Monitor part dimensions across the run because a soft tool drifts as it wears.
4. Use the soft tool to validate the part and the process cheaply. The point of soft tooling is to get real parts in hand to test fit, function, and the molding or forming process before committing bridge or hard tooling. Capture the process learnings (gate location, cycle, release, warp) that will carry into the next tool.
5. Plan tool replacement into the schedule. Because soft tools have short life, plan to make more than one if the prototype quantity exceeds a single tool's life, and sequence tool builds so a worn tool does not stop the program. Treat the soft tool as consumable, not an asset to preserve.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
