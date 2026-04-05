# Mission Control Design System

Design and build cyberpunk-themed dashboard interfaces with glass morphism, glow effects, and dense data visualization using React 19, Tailwind CSS v4, and the Velma design system.

## Execution Pattern: Phase Pipeline

```
PHASE 1: REQUIREMENTS  --> Identify dashboard purpose, data sources, user roles
PHASE 2: LAYOUT        --> Design zone structure, navigation, responsive breakpoints
PHASE 3: COMPONENTS    --> Select/build components (cards, gauges, charts, status indicators)
PHASE 4: THEME         --> Apply design system (colors, typography, animations, effects)
PHASE 5: INTEGRATE     --> Wire data sources, add real-time updates, test responsiveness
```

## Inputs

- **dashboard_purpose**: string -- What the dashboard monitors or controls
- **data_sources**: list[string] -- APIs, WebSocket feeds, or state stores providing data
- **user_roles**: list[string] (optional) -- Who uses this dashboard (operator, analyst, commander)
- **zone_requirements**: list[string] (optional) -- Specific sections or widgets needed

## Outputs

- **layout_spec**: object -- Zone structure, grid layout, responsive breakpoints
- **component_list**: list[object] -- Components selected/built with props and styling
- **themed_code**: string -- React + Tailwind code using the Velma design system
- **integration_plan**: object -- Data wiring, real-time update strategy, state management hooks

## Execution

### Phase 1: REQUIREMENTS -- Identify Purpose & Data
**Entry criteria:** A dashboard need has been identified (monitoring, control, visualization).
**Actions:**
1. Identify the dashboard's primary purpose (executive overview, operational monitoring, trading, memory exploration)
2. Catalog data sources and their update frequencies (real-time, polling, on-demand)
3. Identify user roles and what each needs to see
4. Map to the existing route structure if extending Mission Control:
   - `/` Dashboard (overview), `/value-engine` (trading), `/memory` (NeuroFS), `/ops` (operations), `/telemetry`
5. Determine information density requirements (command center vs consumer app)
**Output:** Requirements document with purpose, data sources, user roles, and density level.
**Quality gate:** Purpose is clear. At least one data source identified. Information density matches command center aesthetic (dense, not spacious).

### Phase 2: LAYOUT -- Design Zone Structure
**Entry criteria:** Requirements document complete.
**Actions:**
1. Design the zone structure following the dashboard composition pattern:
   - Header (identity + mode indicator)
   - Hero zone (primary metric or summary)
   - Stat cards row (key numbers)
   - Primary content (2/3 + 1/3 split or full width)
   - Secondary content (1/3 + 1/3 + 1/3 row)
   - Overlays (full-screen, triggered by clicks)
2. Plan navigation: sidebar integration, keyboard shortcuts (Ctrl+1-5 for zones)
3. Define responsive breakpoints for different screen sizes
4. Plan lazy loading strategy: `lazy(() => import('./pages/...'))` with PageLoader fallback
**Output:** Zone layout specification with grid proportions, navigation plan, and loading strategy.
**Quality gate:** Layout uses the provider stack order (Auth > Velma > Theme > Bridge > EventBus > Chat > Toast). All zones have defined content. Grid proportions add up correctly.

### Phase 3: COMPONENTS -- Select & Build
**Entry criteria:** Zone layout defined with specific content areas.
**Actions:**
1. Select from existing component patterns:
   - **Card**: `glass glass-hover rounded-lg p-4` with translucent borders
   - **Status Indicator**: Pulsing dot with color mapping (green=active, gold=idle, muted=offline)
   - **Badge**: `text-micro font-mono px-2 py-0.5 rounded-full` with translucent background
   - **Modal**: Fixed overlay with `bg-black/60 backdrop-blur-sm`, glass panel with `animate-scale-in`
   - **Stat Card**: Micro label + hero number with `text-glow-cyan`
   - **Button**: Primary (cyan), danger (red), secondary (uppercase tracking)
   - **Input**: `bg-velma-bg2` with cyan focus ring
2. Build custom components for domain-specific needs
3. Apply hex badge clip path for specialized indicators
4. Plan overlay patterns for detail views (SubsystemDetailOverlay pattern)
**Output:** Component inventory with selected patterns, custom component specs, and props.
**Quality gate:** Every zone has assigned components. No generic/unstyled components. All interactive elements have hover/focus states.

