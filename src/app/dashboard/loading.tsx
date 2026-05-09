export default function DashboardLoading() {
  return (
    <div className="animate-fade-in" style={{ padding: 'var(--spacing-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div className="skeleton" style={{ height: '40px', width: '250px', borderRadius: 'var(--radius-md)' }}></div>
        <div className="skeleton" style={{ height: '40px', width: '120px', borderRadius: 'var(--radius-md)' }}></div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
            <div className="skeleton" style={{ height: '24px', width: '60%', marginBottom: 'var(--spacing-md)', borderRadius: 'var(--radius-sm)' }}></div>
            <div className="skeleton" style={{ height: '16px', width: '100%', marginBottom: 'var(--spacing-sm)', borderRadius: 'var(--radius-sm)' }}></div>
            <div className="skeleton" style={{ height: '16px', width: '80%', marginBottom: 'var(--spacing-sm)', borderRadius: 'var(--radius-sm)' }}></div>
            <div className="skeleton" style={{ height: '16px', width: '90%', borderRadius: 'var(--radius-sm)' }}></div>
          </div>
        ))}
      </div>
    </div>
  );
}
