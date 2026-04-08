# Data Dictionary Builder

**One-line description:** Automatically generate a comprehensive data dictionary from a database schema, including column descriptions, data types, relationships, sample values, and business context.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `database_connection`: object (required)
  - `host`: string -- Database server hostname or IP
  - `port`: number -- Database server port
  - `database_name`: string -- Target database name
  - `username`: string -- Authentication username
  - `password`: string -- Authentication password (recommend using environment variable or secure vault, not plain text)
  - `connection_type`: string -- Database type (postgresql, mysql, mssql, oracle, snowflake)

- `schema_filter`: string (optional) -- Specific schema to document (default: all accessible schemas)

- `table_filter`: string[] (optional) -- Specific tables to include (default: all tables)

- `sampling_config`: object (optional)
  - `enabled`: boolean -- Whether to query sample values (default: true)
  - `sample_size`: number -- Number of sample rows per column (default: 5)
  - `max_table_rows`: number -- Skip sampling for tables larger than this (default: 1000000)
  - `mask_pii`: boolean -- Detect and mask sensitive data in samples (default: true)

- `business_context_source`: string (optional) -- Path to external documentation or comments file (default: extract from schema comments only)

- `output_format`: string (optional) -- Output format: markdown, json, csv (default: markdown)

---

## Outputs

- `data_dictionary`: object
  - `metadata`: object
    - `generated_at`: string (ISO 8601 timestamp)
    - `database_name`: string
    - `schema_name`: string
    - `total_tables`: number
    - `total_columns`: number
  - `tables`: object[] -- Array of table definitions
    - `table_name`: string
    - `table_type`: string (TABLE, VIEW, MATERIALIZED_VIEW)
    - `row_count`: number (approximate)
    - `description`: string (business purpose)
    - `columns`: object[] -- Array of column definitions
      - `column_name`: string
      - `data_type`: string
      - `nullable`: boolean
      - `default_value`: string or null
      - `primary_key`: boolean
      - `foreign_key`: object or null
        - `target_table`: string
        - `target_column`: string
      - `unique_constraint`: boolean
      - `description`: string (business meaning)
      - `valid_values`: string[] (enumerated values if applicable)
      - `sample_values`: string[] (representative data samples, PII masked if enabled)
      - `data_quality_notes`: string (patterns, nulls, ranges observed)
      - `pii_detected`: boolean (true if column contains sensitive data)
  - `relationships`: object[] -- Table-to-table relationships
    - `source_table`: string
    - `source_column`: string
    - `target_table`: string
    - `target_column`: string
    - `cardinality`: string (1:1, 1:N, N:M)
    - `relationship_type`: string (FOREIGN_KEY, IMPLICIT)
  - `validation_report`: object
    - `missing_descriptions`: string[] -- Columns without business context
    - `orphaned_columns`: string[] -- Columns with foreign keys to non-existent tables
    - `naming_inconsistencies`: string[] -- Columns with unusual naming patterns
    - `pii_columns`: string[] -- Columns flagged as containing sensitive data
    - `warnings`: string[] -- Data quality or schema issues detected

- `output_file`: string (optional) -- Path to generated data dictionary file (if file output requested)

---

## Execution Phases

### Phase 1: Connect and Retrieve Schema

**Entry Criteria:**
- Database connection parameters are provided and valid
- Connection type matches the target database system
- Credentials are available (from environment variables or secure vault preferred)

**Actions:**
1. Establish connection to database using provided credentials
2. Verify connection is authenticated and authorized
3. Query system catalogs to retrieve schema metadata (tables, columns, types, constraints)
4. Extract primary keys, foreign keys, unique constraints, and indexes
5. Retrieve table and column comments from schema if available
6. Verify at least one table is accessible in the target schema

**Output:**
- Raw schema metadata object with complete table and column definitions
- Connection status confirmation

**Quality Gate:**
- Connection succeeds without authentication errors, verified by successful query execution
- At least one table is accessible and returned in metadata
- Schema metadata includes column names, data types, and nullability for all columns

---

### Phase 2: Extract and Structure Column Metadata

**Entry Criteria:**
- Schema metadata successfully retrieved
- At least one table is available

