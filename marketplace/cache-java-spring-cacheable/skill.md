# Java Spring Cacheable With Redis or Caffeine

**One-line description:** Adds Spring Cache abstraction caching to one Spring Boot hotspot with `@Cacheable`, `@CacheEvict` and a transaction-aware Redis or Caffeine cache manager, per-cache TTLs, explicit keys, and avoids the self-invocation proxy trap, proven with a test that counts repository calls.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the Spring Boot project.
- `key_schema` (object[], required): Key templates from `cache-key-schema-design`.
- `ttl_table` (object[], required): TTL per entry type from `cache-ttl-from-change-rate`.
- `invalidation_plan` (object[], required): Strategy and writer list from `cache-invalidation-strategy-select`.

---

## Outputs

- `cache_aside_change` (object): Files changed, annotated methods, cache manager configuration, the test command and its output, and the Spring Boot version.

---

## Phase 1: Configure the Cache Manager

### Entry Criteria
- `./mvnw test` or `./gradlew test` passes before any change; record the summary.

### Actions
1. Record the Spring Boot version from `pom.xml` or `build.gradle`.
2. Pick the provider from `cache_plan`: shared tier = Redis (`spring-boot-starter-data-redis` plus `spring-boot-starter-cache`); in-process = Caffeine (`com.github.ben-manes.caffeine:caffeine` plus `spring-boot-starter-cache`).
3. Add `@EnableCaching` to one `@Configuration` class.
4. Redis: define a `RedisCacheManager` bean so each cache gets its own TTL and evictions follow the transaction:

   ```java
   @Bean
   RedisCacheManager cacheManager(RedisConnectionFactory cf) {
       RedisCacheConfiguration base = RedisCacheConfiguration.defaultCacheConfig()
           .prefixCacheNameWith("shop:")
           .serializeValuesWith(SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()));
       return RedisCacheManager.builder(cf)
           .cacheDefaults(base)
           .withCacheConfiguration("product", base.entryTtl(Duration.ofSeconds(PRODUCT_TTL)))
           .transactionAware()
           .enableStatistics()
           .build();
   }
   ```
   `transactionAware()` delays `put` and `evict` until the surrounding Spring transaction commits. Without it, an `@CacheEvict` inside a `@Transactional` method can run before the commit.
   Do not use the default JDK serializer: it stores Java serialization bytes that break when a class changes.
5. Caffeine: set `spring.cache.caffeine.spec=maximumSize=<n>,expireAfterWrite=<ttl>s,recordStats` in `application.properties`, with `<n>` = the heap budget for this cache (a user input) divided by the measured size of one entry (measure with a heap dump or JOL `GraphLayout.parseInstance(obj).totalSize()`), and `spring.cache.cache-names=product`.
6. Check the property names against your Boot version's "Common Application Properties" appendix before using any other `spring.cache.*` key.

### Output
Cache manager configured; app starts.

### Quality Gate
- The app context loads: an existing `@SpringBootTest` passes.
- `grep -rn "@EnableCaching" src/main` prints exactly one line.

---

## Phase 2: Annotate the Read and Write Paths

### Entry Criteria
- Cache manager configured.

### Actions
1. Write a failing test first: `@SpringBootTest` with `@MockBean` (or `@MockitoBean` on Boot 3.4 and later) for the repository; call the service twice with the same id; `verify(repo, times(1)).findById(42L)`.
2. Annotate the PUBLIC service method that calls the repository: `@Cacheable(cacheNames = "product", key = "#id", unless = "#result == null")`. Set the key explicitly. The default key generator uses all parameters, which breaks when a parameter is added.
3. Self-invocation trap: Spring caching works through a proxy. A call from another method in the SAME class (`this.getProduct(id)`) bypasses the proxy and is never cached. The caller must be a different bean.
4. Writers: annotate with `@CacheEvict(cacheNames = "product", key = "#product.id")`, or `@CachePut` for `write-through` rows (the method must return the saved value). Do not put `@Cacheable` and `@CachePut` on the same method.
5. `unless = "#result == null"` keeps missing rows out of the cache until `cache-negative-result-caching` decides how to handle them. For Redis, `RedisCacheConfiguration` caches null values unless `disableCachingNullValues()` is called; decide explicitly and record it.
6. Run the test; it must pass. Then add a test that saves through the writer and asserts the next read calls the repository again.

### Output
Annotated methods and passing tests.

### Quality Gate
- The repository-call-count tests pass.
- `grep -rn "@Cacheable" src/main` shows `key =` on every line.

---

## Phase 3: Verify Against Real Redis

### Entry Criteria
- Unit-level tests pass.

### Actions
1. Run the cache tests against a real Redis with Testcontainers (`org.testcontainers:testcontainers` and a `GenericContainer<>("redis:7").withExposedPorts(6379)` wired through `@DynamicPropertySource` to `spring.data.redis.host` and `spring.data.redis.port`; on Boot 2.x the prefix is `spring.redis`).
2. In the test, after a read, assert the key exists with a TTL: `redisTemplate.getExpire("shop:product::42")` is positive. With `prefixCacheNameWith("shop:")` the stored key has the form `shop:product::42`; print the actual keys with `redis-cli --scan --pattern 'shop:*'` if unsure.
3. Run the full suite.

### Output
`cache_aside_change`.

### Quality Gate
- Full test task exits 0.
- The TTL assertion passes with a positive value.

---

## Worked Example

Illustrative. Spring Boot 3.3, entry `product`, TTL 300 s, Redis.

Phase 1: `RedisCacheManager` bean added in `CacheConfig.java` with `transactionAware()`.

Phase 2: test first fails `Wanted 1 time but was 2`. `ProductService.getProduct` gets `@Cacheable(cacheNames="product", key="#id", unless="#result == null")`; `ProductAdminService.update` gets `@CacheEvict(cacheNames="product", key="#product.id")`. Tests pass.

Phase 3: Testcontainers run; `redis-cli --scan --pattern 'shop:*'` prints `shop:product::42`; `getExpire` returns 300. `./mvnw test` prints `Tests run: 311, Failures: 0, Errors: 0`.

---

## Exit Criteria

DONE when the hotspot is cached through the proxy with an explicit key and per-cache TTL, writers evict after commit, and tests pass against a real Redis.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `SerializationException` on read | **Adjust**: the value type lacks a default constructor or has polymorphic fields; configure the Jackson serializer for that type; do not fall back to JDK serialization. |
| Phase 2 | Repository still called twice | **Adjust**: check for self-invocation and a missing `@EnableCaching`. |
| Phase 2 | Eviction happens before commit | **Adjust**: add `transactionAware()` or move eviction to `@TransactionalEventListener(phase = AFTER_COMMIT)`. |
| Phase 3 | Docker unavailable for Testcontainers | **Return**: report the real-Redis verification as not run; do not claim it passed. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
