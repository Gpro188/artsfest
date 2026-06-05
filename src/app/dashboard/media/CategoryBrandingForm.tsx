"use client";

import { useState } from "react";
import { updateCategoryBranding } from "./actions";

export default function CategoryBrandingForm({ categories }: { categories: any[] }) {
    const [loading, setLoading] = useState<string | null>(null);
    const [urls, setUrls] = useState<Record<string, string>>(
        categories.reduce((acc, cat) => ({ ...acc, [cat.id]: cat.posterBgUrl || "" }), {})
    );

    const handleUpdate = async (categoryId: string) => {
        setLoading(categoryId);
        const res = await updateCategoryBranding(categoryId, urls[categoryId]);
        if (res.success) {
            alert("Category branding updated!");
        } else {
            alert("Error: " + res.error);
        }
        setLoading(null);
    };

    return (
        <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>📂 Category-Specific Backgrounds</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)', fontSize: '0.9rem' }}>
                Set unique background styles for different categories. Category backgrounds take priority over the global background.
            </p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)', fontSize: '0.8rem' }}>
                Paste an image URL for each category's poster background. Leave blank to use the global default.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {categories.map(category => (
                    <div key={category.id} className="mobile-stack" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '150px 1fr 100px', 
                        gap: '15px', 
                        alignItems: 'center',
                        paddingBottom: '10px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{category.name}</div>
                        <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Background Image URL"
                            value={urls[category.id]}
                            onChange={(e) => setUrls({ ...urls, [category.id]: e.target.value })}
                            style={{ margin: 0 }}
                        />
                        <button 
                            className="btn btn-secondary" 
                            disabled={loading === category.id}
                            onClick={() => handleUpdate(category.id)}
                            style={{ padding: '8px', fontSize: '0.8rem' }}
                        >
                            {loading === category.id ? 'Saving...' : 'Update'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
