"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBranding } from "./branding";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState({ name: "Arts Fest", moto: "Celebrating Creativity" });

  useEffect(() => {
    getBranding().then(setBranding);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid username or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 'var(--spacing-md)' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: 'var(--spacing-xl)', width: '100%', maxWidth: '400px', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <h1 style={{ color: 'var(--primary)', marginBottom: 'var(--spacing-xs)', fontSize: 'clamp(1.5rem, 8vw, 2.5rem)', fontWeight: 800 }}>{branding.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{branding.moto}</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-md)', textAlign: 'center', border: '1px solid var(--error)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter your username"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--spacing-sm)' }} disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
