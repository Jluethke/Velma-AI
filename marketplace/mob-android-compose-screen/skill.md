# Jetpack Compose Screen From a State Machine

**One-line description:** Implements one screen with a `ViewModel` exposing a single `StateFlow<UiState>` of a sealed interface, a pure `reduce` function for the transition table, effects launched in `viewModelScope`, lifecycle-aware collection with `collectAsStateWithLifecycle`, a stateless content composable with one `@Preview` per state, and `testTag`s for UI tests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`; read the DI library and lifecycle version.
- `screen_state_machine` (object, required): From `mob-screen-state-machine`.

---

## Outputs

- `android_screen_impl` (object): Paths of the state/reducer file, ViewModel and composable; build and lint exit codes; reducer test path and result.

---

## Phase 1: Write the State Types and Reducer

### Entry Criteria
- `app_profile.stack` is `android`.
- Baseline `./gradlew :app:assembleDebug` exited 0.

### Actions
1. Create `<Screen>State.kt` with only data types and the pure function:
```kotlin
sealed interface OrdersUiState {
    data object Loading : OrdersUiState
    data class Content(val items: List<Order>, val isRefreshing: Boolean, val isStale: Boolean) : OrdersUiState
    data object Empty : OrdersUiState
    data class Error(val kind: ErrorKind) : OrdersUiState
}
sealed interface OrdersEvent { data object Appear : OrdersEvent; data object Refresh : OrdersEvent; data object Retry : OrdersEvent
    data class LoadSucceeded(val items: List<Order>) : OrdersEvent; data class LoadFailed(val kind: ErrorKind) : OrdersEvent }
sealed interface OrdersEffect { data object Load : OrdersEffect; data object CancelLoad : OrdersEffect; data class ShowMessage(val text: String) : OrdersEffect }

