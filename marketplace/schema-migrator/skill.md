# Schema Migrator

**One-line description:** Converts a database schema definition into migration scripts, seed data, and an Entity-Relationship Diagram for documentation.

**Execution Pattern:** Phase Pipeline (linear, deterministic sequence)

---

## Inputs

### Schema Definition Inputs
- `schema_definition` (string, required): Database schema in one of: SQL DDL, JSON schema format, or structured documentation. Must include table names, column definitions, types, constraints, and relationships.
- `schema_format` (string, optional, default: "sql"): Format of input schema. Options: "sql", "json", "yaml", "markdown".
- `current_schema` (string, optional): Existing schema definition (for upgrade migrations). If omitted, assumes new database.

### Database Configuration Inputs
- `target_database` (string, optional, default: "postgresql"): Target database dialect. Options: "postgresql", "mysql", "sqlite", "sqlserver", "oracle".
- `migration_framework` (string, optional, default: "flyway"): Migration tool. Options: "flyway", "liquibase", "alembic", "raw_sql".

### Output Format Inputs
- `erd_format` (string, optional, default: "mermaid"): ERD output format. Options: "mermaid", "plantuml", "ascii", "graphviz".
- `documentation_style` (string, optional, default: "markdown"): Documentation format. Options: "markdown", "html", "asciidoc".

### Seed Data Inputs
- `include_seed_data` (boolean, optional, default: true): Whether to generate seed data scripts.
- `seed_data_spec` (object, optional): Specification for seed data. Keys are table names; values are arrays of row objects or counts. If omitted, seed data is generated for lookup tables only (identified by the heuristic in Reference section).

## Outputs

- `migration_scripts` (object): Map of migration files. Keys are version identifiers (e.g., "V001", "V002"); values are objects with `up` (forward migration SQL) and `down` (rollback SQL) properties.
- `seed_scripts` (object): Map of seed data files. Keys are table names or seed phase identifiers; values are SQL INSERT statements.
- `erd_description` (string): Entity-Relationship Diagram in requested format (Mermaid, PlantUML, ASCII, or Graphviz).
- `documentation` (object): Complete documentation package with keys: `readme` (setup guide), `schema_overview` (table and column descriptions), `migration_guide` (how to apply migrations), `erd_visual` (the ERD), `metadata` (schema statistics).
- `validation_report` (object): Validation results with keys: `syntax_valid` (boolean), `consistency_valid` (boolean), `completeness_valid` (boolean), `issues` (array of strings), `warnings` (array of strings).
- `artifact_manifest` (object): Manifest listing all generated files with paths, sizes, and checksums for version control.

---

## Execution Phases

### Phase 0: Pre-flight Check

**Entry Criteria:**
- `schema_definition` is provided and non-empty.
- `schema_format` is recognized.

**Actions:**
1. Verify that `schema_format` is one of the supported formats (sql, json, yaml, markdown). If not, abort with error listing supported formats.
2. Check that the schema definition is not empty and contains at least one table definition.
3. Scan for reserved keywords in table and column names (e.g., SELECT, INSERT, UPDATE, DELETE). Flag any found and suggest aliases.
4. Verify that naming conventions are consistent: check for mixed case styles (camelCase vs snake_case) and flag inconsistencies.
5. Verify that the schema definition includes at least one table with a primary key. If all tables lack primary keys, flag as HIGH severity issue.
6. If `current_schema` is provided, verify it is in the same format as `schema_definition`.

**Output:**
- `preflight_status` (string): "PASS" or "FAIL".
- `preflight_issues` (array): List of issues found (reserved keywords, naming inconsistencies, missing PKs).
- `preflight_warnings` (array): List of warnings (e.g., "schema uses mixed naming conventions").

**Quality Gate:**
- `schema_format` is recognized and supported.
- Schema definition is non-empty and contains at least one table.
- No critical issues (reserved keywords, all tables missing PKs) are present. Warnings are acceptable.

---

### Phase 1: Parse and Validate Schema

**Entry Criteria:**
- Preflight check passes (Phase 0 complete).
- `schema_definition` is provided and non-empty.
- `schema_format` is recognized.

