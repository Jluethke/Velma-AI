/**
 * ChainComposer — Visual DAG editor for composing skill chains.
 * Uses @xyflow/react for the interactive graph canvas.
 *
 * - Loads ALL 176 marketplace skills from /skill-catalog.json
 * - Nodes have top (input) and bottom (output) handles for drag-to-connect
 * - Drag from bottom handle of one node to top handle of another to create flow
 */
import { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import SkillNodeComponent from '../components/SkillNode';
import SkillPalette, { type PaletteSkill } from '../components/SkillPalette';

// ---------------------------------------------------------------------------
// Custom node type — wraps SkillNodeComponent with ReactFlow handles
// ---------------------------------------------------------------------------

const nodeTypes: NodeTypes = {
  skillNode: ({ data, selected }: { data: Record<string, unknown>; selected?: boolean }) => (
    <SkillNodeComponent
      data={data as { label: string; domain: string; inputs: string[]; outputs: string[]; onRemove: () => void }}
      selected={selected}
    />
  ),
};

// ---------------------------------------------------------------------------
// ChainComposer Page
// ---------------------------------------------------------------------------

export default function ChainComposer() {
  const [skills, setSkills] = useState<PaletteSkill[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [chainName, setChainName] = useState('my-chain');
  const [chainDescription, setChainDescription] = useState('');
  const [chainCategory, setChainCategory] = useState('general');
  const [exportJson, setExportJson] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Load full skill catalog from static JSON
  useEffect(() => {
    fetch('/skill-catalog.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: PaletteSkill[]) => {
        setSkills(data);
        setLoadError(null);
      })
      .catch(err => {
        setLoadError(`Could not load skill catalog: ${err.message}`);
        // Fallback: minimal set so composer is still usable
        setSkills([
          { name: 'budget-builder', domain: 'finance', description: 'Build a comprehensive budget', tags: ['money'], inputs: ['income', 'fixed_expenses'], outputs: ['spending_snapshot', 'action_plan'] },
          { name: 'career-pivot', domain: 'career', description: 'Plan a career transition', tags: ['career'], inputs: ['current_role', 'target_role'], outputs: ['gap_analysis', 'transition_plan'] },
          { name: 'am-i-okay', domain: 'life', description: 'Personal wellbeing check-in', tags: ['wellbeing'], inputs: ['current_state'], outputs: ['assessment', 'recommendations'] },
        ]);
      });
  }, []);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge({
      ...connection,
      style: { stroke: 'var(--cyan)', strokeWidth: 2 },
      animated: true,
    }, eds)),
    [],
  );

  const handleAddSkill = useCallback((skill: PaletteSkill) => {
    const id = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const x = 300 + (nodes.length % 3) * 320;
    const y = 80 + Math.floor(nodes.length / 3) * 250;

    const newNode: Node = {
      id,
      type: 'skillNode',
      position: { x, y },
      data: {
        label: skill.name,
        domain: skill.domain,
        inputs: skill.inputs,
        outputs: skill.outputs,
        onRemove: () => {
          setNodes(prev => prev.filter(n => n.id !== id));
          setEdges(prev => prev.filter(e => e.source !== id && e.target !== id));
        },
      },
    };

    setNodes(prev => [...prev, newNode]);
  }, [nodes.length]);

  const handleValidate = useCallback(() => {
    const errors: string[] = [];

    if (nodes.length === 0) {
      errors.push('Add at least one skill');
    }

    if (!chainName.trim()) {
      errors.push('Chain name is required');
    }

    // Cycle detection via topological sort
    const adjList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    for (const node of nodes) {
      adjList.set(node.id, []);
      inDegree.set(node.id, 0);
    }
    for (const edge of edges) {
      adjList.get(edge.source)?.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    }
    const queue = [...inDegree.entries()].filter(([, d]) => d === 0).map(([id]) => id);
    let visited = 0;
    while (queue.length > 0) {
      const curr = queue.shift()!;
      visited++;
      for (const next of adjList.get(curr) ?? []) {
        const nd = (inDegree.get(next) ?? 1) - 1;
        inDegree.set(next, nd);
        if (nd === 0) queue.push(next);
      }
    }
    if (visited !== nodes.length && nodes.length > 1) {
      errors.push('Chain has a cycle — remove a connection');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, [nodes, edges, chainName]);

  const handleExport = useCallback(() => {
    if (!handleValidate()) return;

    // Build dependency map
    const deps = new Map<string, Set<string>>();
    for (const node of nodes) deps.set(node.id, new Set());
    for (const edge of edges) deps.get(edge.target)?.add(edge.source);

    const aliasMap = new Map(nodes.map(n => [
      n.id,
      (n.data.label as string).replace(/-/g, '_'),
    ]));

    // Topological sort
    const sorted: Node[] = [];
    const vis = new Set<string>();
    const visit = (id: string) => {
      if (vis.has(id)) return;
      vis.add(id);
      for (const dep of deps.get(id) ?? []) visit(dep);
      const node = nodes.find(n => n.id === id);
      if (node) sorted.push(node);
    };
    for (const node of nodes) visit(node.id);

    const chain = {
      name: chainName,
      description: chainDescription,
      category: chainCategory,
      steps: sorted.map(node => ({
        skill_name: node.data.label as string,
        alias: (node.data.label as string).replace(/-/g, '_'),
        depends_on: [...(deps.get(node.id) ?? [])].map(d => aliasMap.get(d) ?? d),
        config: {},
        phase_filter: null,
      })),
    };

    setExportJson(JSON.stringify(chain, null, 2));
  }, [nodes, edges, chainName, chainDescription, chainCategory, handleValidate]);

  const handleClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setExportJson(null);
    setValidationErrors([]);
  }, []);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', marginTop: '60px' }}>
      {/* Left: Skill Palette */}
      <SkillPalette skills={skills} onAddSkill={handleAddSkill} />

      {/* Center: Canvas + Controls */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div
          style={{
            padding: '8px 16px',
            background: 'rgba(10, 10, 15, 0.95)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <input
            type="text"
            value={chainName}
            onChange={e => setChainName(e.target.value)}
            placeholder="Chain name"
            style={{
              padding: '4px 8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '13px',
              width: '160px',
              outline: 'none',
            }}
          />
          <input
            type="text"
            value={chainDescription}
            onChange={e => setChainDescription(e.target.value)}
            placeholder="Description"
            style={{
              padding: '4px 8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '13px',
              flex: 1,
              minWidth: '200px',
              outline: 'none',
            }}
          />
          <select
            value={chainCategory}
            onChange={e => setChainCategory(e.target.value)}
            style={{
              padding: '4px 8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            {['general', 'life', 'career', 'business', 'developer', 'health', 'finance', 'creative', 'education', 'ai', 'real estate'].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleValidate}
              style={{
                padding: '4px 12px',
                background: 'rgba(0,255,200,0.08)',
                border: '1px solid rgba(0,255,200,0.2)',
                borderRadius: '4px',
                color: 'var(--cyan)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Validate
            </button>
            <button
              onClick={handleExport}
              style={{
                padding: '4px 12px',
                background: 'rgba(0,255,200,0.15)',
                border: '1px solid rgba(0,255,200,0.3)',
                borderRadius: '4px',
                color: 'var(--cyan)',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Export .chain.json
            </button>
            <button
              onClick={handleClear}
              style={{
                padding: '4px 12px',
                background: 'rgba(255,100,100,0.08)',
                border: '1px solid rgba(255,100,100,0.2)',
                borderRadius: '4px',
                color: '#ff6464',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>

          {/* Node count */}
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
            {nodes.length} skills / {edges.length} connections
          </span>
        </div>

        {/* Load error */}
        {loadError && (
          <div style={{
            padding: '6px 16px',
            background: 'rgba(255,200,0,0.08)',
            borderBottom: '1px solid rgba(255,200,0,0.2)',
            fontSize: '12px',
            color: '#ffc800',
          }}>
            {loadError} — showing fallback skills
          </div>
        )}

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div style={{
            padding: '6px 16px',
            background: 'rgba(255,100,100,0.08)',
            borderBottom: '1px solid rgba(255,100,100,0.2)',
            fontSize: '12px',
            color: '#ff6464',
          }}>
            {validationErrors.join(' | ')}
          </div>
        )}

        {/* Canvas */}
        <div style={{ flex: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            style={{ background: '#0a0a0f' }}
            defaultEdgeOptions={{
              style: { stroke: 'rgba(0,255,200,0.4)', strokeWidth: 2 },
              animated: true,
            }}
          >
            <Controls
              style={{ background: 'rgba(15,15,25,0.9)', borderColor: 'rgba(255,255,255,0.1)' }}
            />
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="rgba(255,255,255,0.05)"
            />
          </ReactFlow>
        </div>

        {/* Empty state hint */}
        {nodes.length === 0 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-20%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>&#x1F9E9;</div>
            <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.25)', marginBottom: '6px' }}>
              Click skills in the palette to add them
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.15)' }}>
              Drag from the <span style={{ color: 'var(--cyan)' }}>cyan dot</span> (bottom) to the <span style={{ color: '#ff6b6b' }}>red dot</span> (top) to connect
            </div>
          </div>
        )}

        {/* Export panel */}
        {exportJson && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(10, 10, 15, 0.95)',
            borderTop: '1px solid rgba(0,255,200,0.2)',
            maxHeight: '200px',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--cyan)', fontWeight: 600 }}>
                Exported Chain
              </span>
              <button
                onClick={() => { navigator.clipboard.writeText(exportJson); }}
                style={{
                  padding: '2px 8px',
                  background: 'rgba(0,255,200,0.08)',
                  border: '1px solid rgba(0,255,200,0.2)',
                  borderRadius: '4px',
                  color: 'var(--cyan)',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                Copy
              </button>
            </div>
            <pre style={{
              margin: 0,
              fontSize: '11px',
              color: 'rgba(255,255,255,0.6)',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}>
              {exportJson}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
