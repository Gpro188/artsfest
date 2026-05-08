"use client";

import { useState } from "react";
import { createCategory, deleteCategory } from "./actions";
import EditCategoryModal from "./EditCategoryModal";

export default function CategoryManager({ eventId, categories }: { eventId: string, categories: any[] }) {
  const [name, setName] = useState("");
  const [offset, setOffset] = useState("0");
  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await createCategory(eventId, name, parseInt(offset) || 0);
    setName("");
    setOffset("0");
    setLoading(false);
  };

  return (
    <div style={{ marginBottom: 'var(--spacing-xl)' }}>
      <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Event Categories</h3>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
        <input 
          type="text" 
          className="form-input" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category Name"
          required
          style={{ flex: 2 }}
        />
        <input 
          type="number" 
          className="form-input" 
          value={offset}
          onChange={(e) => setOffset(e.target.value)}
          placeholder="Chest Offset (e.g. 40)"
          required
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Adding..." : "Add Category"}
        </button>
      </form>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
        {categories.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No categories added yet.</p>
        ) : (
          categories.map(cat => (
            <div key={cat.id} className="glass-panel" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div>
                <strong>{cat.name}</strong>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Offset: {cat.chestNumberOffset}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setEditingCategory(cat)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem', padding: 0 }}
                >
                  Edit
                </button>
                <button 
                  onClick={() => {
                    if (confirm('Delete category? All candidates and programs in this category will be affected.')) {
                      deleteCategory(cat.id, eventId);
                    }
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}
                >
                  &times;
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {editingCategory && (
        <EditCategoryModal 
          category={editingCategory} 
          onClose={() => setEditingCategory(null)} 
        />
      )}
    </div>
  );
}