**Actions:**
1. Parse the schema definition according to `schema_format`.
2. Extract all tables, columns, data types, constraints (PRIMARY KEY, FOREIGN KEY, UNIQUE, NOT NULL, DEFAULT).
3. Identify all relationships (foreign keys) and their cardinality (1:1, 1:N, M:N).
4. For each table, verify that exactly one column is marked as PRIMARY KEY. If a table lacks a primary key, add it to validation_issues with severity HIGH.
5. Validate that all foreign key references point to existing tables and columns. If a foreign key references a non-existent table or column, add it to validation_issues with severity HIGH.
6. Extract indexes, triggers, views, and stored procedures if present.
7. Detect circular foreign key dependencies using depth-first search. If a cycle is found, add it to validation_issues with severity HIGH and include the circular path.

**Output:**
- `parsed_schema` (object): Structured representation with tables array, each containing columns array with type, constraint, and relationship metadata.
- `schema_statistics` (object): Counts of tables, columns, relationships, constraints, indexes.
- `validation_issues` (array): List of schema problems with severity (HIGH, MEDIUM, LOW) and remediation guidance.
- `dependency_graph` (object): Map of table dependencies for topological sorting.

**Quality Gate:**
- All tables are identified and have at least one column.
- All columns have types.
- All relationships are bidirectional (if A.fk → B.pk, this is recorded on both sides).
- All foreign key dependencies form a directed acyclic graph (DAG); verified by topological sort of the dependency graph.
- No validation issues with severity HIGH remain unresolved.

---

### Phase 2: Determine Migration Strategy

**Entry Criteria:**
- Parsed schema is valid (Phase 1 complete).
- `current_schema` is provided (for upgrades) or omitted (for new database).

**Actions:**
1. If `current_schema` is provided, parse it using the same logic as Phase 1.
2. Diff the current schema against the target schema to identify:
   - New tables (CREATE TABLE).
   - Dropped tables (DROP TABLE).
   - New columns (ALTER TABLE ADD COLUMN).
   - Dropped columns (ALTER TABLE DROP COLUMN).
   - Modified columns (ALTER TABLE MODIFY/CHANGE COLUMN).
   - New constraints (ALTER TABLE ADD CONSTRAINT).
   - Dropped constraints (ALTER TABLE DROP CONSTRAINT).
   - New indexes (CREATE INDEX).
   - Dropped indexes (DROP INDEX).
3. Order migrations to respect foreign key dependencies: create parent tables before child tables; drop child tables before parent tables. Use topological sort on the dependency graph.
4. For each destructive operation (drops, renames), mark with RISK: HIGH and include a rollback procedure in the migration_metadata.
5. Determine if migration is "additive" (safe, no data loss), "moderate" (some alters, reversible), or "destructive" (risky, requires backup and careful rollback).
6. For migrations that require data transformation (e.g., column type change), flag with a comment: "Manual data transformation required before applying this migration. See migration_metadata for details."

**Output:**
- `migration_plan` (array): Ordered list of migration operations with type (CREATE, ALTER, DROP), target (table/column/constraint), SQL snippet, and risk level.
- `migration_risk_level` (string): "low" (additive only), "medium" (some alters), "high" (destructive operations).
- `migration_dependencies` (object): Map of which migrations depend on which (for sequencing).
- `data_transformation_notes` (array): List of migrations requiring manual data transformation, with guidance.

**Quality Gate:**
- All operations are ordered to respect foreign key constraints (verified by topological sort).
- Destructive operations are clearly marked with RISK: HIGH.
- No circular dependencies in migration order.
- All data transformation requirements are documented.

---

### Phase 3: Generate Migration Scripts

**Entry Criteria:**
- Migration plan is complete (Phase 2).
- `target_database` and `migration_framework` are specified.

