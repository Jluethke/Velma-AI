# Drawing And Document Control

Establish drawing and document control: the drawing tree, release states, revision scheme, and the single controlled source of released definition.

## Inputs

- `product-definition`: The drawings, models, specifications, and documents that define the product
- `release-process`: The review, approval, and release workflow the organization uses for controlled documents

## Outputs

- `drawing-tree`: The structured drawing tree and document index, from top assembly down to piece parts, with each item's current released revision
- `control-scheme`: The release-state and revision scheme: how documents move from draft to released, how revisions are identified, and where the controlled master lives

## Process

1. Build the drawing tree from the top assembly down to piece parts and specifications. The tree is the backbone of configuration management: it shows every item that makes up the product, its part number, and its current released revision, and it is how a change is traced to everything it affects. Keep one authoritative tree, not scattered lists.
2. Define the release states and the gate between them. A document is draft (in work, freely editable), in review (frozen for approval), or released (controlled, changeable only by a formal change). The gate from review to released is where the approvals are captured; a 'released' document that someone can edit directly is not under control.
3. Set an unambiguous part-number and revision scheme. Decide whether form-fit-function changes get a new part number versus a revision, and whether revisions are letters or numbers; a revision changes the definition of the same part number while a new part number means a part not interchangeable with the old. Interchangeability is the rule that decides which applies.
4. Keep a single controlled master and prevent uncontrolled copies. The released definition lives in one controlled repository (a product data management system), and working copies are clearly marked uncontrolled. The most common configuration failure is someone building to an out-of-date printout; control is only real if people cannot easily use the wrong revision.
5. Make the current released revision of every item visible to everyone who needs it. Engineering, manufacturing, procurement, and quality must all see the same current revision; a change is only effective when everyone downstream is working to it. Define how the released state and current revision are published and how obsolete revisions are withdrawn.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
