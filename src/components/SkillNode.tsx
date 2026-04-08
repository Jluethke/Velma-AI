/**
 * SkillNode — custom node renderer for the visual chain composer.
 * Shows skill name, domain badge, and input/output ports.
 */
import { memo } from 'react';

interface SkillNodeProps {
  data: {
    label: string;
    domain: string;
    inputs: string[];
    outputs: string[];
    onRemove: () => void;
  };
  selected?: boolean;
}

const DOMAIN_COLORS: Record<string, string> = {
  life: '#00ff88',
  career: '#00ffc8',
  business: '#a855f7',
  health: '#22c55e',
  developer: '#00bfff',
  finance: '#ffd700',
  creative: '#ff69b4',
  education: '#00ffc8',
  'real estate': '#ffa500',
  general: '#888',
};

function getDomainColor(domain: string): string {
  return DOMAIN_COLORS[domain.toLowerCase()] ?? DOMAIN_COLORS.general;
}

function SkillNodeComponent({ data, selected }: SkillNodeProps) {
  const color = getDomainColor(data.domain);

  return (
    <div
      style={{
        background: 'rgba(15, 15, 25, 0.95)',
        border: `2px solid ${selected ? 'var(--cyan)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px',
        padding: '0',
        minWidth: '200px',
        fontFamily: 'monospace',
        boxShadow: selected ? '0 0 20px rgba(0,255,200,0.2)' : '0 4px 12px rgba(0,0,0,0.3)',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>
          {data.label}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); data.onRemove(); }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.3)',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '0 2px',
          }}
          title="Remove skill"
        >
          x
        </button>
      </div>

      {/* Domain badge */}
      <div style={{ padding: '6px 12px' }}>
        <span
          style={{
            background: `${color}20`,
            color: color,
            border: `1px solid ${color}40`,
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {data.domain}
        </span>
      </div>

      {/* Ports */}
      <div style={{ padding: '4px 12px 8px', display: 'flex', gap: '16px' }}>
        {/* Inputs */}
        {data.inputs.length > 0 && (
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginBottom: '3px', textTransform: 'uppercase' }}>
              Inputs
            </div>
            {data.inputs.slice(0, 4).map(input => (
              <div
                key={input}
                style={{
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.5)',
                  padding: '1px 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {input}
              </div>
            ))}
            {data.inputs.length > 4 && (
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>
                +{data.inputs.length - 4} more
              </div>
            )}
          </div>
        )}

        {/* Outputs */}
        {data.outputs.length > 0 && (
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginBottom: '3px', textTransform: 'uppercase' }}>
              Outputs
            </div>
            {data.outputs.slice(0, 4).map(output => (
              <div
                key={output}
                style={{
                  fontSize: '10px',
                  color: 'rgba(0,255,200,0.6)',
                  padding: '1px 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {output}
              </div>
            ))}
            {data.outputs.length > 4 && (
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>
                +{data.outputs.length - 4} more
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(SkillNodeComponent);
