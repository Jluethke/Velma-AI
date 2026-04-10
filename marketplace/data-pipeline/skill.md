# Data Pipeline

Build reliable data pipelines by identifying sources, designing extract/transform/load patterns, generating pipeline code, validating data quality, and setting up monitoring.

## Execution Pattern: Phase Pipeline

```
PHASE 1: SOURCE        --> Identify data sources, formats, volumes, freshness needs
PHASE 2: DESIGN        --> Select extract/transform/load patterns, orchestration
PHASE 3: BUILD         --> Generate pipeline code (DAG, transforms, quality checks)
PHASE 4: VALIDATE      --> Data quality tests, schema validation, idempotency check
PHASE 5: MONITOR       --> Set up alerting, freshness SLAs, drift detection
```

## Inputs

- `data_sources`: string -- Description of source systems (APIs, databases, files, streams)
- `destination`: string -- Where data should land (warehouse, lake, database, cache)
- `freshness_requirements`: string -- How fresh data needs to be (real-time, hourly, daily)
- `volume_estimate`: string -- Approximate data volume (rows/day, GB/month)
- `task_description`: string -- Specific pipeline need or general architecture request

## Outputs

- `pipeline_architecture`: object -- Source-to-destination flow diagram with pattern selection rationale
- `pipeline_code`: string -- Executable pipeline code (DAG definition, transforms, loaders)
- `quality_checks`: object -- Data quality validation suite with tests and thresholds
- `monitoring_config`: object -- Alerting rules, freshness SLAs, and drift detection setup

---

## Execution

### Phase 1: SOURCE -- Identify Data Sources

**Entry criteria:** At least one data source is described.

**Actions:**
1. Inventory all data sources: APIs, databases, file drops, event streams, third-party feeds
2. For each source, determine:
   - Format (JSON, CSV, Parquet, Avro, database tables)
   - Volume (rows/day, GB)
   - Freshness (real-time events, daily dumps, on-demand)
   - Access method (REST API, CDC, file watch, Kafka topic)
   - Authentication requirements
3. Identify source-side constraints: rate limits, connection limits, export schedules
4. Determine incremental extraction capability: timestamp-based CDC, log-based CDC, or full dump only (see Reference: Extract Patterns)
5. Identify the destination and its requirements: schema, format, access patterns
6. Determine latency requirements: Is this batch or streaming? (see Reference: Streaming vs Batch)

**Output:** A source inventory listing each source with format, volume, freshness, access method, and constraints. Plus destination requirements and latency target.

**Quality gate:** Every source has volume and freshness estimates. Extraction method is determined for each source. Batch vs streaming decision is made.

---

### Phase 2: DESIGN -- Select Patterns and Orchestration

**Entry criteria:** Source inventory is complete with latency and volume decisions.

**Actions:**
1. Select extraction pattern per source (see Reference: Extract Patterns):
   - API polling with If-Modified-Since for REST sources
   - Paginated extraction for large API datasets
   - CDC (timestamp or log-based) for database sources
   - File watching for drop-zone sources
2. Select transform patterns (see Reference: Transform Patterns):
   - Map/filter/reduce for standard data cleaning
   - Deduplication strategy (latest, first, or merge)
   - Windowing for time-series aggregation
   - Schema evolution handling for changing sources
3. Select load pattern (see Reference: Load Patterns):
   - Batch insert for bulk loads
   - Upsert for incremental updates
   - SCD Type 1 (overwrite) or Type 2 (history) for dimensions
   - Append-only for event/fact tables
4. Select data format for intermediate and final storage (see Reference: Format Selection)
5. Design orchestration (see Reference: Orchestration):
   - DAG structure with task dependencies
   - Retry strategy with exponential backoff
   - Idempotency pattern (safe to re-run)
   - Checkpointing for resume-on-failure
6. Select tool stack (see Reference: Tool Selection Guide):
   - Transform: pandas/Polars/Spark/dbt based on volume
   - Orchestration: Airflow/Prefect/Dagster based on complexity
   - Streaming: Kafka + Flink/Kafka Streams if real-time
7. Choose architecture pattern: Lambda (batch + speed layers) or Kappa (stream-only)

