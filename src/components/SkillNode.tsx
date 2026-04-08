/**
 * SkillNode — custom node for the visual chain composer.
 *
 * Features:
 * - Domain-colored badge
 * - Input/output port lists
 * - ReactFlow handles for drag-to-connect
 * - Click to expand and customize inputs/outputs (dev mode)
 * - Tracks modifications as derivatives for royalty splitting
 */
import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';

interface SkillNodeProps {
  data: {
    label: string;
    domain: string;
    inputs: string[];
    outputs: string[];
    onRemove: () => void;
    /** Called when inputs/outputs are customized */
    onCustomize?: (inputs: string[], outputs: string[]) => void;
    /** Whether this node has been customized from the original */
    isCustomized?: boolean;
  };
  selected?: boolean;
}

const DOMAIN_COLORS: Record<string, string> = {
  life: '#00ff88', career: '#00ffc8', business: '#a855f7', health: '#22c55e',
  engineering: '#00bfff', finance: '#ffd700', marketing: '#ff69b4',
  ai: '#a855f7', data: '#00bfff', learning: '#00ffc8', legal: '#ffa500',
  thinking: '#88ccff', meta: '#888', general: '#888',
};

function getDomainColor(domain: string): string {
  return DOMAIN_COLORS[domain.toLowerCase()] ?? DOMAIN_COLORS.general;
}

