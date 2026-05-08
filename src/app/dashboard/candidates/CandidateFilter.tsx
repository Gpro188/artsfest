"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function CandidateFilter({ 
  teams, 
  categories, 
  currentTeamId, 
  currentCategoryId,
  showTeamFilter
}: { 
  teams: any[], 
  categories: any[], 
  currentTeamId?: string, 
  currentCategoryId?: string,
  showTeamFilter: boolean
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
      {showTeamFilter && (
        <select 
          className="form-input" 
          value={currentTeamId || ""} 
          onChange={(e) => handleFilterChange('teamId', e.target.value)}
          style={{ padding: '0.4rem', fontSize: '0.8rem', minWidth: '150px' }}
        >
          <option value="">All Teams</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      )}

      <select 
        className="form-input" 
        value={currentCategoryId || ""} 
        onChange={(e) => handleFilterChange('categoryId', e.target.value)}
        style={{ padding: '0.4rem', fontSize: '0.8rem', minWidth: '150px' }}
      >
        <option value="">All Categories</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      {(currentTeamId || currentCategoryId) && (
        <button 
          onClick={() => router.push(pathname)}
          className="btn btn-secondary" 
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: 'var(--error)' }}
        >
          Clear
        </button>
      )}
    </div>
  );
}
