"use client";

import { useState } from "react";
import { updateCategory } from "./actions";

type Category = {
  id: string;
  name: string;
  chestNumberOffset: number;
  eventId: string;
};

export default function EditCategoryModal({ category, onClose }: { category: Category, onClose: () => void }) {
  const [name, setName] = useState(category.name);
  const [offset, setOffset] = useState(category.chestNumberOffset.toString());
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateCategory(category.id, category.eventId, name, parseInt(offset) || 0);
    if (result.success) {
      onClose();
    } else {
      alert(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel" style={{ width: '400px', padding: 'var(--spacing-lg)', position: 'relative' }}>
        <button onClick={onClose} className="modal-close">&times;</button>
        <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Edit Category</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Category Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Chest Number Offset</label>
            <input 
              type="number" 
              className="form-input" 
              value={offset}
              onChange={(e) => setOffset(e.target.value)}
              required
            />
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Base: Team Prefix. Result: Prefix + Offset + Sequence
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? "Saving..." : "Update Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
