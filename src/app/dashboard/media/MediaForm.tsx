"use client";

import { useState } from "react";
import { saveMediaTemplate } from "./actions";

export default function MediaForm({ programId, initialUrl }: { programId: string, initialUrl: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'success', message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    
    const result = await saveMediaTemplate(programId, url);
    
    if (result.success) {
      setStatus({ type: 'success', message: 'Saved successfully' });
    } else {
      setStatus({ type: 'error', message: result.error || 'Failed to save' });
    }
    
    setLoading(false);
    
    // Clear status after 3 seconds
    if (result.success) {
      setTimeout(() => setStatus(null), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
      <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
        <input 
          type="url" 
          className="form-input" 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/poster-bg.png"
          required
        />
      </div>
      
      <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '42px', padding: '0 var(--spacing-lg)' }}>
        {loading ? "Saving..." : "Save"}
      </button>

      {status && (
        <span style={{ 
          color: status.type === 'error' ? 'var(--error)' : 'var(--success)', 
          fontSize: '0.875rem',
          whiteSpace: 'nowrap'
        }}>
          {status.message}
        </span>
      )}
    </form>
  );
}