**Actions:**
1. Iterate through each table in the schema
2. For each column, extract: name, data type, nullable flag, default value
3. Identify and flag primary key columns by checking primary key constraints
4. Identify and flag foreign key relationships with target table and column
5. Identify and flag unique constraints by checking unique constraint definitions
6. Normalize data type names to standard SQL types using mapping table (VARCHAR→STRING, INT→INTEGER, etc.)
7. Extract existing column comments from schema metadata
8. Validate that all extracted values are non-null; use explicit defaults (empty string, false, null) for missing values

**Output:**
- Structured column metadata array with all attributes defined
- Primary key and constraint mappings

**Quality Gate:**
- Every column has a name and data type, verified by checking that name and data_type fields are populated
- Nullable and default values are explicitly set for every column (no undefined fields)
- Foreign key references are validated against existing tables; orphaned references are flagged

---

### Phase 3: Identify Table Relationships

**Entry Criteria:**
- Column metadata is complete
- Foreign key information is extracted

**Actions:**
1. Build relationship graph from foreign key constraints
2. For each foreign key, determine cardinality by analyzing source and target table structure:
   - 1:1 if target column has unique constraint
   - 1:N if source column is foreign key to target primary key
   - N:M if relationship is through a junction table (table with only foreign keys)
3. Identify implicit relationships using naming convention matching: if column name matches pattern {table_name}_id or {table_name}_key, suggest relationship to that table
4. Detect circular dependencies by performing depth-first search on relationship graph; flag if cycle detected
5. Document relationship type as FOREIGN_KEY (constraint-based) or IMPLICIT (name-based)
6. Validate that all referenced tables exist in schema; flag non-existent targets

**Output:**
- Relationships array with source, target, cardinality, and type
- Warnings for orphaned or invalid references

**Quality Gate:**
- All foreign key targets exist in the schema, verified by cross-referencing against table list
- Cardinality is correctly identified for each relationship, verified by checking constraint definitions
- No unresolved circular dependencies; circular relationships are documented with bootstrap table identified

---

### Phase 4: Query Sample Data

**Entry Criteria:**
- Column metadata is complete
- Sampling is enabled in configuration
- Database connection is active

**Actions:**
1. For each table, execute COUNT(*) query to determine row count
2. If row count exceeds max_table_rows threshold, skip sampling for that table and mark as "sampling skipped - table too large"
3. For tables within threshold, execute SELECT query with LIMIT and random sampling (e.g., ORDER BY RANDOM() LIMIT sample_size)
4. Extract 3-5 representative values per column, including NULL if column allows nulls
5. Identify data patterns: numeric ranges (min/max), string formats (length, character sets), null percentages
6. Detect enumerated values by counting distinct values; if distinct count < 20, list all values
7. Note any data quality issues: unexpected nulls (>50% null), outliers (values outside expected range), formatting inconsistencies
8. If mask_pii is enabled, scan sample values against PII patterns (email: ^[^@]+@[^@]+\.[^@]+$, phone: ^\d{3}-\d{3}-\d{4}$, SSN: ^\d{3}-\d{2}-\d{4}$, credit card: ^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$); mask matching values as [MASKED] and flag column as pii_detected=true

**Output:**
- Sample values array per column (masked if PII detected)
- Data quality notes and patterns
- Enumerated value lists where applicable
- PII detection flags

**Quality Gate:**
- Sample queries complete without timeout (max 30 seconds per table), verified by query execution time
- At least one sample value is retrieved per column or explicitly marked as "no data available" if column is empty
- Data patterns are documented with specific observations (e.g., "numeric range 0-100", "date format YYYY-MM-DD")

---

### Phase 5: Gather Business Context

**Entry Criteria:**
- Column metadata is complete
- Optional business context source is available

**Actions:**
1. Extract existing descriptions from schema comments using database-specific comment retrieval (e.g., pg_description for PostgreSQL)
2. If business_context_source is provided, parse external documentation file (JSON, CSV, or markdown format)
3. Match external descriptions to columns using two-pass approach:
   - Pass 1: Exact match on column name
   - Pass 2: Fuzzy match using Levenshtein distance with threshold of 0.8 (80% similarity)
4. For each column, compile: business purpose, valid values, business rules
5. Identify columns missing descriptions; flag for manual review
6. Extract domain-specific knowledge by analyzing column names and data patterns:
   - Date columns: document expected format and timezone
   - Numeric columns: document units (currency, percentage, count) and precision
   - Enumerated columns: list all valid values and their business meanings
   - Status/flag columns: document state transitions and valid combinations
7. Document any business rules found in comments (e.g., "must be > 0", "unique within customer")

