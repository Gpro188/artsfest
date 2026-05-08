"use client";

import { useState } from "react";
import { updatePassword } from "./actions";

export default function PasswordForm({ userId }: { userId: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<{ type: 'error' | 'success', message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setStatus({ type: 'error', message: 'Passwords do not match' });
      return;
    }
    
    setLoading(true);
    setStatus(null);
    
    const result = await updatePassword(userId, password);
    
    if (result.success) {
      setStatus({ type: 'success', message: 'Password updated successfully' });
      setPassword("");
      setConfirm("");
    } else {
      setStatus({ type: 'error', message: result.error || 'Failed to update password' });
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      {status && (
        <div style={{ 
          padding: 'var(--spacing-sm)', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: 'var(--spacing-md)',
          backgroundColor: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          color: status.type === 'error' ? 'var(--error)' : 'var(--success)',
          border: `1px solid ${status.type === 'error' ? 'var(--error)' : 'var(--success)'}`
        }}>
          {status.message}
        </div>
      )}
      
      <div className="form-group">
        <label className="form-label">New Password</label>
        <input 
          type="password" 
          className="form-input" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Confirm Password</label>
        <input 
          type="password" 
          className="form-input" 
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={6}
        />
      </div>
      
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
}