**Output:** Pipeline architecture document with extraction, transform, load, and orchestration patterns selected for each source, plus tool stack recommendation.

**Quality gate:** Every source has an extraction pattern. Transform logic handles deduplication. Load pattern supports idempotent re-runs. Tool choices match volume requirements.

---

### Phase 3: BUILD -- Generate Pipeline Code

**Entry criteria:** Architecture design is complete and approved.

**Actions:**
1. Generate extraction code per source:
   - API extractors with pagination, rate limiting, error handling (see Reference: API Polling, Paginated API Extraction)
   - CDC queries with incremental bookmarks
   - File watchers with new-file detection
2. Generate transform code (see Reference: Transform Patterns):
   - Data cleaning: type casting, null handling, standardization
   - Deduplication on natural keys
   - Derived columns and aggregations
   - Schema evolution handler
3. Generate load code (see Reference: Load Patterns):
   - Batch insert with configurable batch size
   - Upsert with conflict resolution
   - SCD implementation if needed
4. Generate orchestration DAG (see Reference: Orchestration):
   - Task definitions with dependencies
   - Retry configuration with backoff
   - Idempotent load with batch_id tracking
   - Checkpoint save/restore
5. Generate error handling (see Reference: Error Handling):
   - Dead letter queue for failed records
   - Poison pill detection
   - Circuit breaker for unreliable sources
6. Generate data quality checks (see Reference: Data Quality):
   - Null checks on required columns
   - Format validation (email, date, etc.)
   - Row count reasonableness
   - Value range checks

**Output:** Complete, executable pipeline code including extractors, transforms, loaders, DAG, error handling, and quality checks.

**Quality gate:** Pipeline code runs without syntax errors. Every extractor handles errors (retries, timeouts). Transforms handle null values. Loads are idempotent.

---

### Phase 4: VALIDATE -- Data Quality Tests

**Entry criteria:** Pipeline code is generated and can be tested.

**Actions:**
1. Run data quality checks on sample data (see Reference: Validation Framework):
   - No nulls in required columns
   - All values within expected ranges
   - No unexpected duplicates after deduplication
   - Row counts within expected bounds
   - No future dates in timestamp columns
2. Validate schema compatibility between source and destination
3. Test idempotency: run the pipeline twice with the same data, verify no duplicates
4. Test incremental: run with new data, verify only new records are processed
5. Test failure recovery: kill the pipeline mid-run, restart, verify correct resume
6. Check freshness: verify data age meets SLA (see Reference: Freshness SLA)
7. Check row count anomaly detection (see Reference: Row Count Monitoring)

**Output:** Validation report listing all quality checks with pass/fail status and any data issues found.

**Quality gate:** All required-column null checks pass. Idempotency test produces zero duplicates. Incremental test processes only new records. Freshness meets SLA.

---

### Phase 5: MONITOR -- Set Up Alerting and Drift Detection

**Entry criteria:** Validation passes with all critical checks green.

**Actions:**
1. Set up pipeline metrics tracking (see Reference: Key Metrics for Data Pipelines):
   - Row count per run
   - Pipeline duration
   - Error rate (failed records / total)
   - Data freshness (age of newest record)
   - Data drift (schema changes, distribution shifts)
   - Null rate per column
2. Configure alerting thresholds:
   - Row count > 50% deviation from 30-day average
   - Freshness exceeds SLA
   - Error rate > 1%
   - Duration > 2x historical average
   - Any new null in previously non-null column
3. Set up pipeline logging (see Reference: Pipeline Logging Pattern):
   - Stage name, duration, row count for every stage
   - Error details with record context
4. Configure dead letter queue monitoring:
   - Alert when DLQ depth exceeds threshold
   - Auto-retry with backoff for retryable errors
5. Document runbook: what to do when each alert fires

**Output:** Monitoring configuration with alerting rules, dashboards, and runbook.

**Quality gate:** Every key metric has an alert. Freshness SLA is monitored. DLQ is monitored. Runbook covers all alert types.

---

## Exit Criteria

