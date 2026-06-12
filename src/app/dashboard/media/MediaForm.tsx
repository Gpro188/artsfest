"use client";

import { useState } from "react";
import { saveMediaTemplate } from "./actions";
import ImageUpload from "../../components/ImageUpload";

export default function MediaForm({ programId, initialUrl }: { programId: string, initialUrl: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'success', message: string } | null>(null);

  const handleUploadComplete = async (newUrl: string) => {
    setUrl(newUrl);
    setLoading(true);
    setStatus(null);
    
    const result = await saveMediaTemplate(programId, newUrl);
    
    if (result.success) {
      setStatus({ type: 'success', message: 'Saved successfully' });
    } else {
      setStatus({ type: 'error', message: result.error || 'Failed to save' });
    }
    
    setLoading(false);
    if (result.success) {
      setTimeout(() => setStatus(null), 3000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
      <ImageUpload 
        label="Final Poster (Upload to replace generated)" 
        folder="posters" 
        initialUrl={url}
        onUploadComplete={handleUploadComplete} 
      />

      {status && (
        <span style={{ 
          color: status.type === 'error' ? 'var(--error)' : 'var(--success)', 
          fontSize: '0.875rem'
        }}>
          {status.message}
        </span>
      )}
    </div>
  );
}
