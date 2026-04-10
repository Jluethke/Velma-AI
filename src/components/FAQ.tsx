import { useState } from 'react';

const faqs = [
  {
    question: 'What is a flow?',
    answer: 'A flow is a structured AI procedure — a set of phases with quality gates that an AI follows step by step. Examples: building a budget, prepping for an interview, analyzing competitors, designing an API. Each flow has defined inputs, outputs, and validation criteria. Anyone can run a flow for free.',
  },
  {
    question: 'What is a flow pipeline?',
    answer: 'A flow pipeline is multiple flows connected together into a sequence. For example, a "Career Launchpad" pipeline runs resume-builder → interview-prep → salary-negotiator in order, passing context between each step. Pipelines are where the real value is — they produce outcomes no single flow can achieve alone.',
  },
  {
    question: 'What is TRUST?',
    answer: 'TRUST is the token that powers the FlowFabric ecosystem, deployed on Base mainnet. You can earn TRUST by publishing flows, validating quality, or creating chains that others use. You can also buy TRUST to unlock features faster. Your TRUST balance determines your tier — from Explorer (free) to Governor (100K+).',
  },
  {
    question: 'Do I need TRUST to try a flow?',
    answer: 'No. Individual flows are free to run. You can browse all flows in the Composer and run any one of them without a wallet or tokens. TRUST is needed to connect flows into pipelines, publish on-chain, and access premium domains like engineering, AI, and legal.',
  },
  {
    question: 'How do tiers work?',
    answer: 'Your TRUST balance determines what you can do. Explorer (free): run individual flows. Builder (500 TRUST): connect flows into pipelines, save and schedule. Creator (2,500): publish on-chain, earn royalties. Validator (25K staked): validate flows for the network. Governor (100K staked): vote on protocol decisions.',
  },
  {
    question: 'How do I earn TRUST?',
    answer: 'Publish flows that others use (70% of earnings go to you). Validate flows for quality (15% of earnings). Create derivatives that improve on existing flows (original author gets 15% royalty automatically). All splits are enforced by smart contract — no middleman. You also earn TRUST by building pipelines that others run.',
  },
  {
    question: 'Can I buy TRUST?',
    answer: 'Yes. TRUST can be purchased to unlock features immediately. But earned TRUST carries more weight — it boosts your visibility in the marketplace, your priority in validator selection, and your influence in governance voting. Buying gets you access. Earning gets you influence.',
  },
  {
    question: 'What happens when I modify someone\'s flow?',
    answer: 'It\'s tracked as a derivative. When you publish it, 15% of all TRUST earned on your version goes to the original author — automatically, forever, via smart contract. This incentivizes creating flows worth building on.',
  },
  {
    question: 'How is quality enforced?',
    answer: 'Shadow validation. Validators run flows against test cases and measure output consistency. Flows must achieve 95%+ similarity across multiple runs to graduate. Only domain-competent validators can vote. Trust scores are computed mathematically from validation outcomes — not reviews, not star ratings.',
  },
  {
    question: 'What is flow evolution?',
    answer: 'Flows evolve through validation: Prompt → Flow → Validated → Graduated → Compiled. A graduated flow has been proven consistent enough to compile into executable code — software that runs without an AI, with zero token cost. This is the endgame: language becomes code through consensus.',
  },
  {
    question: 'Do I need to install anything?',
    answer: 'The Composer runs entirely in your browser. When you click Run, a small script downloads that opens Claude Code on your machine. If Claude Code isn\'t installed, it installs automatically. No SDK required for basic usage.',
  },
  {
    question: 'Is this a crypto project?',
    answer: 'FlowFabric uses blockchain for what it\'s good at: ownership, payments, and governance that no single party controls. The token economics reward contribution over speculation — earned TRUST has more influence than bought TRUST. The core innovation is trust-weighted consensus backed by deployed smart contracts on Base mainnet, not a whitepaper promise.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="px-6 py-20 max-w-3xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: 'var(--text-primary)' }}>
        FAQ
      </h2>
      <p className="text-center mb-12 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Common questions, direct answers.
      </p>

      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="rounded-lg overflow-hidden transition-colors"
            style={{
              background: openIndex === i ? 'var(--bg-card)' : 'transparent',
              border: `1px solid ${openIndex === i ? 'var(--border)' : 'var(--border)'}`,
            }}
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer"
              style={{
                background: 'transparent',
                border: 'none',
                color: openIndex === i ? 'var(--cyan)' : 'var(--text-primary)',
              }}
            >
              <span className="text-sm font-medium pr-4">{faq.question}</span>
              <span
                className="text-lg shrink-0 transition-transform"
                style={{
                  transform: openIndex === i ? 'rotate(45deg)' : 'none',
                  color: 'var(--text-secondary)',
                }}
              >
                +
              </span>
            </button>

            <div
              className="overflow-hidden transition-all duration-300"
              style={{
                maxHeight: openIndex === i ? '500px' : '0',
                opacity: openIndex === i ? 1 : 0,
              }}
            >
              <p className="px-6 pb-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {faq.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
