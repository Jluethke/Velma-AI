import { useParams, Link } from 'react-router-dom';
import { useMeta } from '../hooks/useMeta';
import { analytics } from '../hooks/useAnalytics';

interface UseCaseData {
  slug: string;
  title: string;
  h1: string;
  description: string;
  longDescription: string;
  flows: { name: string; slug: string; description: string }[];
  keywords: string[];
}

const USE_CASES: Record<string, UseCaseData> = {
  career: {
    slug: 'career',
    title: 'AI Career Planning Flows — FlowFabric',
    h1: 'AI-powered career planning, step by step',
    description: 'Free AI workflows for job interviews, salary negotiation, career change, resume writing, and professional development. No account needed.',
    longDescription: 'Whether you are preparing for an interview, negotiating a raise, planning a career pivot, or updating your resume, FlowFabric has a structured AI workflow that walks you through it phase by phase. Each flow asks the right questions, processes your situation, and delivers specific, actionable guidance — not generic advice.',
    flows: [
      { name: 'Interview Coach', slug: 'interview-coach', description: 'Practice answers to likely interview questions with AI feedback' },
      { name: 'Salary Negotiator', slug: 'salary-negotiator', description: 'Build your case, rehearse the conversation, plan your BATNA' },
      { name: 'Resume Builder', slug: 'resume-builder', description: 'Structured resume creation with ATS optimization' },
      { name: 'Career Decision Analyzer', slug: 'decision-analyzer', description: 'Weigh options systematically when facing a career crossroads' },
    ],
    keywords: ['AI career coach', 'AI interview prep', 'AI salary negotiation', 'AI resume builder'],
  },
  money: {
    slug: 'money',
    title: 'AI Money & Budget Flows — FlowFabric',
    h1: 'AI-powered budgeting and financial planning',
    description: 'Free AI workflows for budgeting, expense tracking, retirement planning, investment strategy, and financial decision-making. No account needed.',
    longDescription: 'Take control of your finances with structured AI workflows that guide you through budgeting, expense optimization, retirement planning, and investment decisions. Each flow runs phase by phase, asking the right questions about your situation and delivering a personalized financial plan — not generic tips.',
    flows: [
      { name: 'Budget Builder', slug: 'budget-builder', description: 'Build a realistic monthly budget based on your actual spending' },
      { name: 'Expense Optimizer', slug: 'expense-optimizer', description: 'Find and eliminate unnecessary spending systematically' },
      { name: 'Retirement Planner', slug: 'retirement-planner', description: 'Calculate your retirement number and build a savings roadmap' },
      { name: 'Money Truth', slug: 'money-truth', description: 'Get an honest assessment of your financial health' },
    ],
    keywords: ['AI budget planner', 'AI financial advisor free', 'AI retirement calculator', 'AI expense tracker'],
  },
  health: {
    slug: 'health',
    title: 'AI Health & Wellness Flows — FlowFabric',
    h1: 'AI-powered health and wellness planning',
    description: 'Free AI workflows for meal planning, fitness routines, nutrition tracking, and wellness habits. No account needed.',
    longDescription: 'Build healthier habits with structured AI workflows for meal planning, exercise routines, nutrition optimization, and medication tracking. Each flow walks you through your goals, preferences, and constraints to create a plan that actually fits your life.',
    flows: [
      { name: 'Meal Planner', slug: 'meal-planner', description: 'Weekly meal plans based on your diet, budget, and preferences' },
      { name: 'Fitness Starter', slug: 'fitness-starter', description: 'A beginner-friendly exercise plan tailored to your level' },
      { name: 'Nutrition Optimizer', slug: 'nutrition-optimizer', description: 'Analyze and improve your daily nutrition intake' },
      { name: 'Habit Builder', slug: 'habit-builder', description: 'Design and stick to new habits with a structured system' },
    ],
    keywords: ['AI meal planner', 'AI fitness plan', 'AI nutrition tracker', 'AI habit tracker'],
  },
  goals: {
    slug: 'goals',
    title: 'AI Goal Setting & Life Planning Flows — FlowFabric',
    h1: 'AI-powered goal setting that actually works',
    description: 'Free AI workflows for 90-day goals, life planning, decision-making, and personal development. No account needed.',
    longDescription: 'Stop setting goals that fade after a week. FlowFabric goal-setting flows break down your ambitions into milestones, weekly tasks, and risk plans — delivered phase by phase so you leave with an actionable roadmap, not a vague intention.',
    flows: [
      { name: 'Life OS', slug: 'life-os', description: 'Build a complete operating system for your life goals' },
      { name: 'Decision Analyzer', slug: 'decision-analyzer', description: 'Systematically weigh major life decisions' },
      { name: 'Daily Planner', slug: 'daily-planner', description: 'Structure your day for maximum impact' },
      { name: 'Future Self Letter', slug: 'future-self-letter', description: 'Write to your future self and clarify what matters' },
    ],
    keywords: ['AI goal setting', 'AI life planner', 'AI decision maker', 'AI personal development'],
  },
  business: {
    slug: 'business',
    title: 'AI Business Planning Flows — FlowFabric',
    h1: 'AI-powered business planning and strategy',
    description: 'Free AI workflows for startup validation, pricing strategy, competitive analysis, and business operations. No account needed.',
    longDescription: 'From validating a startup idea to optimizing pricing to analyzing competitors, FlowFabric business flows give you structured strategic guidance. Each flow processes your specific situation and market context to deliver actionable recommendations.',
    flows: [
      { name: 'Business in a Box', slug: 'business-in-a-box', description: 'Complete business plan from idea to launch roadmap' },
      { name: 'Pricing Strategy', slug: 'pricing-strategy', description: 'Find the right price point for your product or service' },
      { name: 'Competitor Teardown', slug: 'competitor-teardown', description: 'Deep analysis of competitor strengths and weaknesses' },
      { name: 'Side Hustle Launcher', slug: 'side-hustle-launcher', description: 'Turn a skill into income with a structured launch plan' },
    ],
    keywords: ['AI business plan', 'AI pricing tool', 'AI competitor analysis', 'AI startup validation'],
  },
  negotiation: {
    slug: 'negotiation',
    title: 'AI Negotiation & Communication Flows — FlowFabric',
    h1: 'AI-powered negotiation and difficult conversations',
    description: 'Free AI workflows for salary negotiation, conflict resolution, complaint writing, and persuasive communication. No account needed.',
    longDescription: 'Prepare for high-stakes conversations with structured AI workflows that help you build your case, anticipate objections, rehearse delivery, and plan fallback positions. Whether it is a salary negotiation, a difficult conversation with a colleague, or a formal complaint, these flows have you covered.',
    flows: [
      { name: 'Salary Negotiator', slug: 'salary-negotiator', description: 'Build your case and rehearse the conversation' },
      { name: 'Other Shoes', slug: 'other-shoes', description: 'See any conflict from the other person\'s perspective' },
      { name: 'Complaint Letter Writer', slug: 'complaint-letter-writer', description: 'Write effective, professional complaint letters' },
      { name: 'Email Writer', slug: 'email-writer', description: 'Craft persuasive emails for any professional situation' },
    ],
    keywords: ['AI negotiation coach', 'AI conflict resolution', 'AI complaint letter', 'AI email writer'],
  },
};

