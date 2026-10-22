# Engineering Change Management

Run the change process: change request, classification, impact assessment, approval, and the change order that releases the new definition.

## Inputs

- `drawing-tree`: The released definition and the items a change would affect
- `change-need`: The reason for the change: a defect, an improvement, a cost reduction, or a requirement change

## Outputs

- `change-package`: The change request, its classification, the impact assessment across affected items, and the approved change order
- `disposition-plan`: The disposition of affected in-process and fielded units (use-as-is, rework, scrap, retrofit) and the effectivity point for the change

## Process

1. Start every change as a request that states the problem, not the solution. The change request (ECR) captures why a change is needed and what it must achieve; separating the request from the implementing order keeps a record of the problem and prevents a half-analyzed fix from being released. Route the request to a change board for a decision to pursue it.
2. Classify the change by its impact on form, fit, function, and interface. A major change (Class I) affects form, fit, function, interface, interchangeability, safety, or a controlled requirement and needs full review and often customer approval; a minor change (Class II) is a documentation or non-interchangeable-detail fix. The classification sets the approval level and the rigor.
3. Assess impact across everything the drawing tree connects. A change ripples to mating parts, interfaces, tooling, test procedures, spares, manuals, and qualification; use the drawing tree to find every affected item and assess each. The commonest change failure is updating the part but not the tooling, the test, or the mating part.
4. Release the change through a controlled change order (ECN/ECO). After approval, the change order formally supersedes the old revision with the new, records the approvals, and is the authority for everyone downstream to switch. The order names the effectivity point so manufacturing knows exactly which units get the change.
5. Disposition the units already in process and in the field. Decide for each affected population: use-as-is (the change is an improvement, old units are acceptable), rework, scrap, or retrofit. A safety change may force retrofit of fielded units; an improvement may apply only to new production. Record the disposition and the effectivity so the as-built record stays accurate.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