The skill is DONE when:
- Pipeline extracts from all identified sources with error handling
- Transforms handle deduplication, null values, and schema evolution
- Loads are idempotent (safe to re-run)
- Data quality checks pass on sample data
- Monitoring is configured with alerting on freshness, row count, and error rate
- Runbook documents how to respond to each alert type

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| SOURCE | Cannot access data source | **Escalate** -- ask user for credentials or access instructions |
| SOURCE | Volume is unknown | **Adjust** -- estimate from available metadata, flag for validation in Phase 4 |
| DESIGN | Latency requirement impossible with batch | **Adjust** -- recommend streaming architecture or relax SLA |
| DESIGN | Volume exceeds single-machine capacity | **Adjust** -- recommend Spark or cloud-native (BigQuery/Snowflake) |
| BUILD | Source API has no pagination support | **Adjust** -- implement full extraction with timestamp-based dedup |
| BUILD | Destination schema incompatible with source | **Escalate** -- recommend schema migration or transform adjustment |
| VALIDATE | Quality checks fail on sample data | **Retry** -- adjust transforms to handle the failing cases, max 3 retries |
| VALIDATE | Idempotency test fails | **Retry** -- fix load logic (add batch_id tracking or upsert) |
| MONITOR | Monitoring tool not available | **Adjust** -- generate file-based logging with manual review instructions |
| MONITOR | User rejects final output | **Targeted revision** -- ask which pipeline stage, transform logic, or monitoring alert fell short and rerun only that section. Do not redesign the full pipeline. |

## State Persistence

Between runs, this skill saves:
- **Source inventory**: all sources with access methods, formats, and volume estimates
- **Pipeline architecture**: patterns selected for extract, transform, load, and orchestration
- **Quality baselines**: expected row counts, null rates, and freshness for anomaly detection
- **Checkpoint state**: last processed ID/timestamp per source for incremental extraction

---

## Reference

### Extract Patterns

#### API Polling
```python
import requests
import time

def poll_api(url, interval_seconds=60, last_modified=None):
    """Poll an API at fixed intervals, using If-Modified-Since for efficiency."""
    headers = {}
    if last_modified:
        headers['If-Modified-Since'] = last_modified

    response = requests.get(url, headers=headers, timeout=30)

    if response.status_code == 304:
        return None  # Not modified since last poll

    if response.status_code == 200:
        return {
            'data': response.json(),
            'last_modified': response.headers.get('Last-Modified'),
            'etag': response.headers.get('ETag')
        }

    raise Exception(f"API error: {response.status_code}")
```

#### Paginated API Extraction
```python
def extract_all_pages(base_url, params=None):
    """Extract all pages from a cursor-paginated API."""
    params = params or {}
    all_records = []
    cursor = None

    while True:
        if cursor:
            params['cursor'] = cursor

        response = requests.get(base_url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()

        all_records.extend(data['results'])

        cursor = data.get('next_cursor')
        if not cursor or not data.get('has_more', False):
            break

        time.sleep(0.1)  # Rate limit courtesy

    return all_records
```

#### Change Data Capture (CDC)
```sql
-- Method 1: Timestamp-based CDC (simplest)
-- Requires updated_at column with index
SELECT * FROM orders
WHERE updated_at > :last_sync_timestamp
ORDER BY updated_at;
-- LIMITATION: Misses deletes. Add soft-delete or separate CDC.

-- Method 2: Log-based CDC (Debezium, pg_logical)
-- Reads database write-ahead log (WAL)
-- Captures INSERT, UPDATE, DELETE in real-time
-- No polling overhead, no missed changes
-- Debezium config for PostgreSQL:
```

```json
{
  "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
  "database.hostname": "db-host",
  "database.port": "5432",
  "database.dbname": "mydb",
  "database.server.name": "myserver",
  "slot.name": "debezium_slot",
  "plugin.name": "pgoutput",
  "table.include.list": "public.orders,public.users"
}
```

#### File Watching
```python
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import os

class NewFileHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory:
            return
        if event.src_path.endswith('.csv'):
            process_file(event.src_path)

def watch_directory(path):
    observer = Observer()
    observer.schedule(NewFileHandler(), path, recursive=False)
    observer.start()
    return observer
```

---

### Transform Patterns