### Phase 4: THEME -- Apply Design System
**Entry criteria:** Components selected and custom components specified.
**Actions:**
1. Apply the Velma color palette:
   - Backgrounds: `velma-bg` (#0a0a14), `velma-bg2` (#111120), `velma-card` (#12121f)
   - Borders: translucent cyan at 0.08/0.15/0.25 opacity levels
   - Accents: cyan (primary), green (success), gold (warning), red (danger), purple (memory), pink (StreamShark)
   - Text: `velma-text` (#e8e8f0), `velma-text2` (#9999bb), `velma-muted` (#8b8fa8)
2. Apply typography:
   - `font-mono` for all data: numbers, statuses, timestamps, IDs
   - `font-sans` for headings and descriptions
   - Scale: micro (10px) -> caption (11px) -> body (12px) -> label (14px) -> title (18px) -> hero (24px)
3. Apply visual effects:
   - Glass morphism on all cards and panels
   - Glow effects on interactive elements (`glow-cyan`, `glow-cyan-strong`)
   - Grid background on main content areas (40px grid)
   - Boot sequence animations for initial load
4. Apply animations: `animate-fade-in`, `animate-slide-in`, `animate-scale-in`, `animate-pulse-glow`
5. Apply scrollbar styling (6px, cyan thumb on dark track)
6. Enforce design rules: dark only, monospace for data, cyan is primary, dense information, glow on interaction
**Output:** Fully themed components with correct colors, typography, effects, and animations.
**Quality gate:** All 10 design rules satisfied. No light backgrounds. All data in monospace. Cyan used for primary actions. Glass morphism on all surfaces.

### Phase 5: INTEGRATE -- Wire Data & Test
**Entry criteria:** Themed components ready with design system applied.
**Actions:**
1. Wire state management:
   - VelmaContext (useReducer + localStorage, version 8+)
   - Custom hooks: useVelma, useAgents, useTasks, useCalendar, useMemory, useContent, usePortfolio, useActivities
2. Add real-time updates (polling intervals, WebSocket connections)
3. Wire keyboard shortcuts (Ctrl+K command palette, Ctrl+/ focus chat, Ctrl+1-5 zones)
4. Add toast notifications for action feedback
5. Test responsiveness across breakpoints
6. Wrap in error boundary: `<RouteErrorBoundary><Suspense fallback={<PageLoader />}>`
7. Add chat integration via `useChatContext()`
**Output:** Fully integrated dashboard with live data, keyboard navigation, and error handling.
**Quality gate:** All data sources connected. Keyboard shortcuts working. Error boundaries in place. Toast notifications functional. Page loads with boot animation.

## Exit Criteria

- Dashboard renders with correct zone layout and all components styled
- All 10 design rules enforced (dark only, monospace data, cyan primary, glass morphism, etc.)
- Data sources wired with appropriate update frequencies
- Keyboard navigation and command palette functional
- Error boundaries and loading states in place
- Responsive across target breakpoints

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| REQUIREMENTS | No data sources identified | **Adjust** -- use mock data, design for future data integration |
| LAYOUT | Zone proportions don't fit viewport | **Adjust** -- restructure grid, move content to overlays |
| COMPONENTS | Required component pattern doesn't exist | **Adjust** -- build custom component following glass morphism pattern |
| THEME | Color contrast fails accessibility check | **Adjust** -- increase opacity on text/borders while maintaining dark theme |
| INTEGRATE | Data source unavailable or rate-limited | **Adjust** -- add skeleton loading states, cache last known data |

## State Persistence

- VelmaContext state (localStorage key: `velma-mission-control-state`, versioned with migration)
- User layout preferences (collapsed sidebar, selected zone)
- Last known data snapshots (for offline rendering)

## Reference

### Tech Stack

- **React 19** + **Vite** (latest)
- **Tailwind CSS v4** (uses `@theme` in CSS, NOT tailwind.config.js)
- **react-router-dom v7** (BrowserRouter + Routes/Route pattern)
- **Express 5.2** backend (port 3141)
- **lucide-react** for icons
- **@dnd-kit** for drag-and-drop

### Color Palette (velma-* prefix in Tailwind)

All colors defined in `src/index.css` under `@theme`:

**Backgrounds:**
```css
--color-velma-bg:         #0a0a14;
--color-velma-bg2:        #111120;
--color-velma-card:       #12121f;
--color-velma-card-hover: #181830;
```

**Borders (translucent cyan):**
```css
--color-velma-border:  rgba(0, 255, 200, 0.08);
--color-velma-border2: rgba(0, 255, 200, 0.15);
--color-velma-border3: rgba(0, 255, 200, 0.25);
```

**Accent Colors:**
```css
--color-velma-cyan:   #00ffc8;   /* PRIMARY */
--color-velma-green:  #00ff88;   /* success */
--color-velma-gold:   #ffd700;   /* warnings, commander */
--color-velma-red:    #ff4466;   /* errors, danger */
--color-velma-purple: #aa88ff;   /* memory, NeuroPRIN */
--color-velma-pink:   #ff66aa;   /* StreamShark */
--color-velma-orange: #ff8844;   /* in-progress */
--color-velma-blue:   #44aaff;   /* infrastructure */
```

**Text:**
```css
--color-velma-text:  #e8e8f0;
--color-velma-text2: #9999bb;
--color-velma-muted: #8b8fa8;
```

**Component-Specific Color Maps:**
```typescript
NeurOS:       #00ffc8 (cyan)
NeuroPRIN:    #aa88ff (purple)
Value Engine: #00ff88 (green)
StreamShark:  #ff66aa (pink)
Wayfinder:    #ffd700 (gold)
Terra Unita:  #44aaff (blue)
General:      #8b8fa8 (muted)
```

### Typography

**System fonts (no Google Fonts import required):**
```css
--font-sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'Cascadia Code', 'Fira Code', 'SF Mono', Consolas, monospace;
```

**Scale (rem-based):**
```css
--text-micro:   0.625rem;    /* 10px -- badges, timestamps */
--text-caption: 0.6875rem;   /* 11px -- secondary labels */
--text-body:    0.75rem;     /* 12px -- primary body */
--text-label:   0.875rem;    /* 14px -- labels, nav items */
--text-title:   1.125rem;    /* 18px -- section titles */
--text-hero:    1.5rem;      /* 24px -- dashboard hero values */
```

### Visual Effects

**Glass Morphism:**
```css
.glass {
  background: rgba(18, 18, 31, 0.8);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(0, 255, 200, 0.08);
}
.glass-hover:hover {
  background: rgba(24, 24, 48, 0.8);
  border-color: rgba(0, 255, 200, 0.15);
  box-shadow: 0 0 20px rgba(0, 255, 200, 0.08);
}
```

**Glow Effects:**
```css
.glow-cyan        { box-shadow: 0 0 12px rgba(0, 255, 200, 0.2); }
.glow-cyan-strong { box-shadow: 0 0 24px rgba(0, 255, 200, 0.35); }
.text-glow-cyan   { text-shadow: 0 0 12px rgba(0, 255, 200, 0.5); }
.text-glow-gold   { text-shadow: 0 0 12px rgba(255, 215, 0, 0.5); }
```

**Background Grid:**
```css
.bg-grid {
  background-image:
    linear-gradient(rgba(0, 255, 200, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 200, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}
```

### Animations

| Animation | Class | Effect |
|-----------|-------|--------|
| pulse-glow | animate-pulse-glow | Box shadow pulse (cyan, 2s) |
| pulse-dot | animate-pulse-dot | Opacity + scale pulse for status dots (2s) |
| fade-in | animate-fade-in | Opacity 0->1 |
| slide-in | animate-slide-in | Slide from left (-12px) |
| scale-in | animate-scale-in | Scale from 0.95 |
| boot-line | animate-boot-line | Slide up from 4px |
| slide-up | animate-slide-up | Slide up from 40px |
| page-enter | animate-page-enter | Slide up 8px + fade |
| skeleton-shimmer | skeleton | Loading shimmer effect |

### Component Patterns

**Card:**
```tsx
<div className="glass glass-hover rounded-lg p-4">{/* content */}</div>
```

**Status Indicator:**
```tsx
<div className={`w-2 h-2 rounded-full ${
  status === 'active' ? 'bg-velma-green animate-pulse-dot' :
  status === 'idle' ? 'bg-velma-gold' : 'bg-velma-muted'
}`} />
```

**Badge:**
```tsx
<span className="text-micro font-mono px-2 py-0.5 rounded-full"
      style={{ backgroundColor: `${color}20`, color }}>{label}</span>
```

**Modal:**
```tsx
<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
  <div className="glass rounded-xl p-6 max-w-lg w-full mx-4 animate-scale-in">{/* content */}</div>
</div>
```

**Stat Card:**
```tsx
<div className="glass rounded-lg p-4">
  <div className="text-micro font-mono text-velma-text2 uppercase tracking-wider mb-1">{label}</div>
  <div className="text-hero font-mono text-velma-cyan text-glow-cyan">{value}</div>
</div>
```

**Buttons:**
```tsx
// Primary
<button className="px-4 py-2 bg-velma-cyan/10 border border-velma-cyan/30 rounded-lg text-velma-cyan text-sm font-mono hover:bg-velma-cyan/20 transition-colors">
// Danger
<button className="px-4 py-2 bg-velma-red/10 border border-velma-red/30 rounded-lg text-velma-red text-sm font-mono hover:bg-velma-red/20 transition-colors">
```

### Application Architecture

**Provider Stack (outermost to innermost):**
```tsx
<AuthProvider>
  <VelmaProvider>
    <ThemeProvider>
      <BridgeProvider>
        <EventBusProvider>
          <ChatProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </ChatProvider>
        </EventBusProvider>
      </BridgeProvider>
    </ThemeProvider>
  </VelmaProvider>
</AuthProvider>
```

### Design Rules (Non-Negotiable)

1. **Dark only** -- no light theme, ever
2. **Monospace for data** -- numbers, statuses, timestamps, IDs always use font-mono
3. **Cyan is primary** -- all active states, links, focus rings, primary actions
4. **Gold is warning/commander** -- secondary highlights, warnings
5. **Red is danger only** -- errors, critical states, destructive actions
6. **Glass morphism everywhere** -- cards, modals, overlays all use glass pattern
7. **Subtle animations** -- 150-300ms transitions, no jarring movements
8. **Dense information** -- command center aesthetic, not consumer app spacing
9. **Glow on interaction** -- hover/focus/active states should have subtle glow
10. **Grid background** -- subtle 40px grid on main content areas