**Actions:**
1. For each migration operation, generate SQL in the target database dialect using the syntax reference in the Reference section.
2. Wrap migrations in the chosen framework's format:
   - **Flyway:** V{version}__{description}.sql files with -- Flyway comments.
   - **Liquibase:** XML or YAML changesets with rollback logic.
   - **Alembic:** Python migration files with upgrade() and downgrade() functions.
   - **Raw SQL:** Separate up.sql and down.sql files with version prefixes.
3. For each migration, generate both the forward (up) and reverse (down) scripts. Down scripts must be true inverses of up scripts (reversible).
4. Add transaction boundaries and error handling (e.g., IF NOT EXISTS, IF EXISTS) appropriate to the target database.
5. Include comments explaining the purpose of each migration and any data transformation requirements.
6. Assign version numbers sequentially (V001, V002, etc.) or timestamps (2024_01_15_120000, etc.) based on migration_framework conventions.
7. Validate all generated SQL for syntax errors against the target database dialect.

**Output:**
- `migration_scripts` (object): Map of migration files with `up` and `down` SQL.
- `migration_metadata` (array): List of migrations with version, description, risk level, estimated execution time, and rollback procedure.
- `sql_validation_report` (object): Syntax validation results for all generated SQL.

**Quality Gate:**
- Every migration has both up and down scripts.
- Down scripts are true inverses of up scripts (reversible); verified by checking that down script undoes all changes from up script.
- All SQL is syntactically valid for the target database (verified by parsing or linting).
- Comments explain the purpose of each migration and any data transformation requirements.
- No SQL identifiers exceed database limits (e.g., 63 characters for PostgreSQL).

---

### Phase 4: Generate Seed Data Scripts

**Entry Criteria:**
- `include_seed_data` is true.
- Parsed schema is available (Phase 1).
- `seed_data_spec` is provided (optional; if omitted, seed data is generated for lookup tables only).

**Actions:**
1. Identify tables that require seed data:
   - Apply the lookup table heuristic (see Reference section) to identify reference tables.
   - Include any tables specified in `seed_data_spec`.
2. For each seed table, generate INSERT statements:
   - (1) If `seed_data_spec` contains an entry for this table, use the provided data.
   - (2) If not, apply the lookup table heuristic (see Reference section).
   - (3) If the table matches the heuristic, generate placeholder data (e.g., status codes, default roles, common categories); otherwise, skip.
3. Order seed scripts to respect foreign key dependencies: insert into parent tables before child tables. Use topological sort on the dependency graph.
4. Use database-specific syntax (INSERT INTO ... VALUES, INSERT INTO ... SELECT, etc.) appropriate to `target_database`.
5. Add idempotency: use INSERT IGNORE, INSERT OR REPLACE, or ON CONFLICT clauses to allow re-running seeds without errors.
6. Include comments identifying the purpose of each seed record and the table it belongs to.
7. Validate that all seed data respects foreign key constraints (no orphaned records).

**Output:**
- `seed_scripts` (object): Map of seed data files with INSERT statements.
- `seed_metadata` (array): List of seed operations with table, row count, purpose, and whether it is required or optional.
- `seed_validation_report` (object): Validation results showing FK constraint compliance.

**Quality Gate:**
- All seed data respects foreign key constraints (no orphaned records); verified by checking that all FK values exist in parent tables.
- Seed scripts are idempotent (can be run multiple times safely); verified by checking for INSERT IGNORE, INSERT OR REPLACE, or ON CONFLICT clauses.
- All SQL is syntactically valid for the target database.
- Seed tables are ordered to respect FK dependencies (verified by topological sort).

---

### Phase 5: Generate Entity-Relationship Diagram

**Entry Criteria:**
- Parsed schema is available (Phase 1).
- `erd_format` is specified.

**Actions:**
1. Extract all tables and relationships from the parsed schema.
2. Determine cardinality for each relationship (1:1, 1:N, M:N) based on foreign key constraints and uniqueness.
3. Generate ERD in the requested format:
   - **Mermaid:** erDiagram syntax with entities and relationships.
   - **PlantUML:** entity-relationship diagram syntax.
   - **ASCII:** Text-based diagram using box-drawing characters.
   - **Graphviz:** DOT format for rendering.