#### Map / Filter / Reduce
```python
import pandas as pd

def transform_orders(df: pd.DataFrame) -> pd.DataFrame:
    """Standard transform pipeline: filter -> map -> derive -> aggregate."""

    # Filter: Remove test orders and cancelled
    df = df[
        (df['is_test'] == False) &
        (df['status'] != 'cancelled')
    ]

    # Map: Standardize fields
    df['email'] = df['email'].str.lower().str.strip()
    df['created_date'] = pd.to_datetime(df['created_at']).dt.date
    df['amount_usd'] = df.apply(
        lambda r: convert_currency(r['amount'], r['currency'], 'USD'),
        axis=1
    )

    # Derive: Add computed columns
    df['is_high_value'] = df['amount_usd'] > 1000
    df['order_month'] = pd.to_datetime(df['created_date']).dt.to_period('M')

    # Aggregate: Per-customer metrics
    customer_stats = df.groupby('customer_id').agg(
        total_orders=('order_id', 'count'),
        total_spend=('amount_usd', 'sum'),
        avg_order_value=('amount_usd', 'mean'),
        first_order=('created_date', 'min'),
        last_order=('created_date', 'max')
    ).reset_index()

    return customer_stats
```

#### Deduplication
```python
def deduplicate(df: pd.DataFrame, key_columns: list, strategy='latest') -> pd.DataFrame:
    """Remove duplicates, keeping the specified version."""
    if strategy == 'latest':
        # Keep the most recent record per key
        df = df.sort_values('updated_at', ascending=False)
        return df.drop_duplicates(subset=key_columns, keep='first')
    elif strategy == 'first':
        return df.drop_duplicates(subset=key_columns, keep='first')
    elif strategy == 'merge':
        # Merge: take non-null values from all duplicates
        return df.groupby(key_columns).agg('first').reset_index()
```

#### Windowing
```python
# Time-based windows (common in streaming and batch)
def apply_window(df, window_column, window_size='1h', agg_func='sum', value_column='amount'):
    """Apply tumbling window aggregation."""
    df[window_column] = pd.to_datetime(df[window_column])
    return df.set_index(window_column).resample(window_size)[value_column].agg(agg_func).reset_index()

# Sliding window
def sliding_window_avg(df, column, window_size=7):
    """Compute rolling average."""
    df[f'{column}_rolling_avg'] = df[column].rolling(window=window_size, min_periods=1).mean()
    return df
```

#### Schema Evolution
```python
def handle_schema_evolution(new_df: pd.DataFrame, existing_schema: dict) -> pd.DataFrame:
    """Handle schema changes gracefully."""
    new_columns = set(new_df.columns) - set(existing_schema.keys())
    removed_columns = set(existing_schema.keys()) - set(new_df.columns)

    if new_columns:
        print(f"New columns detected: {new_columns}")
        # Add new columns with defaults to existing data
        for col in new_columns:
            # Log schema change for audit
            log_schema_change('ADD_COLUMN', col, str(new_df[col].dtype))

    if removed_columns:
        print(f"Removed columns detected: {removed_columns}")
        # Keep removed columns as NULL in destination
        for col in removed_columns:
            new_df[col] = None
            log_schema_change('REMOVE_COLUMN', col)

    return new_df
```

---

### Load Patterns

#### Batch Insert (fastest for bulk loads)
```python
def batch_insert(engine, table_name, df, batch_size=10000):
    """Insert in batches to avoid memory issues and lock contention."""
    for i in range(0, len(df), batch_size):
        batch = df.iloc[i:i + batch_size]
        batch.to_sql(
            table_name,
            engine,
            if_exists='append',
            index=False,
            method='multi'  # Single INSERT with multiple VALUES
        )
        print(f"Inserted rows {i} to {i + len(batch)}")
```

#### Upsert (Insert or Update)
```sql
-- PostgreSQL: INSERT ON CONFLICT
INSERT INTO customers (id, email, name, updated_at)
VALUES (:id, :email, :name, NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;

-- MySQL: INSERT ON DUPLICATE KEY UPDATE
INSERT INTO customers (id, email, name, updated_at)
VALUES (:id, :email, :name, NOW())
ON DUPLICATE KEY UPDATE
  email = VALUES(email),
  name = VALUES(name),
  updated_at = VALUES(updated_at);
```