fun reduce(s: OrdersUiState, e: OrdersEvent): Pair<OrdersUiState, List<OrdersEffect>> = when {
    s is OrdersUiState.Error && e is OrdersEvent.Retry -> OrdersUiState.Loading to listOf(OrdersEffect.Load)
    s is OrdersUiState.Content && !s.isRefreshing && e is OrdersEvent.Refresh -> s.copy(isRefreshing = true) to listOf(OrdersEffect.Load)
    // one branch per non-ignored cell
    else -> s to emptyList()   // ignored cells, listed in a comment
}
```
   `data object` needs Kotlin 1.9 or later; on older Kotlin use `object`.
2. No Android imports in this file. It must compile as plain Kotlin so JVM unit tests run without an emulator.

### Output
`<Screen>State.kt`.

### Quality Gate
- `grep -c " -> " <Screen>State.kt` inside `reduce` equals non-ignored cells plus one (`else`).
- `grep -c "^import android" <Screen>State.kt` prints 0.

---

## Phase 2: ViewModel and Composables

### Entry Criteria
- Phase 1 compiles: `./gradlew :app:compileDebugKotlin` exit 0.

### Actions
1. ViewModel:
```kotlin
@HiltViewModel   // only if app_profile.libraries.di is Hilt
class OrdersViewModel @Inject constructor(private val repo: OrdersRepository, private val saved: SavedStateHandle) : ViewModel() {
    private val _state = MutableStateFlow<OrdersUiState>(OrdersUiState.Loading)
    val state: StateFlow<OrdersUiState> = _state.asStateFlow()
    private var loadJob: Job? = null
    fun onEvent(e: OrdersEvent) {
        var fx: List<OrdersEffect> = emptyList()
        _state.update { val (n, f) = reduce(it, e); fx = f; n }
        fx.forEach(::run)
    }
    private fun run(fx: OrdersEffect) = when (fx) {
        OrdersEffect.Load -> { loadJob?.cancel(); loadJob = viewModelScope.launch {
            runCatching { repo.fetch() }.fold({ onEvent(OrdersEvent.LoadSucceeded(it)) }, { if (it is CancellationException) throw it; onEvent(OrdersEvent.LoadFailed(ErrorKind.from(it))) }) } }
        OrdersEffect.CancelLoad -> loadJob?.cancel()
        is OrdersEffect.ShowMessage -> Unit   // exposed through a separate Channel/SharedFlow
    }
}
```
   Never swallow `CancellationException`; rethrow it, or cancellation breaks.
2. Route composable collects state: `val state by viewModel.state.collectAsStateWithLifecycle()` (artifact `androidx.lifecycle:lifecycle-runtime-compose`; add it only if absent from `app_profile`). Emit `Appear` from `LaunchedEffect(Unit) { viewModel.onEvent(OrdersEvent.Appear) }`.
3. Content composable is stateless: `fun OrdersContent(state: OrdersUiState, onEvent: (OrdersEvent) -> Unit)`. Do NOT pass the ViewModel into child composables. Branch with an exhaustive `when (state)`.
4. Pull to refresh: if Material3 version in `app_profile` has `PullToRefreshBox` use it; otherwise keep the existing refresh component. Check the `androidx.compose.material3` release notes instead of guessing the API.
5. Add `Modifier.testTag("orders.error")` etc. from `screen_state_machine.test_cases`.
6. One `@Preview` per state calling `OrdersContent` with a fixed state.
7. Restoration: store only fields listed in `screen_state_machine.restoration` in `SavedStateHandle`.

### Output
ViewModel and composable files.

### Quality Gate
- `./gradlew :app:assembleDebug` exits 0.
- `./gradlew :app:lintDebug` reports no new issues compared with baseline (compare counts in `app/build/reports/lint-results-debug.txt`).
- `grep -c "@Preview" OrdersScreen.kt` equals the state count.

---

## Phase 3: Unit-Test the Reducer and ViewModel

### Entry Criteria
- Phase 2 builds.

### Actions
1. `OrdersReducerTest.kt` in `app/src/test/`: one `@Test` per transition case, or a JUnit parameterized test, asserting both state and effects.
2. ViewModel test with `kotlinx-coroutines-test`: a `MainDispatcherRule` that calls `Dispatchers.setMain(StandardTestDispatcher())`, `runTest { ... advanceUntilIdle() }`, fake repository. Assert `Retry` from `Error` ends in `Content`.
3. Run: `./gradlew :app:testDebugUnitTest --tests "*Orders*"`.

### Output
`android_screen_impl`.

### Quality Gate
- `BUILD SUCCESSFUL` and the XML in `app/build/test-results/testDebugUnitTest/` shows `failures="0"` and `tests` equal to the case count plus ViewModel tests.

---

## Worked Example

Illustrative only. Orders screen, Hilt present, Material3 1.3.1.

Phase 1: 21 branches plus `else`. Phase 2: `PullToRefreshBox(isRefreshing = s.isRefreshing, onRefresh = { onEvent(OrdersEvent.Refresh) })`; lint baseline 12 warnings, after 12.

Phase 3:
```
$ ./gradlew :app:testDebugUnitTest --tests "*Orders*"
OrdersReducerTest > retry_fromError_goesLoading PASSED
...
BUILD SUCCESSFUL in 18s
$ grep -o 'tests="[0-9]*" .*failures="[0-9]*"' app/build/test-results/testDebugUnitTest/TEST-*OrdersReducerTest.xml
tests="23" skipped="0" failures="0"
```

---

## Exit Criteria

DONE when the screen renders from one `StateFlow`, the reducer is pure and fully tested, previews exist per state, and build, lint and unit tests are green.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `'when' expression must be exhaustive` | **Adjust**: add the missing state branch; do not add an `else` in the composable `when`. |
| Phase 2 | `Unresolved reference: collectAsStateWithLifecycle` | **Adjust**: add `lifecycle-runtime-compose` at the same version as the other lifecycle artifacts. |
| Phase 2 | Hilt `@HiltViewModel` crash (`Cannot create an instance of class`) | **Adjust**: the Activity needs `@AndroidEntryPoint` and the composable must use `hiltViewModel()`. |
| Phase 3 | `Module with the Main dispatcher had failed to initialize` | **Adjust**: add the `MainDispatcherRule`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
