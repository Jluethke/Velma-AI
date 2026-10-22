# Effectivity And Serialization

Define effectivity and serialization so each change applies to an exactly known set of units and each unit is individually traceable.

## Inputs

- `as-built-record`: The per-unit configuration and the units in and out of production
- `traceability-requirements`: The level of traceability the product requires: serial, lot, or batch, driven by safety, regulatory, or warranty needs

## Outputs

- `effectivity-scheme`: How effectivity is expressed and applied: by serial number, block, date, or lot, so each change has a precise cut-in point
- `serialization-plan`: The serialization and marking plan: which items are serialized, how they are marked, and how the as-built record links to each serial

## Process

1. Choose how effectivity is expressed to match the product. Effectivity can be by serial number (unit 101 and up), by block or lot, or by date; serial-number effectivity gives the most precise cut-in and is standard for complex, safety-relevant, or low-rate hardware, while lot or date effectivity suits high-rate commodity parts. Every change order states its effectivity in this scheme.
2. Make every change's cut-in point unambiguous. A change that is 'effective soon' creates built-wrong units in the gap; the effectivity names the exact first unit (or lot, or date) that gets the change and confirms the disposition of everything before it. Manufacturing builds to the effectivity, so it must be precise.
3. Decide which items are serialized and to what depth. Serialize items that need individual life tracking, failure traceability, or warranty and regulatory tracking (structural parts, life-limited parts, safety-critical assemblies); lot-trace fasteners and raw material; batch-track consumables. Over-serializing wastes effort, under-serializing loses the traceability a failure investigation needs.
4. Mark serials durably and link them to the as-built record. Apply the serial by a method that survives the part's service life (laser etch, data-matrix, stamped plate) and tie that serial to the unit's as-built configuration, so scanning or reading the serial retrieves exactly what that unit is and what changes apply to it. A serial that does not link to a record is just a number.
5. Maintain the where-used and effectivity links both ways. From a change, you must find every effective unit; from a unit's serial, you must find its full configuration and every change applied to it. Keep the forward (change-to-units) and reverse (unit-to-configuration) links current so recalls, retrofits, and investigations can resolve the exact affected population.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