```python
# SQLAlchemy upsert
from sqlalchemy.dialects.postgresql import insert

def upsert_batch(engine, table, records, conflict_columns):
    stmt = insert(table).values(records)
    update_cols = {c.name: c for c in stmt.excluded if c.name not in conflict_columns}
    stmt = stmt.on_conflict_do_update(
        index_elements=conflict_columns,
        set_=update_cols
    )
    engine.execute(stmt)
```

#### Slowly Changing Dimensions (SCD)

**SCD Type 1: Overwrite** (no history)
```sql
-- Simply UPDATE the existing row
UPDATE dim_customer SET
  name = :new_name,
  email = :new_email,
  updated_at = NOW()
WHERE customer_id = :id;
```

**SCD Type 2: Add New Row** (full history)
```sql
-- Step 1: Close the current record
UPDATE dim_customer SET
  is_current = FALSE,
  valid_to = NOW()
WHERE customer_id = :id AND is_current = TRUE;

-- Step 2: Insert new version
INSERT INTO dim_customer (customer_id, name, email, valid_from, valid_to, is_current)
VALUES (:id, :new_name, :new_email, NOW(), '9999-12-31', TRUE);
```

```
| surrogate_key | customer_id | name    | valid_from | valid_to   | is_current |
|---------------|-------------|---------|------------|------------|------------|
| 1             | C001        | Alice   | 2025-01-01 | 2026-03-15 | FALSE      |
| 2             | C001        | Alice B | 2026-03-15 | 9999-12-31 | TRUE       |
```

#### Append-Only (Event Sourcing / Fact Tables)
```sql
-- Never update, only insert. Immutable log.
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Partition by month for fast drops
-- Current state = replay all events (or maintain materialized view)
```

---

### Orchestration

#### DAG Pattern (Airflow-style)
```python
# Conceptual DAG — dependencies define execution order
pipeline = DAG(
    schedule="0 2 * * *",  # Run at 2 AM daily
    tasks={
        'extract_orders': Task(extract_orders, retries=3, retry_delay=300),
        'extract_customers': Task(extract_customers, retries=3, retry_delay=300),
        'transform': Task(
            transform_data,
            depends_on=['extract_orders', 'extract_customers'],
            retries=2
        ),
        'validate': Task(validate_output, depends_on=['transform']),
        'load': Task(load_to_warehouse, depends_on=['validate']),
        'notify': Task(send_slack_notification, depends_on=['load'], trigger_rule='all_done'),
    }
)
```

#### Retry with Exponential Backoff
```python
import time
import random

def retry_with_backoff(func, max_retries=5, base_delay=1, max_delay=300):
    """Retry a function with exponential backoff and jitter."""
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise  # Final attempt, let it fail

            delay = min(base_delay * (2 ** attempt), max_delay)
            jitter = random.uniform(0, delay * 0.1)  # 10% jitter
            total_delay = delay + jitter

            print(f"Attempt {attempt + 1} failed: {e}. Retrying in {total_delay:.1f}s")
            time.sleep(total_delay)
```

#### Idempotency
```python
def idempotent_load(engine, batch_id, data):
    """Load data idempotently — safe to re-run without duplicates."""
    with engine.begin() as conn:
        # Delete any previous load for this batch
        conn.execute(
            "DELETE FROM staging_orders WHERE batch_id = %s",
            batch_id
        )
        # Insert fresh
        for record in data:
            record['batch_id'] = batch_id
            conn.execute(insert(staging_orders), record)

        # Record completion
        conn.execute(
            """INSERT INTO pipeline_checkpoints (batch_id, stage, completed_at)
               VALUES (%s, 'load', NOW())
               ON CONFLICT (batch_id, stage) DO UPDATE SET completed_at = NOW()""",
            batch_id
        )
```