4. Include table names, column names, data types, and key indicators (PK, FK).
5. Use standard ER notation: crow's foot for cardinality, solid lines for required relationships, dashed for optional.
6. If the ERD is too complex (more than 20 tables), generate multiple ERDs: one per logical schema section or domain.
7. Organize layout to minimize crossing lines (if the format supports layout hints).

**Output:**
- `erd_description` (string): Complete ERD in the requested format.
- `erd_metadata` (object): Statistics (table count, relationship count, max cardinality, complexity level).
- `erd_sections` (array, optional): If ERD is split into multiple diagrams, list each section with its tables and relationships.

**Quality Gate:**
- All tables appear in the ERD (or in one of the ERD sections if split).
- All relationships are shown with correct cardinality.
- The diagram is readable and follows standard ER notation (crow's foot for cardinality, solid/dashed lines for required/optional).
- If split into multiple ERDs, each section is self-contained and labeled clearly.

---

### Phase 6: Generate Documentation

**Entry Criteria:**
- All previous phases are complete.
- `documentation_style` is specified.

**Actions:**
1. Create a README with:
   - Overview of the schema and its purpose.
   - Prerequisites (database version, tools, permissions).
   - Step-by-step setup instructions with example commands for each target database (PostgreSQL, MySQL, SQLite, SQL Server, Oracle).
   - Rollback instructions with example commands for each target database.
   - Troubleshooting section with at least 3 common issues and solutions (e.g., "Foreign key constraint violation during migration", "Migration timeout on large tables", "Seed data conflicts with existing records").
2. Create a schema overview document with:
   - Table-by-table descriptions (purpose, usage, row count estimate).
   - Column descriptions (name, type, constraints, purpose, example values).
   - Relationship descriptions (cardinality, meaning, cascade rules).
   - Indexes and their purposes.
3. Create a migration guide with:
   - List of all migrations in order with version, description, risk level, estimated execution time.
   - For each migration: rollback procedure and data transformation requirements (if any).
   - Instructions for applying migrations in development, staging, and production environments.
   - Guidance on handling failed migrations and recovery procedures.
4. Include the ERD visual (or multiple ERDs if split).
5. Add a metadata section with:
   - Schema version and last updated date.
   - Statistics (table count, column count, relationship count, index count).
   - Database dialect and version requirements.
   - Migration framework and version.
6. Format all documentation in the requested style (Markdown, HTML, AsciiDoc).

**Output:**
- `documentation` (object): Complete documentation package with keys: `readme`, `schema_overview`, `migration_guide`, `erd_visual`, `metadata`.
- `documentation_files` (array): List of generated documentation files with paths and formats.

**Quality Gate:**
- All documentation is complete and internally consistent (no broken references).
- Instructions are clear and actionable (include example commands for each target database).
- No references to undefined tables, columns, or migrations.
- Troubleshooting section includes at least 3 common issues with solutions.
- All documentation sections are present and non-empty.

---

### Phase 7: Validate and Package

**Entry Criteria:**
- All previous phases are complete.

**Actions:**
1. Validate all generated SQL scripts:
   - Check syntax for the target database dialect (using parser or linter).
   - Verify that all referenced tables and columns exist in the parsed schema.
   - Verify that all foreign key constraints are satisfiable (no orphaned records in seed data).
   - Verify that all migration down scripts are true inverses of up scripts.
2. Validate consistency:
   - Ensure migration scripts match the migration plan (same operations, same order).
   - Ensure seed scripts match the schema (all tables and columns exist).
   - Ensure ERD matches the schema (all tables and relationships present).
   - Ensure documentation references match actual artifacts (no broken links or undefined tables).
3. Check completeness:
   - Verify that all tables from the schema are covered in migrations, seeds, and ERD.
   - Verify that all relationships are documented in the ERD and migration guide.
   - Verify that all migrations have both up and down scripts.
   - Verify that all documentation sections are present and non-empty.
4. Generate a validation report with:
   - Overall status (PASS, PASS WITH WARNINGS, FAIL).
   - List of any syntax errors, consistency issues, or missing elements with line numbers and remediation guidance.
   - Recommendations for fixes.
5. Create an artifact manifest listing all generated files with paths, sizes, and checksums (MD5 or SHA256).
6. Package all outputs into a coherent directory structure: migrations/, seeds/, docs/, erd/.

**Output:**
- `validation_report` (object): Validation results with `syntax_valid`, `consistency_valid`, `completeness_valid`, `issues` (array with line numbers and remediation), `warnings` (array).
- `artifact_manifest` (object): Map of all generated files with metadata (path, size, checksum, format).
- `package_structure` (string): Description of the output directory structure.

**Quality Gate:**
- No critical errors (syntax, missing references). If critical errors exist, return FAIL status and do not package artifacts.
- All warnings are documented and explained.
- Artifact manifest is complete and accurate (all files listed with correct paths and sizes).
- Package structure is clear and follows conventions (migrations/, seeds/, docs/, erd/).

---

## Exit Criteria

The skill is DONE when:
1. All migration scripts are generated, validated, and ordered correctly (verified by topological sort).
2. Seed data scripts are generated for all lookup/reference tables and any tables specified in `seed_data_spec`.
3. An ERD is generated in the requested format (or multiple ERDs if complexity exceeds 20 tables).
4. Complete documentation is generated with:
   - Step-by-step setup instructions with example commands for each target database.
   - Migration guide with risk levels and rollback procedures.
   - Troubleshooting section with at least 3 common issues and solutions.
5. A validation report confirms all artifacts are syntactically correct and consistent (no FAIL status).
6. An artifact manifest lists all outputs with paths, sizes, and checksums for version control and deployment.
7. All documentation sections are present and non-empty (readme, schema_overview, migration_guide, erd_visual, metadata).

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 0 | Schema format is unrecognized | **Abort** -- return error with expected format examples. List supported formats: sql, json, yaml, markdown. |
| Phase 0 | Schema definition is empty | **Abort** -- return error: "Schema definition is empty. Provide at least one table definition." |
| Phase 0 | All tables lack primary keys | **Abort** -- return error: "No tables have primary keys. Every table must have a PRIMARY KEY constraint." |
| Phase 1 | Schema definition is malformed or unrecognized format | **Abort** -- return error with expected format examples. Ask user to provide schema in one of: SQL DDL, JSON, YAML, or Markdown. |
| Phase 1 | Schema has tables without primary keys | **Adjust** -- flag in validation_issues with severity HIGH. Generate migrations that add surrogate PKs (id SERIAL PRIMARY KEY) if user confirms. |
| Phase 1 | Schema has circular foreign key dependencies | **Adjust** -- identify the cycle using depth-first search. Generate a detailed report showing: (1) the circular path, (2) which FK to remove or which junction table to create, (3) the impact on seed data order. Require user confirmation before proceeding. |
| Phase 2 | Current schema and target schema are incompatible (e.g., column type change requires data transformation) | **Adjust** -- flag as high-risk migration in migration_metadata. Generate migration with a comment: "Manual data transformation required before applying this migration. See data_transformation_notes for details." |
| Phase 3 | Target database dialect is unsupported | **Abort** -- return error listing supported dialects: postgresql, mysql, sqlite, sqlserver, oracle. |
| Phase 3 | Generated SQL exceeds database limits (e.g., identifier length, statement size) | **Adjust** -- truncate identifiers to database limit (e.g., 63 chars for PostgreSQL), split large statements, add comments explaining the issue. Flag in sql_validation_report. |
| Phase 4 | Seed data violates foreign key constraints | **Abort** -- return error listing the constraint violations with table names and FK columns. Ask user to fix `seed_data_spec` or provide data in correct order. |
| Phase 5 | ERD format is unsupported | **Abort** -- return error listing supported formats: mermaid, plantuml, ascii, graphviz. |
| Phase 5 | ERD is too complex to render (more than 20 tables) | **Adjust** -- generate multiple ERDs: one per logical schema section or domain. Label each section clearly and include a master ERD showing section relationships. |
| Phase 6 | Documentation style is unsupported | **Abort** -- return error listing supported styles: markdown, html, asciidoc. |
| Phase 7 | Validation finds critical errors (syntax, missing references) | **Abort** -- return validation_report with FAIL status and detailed error list with line numbers. Do not package artifacts until errors are resolved. |
| Phase 7 | Artifact manifest cannot be generated (e.g., file system error) | **Adjust** -- generate manifest in memory and return as JSON. Warn user to verify file outputs manually. |

---

## Reference Section

### Database Dialect Syntax Differences

- **PostgreSQL:** Uses `SERIAL` for auto-increment, `IF NOT EXISTS`, `ON CONFLICT` for upserts. Identifier limit: 63 characters.
- **MySQL:** Uses `AUTO_INCREMENT`, `IF NOT EXISTS`, `ON DUPLICATE KEY UPDATE` for upserts. Identifier limit: 64 characters.
- **SQLite:** Uses `AUTOINCREMENT`, `IF NOT EXISTS`, `INSERT OR REPLACE` for upserts. Identifier limit: unlimited.
- **SQL Server:** Uses `IDENTITY`, `IF NOT EXISTS`, `MERGE` for upserts. Identifier limit: 128 characters.
- **Oracle:** Uses `SEQUENCE` and `TRIGGER` for auto-increment, `IF NOT EXISTS` (11g+), `MERGE` for upserts. Identifier limit: 30 characters.

### Migration Framework Conventions

- **Flyway:** Versioned SQL files (V001__description.sql), auto-discovery, simple and lightweight. Supports undo (Pro version).
- **Liquibase:** XML/YAML changesets, database-agnostic, supports rollback and preconditions. More complex but more flexible.
- **Alembic:** Python-based, auto-generation of migrations, good for ORMs (SQLAlchemy). Requires Python environment.
- **Raw SQL:** Manual version control, maximum flexibility, requires discipline. Recommended for simple schemas.

### ERD Notation

- **Crow's Foot:** Standard ER notation. One side of relationship shows cardinality (one, many). Lines: solid = required, dashed = optional.
  - One-to-One: |--|
  - One-to-Many: |--<
  - Many-to-Many: >--<
- **Chen Notation:** Alternative ER notation using diamond shapes for relationships. Less common in modern tools.
- **UML:** Class diagram style, shows attributes and methods. Useful for OOP-mapped schemas.

### Lookup Table Identification Heuristic

Tables are likely lookup/reference tables if they meet at least 3 of these criteria:
1. Have fewer than 100 rows (typically).
2. Have a simple structure (id, code, name, description).
3. Are referenced by multiple other tables via foreign keys (2 or more).
4. Contain static, rarely-changing data (statuses, roles, categories, types).
5. Have no outgoing foreign keys (only incoming).
6. Have a naming pattern suggesting reference data (e.g., status_*, type_*, role_*, *_lookup).

### Seed Data Best Practices

- Use idempotent inserts (INSERT IGNORE, INSERT OR REPLACE, ON CONFLICT) to allow re-running seeds.
- Order seed scripts to respect FK dependencies (use topological sort).
- Include comments explaining the purpose of each seed record and which table it belongs to.
- Separate seed data into phases: (1) core reference data (required), (2) optional test data.
- Document which seed data is required vs. optional in seed_metadata.
- Use meaningful values for seed data (e.g., 'active', 'pending', 'inactive' for status codes) rather than generic placeholders.
- For large seed datasets, consider using INSERT INTO ... SELECT or LOAD DATA INFILE for performance.

### Documentation Checklist

- [ ] README with setup and rollback instructions (with example commands for each target database).
- [ ] Schema overview with table and column descriptions.
- [ ] Migration guide with version history, risk levels, and rollback procedures.
- [ ] ERD visual showing all tables and relationships (or multiple ERDs if complexity exceeds 20 tables).
- [ ] Metadata section with version, date, statistics, and database requirements.
- [ ] Troubleshooting section with at least 3 common issues and solutions.
- [ ] Examples of common queries or operations on the schema.
- [ ] Data transformation guidance for migrations requiring manual intervention.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.