# Stackup Review And Fabricator Negotiation

Review the stackup with the fabricator, negotiate achievable specifications, and finalize the stackup for production.

## Inputs

- `fabricator-specification`: Initial specification document
- `manufacturing-tolerance-budget`: Required tolerances
- `impedance-sensitivity-to-manufacturing-tolerances`: Sensitivity data for trade-off discussions

## Outputs

- `fabricator-feedback`: Fabricator's response: what they can hold, what they cannot, proposed alternatives
- `final-stackup`: Agreed stackup with fabricator-confirmed dielectric heights, materials, impedance targets, and tolerances
- `stackup-drawing`: Engineering drawing of the stackup cross-section suitable for inclusion in the fabrication package

## Process

1. Send the stackup specification to the fabricator and request a DFM review. Ask specifically: can you hold the dielectric height tolerance on layers X and Y? What is your standard etch tolerance for this trace width? What glass/resin combinations do you stock for this Dk requirement?
2. Negotiate: if the fabricator cannot hold the requested tolerance (e.g., +/- 5% dielectric height is a premium option), use the sensitivity analysis to determine if relaxing to +/- 10% still keeps impedance within spec. Adjust trace width to compensate if needed. The goal is a design that the fabricator can build reliably without premium charges.
3. Finalize: document the agreed stackup in a drawing that shows every layer, its material, thickness (finished), copper weight (starting), impedance targets, and coupon specifications. Both the designer and fabricator should sign off on this document before Gerber release.
4. Include the note: the stackup drawing is a controlled document. Any change by the fabricator (material substitution, thickness adjustment, process change) requires notification and re-approval. Without this note, fabricators may substitute 'equivalent' materials that have different Dk or Df.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
