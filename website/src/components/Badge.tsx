interface BadgeProps {
  label: string;
  variant: 'open' | 'commercial' | 'proprietary' | 'domain';
}

const variantStyles: Record<BadgeProps['variant'], { bg: string; color: string }> = {
  open: { bg: 'rgba(0, 255, 136, 0.12)', color: 'var(--green)' },
  commercial: { bg: 'rgba(170, 136, 255, 0.12)', color: 'var(--purple)' },
  proprietary: { bg: 'rgba(255, 215, 0, 0.12)', color: 'var(--gold)' },
  domain: { bg: 'rgba(0, 255, 200, 0.08)', color: 'var(--text-secondary)' },
};

export default function Badge({ label, variant }: BadgeProps) {
  const style = variantStyles[variant];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ background: style.bg, color: style.color }}
    >
      {label}
    </span>
  );
}
