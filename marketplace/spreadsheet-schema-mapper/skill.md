# Spreadsheet Schema Mapper

Map spreadsheet columns to database fields, noting data type differences and naming mismatches.

## Inputs

- `spreadsheet-structure`: Column names, data types, and sample values from the spreadsheet
- `database-schema`: Table and field definitions from the target database

## Outputs

- `field-mapping`: Column-to-field mapping with data type conversions noted
- `mapping-exceptions`: Columns or fields that do not have a clear match

## Process

1. List every spreadsheet column with its inferred data type and a sample value.
2. List every database field with its defined type and constraints.
3. Match columns to fields by name similarity and data type compatibility.
4. Flag any column or field without a match as an exception to resolve.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