#### Checkpointing
```python
import json
from pathlib import Path

class Checkpoint:
    def __init__(self, path='checkpoint.json'):
        self.path = Path(path)
        self.state = self._load()

    def _load(self):
        if self.path.exists():
            return json.loads(self.path.read_text())
        return {}

    def save(self, key, value):
        self.state[key] = value
        self.path.write_text(json.dumps(self.state))

    def get(self, key, default=None):
        return self.state.get(key, default)

# Usage:
checkpoint = Checkpoint()
last_processed_id = checkpoint.get('last_order_id', 0)
for order in fetch_orders_after(last_processed_id):
    process(order)
    checkpoint.save('last_order_id', order['id'])
```

---

### Data Quality

#### Validation Framework
```python
class DataQualityCheck:
    def __init__(self, name, check_fn, severity='error'):
        self.name = name
        self.check_fn = check_fn
        self.severity = severity  # 'error' = halt, 'warning' = log + continue

def run_quality_checks(df, checks):
    """Run all quality checks, return failures."""
    failures = []
    for check in checks:
        passed, details = check.check_fn(df)
        if not passed:
            failures.append({
                'check': check.name,
                'severity': check.severity,
                'details': details
            })
    return failures

# Define checks
checks = [
    DataQualityCheck('no_nulls_in_id', lambda df: (
        df['id'].notna().all(),
        f"{df['id'].isna().sum()} null IDs found"
    )),
    DataQualityCheck('email_format', lambda df: (
        df['email'].str.match(r'^[^@]+@[^@]+\.[^@]+$').all(),
        f"{(~df['email'].str.match(r'^[^@]+@[^@]+\\.[^@]+$')).sum()} invalid emails"
    )),
    DataQualityCheck('amount_positive', lambda df: (
        (df['amount'] > 0).all(),
        f"{(df['amount'] <= 0).sum()} non-positive amounts"
    )),
    DataQualityCheck('row_count_reasonable', lambda df: (
        100 < len(df) < 1000000,
        f"Row count {len(df)} outside expected range [100, 1M]"
    ), severity='warning'),
    DataQualityCheck('no_future_dates', lambda df: (
        (pd.to_datetime(df['created_at']) <= pd.Timestamp.now()).all(),
        f"Found {(pd.to_datetime(df['created_at']) > pd.Timestamp.now()).sum()} future dates"
    )),
]
```

#### Freshness SLA
```python
from datetime import datetime, timedelta

def check_freshness(engine, table, timestamp_column, max_age_hours=4):
    """Verify data is fresh enough."""
    result = engine.execute(
        f"SELECT MAX({timestamp_column}) FROM {table}"
    ).scalar()

    if result is None:
        return False, "Table is empty"

    age = datetime.utcnow() - result
    if age > timedelta(hours=max_age_hours):
        return False, f"Data is {age.total_seconds()/3600:.1f}h old (max: {max_age_hours}h)"

    return True, f"Data is {age.total_seconds()/60:.0f}min old"
```

#### Row Count Monitoring
```python
def check_row_count_anomaly(engine, table, lookback_days=30, threshold_pct=50):
    """Alert if today's row count differs significantly from historical average."""
    result = engine.execute(f"""
        WITH daily_counts AS (
            SELECT DATE(created_at) as day, COUNT(*) as cnt
            FROM {table}
            WHERE created_at > NOW() - INTERVAL '{lookback_days} days'
            GROUP BY DATE(created_at)
        )
        SELECT
            AVG(cnt) as avg_count,
            (SELECT COUNT(*) FROM {table} WHERE DATE(created_at) = CURRENT_DATE) as today_count
        FROM daily_counts
        WHERE day < CURRENT_DATE
    """).fetchone()

    avg_count = result['avg_count'] or 0
    today_count = result['today_count'] or 0

    if avg_count > 0:
        pct_diff = abs(today_count - avg_count) / avg_count * 100
        if pct_diff > threshold_pct:
            return False, f"Today: {today_count}, Avg: {avg_count:.0f}, Diff: {pct_diff:.0f}%"

    return True, f"Today: {today_count}, Avg: {avg_count:.0f}"
```

---

### Error Handling