**Output:**
- Business descriptions for each column
- Valid values and business rules
- List of columns requiring manual documentation

**Quality Gate:**
- Every column has at least a placeholder description ("[No description available]" if missing), verified by checking description field is non-empty
- Valid values are documented for enumerated columns (distinct count < 20)
- Missing descriptions are explicitly flagged in validation report with column name and table name

---

### Phase 6: Compile Data Dictionary

**Entry Criteria:**
- All previous phases are complete
- Column metadata, relationships, samples, and business context are available

**Actions:**
1. Organize output by table, sorted alphabetically
2. For each table, compile: name, type, row count, description, columns array
3. For each column, assemble: name, type, nullable, default, constraints, description, samples, data quality notes, pii_detected flag
4. Compile relationships array, sorted by source table then source column
5. Add metadata header: timestamp (ISO 8601), database name, schema name, total table count, total column count
6. Format output according to requested format:
   - **markdown**: Table-by-table with markdown tables for columns and relationships
   - **json**: Complete data_dictionary object as JSON
   - **csv**: Three CSV files (tables.csv, columns.csv, relationships.csv)
7. If output_format is unsupported, abort with error listing supported formats
8. If file output requested, write to specified path; verify write succeeds

**Output:**
- Structured data_dictionary object
- Formatted output file (if applicable)

**Quality Gate:**
- All tables and columns from schema are represented in output, verified by comparing counts to Phase 1 metadata
- Output is valid JSON (if json format) or valid markdown (if markdown format), verified by parsing
- File is written successfully with correct permissions (if applicable), verified by file existence and size check

---

### Phase 7: Validate and Report

**Entry Criteria:**
- Data dictionary is compiled

**Actions:**
1. Check for missing descriptions: identify columns where description is empty or "[No description available]"; list by table.column
2. Check for orphaned columns: identify foreign keys where target table does not exist in schema; list with target table name
3. Check naming consistency: identify columns with unusual patterns (e.g., single-letter names, inconsistent case, special characters); flag for review
4. Detect data quality issues: identify columns with high null percentages (>50%), unexpected data types, or formatting inconsistencies noted in Phase 4
5. Validate relationships: ensure all foreign keys are documented in relationships array; flag any missing
6. Check for PII exposure: identify columns flagged as pii_detected=true; recommend masking in shared dictionaries
7. Generate validation report with sections: missing_descriptions, orphaned_columns, naming_inconsistencies, pii_columns, warnings
8. Append validation report to data dictionary output

**Output:**
- Validation report object with missing items, inconsistencies, warnings
- Updated data dictionary with validation results

**Quality Gate:**
- Validation report is complete with all checks performed, verified by checking all report sections are populated
- All warnings are specific and reference column/table names (e.g., "Column 'user_id' in table 'orders' has 75% null values"), verified by checking each warning contains table and column names
- No critical issues block dictionary use; critical issues (e.g., connection failure) are handled in error handling phase

---

## Exit Criteria

