# Bridge Tooling Low Rate Production

Build bridge tooling to carry low-rate production while the design settles or hard tooling is cut: aluminum molds, modular inserts, and low-cavitation tools.

## Inputs

- `tooling-strategy`: The decision to use bridge tooling and the rate and duration it must cover
- `prototype-parts-plan`: The process learnings from the soft-tool prototypes that inform the bridge tool

## Outputs

- `bridge-tool-design`: The bridge tool design (aluminum mold, modular insert set, low-cavity count) with its expected life, rate, and tolerance
- `low-rate-production-plan`: The plan to run low-rate production on the bridge tool while the design freezes or hard tooling is built

## Process

1. Build the bridge tool in aluminum or a pre-hardened steel for a useful but limited life. An aluminum injection mold can run thousands to tens of thousands of shots at a fraction of a hardened-steel tool's cost and lead time, which covers low-rate production and the hard-tool build period. Choose the material for the shot count the bridge phase actually needs.
2. Use modular inserts to absorb design changes cheaply. A master unit die (MUD) frame with replaceable cavity inserts lets a design change touch only the insert, not the whole tool. During a phase where the design is still moving, modularity is what makes the bridge tool affordable to update.
3. Run low cavitation to cut tool cost and schedule. A one- or two-cavity bridge tool costs far less and comes faster than a multi-cavity production tool; it meets low-rate demand and avoids spending multi-cavity money before the design is frozen. Size the cavity count to the low-rate demand, not the eventual high-rate demand.
4. Qualify parts off the bridge tool as representative of production. Bridge-tool parts are usually the first parts made by the production process at a representative rate; use them for first-article inspection and to start deliveries, while recording any differences from the hard-tool parts to come. Confirm the bridge tool holds the required tolerances across its planned run.
5. Set the handoff trigger to hard tooling. Define when the program steps from bridge to hard tooling: typically at design freeze and a demonstrated volume that justifies the hard-tool investment. Overlap the hard-tool build with bridge production so deliveries do not pause, and plan the cutover so the first hard-tool parts are qualified before the bridge tool retires.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