#### Dead Letter Queue (DLQ)
```python
def process_with_dlq(records, process_fn, dlq):
    """Process records, send failures to dead letter queue."""
    succeeded = 0
    failed = 0

    for record in records:
        try:
            process_fn(record)
            succeeded += 1
        except Exception as e:
            failed += 1
            dlq.send({
                'original_record': record,
                'error': str(e),
                'error_type': type(e).__name__,
                'timestamp': datetime.utcnow().isoformat(),
                'retry_count': record.get('_retry_count', 0)
            })

    return {'succeeded': succeeded, 'failed': failed}
```

#### Poison Pill Detection
```python
MAX_RETRIES = 3

def process_with_poison_detection(record, process_fn, dlq):
    """Detect and quarantine records that repeatedly fail."""
    retry_count = record.get('_retry_count', 0)

    if retry_count >= MAX_RETRIES:
        # This record is a poison pill — quarantine it
        dlq.send({
            'record': record,
            'reason': 'poison_pill',
            'retries_exhausted': True
        })
        alert(f"Poison pill detected: {record.get('id')}")
        return False

    try:
        process_fn(record)
        return True
    except Exception:
        record['_retry_count'] = retry_count + 1
        retry_queue.send(record)
        return False
```

#### Circuit Breaker
```python
import time

class CircuitBreaker:
    def __init__(self, failure_threshold=5, recovery_timeout=60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = 'CLOSED'  # CLOSED = normal, OPEN = failing, HALF_OPEN = testing

    def call(self, func, *args, **kwargs):
        if self.state == 'OPEN':
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = 'HALF_OPEN'
            else:
                raise CircuitOpenError("Circuit breaker is OPEN")

        try:
            result = func(*args, **kwargs)
            if self.state == 'HALF_OPEN':
                self.state = 'CLOSED'
                self.failure_count = 0
            return result
        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()
            if self.failure_count >= self.failure_threshold:
                self.state = 'OPEN'
            raise
```

---

### Format Selection

| Format | Best For | Pros | Cons |
|---|---|---|---|
| **Parquet** | Analytics, data warehouse | Columnar, compressed (10:1), schema embedded, predicate pushdown | Not human-readable, append-only |
| **CSV** | Data exchange, small files | Universal, human-readable | No types, no compression, escaping issues |
| **JSON/JSONL** | API responses, logs, semi-structured | Flexible schema, human-readable | Verbose, slow to parse at scale |
| **Avro** | Streaming (Kafka), schema evolution | Compact binary, schema registry, backward/forward compatible | Requires schema registry for full benefit |
| **ORC** | Hive/Hadoop ecosystem | Similar to Parquet, better for Hive | Less universal than Parquet |

#### Parquet Best Practices
```python
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

# Write with compression and row groups
df.to_parquet(
    'orders.parquet',
    engine='pyarrow',
    compression='snappy',      # Fast decompression, decent ratio
    index=False,               # Don't persist DataFrame index
    row_group_size=100_000     # Optimize for predicate pushdown
)

# Read only needed columns (columnar advantage)
df = pd.read_parquet('orders.parquet', columns=['id', 'amount', 'status'])

# Partition by date for time-range queries
df.to_parquet(
    'data/orders/',
    engine='pyarrow',
    partition_cols=['year', 'month'],  # Creates year=2026/month=03/ directory structure
    compression='snappy'
)
```

---

### Streaming vs Batch

#### When to Use Batch
- Data doesn't need to be available for > 1 hour after creation
- Source system only exports periodically (nightly dump, weekly report)
- Complex transformations that need full dataset context (percentiles, rankings)
- Analytical queries (aggregations over large time ranges)
- Cost-sensitive workloads (batch is cheaper)

#### When to Use Streaming
- Latency requirement < 1 minute (fraud detection, monitoring, alerting)
- Event-driven architecture (user actions, IoT sensors)
- Source emits continuous events (clickstream, log tailing)
- Downstream consumers need real-time updates

#### Lambda Architecture
```
               +-- Batch Layer (hourly/daily) --> Batch View --+
Raw Events ---|                                                 |---> Query
               +-- Speed Layer (real-time) --> Real-time View --+
```
- Batch layer: complete, accurate, reprocessable (Spark, dbt)
- Speed layer: approximate, fast, recent data only (Kafka Streams, Flink)
- Serving layer: merges both views for queries

