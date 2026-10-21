# RAG Qdrant Collection Index

**One-line description:** Creates a Qdrant collection with named dense vectors and cosine distance, uploads chunks with valid point ids and payload, creates payload indexes for filter fields, waits until HNSW indexing is complete, and tunes `hnsw_ef` by recall against `exact=True` search.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `chunk_config` (object, required): From `rag-chunk-size-select`.
- `embedding_choice` (object, required): From `rag-embedding-model-select`.
- `eval_harness` (string, required): Path to `eval_retrieval.py`.
- `qdrant_url` (string, required): For example `http://localhost:6333`, plus an API key in the `QDRANT_API_KEY` environment variable for a secured instance.
- `target_ann_recall` (number, required): Minimum fraction of the exact top-k the HNSW search must return. A user decision.

---

## Outputs

- `vector_index` (object): `store` `qdrant`, collection name, vector name `dense`, distance, HNSW config, payload indexes, chosen `hnsw_ef`, Qdrant server and client versions.
- `ann_recall_report` (string): Path to `work_dir/index/qdrant_ann.json` with ANN recall@k against exact per `hnsw_ef`, latency, `indexed_vectors_count`, and the harness result for `work_dir/runs/dense.run`.

---

## Phase 1: Server and Collection

### Entry Criteria
- `curl -s $QDRANT_URL/healthz` (or `GET /`) answers.

### Actions
1. Local server: `docker run -p 6333:6333 -p 6334:6334 -v "$(pwd)/qdrant_storage:/qdrant/storage" qdrant/qdrant`. Pin an image tag in real deployments.
2. `pip install qdrant-client`. Record the server version from `GET /` and `pip show qdrant-client`. Keep client and server on compatible versions; the Query API used below exists from server 1.10.
3. Create the collection with a named dense vector so a sparse vector can be added later for hybrid search:
   `client.create_collection(collection_name="chunks", vectors_config={"dense": models.VectorParams(size=<dimension>, distance=models.Distance.COSINE)}, sparse_vectors_config={"bm25": models.SparseVectorParams(modifier=models.Modifier.IDF)})`.
   Qdrant normalizes vectors for `COSINE` at insert time.
4. Default HNSW settings are `m=16`, `ef_construct=100`; leave them unless Phase 3 fails to reach the target.

### Output
Empty collection.

### Quality Gate
- `client.get_collection("chunks").config.params.vectors["dense"].size` equals `dimension`.

---

## Phase 2: Upload Points and Payload Indexes

### Entry Criteria
- Collection exists.

### Actions
1. Point ids must be unsigned integers or UUID strings. A string like `"9f2c41d0:section-512-64:3"` is rejected. Derive a stable id with `str(uuid.uuid5(uuid.NAMESPACE_URL, chunk_id))` and keep `chunk_id` in the payload.
2. Payload per point: `chunk_id`, `doc_id`, `char_start`, `char_end`, `section_path`, `text`, and filter fields from `metadata` (for example `tenant`, `doc_type`, `published`).
3. Upload in batches: `client.upload_points("chunks", points=(models.PointStruct(id=..., vector={"dense": vec}, payload=...) for ...), batch_size=<n>, parallel=<n>)`. Check the client docs for `upload_points` argument names in your version.
4. Create a payload index for every field used in filters: `client.create_payload_index("chunks", field_name="tenant", field_schema=models.PayloadSchemaType.KEYWORD)`; use `INTEGER`, `FLOAT`, `DATETIME` or `BOOL` to match the data. Without payload indexes, filtered search is slow and the HNSW graph does not get the extra filter-aware links.
5. Wait for indexing: poll `client.get_collection("chunks")` until `status` is `green`. Then read `indexed_vectors_count`: it is either near `points_count` (HNSW built; a small remainder can sit in an unindexed segment) or 0. Small collections stay below the optimizer's `indexing_threshold` and are searched by full scan; that is expected and exact.

### Output
Loaded and indexed collection.

### Quality Gate
- `client.count("chunks", exact=True).count` equals the chunk count.
- `get_collection` shows `status` green and lists every payload index in `payload_schema`.

---

## Phase 3: Tune hnsw_ef by Recall

### Entry Criteria
- Status green.

### Actions
1. Ground truth per dev question: `client.query_points("chunks", query=qvec, using="dense", limit=k, search_params=models.SearchParams(exact=True))`.
2. Sweep `hnsw_ef` values (at least k): `search_params=models.SearchParams(hnsw_ef=v)`. ANN recall@k = overlap / k.
3. Choose the smallest `hnsw_ef` whose ANN recall@k is at or above `target_ann_recall`. If `indexed_vectors_count` is 0, every setting returns exact results; note that the sweep is meaningless until the collection grows past the threshold.
4. Write `work_dir/runs/dense.run` (map point ids back through the `chunk_id` payload) and score with the harness against the exact run.

### Output
`vector_index`, `ann_recall_report`.

### Quality Gate
- `qdrant_ann.json` contains recall and latency for each `hnsw_ef` and the `indexed_vectors_count` at test time.
- The harness comparison between `dense.run` and exact is recorded with its p-value.

---

## Worked Example

Illustrative.

```
server 1.12.x client 1.12.x
upload_points 9,207 points batch_size=256 in 41 s
payload indexes: tenant KEYWORD, doc_type KEYWORD, published DATETIME
get_collection: status=green points_count=9207 indexed_vectors_count=9207
hnsw_ef  ann_recall@9  p50 ms
16       0.951         1.9
64       0.991         2.6
chosen hnsw_ef=64; dense.run hit_rate@9 0.873 vs exact 0.874 (p=0.82)
```

---

## Exit Criteria

DONE when every chunk is a point with a valid id and payload, filter fields have payload indexes, indexing is green, and `hnsw_ef` is chosen by recall against exact search.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Client warns about incompatible server version | **Adjust**: install the client matching the server's major and minor version. |
| Phase 2 | `Unable to parse UUID` or 400 on upsert | **Adjust**: use `uuid5` ids; keep the original id in payload. |
| Phase 2 | Status stays yellow for long | **Retry**: wait and poll; check server logs for the optimizer. |
| Phase 3 | Wrong vector name error | **Adjust**: pass `using="dense"` on named-vector collections. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
