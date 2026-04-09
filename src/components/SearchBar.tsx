interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  domain: string;
  onDomainChange: (d: string) => void;
  sort: string;
  onSortChange: (s: string) => void;
  domains?: string[];
}

export default function SearchBar({ query, onQueryChange, domain, onDomainChange, sort, onSortChange, domains = [] }: SearchBarProps) {
  const selectStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    fontFamily: "'JetBrains Mono', monospace",
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      {/* Search input */}
      <div className="flex-1 relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2"
          width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search flows..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none transition-colors"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
          onFocus={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--cyan)'; }}
          onBlur={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--border)'; }}
        />
      </div>

      {/* Domain filter */}
      <select
        value={domain}
        onChange={(e) => onDomainChange(e.target.value)}
        className="px-4 py-2.5 rounded-lg text-sm cursor-pointer outline-none"
        style={selectStyle}
      >
        <option value="">All domains</option>
        {domains.map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {/* Sort */}
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
        className="px-4 py-2.5 rounded-lg text-sm cursor-pointer outline-none"
        style={selectStyle}
      >
        <option value="name">Name</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="domain">Domain</option>
      </select>
    </div>
  );
}