#### Kappa Architecture (simpler)
```
Raw Events --> Stream Processor --> Serving Layer --> Query
                    |
                    +-- Replay from beginning for reprocessing
```
- Single processing path: everything is a stream
- Reprocessing = replay the event log from the start
- Simpler to maintain but requires durable event log (Kafka with long retention)

---

### Monitoring

#### Key Metrics for Data Pipelines
| Metric | What to Track | Alert Threshold |
|---|---|---|
| Row count | Records processed per run | > 50% deviation from average |
| Latency | Time from source event to available in warehouse | > SLA (e.g., 4 hours) |
| Freshness | Age of newest record in destination | > max_age_hours |
| Error rate | Failed records / total records | > 1% |
| Duration | Pipeline execution time | > 2x historical average |
| Data drift | Schema changes, value distribution shifts | Any unexpected change |
| Null rate | Percentage of nulls per column | New nulls in previously non-null column |

#### Pipeline Logging Pattern
```python
import logging
import time

logger = logging.getLogger('pipeline')

def run_pipeline_stage(stage_name, func, *args, **kwargs):
    """Wrapper that logs timing and row counts for every stage."""
    start = time.time()
    logger.info(f"[{stage_name}] Starting")

    try:
        result = func(*args, **kwargs)
        duration = time.time() - start
        row_count = len(result) if hasattr(result, '__len__') else 'N/A'

        logger.info(f"[{stage_name}] Completed in {duration:.1f}s, rows={row_count}")
        emit_metric(f"pipeline.{stage_name}.duration_seconds", duration)
        emit_metric(f"pipeline.{stage_name}.row_count", row_count)

        return result
    except Exception as e:
        duration = time.time() - start
        logger.error(f"[{stage_name}] Failed after {duration:.1f}s: {e}")
        emit_metric(f"pipeline.{stage_name}.errors", 1)
        raise
```

---

### Tool Selection Guide

| Tool | Category | Use When |
|---|---|---|
| **pandas** | Transform | < 10GB, single machine, exploratory or small pipelines |
| **Polars** | Transform | 1-100GB, single machine, need speed (Rust-based, 5-10x faster than pandas) |
| **dbt** | Transform | SQL transforms in warehouse, need version control + testing + docs |
| **Apache Spark** | Transform | > 100GB, distributed processing, complex transformations |
| **Apache Airflow** | Orchestration | Complex DAGs, many dependencies, need scheduling + monitoring |
| **Prefect/Dagster** | Orchestration | Modern alternative to Airflow, better local dev experience |
| **Apache Kafka** | Streaming | High-throughput event streaming, durable log, pub/sub |
| **Kafka Connect** | Extract/Load | Standard connectors for databases, S3, APIs (no code) |
| **Apache Flink** | Streaming | Complex stream processing, event time, exactly-once |
| **Fivetran/Airbyte** | Extract/Load | Managed connectors, don't want to maintain extraction code |

#### Decision Flowchart
```
Is latency < 1 min required?
+-- Yes -> Streaming (Kafka + Flink/Kafka Streams)
+-- No -> How big is the data?
    +-- < 10GB -> pandas/Polars + cron or Airflow
    +-- 10-100GB -> Polars or Spark (single node)
    +-- > 100GB -> Spark cluster or cloud-native (BigQuery, Snowflake)
```

---

### Quick Reference Checklist

- [ ] Extract: Using CDC or timestamp-based incremental (not full dumps)
- [ ] Transform: Deduplication applied on natural key
- [ ] Load: Using upsert pattern (not truncate-and-reload)
- [ ] Orchestration: DAG with explicit dependencies and retry logic
- [ ] Idempotency: Pipeline safe to re-run without duplicates
- [ ] Checkpointing: Can resume from last successful point
- [ ] Data quality: Null checks, row counts, freshness SLA validated
- [ ] Error handling: Dead letter queue for failed records
- [ ] Monitoring: Duration, row count, error rate, freshness tracked
- [ ] Format: Using Parquet for analytics, JSONL for logs
- [ ] Schema evolution: New/removed columns handled gracefully
