# Example: Hourly ETL Pipeline from REST API to PostgreSQL

## Task
Sync order data from a third-party API to a PostgreSQL warehouse every hour.

## Solution

```python
import requests
import pandas as pd
from sqlalchemy import create_engine, text
from datetime import datetime, timedelta
import json
import time
import logging

logger = logging.getLogger(__name__)
engine = create_engine(os.environ['DATABASE_URL'])

# --- EXTRACT ---
def extract_orders(last_checkpoint: str) -> list:
    """Fetch orders modified since last checkpoint."""
    all_orders = []
    cursor = None

    while True:
        params = {
            'updated_after': last_checkpoint,
            'limit': 100,
        }
        if cursor:
            params['cursor'] = cursor

        response = requests.get(
            'https://api.vendor.com/v1/orders',
            params=params,
            headers={'Authorization': f'Bearer {os.environ["API_KEY"]}'},
            timeout=30
        )
        response.raise_for_status()
        data = response.json()

        all_orders.extend(data['orders'])
        cursor = data.get('next_cursor')
        if not cursor:
            break
        time.sleep(0.1)  # Rate limit courtesy

    logger.info(f"Extracted {len(all_orders)} orders")
    return all_orders

# --- TRANSFORM ---
def transform_orders(raw_orders: list) -> pd.DataFrame:
    """Clean and standardize order data."""
    df = pd.DataFrame(raw_orders)
    if df.empty:
        return df

    # Standardize types
    df['total_amount'] = pd.to_numeric(df['total_amount'], errors='coerce')
    df['created_at'] = pd.to_datetime(df['created_at'])
    df['updated_at'] = pd.to_datetime(df['updated_at'])
    df['email'] = df['email'].str.lower().str.strip()

    # Deduplicate (API may return duplicates across pages)
    df = df.drop_duplicates(subset='order_id', keep='last')

    return df[['order_id', 'email', 'status', 'total_amount', 'created_at', 'updated_at']]

# --- QUALITY ---
def validate(df: pd.DataFrame) -> bool:
    """Run quality checks before loading."""
    assert df['order_id'].notna().all(), "Found null order_ids"
    assert (df['total_amount'] >= 0).all(), "Found negative amounts"
    assert df['order_id'].is_unique, "Found duplicate order_ids"
    return True

# --- LOAD ---
def load_orders(df: pd.DataFrame, batch_id: str):
    """Upsert orders into warehouse (idempotent)."""
    with engine.begin() as conn:
        for _, row in df.iterrows():
            conn.execute(text("""
                INSERT INTO orders (order_id, email, status, total_amount, created_at, updated_at, batch_id)
                VALUES (:order_id, :email, :status, :total_amount, :created_at, :updated_at, :batch_id)
                ON CONFLICT (order_id) DO UPDATE SET
                    status = EXCLUDED.status,
                    total_amount = EXCLUDED.total_amount,
                    updated_at = EXCLUDED.updated_at,
                    batch_id = EXCLUDED.batch_id
            """), {**row.to_dict(), 'batch_id': batch_id})

# --- ORCHESTRATE ---
def run_pipeline():
    batch_id = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    checkpoint = load_checkpoint() or (datetime.utcnow() - timedelta(hours=2)).isoformat()

    raw = extract_orders(checkpoint)
    if not raw:
        logger.info("No new orders")
        return

    df = transform_orders(raw)
    validate(df)
    load_orders(df, batch_id)
    save_checkpoint(df['updated_at'].max().isoformat())

    logger.info(f"Pipeline complete: {len(df)} orders loaded, batch={batch_id}")
```

## Key Patterns Used
- **Incremental extraction**: Only fetches orders modified since last run
- **Cursor pagination**: Handles large result sets without offset issues
- **Deduplication**: Removes duplicate records before loading
- **Data quality checks**: Validates before loading to prevent bad data
- **Upsert loading**: INSERT ON CONFLICT makes the load idempotent
- **Checkpointing**: Saves progress so pipeline can resume after failure
- **Batch ID**: Every load tagged for traceability and debugging
