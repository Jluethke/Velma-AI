import { useState, useMemo } from 'react';
import { useSkills } from '../hooks/useSkills';
import { useGateCheck } from '../hooks/useGateCheck';
import SkillCard from '../components/SkillCard';
import SearchBar from '../components/SearchBar';

export default function Explore() {
  const { data: skills = [], isLoading } = useSkills();
  const { isUnlocked } = useGateCheck();
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState('');
  const [sort, setSort] = useState('name');

  const domains = useMemo(() => [...new Set(skills.map(s => s.domain))].sort(), [skills]);

  const filtered = useMemo(() => {
    let result = [...skills];

    // Filter by query
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Filter by domain
    if (domain) {
      result = result.filter(s => s.domain === domain);
    }

    // Sort
    switch (sort) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-asc':
        result.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price-desc':
        result.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case 'domain':
        result.sort((a, b) => a.domain.localeCompare(b.domain));
        break;
    }

    return result;
  }, [skills, query, domain, sort]);

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 max-w-6xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#ffffff' }}>
        Explore Skills
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        {isLoading ? 'Loading...' : `${filtered.length} skill${filtered.length !== 1 ? 's' : ''} available`}
      </p>

      <SearchBar
        query={query}
        onQueryChange={setQuery}
        domain={domain}
        onDomainChange={setDomain}
        sort={sort}
        onSortChange={setSort}
        domains={domains}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-5 animate-pulse"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', height: 180 }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {filtered
            .sort((a, b) => (a.free === b.free ? 0 : a.free ? -1 : 1))
            .map(skill => (
            <SkillCard key={skill.name} skill={skill} locked={!skill.free && !isUnlocked} />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No skills match your search.
          </p>
        </div>
      )}
    </div>
  );
}
