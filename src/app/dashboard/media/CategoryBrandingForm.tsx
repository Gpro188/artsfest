"use client";

import { useState } from "react";
import { updateCategoryBranding } from "./actions";
import ImageUpload from "../../components/ImageUpload";

export default function CategoryBrandingForm({ categories }: { categories: any[] }) {
    const [loading, setLoading] = useState<string | null>(null);
    const [urls, setUrls] = useState<Record<string, string>>(
        categories.reduce((acc, cat) => ({ ...acc, [cat.id]: cat.posterBgUrl || "" }), {})
    );

    const handleUpdate = async (categoryId: string, newUrl: string) => {
        setLoading(categoryId);
        setUrls({ ...urls, [categoryId]: newUrl });
        const res = await updateCategoryBranding(categoryId, newUrl);
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
                        display: 'flex', 
                        gap: '15px', 
                        flexDirection: 'column',
                        paddingBottom: '10px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--primary)' }}>{category.name}</div>
                        <div style={{ flex: 1 }}>
                            <ImageUpload 
                                label={`Upload Background (${category.name})`} 
                                folder="posters" 
                                initialUrl={urls[category.id]}
                                onUploadComplete={(url) => handleUpdate(category.id, url)} 
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