The skill is DONE when:
1. Data dictionary object is fully populated with all tables, columns, and relationships from the schema
2. Every column has a data type, nullability flag, and business description (or explicit "[No description available]" placeholder)
3. All foreign key relationships are documented in relationships array with cardinality (1:1, 1:N, N:M) identified
4. Sample values are retrieved for at least 80% of columns (or marked as "sampling skipped" or "no data available" for remaining)
5. Validation report is generated and identifies any missing descriptions, orphaned columns, naming inconsistencies, and PII-flagged columns
6. Output is formatted and written to requested format (markdown/json/csv) without errors
7. A user unfamiliar with the database schema could understand each field's purpose, valid values, and content from the dictionary
8. All PII-containing columns are flagged and masked in sample values (if mask_pii enabled)

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Database connection fails (authentication, host unreachable) | **Abort** -- Return error message with connection details (host, port, database name). Suggest verifying credentials are correct, host is reachable, and using secure vault instead of plain text passwords. |
| Phase 1 | No tables found in schema | **Abort** -- Return error indicating empty or inaccessible schema. Suggest checking schema_filter parameter matches actual schema name and user has SELECT permissions. |
| Phase 2 | Foreign key references non-existent table | **Adjust** -- Flag as orphaned relationship in validation report. Document in warnings. Continue processing remaining columns. |
| Phase 3 | Circular dependency detected (A→B→C→A) | **Adjust** -- Document circular relationship in relationships array. Identify bootstrap table (entry point). Continue processing. |
| Phase 4 | Sampling query times out on large table (>30 seconds) | **Adjust** -- Skip sampling for that table. Mark as "sampling skipped - query timeout" in data_quality_notes. Continue with next table. |
| Phase 4 | Column contains binary or unsupported data type (BLOB, BYTEA) | **Adjust** -- Skip sampling. Document data type as unsupported in data_quality_notes. Set sample_values to empty array. Continue. |
| Phase 4 | PII detection regex matches non-sensitive data (false positive) | **Adjust** -- Log match but allow user to override in business_context_source. Mark pii_detected=true but include note "[VERIFY: possible false positive]". |
| Phase 5 | External business context file is malformed (invalid JSON/CSV) | **Adjust** -- Log parsing error with line number. Continue with schema comments only. Flag all columns as needing manual review in validation report. |
| Phase 5 | Fuzzy matching produces ambiguous results (multiple >80% matches) | **Adjust** -- Use highest-confidence match. Log ambiguity in warnings. Flag column for manual review. |
| Phase 6 | Output format is unsupported | **Abort** -- Return error listing supported formats: markdown, json, csv. |
| Phase 6 | File write fails (permissions, disk full) | **Abort** -- Return error with file path and system error message. Suggest checking directory permissions and available disk space. |
| Phase 7 | Validation detects critical schema issues (circular dependencies, orphaned FKs) | **Adjust** -- Document in validation report with severity level (CRITICAL, WARNING, INFO). Flag for manual review. Continue processing. |

---

## Reference Section

### Domain Knowledge: Data Dictionary Best Practices

**Column Description Guidelines:**
- Business purpose: What does this field represent in the business domain?
- Valid values: What values can this column contain? (ranges, enumerations, formats)
- Business rules: Any constraints or calculations applied to this field?
- Related fields: Does this column relate to other columns in the table or other tables?

**Relationship Cardinality:**
- **1:1** -- Each row in source table relates to exactly one row in target table (verified by unique constraint on target column)
- **1:N** -- Each row in source table can relate to multiple rows in target table (source column is foreign key to target primary key)
- **N:M** -- Many-to-many relationship, typically through a junction table (table with only foreign keys and no other data columns)

**Data Type Normalization:**
Map database-specific types to standard SQL types:
- VARCHAR/CHAR/TEXT → STRING
- INT/BIGINT/SMALLINT → INTEGER
- DECIMAL/NUMERIC/FLOAT → DECIMAL
- DATE/DATETIME/TIMESTAMP → DATETIME
- BOOLEAN/BIT → BOOLEAN
- JSON/JSONB → JSON
- BLOB/BYTEA/VARBINARY → BINARY

**Sample Value Selection:**
- Include 3-5 representative values showing data range and format
- Include NULL if column allows nulls
- Include edge cases (minimum, maximum, typical values)
- Avoid sensitive data (PII, credentials) in samples; mask if detected
- For enumerated columns, include all distinct values if count < 20

**PII Detection Patterns:**
- Email: `^[^@]+@[^@]+\.[^@]+$`
- Phone (US): `^\d{3}-\d{3}-\d{4}$`
- Social Security Number: `^\d{3}-\d{2}-\d{4}$`
- Credit Card: `^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$`
- Mask detected values as `[MASKED]` in sample output

**Validation Checklist:**
- [ ] Every column has a business description (or explicit placeholder)
- [ ] Foreign keys reference existing tables
- [ ] Enumerated columns list all valid values
- [ ] Date/time columns document format and timezone
- [ ] Numeric columns document units and precision
- [ ] Relationships are documented with cardinality
- [ ] No orphaned or circular dependencies
- [ ] Sample data is representative and non-sensitive (PII masked)
- [ ] All PII-containing columns are flagged

### State Persistence

If running this skill repeatedly on the same database:
- **Cache schema metadata** between runs: store table and column definitions with schema version hash; invalidate cache if hash changes
- **Store business descriptions** in persistent store: maintain mapping of {database}.{schema}.{table}.{column} → description; reuse on subsequent runs
- **Track manual reviews**: maintain list of columns that have been manually reviewed; skip re-flagging on next run
- **Version history**: maintain changelog of data dictionary versions with timestamps and changes (new columns, renamed columns, type changes)
- **Cache invalidation triggers**: refresh cache if (1) schema version changes, (2) manual refresh flag is set, (3) last refresh > 7 days ago

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.