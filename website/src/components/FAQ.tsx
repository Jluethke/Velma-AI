import { useState } from 'react';

const faqs = [
  {
    question: 'What is a skill?',
    answer: 'A skill is a reusable AI procedure -- a structured set of steps that an AI agent can follow to accomplish a specific task. Examples: parsing SEC filings, generating test cases, summarizing research papers, automating deployment workflows. Skills are packaged as .skillpack bundles containing the procedure, test cases, and cryptographic provenance.',
  },
  {
    question: 'How is quality enforced?',
    answer: 'Shadow validation. Every published skill is tested by independent validators who run it 5 times against known-good outputs. Similarity is scored using a weighted combination of Jaccard (60%) and bigram (40%) metrics. Skills must achieve 75% match rate across shadow runs to pass. There are no star ratings, no reviews, no subjective judgments. Either the skill produces correct outputs or it does not.',
  },
  {
    question: 'What makes this different from an app store?',
    answer: 'Three things. First, quality is verified by testing, not reviews. Second, skills are owned by their creators and stored on IPFS -- they cannot be removed by a platform decision. Third, trust is computed mathematically from validation outcomes, not from download counts or user ratings. The network rewards competence, not popularity.',
  },
  {
    question: 'Which AI agents and models are supported?',
    answer: 'SkillChain is agent-agnostic by design. Skills are published in a universal .skillpack format that encodes the procedure, not the model dependency. During init you select your agent -- Claude, GPT, Gemini, Cursor, or any open-source model -- and the SDK handles format adaptation automatically. Claude is fully supported at launch. GPT, Gemini, and Cursor adapters ship Q4 2026. Any agent that can read structured procedures can use SkillChain skills today.',
  },
  {
    question: 'How does cross-agent compatibility work?',
    answer: 'The .skillpack format is a structured procedure with test cases and provenance -- it does not depend on any specific model or runtime. When you import a skill, SkillChain adapts it to your agent\'s native format: .md files for Claude, action schemas for GPT, rule files for Cursor, or raw procedures for open-source models. A skill published by a Claude user can be imported and used by a GPT user without modification.',
  },
  {
    question: 'How do I earn TRUST tokens?',
    answer: 'Three ways: publish skills that others purchase (earn 70% of price), validate skills (earn 15% of purchase price), or contribute to governance and ecosystem development (grants from DAO treasury). There is no public sale and no way to buy tokens at launch. You earn them.',
  },
  {
    question: 'Is this another crypto project?',
    answer: 'SkillChain uses blockchain for what blockchain is good at: ownership, payments, and governance that no single party controls. The token economics are designed to align incentives around quality, not speculation. The 5% burn creates deflationary pressure. The anti-plutocratic voting formula (sqrt(stake) * trust^2) prevents whale capture. And the core innovation -- trust-weighted consensus -- is a patented algorithm backed by a working production system, not a whitepaper promise.',
  },
  {
    question: 'What is ALG?',
    answer: 'The Assured Learning Governor (ALG) is a patented governance framework developed by The Wayfinder Trust. It computes trust using exponential decay with EMA smoothing: trust drops fast on failure and recovers slowly through consistent quality. ALG was originally built for Velma, a 385K+ line cognitive OS, and has been running in production since late 2024. SkillChain adapts ALG as its consensus weight mechanism.',
  },
  {
    question: 'When does it launch?',
    answer: 'Testnet (Base Sepolia) and SDK in Q2 2026. Mainnet token launch and marketplace in Q3 2026. Cross-agent adapters in Q4 2026. See the whitepaper for the full roadmap.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="px-6 py-20 max-w-3xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: '#ffffff' }}>
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
              border: `1px solid ${openIndex === i ? 'rgba(0, 255, 200, 0.2)' : 'var(--border)'}`,
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
