import { Link } from 'react-router-dom';
import { analytics } from '../hooks/useAnalytics';

interface PostFlowCTAProps {
  completedFlowSlug: string;
  completedFlowDomain?: string;
}

const NEXT_FLOW_MAP: Record<string, { name: string; slug: string; reason: string }[]> = {
  career: [
    { name: 'Salary Negotiator', slug: 'salary-negotiator', reason: 'Negotiate your next raise' },
    { name: 'Resume Builder', slug: 'resume-builder', reason: 'Update your resume' },
    { name: 'Interview Coach', slug: 'interview-coach', reason: 'Practice interview questions' },
  ],
  money: [
    { name: 'Expense Optimizer', slug: 'expense-optimizer', reason: 'Cut unnecessary spending' },
    { name: 'Retirement Planner', slug: 'retirement-planner', reason: 'Plan for the future' },
    { name: 'Money Truth', slug: 'money-truth', reason: 'Get your full financial picture' },
  ],
  health: [
    { name: 'Meal Planner', slug: 'meal-planner', reason: 'Plan healthy meals' },
    { name: 'Fitness Starter', slug: 'fitness-starter', reason: 'Start an exercise routine' },
    { name: 'Habit Builder', slug: 'habit-builder', reason: 'Build lasting habits' },
  ],
  life: [
    { name: 'Decision Analyzer', slug: 'decision-analyzer', reason: 'Weigh your options' },
    { name: 'Life OS', slug: 'life-os', reason: 'Build your life operating system' },
    { name: 'Daily Planner', slug: 'daily-planner', reason: 'Structure your day' },
  ],
  developer: [
    { name: 'Code Review', slug: 'code-review', reason: 'Get your code reviewed' },
    { name: 'Refactor Planner', slug: 'refactor-planner', reason: 'Plan your next refactor' },
    { name: 'API Design', slug: 'api-design', reason: 'Design a clean API' },
  ],
};

export default function PostFlowCTA({ completedFlowSlug, completedFlowDomain }: PostFlowCTAProps) {
  const domain = completedFlowDomain || 'life';
  const suggestions = NEXT_FLOW_MAP[domain] || NEXT_FLOW_MAP.life;
  // Filter out the flow they just completed
  const filtered = suggestions.filter(s => s.slug !== completedFlowSlug).slice(0, 2);

  return (
    <div className="glass-card p-5 mt-6" style={{ borderColor: 'rgba(74,222,128,0.15)' }}>
      <div className="flex items-center gap-2 mb-4">
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
        <span className="text-xs font-semibold" style={{ color: 'var(--green)' }}>Flow complete</span>
      </div>

      {filtered.length > 0 && (
        <>
          <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
            Keep going — try a related flow:
          </p>
          <div className="flex flex-col gap-2 mb-4">
            {filtered.map(flow => (
              <Link
                key={flow.slug}
                to={`/flow/${flow.slug}`}
                className="flex items-center justify-between px-3 py-2 rounded-lg no-underline"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}
                onClick={() => analytics.ctaClicked(`post-flow-${flow.slug}`, 'flow-complete')}
              >
                <div>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{flow.name}</span>
                  <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>{flow.reason}</span>
                </div>
                <span className="text-xs" style={{ color: 'var(--cyan)' }}>&rarr;</span>
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="flex items-center gap-4">
        <Link
          to="/explore"
          className="text-xs no-underline font-semibold"
          style={{ color: 'var(--cyan)' }}
          onClick={() => analytics.ctaClicked('browse-more', 'flow-complete')}
        >
          Browse all flows &rarr;
        </Link>
      </div>
    </div>
  );
}
