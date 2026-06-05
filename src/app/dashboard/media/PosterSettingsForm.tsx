"use client";

import { useState } from "react";
import { updatePosterSettings } from "./actions";

export default function PosterSettingsForm({ initialSettings }: { initialSettings: any }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    posterHeaderUrl: initialSettings?.posterHeaderUrl || "",
    posterFooterUrl: initialSettings?.posterFooterUrl || "",
    posterCongratulationUrl: initialSettings?.posterCongratulationUrl || "",
    posterLogoUrl: initialSettings?.posterLogoUrl || "",
    posterBgUrl: initialSettings?.posterBgUrl || "",
    posterPrimaryColor: initialSettings?.posterPrimaryColor || "#1e293b",
    posterSecondaryColor: initialSettings?.posterSecondaryColor || "#f97316",
    posterTextColor: initialSettings?.posterTextColor || "#1e293b",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await updatePosterSettings(formData);
    if (res.success) {
      alert("Poster settings updated successfully!");
    } else {
      alert("Error: " + res.error);
    }
    setLoading(false);
  };

  return (
    <div className="glass-panel" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
      <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Global Poster Template Settings</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)', fontSize: '0.9rem' }}>
        Configure the official assets for the results announcement posters. These will be applied to all program result boards.
      </p>

      <div className="glass-panel" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.2)', padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', borderRadius: 'var(--radius-md)' }}>
        <p style={{ fontSize: '0.85rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>💡</span>
          <strong>Manual Design Workflow:</strong> Download the "Clean Body" from any program results page, design your background manually, and upload the Final Poster.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="form-label">Default Poster Background URL (Global)</label>
          <input 
            type="text" 
            className="form-input" 
            value={formData.posterBgUrl}
            onChange={(e) => setFormData({...formData, posterBgUrl: e.target.value})}
            placeholder="Recommended: 800x1128 PNG/JPG (A4 Ratio)"
          />
          <span className="field-helper">This image is used as the base background for all result announcement posters. Use a high-resolution PNG or JPG in A4 portrait ratio.</span>
        </div>

        <div className="form-group">
          <label className="form-label">Primary Color (Program Name)</label>
          <span className="field-helper">Used for the program name heading on result posters.</span>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input 
                type="color" 
                value={formData.posterPrimaryColor || "#1e293b"}
                onChange={(e) => setFormData({...formData, posterPrimaryColor: e.target.value})}
                style={{ width: '40px', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            />
            <input 
                type="text" 
                className="form-input" 
                value={formData.posterPrimaryColor || "#1e293b"}
                onChange={(e) => setFormData({...formData, posterPrimaryColor: e.target.value})}
                placeholder="#1e293b"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Secondary Color (Category & Prize)</label>
          <span className="field-helper">Applied to category labels, prize/rank badges, and decorative accents.</span>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input 
                type="color" 
                value={formData.posterSecondaryColor || "#f97316"}
                onChange={(e) => setFormData({...formData, posterSecondaryColor: e.target.value})}
                style={{ width: '40px', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            />
            <input 
                type="text" 
                className="form-input" 
                value={formData.posterSecondaryColor || "#f97316"}
                onChange={(e) => setFormData({...formData, posterSecondaryColor: e.target.value})}
                placeholder="#f97316"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Text Color (Participant Names)</label>
          <span className="field-helper">The color used for candidate/participant names in the results table on posters.</span>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input 
                type="color" 
                value={formData.posterTextColor || "#1e293b"}
                onChange={(e) => setFormData({...formData, posterTextColor: e.target.value})}
                style={{ width: '40px', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            />
            <input 
                type="text" 
                className="form-input" 
                value={formData.posterTextColor || "#1e293b"}
                onChange={(e) => setFormData({...formData, posterTextColor: e.target.value})}
                placeholder="#1e293b"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Logo URL (Optional)</label>
          <input 
            type="text" 
            className="form-input" 
            value={formData.posterLogoUrl}
            onChange={(e) => setFormData({...formData, posterLogoUrl: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Congratulations PNG (Optional)</label>
          <input 
            type="text" 
            className="form-input" 
            value={formData.posterCongratulationUrl}
            onChange={(e) => setFormData({...formData, posterCongratulationUrl: e.target.value})}
          />
          <span className="field-helper">An overlay image (e.g., confetti or banner) shown on top of the poster for winner celebrations.</span>
        </div>

        <div style={{ gridColumn: 'span 2', display: 'none' }}>
           {/* Hidden but kept for schema compatibility */}
           <input type="hidden" value={formData.posterHeaderUrl} />
           <input type="hidden" value={formData.posterFooterUrl} />
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? "Saving..." : "Save Global Branding Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