export default function UseCase() {
  const { category } = useParams<{ category: string }>();
  const data = USE_CASES[category || ''];

  if (!data) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Use case not found</h1>
          <Link to="/explore" className="text-sm no-underline" style={{ color: 'var(--cyan)' }}>Browse all flows &rarr;</Link>
        </div>
      </div>
    );
  }

  useMeta({
    title: data.title,
    description: data.description,
    canonical: `https://velma-ai.vercel.app/use/${data.slug}`,
  });

  return (
    <section className="px-6 pt-28 pb-20 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <li><Link to="/" className="no-underline" style={{ color: 'var(--text-secondary)' }}>Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link to="/explore" className="no-underline" style={{ color: 'var(--text-secondary)' }}>Flows</Link></li>
          <li aria-hidden="true">/</li>
          <li style={{ color: 'var(--cyan)' }}>{data.slug}</li>
        </ol>
      </nav>

      {/* H1 */}
      <h1 className="text-3xl md:text-5xl font-bold mb-6" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        {data.h1}
      </h1>

      {/* Long description */}
      <p className="text-base md:text-lg mb-12 leading-relaxed" style={{ color: 'var(--text-secondary)', maxWidth: '42rem' }}>
        {data.longDescription}
      </p>

      {/* Flow cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
        {data.flows.map(flow => (
          <Link
            key={flow.slug}
            to={`/flow/${flow.slug}`}
            className="glass-card p-5 no-underline block"
            style={{ borderColor: 'rgba(56,189,248,0.1)' }}
            onClick={() => analytics.ctaClicked(`use-case-flow-${flow.slug}`, `use/${data.slug}`)}
          >
            <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{flow.name}</div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{flow.description}</p>
            <div className="mt-3 text-xs font-semibold" style={{ color: 'var(--cyan)' }}>Run this flow &rarr;</div>
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link
          to="/explore"
          className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold no-underline"
          onClick={() => analytics.ctaClicked('browse-all-flows', `use/${data.slug}`)}
        >
          Browse all 165+ flows &rarr;
        </Link>
      </div>

      {/* HowTo structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": data.h1,
        "description": data.description,
        "step": data.flows.map((flow, i) => ({
          "@type": "HowToStep",
          "position": i + 1,
          "name": flow.name,
          "text": flow.description,
        })),
      }) }} />

      {/* BreadcrumbList structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://velma-ai.vercel.app" },
          { "@type": "ListItem", "position": 2, "name": "Flows", "item": "https://velma-ai.vercel.app/explore" },
          { "@type": "ListItem", "position": 3, "name": data.title.split(' — ')[0] },
        ],
      }) }} />
    </section>
  );
}
