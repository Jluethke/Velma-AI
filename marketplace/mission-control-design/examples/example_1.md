# Mission Control Design Example: Building a Stat Card

## Glass Morphism Stat Card
```tsx
<div className="glass rounded-lg p-4">
  <div className="text-micro font-mono text-velma-text2 uppercase tracking-wider mb-1">
    Active Agents
  </div>
  <div className="text-hero font-mono text-velma-cyan text-glow-cyan">
    12
  </div>
</div>
```

## Status Indicator with Pulse
```tsx
<div className={`w-2 h-2 rounded-full ${
  status === 'active' ? 'bg-velma-green animate-pulse-dot' :
  status === 'idle'   ? 'bg-velma-gold' :
  'bg-velma-muted'
}`} />
```

## Primary Action Button
```tsx
<button className="px-4 py-2 bg-velma-cyan/10 border border-velma-cyan/30 rounded-lg
                   text-velma-cyan text-sm font-mono hover:bg-velma-cyan/20
                   transition-colors">
  Deploy Agent
</button>
```

## Key Rules
- Dark only, no light theme -- backgrounds start at #0a0a14
- All data (numbers, timestamps, IDs) use `font-mono`
- Cyan (#00ffc8) for primary actions, Gold (#ffd700) for warnings, Red (#ff4466) for danger
- Every card uses glass morphism with subtle border glow on hover
