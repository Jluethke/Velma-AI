# Example: Optimizing a Slow Dashboard Query

## Problem
A dashboard query takes 8 seconds to load. It shows order totals by product category for the last 30 days.

```sql
SELECT
    p.category,
    COUNT(*) as order_count,
    SUM(oi.quantity * oi.unit_price) as total_revenue
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
WHERE o.status = 'completed'
  AND o.created_at > NOW() - INTERVAL '30 days'
GROUP BY p.category
ORDER BY total_revenue DESC;
```

## Diagnosis

Run `EXPLAIN ANALYZE` and find:
- Seq Scan on orders (2M rows, filtering to 50K)
- Nested Loop join on order_items (no index on order_id FK)
- Missing index on orders.status + orders.created_at

## Solution

### Step 1: Add composite index (equality first, range second)
```sql
CREATE INDEX idx_orders_status_created
ON orders(status, created_at);
```
This covers `WHERE status = 'completed' AND created_at > ...` efficiently.

### Step 2: Index the foreign key on order_items
```sql
CREATE INDEX idx_order_items_order_id
ON order_items(order_id);
```

### Step 3: Add covering index to avoid table lookups
```sql
CREATE INDEX idx_order_items_covering
ON order_items(order_id) INCLUDE (product_id, quantity, unit_price);
```

## Result
- Query drops from 8 seconds to 45ms
- EXPLAIN shows Index Scan on orders, Index Only Scan on order_items
- No table restructuring needed, just proper indexes

## Key Principles Applied
- Composite index with equality column (status) before range column (created_at)
- Foreign key indexed (PostgreSQL does not auto-create FK indexes)
- Covering index eliminates table lookups for order_items
