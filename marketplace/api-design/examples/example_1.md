# Example: Designing an E-Commerce Order API

## Task
Design REST API endpoints for an e-commerce order management system.

## Solution

### Endpoints

```
# Orders
GET    /api/v1/orders                  # List orders (paginated, filterable)
GET    /api/v1/orders/:id              # Get single order
POST   /api/v1/orders                  # Create order
PATCH  /api/v1/orders/:id              # Update order (partial)
DELETE /api/v1/orders/:id              # Cancel order

# Order items (nested under order)
GET    /api/v1/orders/:id/items        # List items in order
POST   /api/v1/orders/:id/items        # Add item to order

# Order actions (RPC-style)
POST   /api/v1/orders/:id/submit       # Submit for processing
POST   /api/v1/orders/:id/refund       # Initiate refund
```

### Pagination (cursor-based)

```
GET /api/v1/orders?limit=20&cursor=eyJpZCI6MTAwfQ==&status=shipped
```

Response:
```json
{
  "data": [
    {
      "id": "ord_abc123",
      "status": "shipped",
      "total": 59.99,
      "created_at": "2026-03-30T10:00:00Z",
      "items_count": 3,
      "_links": {
        "self": "/api/v1/orders/ord_abc123",
        "items": "/api/v1/orders/ord_abc123/items"
      }
    }
  ],
  "pagination": {
    "next_cursor": "eyJpZCI6MTIwfQ==",
    "has_more": true
  }
}
```

### Create Order (201 + Location)

```
POST /api/v1/orders
Content-Type: application/json
Authorization: Bearer eyJ...

{
  "items": [
    {"product_id": "prod_xyz", "quantity": 2}
  ],
  "shipping_address_id": "addr_456"
}
```

Response:
```
HTTP/1.1 201 Created
Location: /api/v1/orders/ord_new789
X-RateLimit-Remaining: 998

{
  "id": "ord_new789",
  "status": "draft",
  "total": 59.98,
  "created_at": "2026-03-31T14:30:00Z"
}
```

### Error Response (RFC 7807)

```
HTTP/1.1 422 Unprocessable Entity

{
  "type": "https://api.shop.com/errors/out-of-stock",
  "title": "Product Out of Stock",
  "status": 422,
  "detail": "Product 'prod_xyz' only has 1 unit available but 2 were requested.",
  "instance": "/api/v1/orders",
  "trace_id": "req_abc123",
  "errors": [
    {
      "field": "items[0].quantity",
      "message": "Requested quantity exceeds available stock",
      "value": 2
    }
  ]
}
```

## Why This Works
- Plural nouns, no verbs in URLs
- Cursor pagination for stable feed traversal
- 201 + Location for creation
- RFC 7807 errors with field-level details and trace_id
- Rate limit headers on every response
- HATEOAS links for discoverability