function SkillNodeComponent({ data, selected }: SkillNodeProps) {
  const color = getDomainColor(data.domain);
  const [expanded, setExpanded] = useState(false);
  const [editingInputs, setEditingInputs] = useState(false);
  const [editingOutputs, setEditingOutputs] = useState(false);
  const [inputDraft, setInputDraft] = useState('');
  const [outputDraft, setOutputDraft] = useState('');

  const handleAddInput = () => {
    const trimmed = inputDraft.trim().toLowerCase().replace(/\s+/g, '_');
    if (trimmed && !data.inputs.includes(trimmed) && data.onCustomize) {
      data.onCustomize([...data.inputs, trimmed], data.outputs);
      setInputDraft('');
    }
  };

  const handleRemoveInput = (input: string) => {
    if (data.onCustomize) {
      data.onCustomize(data.inputs.filter(i => i !== input), data.outputs);
    }
  };

  const handleAddOutput = () => {
    const trimmed = outputDraft.trim().toLowerCase().replace(/\s+/g, '_');
    if (trimmed && !data.outputs.includes(trimmed) && data.onCustomize) {
      data.onCustomize(data.inputs, [...data.outputs, trimmed]);
      setOutputDraft('');
    }
  };

  const handleRemoveOutput = (output: string) => {
    if (data.onCustomize) {
      data.onCustomize(data.inputs, data.outputs.filter(o => o !== output));
    }
  };

  return (
    <div
      style={{
        background: 'rgba(15, 15, 25, 0.95)',
        border: `2px solid ${data.isCustomized ? 'var(--gold)' : selected ? 'var(--cyan)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px',
        minWidth: '220px',
        maxWidth: expanded ? '340px' : '280px',
        fontFamily: 'monospace',
        boxShadow: selected ? '0 0 20px rgba(0,255,200,0.2)' : '0 4px 12px rgba(0,0,0,0.3)',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      {/* Input handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: '#ff6b6b', border: '2px solid rgba(255,107,107,0.5)',
          width: '12px', height: '12px', top: '-6px',
        }}
      />

      {/* Header */}
      <div
        style={{
          padding: '10px 12px 6px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>
            {data.label}
          </span>
          {data.isCustomized && (
            <span style={{ fontSize: '9px', color: 'var(--gold)', background: 'rgba(255,215,0,0.1)', padding: '1px 4px', borderRadius: '3px', border: '1px solid rgba(255,215,0,0.2)' }}>
              modified
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>
            {expanded ? '\u25B2' : '\u25BC'}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); data.onRemove(); }}
            style={{
              background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
              fontSize: '14px', padding: '0 2px', lineHeight: 1,
            }}
            title="Remove skill"
          >
            x
          </button>
        </div>
      </div>

      {/* Domain badge */}
      <div style={{ padding: '0 12px 6px' }}>
        <span
          style={{
            background: `${color}20`, color, border: `1px solid ${color}40`,
            borderRadius: '4px', padding: '2px 6px',
            fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px',
          }}
        >
          {data.domain}
        </span>
      </div>

      {/* Ports — compact view */}
      {!expanded && (
        <div style={{ padding: '4px 12px 10px', display: 'flex', gap: '16px' }}>
          {data.inputs.length > 0 && (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginBottom: '3px', textTransform: 'uppercase' }}>In</div>
              {data.inputs.slice(0, 3).map(input => (
                <div key={input} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', padding: '1px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{input}</div>
              ))}
              {data.inputs.length > 3 && <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>+{data.inputs.length - 3}</div>}
            </div>
          )}
          {data.outputs.length > 0 && (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginBottom: '3px', textTransform: 'uppercase' }}>Out</div>
              {data.outputs.slice(0, 3).map(output => (
                <div key={output} style={{ fontSize: '10px', color: 'rgba(0,255,200,0.6)', padding: '1px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{output}</div>
              ))}
              {data.outputs.length > 3 && <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>+{data.outputs.length - 3}</div>}
            </div>
          )}
          {data.inputs.length === 0 && data.outputs.length === 0 && (
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>Click to customize</div>
          )}
        </div>
      )}

      {/* Expanded: editable inputs/outputs */}
      {expanded && (
        <div style={{ padding: '4px 12px 10px' }}>
          {/* Inputs */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Inputs</span>
              <button
                onClick={(e) => { e.stopPropagation(); setEditingInputs(!editingInputs); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--cyan)', fontSize: '9px', cursor: 'pointer', padding: 0 }}
              >
                {editingInputs ? 'done' : 'edit'}
              </button>
            </div>
            {data.inputs.map(input => (
              <div key={input} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '1px 0' }}>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', flex: 1 }}>{input}</span>
                {editingInputs && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoveInput(input); }}
                    style={{ background: 'transparent', border: 'none', color: '#ff6464', fontSize: '10px', cursor: 'pointer', padding: '0 2px' }}
                  >-</button>
                )}
              </div>
            ))}
            {editingInputs && (
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                <input
                  type="text"
                  value={inputDraft}
                  onChange={e => setInputDraft(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddInput()}
                  placeholder="new_input"
                  onClick={e => e.stopPropagation()}
                  style={{
                    flex: 1, padding: '2px 4px', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '3px',
                    color: '#fff', fontSize: '10px', outline: 'none',
                  }}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); handleAddInput(); }}
                  style={{ background: 'rgba(0,255,200,0.1)', border: '1px solid rgba(0,255,200,0.2)', borderRadius: '3px', color: 'var(--cyan)', fontSize: '10px', cursor: 'pointer', padding: '2px 6px' }}
                >+</button>
              </div>
            )}
          </div>

          {/* Outputs */}
          <div>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Outputs</span>
              <button
                onClick={(e) => { e.stopPropagation(); setEditingOutputs(!editingOutputs); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--cyan)', fontSize: '9px', cursor: 'pointer', padding: 0 }}
              >
                {editingOutputs ? 'done' : 'edit'}
              </button>
            </div>
            {data.outputs.map(output => (
              <div key={output} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '1px 0' }}>
                <span style={{ fontSize: '10px', color: 'rgba(0,255,200,0.6)', flex: 1 }}>{output}</span>
                {editingOutputs && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoveOutput(output); }}
                    style={{ background: 'transparent', border: 'none', color: '#ff6464', fontSize: '10px', cursor: 'pointer', padding: '0 2px' }}
                  >-</button>
                )}
              </div>
            ))}
            {editingOutputs && (
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                <input
                  type="text"
                  value={outputDraft}
                  onChange={e => setOutputDraft(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddOutput()}
                  placeholder="new_output"
                  onClick={e => e.stopPropagation()}
                  style={{
                    flex: 1, padding: '2px 4px', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '3px',
                    color: '#fff', fontSize: '10px', outline: 'none',
                  }}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); handleAddOutput(); }}
                  style={{ background: 'rgba(0,255,200,0.1)', border: '1px solid rgba(0,255,200,0.2)', borderRadius: '3px', color: 'var(--cyan)', fontSize: '10px', cursor: 'pointer', padding: '2px 6px' }}
                >+</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Output handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: 'var(--cyan)', border: '2px solid rgba(0,255,200,0.5)',
          width: '12px', height: '12px', bottom: '-6px',
        }}
      />
    </div>
  );
}

export default memo(SkillNodeComponent);
