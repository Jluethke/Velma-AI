/**
 * Studio — unified one-stop-shop for creating and chaining flows.
 *
 * Tab 1 "Create Flow": NL description → generates skill.md + manifest.json (FlowStudio)
 * Tab 2 "Chain Flows": visual DAG editor for composing flow pipelines (ChainComposer)
 *
 * URL: /studio?tab=create (default) | /studio?tab=chain
 */
import { useSearchParams } from 'react-router-dom';
import FlowStudio from './FlowStudio';
import ChainComposer from './ChainComposer';

const NAV_H = 60;
const TAB_H = 46;

type StudioTab = 'create' | 'chain';

const TABS: { key: StudioTab; label: string; desc: string }[] = [
  { key: 'create', label: 'Create Flow', desc: 'NL → skill.md + manifest' },
  { key: 'chain', label: 'Chain Flows', desc: 'Visual DAG composer' },
];

export default function Studio() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') ?? 'create') as StudioTab;

  const setTab = (tab: StudioTab) => {
    setSearchParams({ tab }, { replace: true });
  };

  const isChain = activeTab === 'chain';

  return (
    <div style={{
      marginTop: NAV_H,
      height: `calc(100vh - ${NAV_H}px)`,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Tab bar */}
      <div style={{
        height: TAB_H,
        minHeight: TAB_H,
        display: 'flex',
        alignItems: 'stretch',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
        paddingLeft: '16px',
        gap: '4px',
        flexShrink: 0,
      }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setTab(tab.key)}
            style={{
              padding: '0 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid var(--cyan)' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'monospace',
              fontWeight: activeTab === tab.key ? 700 : 400,
              color: activeTab === tab.key ? 'var(--cyan)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'color 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
            <span style={{
              fontSize: '10px',
              fontWeight: 400,
              color: activeTab === tab.key ? 'rgba(0,229,255,0.6)' : 'var(--text-secondary)',
              opacity: 0.7,
            }}>
              {tab.desc}
            </span>
          </button>
        ))}
      </div>

      {/* Content area */}
      <div style={{
        flex: 1,
        overflow: isChain ? 'hidden' : 'auto',
        minHeight: 0,
      }}>
        {activeTab === 'create' && (
          <div style={{ paddingTop: '32px' }}>
            <FlowStudio embedded />
          </div>
        )}
        {activeTab === 'chain' && <ChainComposer embedded />}
      </div>
    </div>
  );
}
