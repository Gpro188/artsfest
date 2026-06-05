"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBranding } from "./branding";
import OnboardingTour from "@/components/OnboardingTour";
import { getTourSteps } from "@/lib/tourSteps";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSuperAdmin = searchParams.get("callbackUrl")?.includes("super-admin");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState({ name: "Arts Fest", moto: "Celebrating Creativity" });

  useEffect(() => {
    if (isSuperAdmin) {
      setBranding({ name: "Super Admin", moto: "System Administrator Access" });
    } else {
      getBranding().then(setBranding);
    }
  }, [isSuperAdmin]);

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
      const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 'var(--spacing-md)' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: 'var(--spacing-xl)', width: '100%', maxWidth: '400px', boxSizing: 'border-box' }}>
        <div data-tour="login-branding" style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <h1 style={{ color: 'var(--primary)', marginBottom: 'var(--spacing-xs)', fontSize: 'clamp(1.5rem, 8vw, 2.5rem)', fontWeight: 800 }}>{branding.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{branding.moto}</p>
          {!isSuperAdmin && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '8px' }}>
              Sign in to access your festival management dashboard.
            </p>
          )}
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-md)', textAlign: 'center', border: '1px solid var(--error)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div data-tour="login-username" className="form-group">
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
            <span className="field-helper">The username assigned to you by your festival administrator.</span>
          </div>
          <div data-tour="login-password" className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter your password"
            />
            <span className="field-helper">Your secure password. Credentials are encrypted.</span>
          </div>
          <div data-tour="login-submit">
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--spacing-sm)' }} disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </form>

        <div style={{ marginTop: 'var(--spacing-lg)', paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>
            Need help? Contact your festival administrator for login credentials or password reset.
          </p>
        </div>
      </div>

      {!isSuperAdmin && (
        <OnboardingTour pageId="login" steps={getTourSteps("login")} />
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
