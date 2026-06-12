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
  const [branding, setBranding] = useState({ name: "Artsfest Central Portal", moto: "Central Festival Management" });

  useEffect(() => {
    // We now just always fetch generic branding.
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
      const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      padding: 'var(--spacing-md)',
      position: 'relative',
      overflow: 'hidden',
      background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.15), transparent 40%), radial-gradient(circle at bottom left, rgba(236, 72, 153, 0.15), transparent 40%)'
    }}>
      {/* Decorative background blobs */}
      <div style={{ position: 'absolute', top: '10%', right: '15%', width: '300px', height: '300px', background: 'var(--primary)', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.15, zIndex: 0, animation: 'pulse 8s infinite alternate' }} />
      <div style={{ position: 'absolute', bottom: '10%', left: '15%', width: '400px', height: '400px', background: 'var(--accent)', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.15, zIndex: 0, animation: 'pulse 10s infinite alternate-reverse' }} />

      <div className="glass-panel animate-fade-in" style={{ 
        position: 'relative',
        zIndex: 1,
        padding: '3rem 2.5rem', 
        width: '100%', 
        maxWidth: '440px', 
        boxSizing: 'border-box',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div data-tour="login-branding" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            width: '64px', 
            height: '64px', 
            borderRadius: '16px', 
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            marginBottom: '1rem',
            boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 style={{ 
            color: 'white', 
            marginBottom: '0.5rem', 
            fontSize: '1.75rem', 
            fontWeight: 800,
            letterSpacing: '-0.025em'
          }}>{branding.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>{branding.moto}</p>
        </div>

        {error && (
          <div style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            color: '#fca5a5', 
            padding: '1rem', 
            borderRadius: 'var(--radius-md)', 
            marginBottom: '1.5rem', 
            textAlign: 'center', 
            border: '1px solid rgba(239, 68, 68, 0.3)',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div data-tour="login-username">
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.5rem' }} htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                fontSize: '1rem',
                transition: 'all 0.2s',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter your assigned username"
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>
          <div data-tour="login-password">
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.5rem' }} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                fontSize: '1rem',
                transition: 'all 0.2s',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="••••••••"
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>
          <div data-tour="login-submit" style={{ marginTop: '0.5rem' }}>
            <button 
              type="submit" 
              style={{ 
                width: '100%', 
                padding: '0.875rem',
                background: 'linear-gradient(to right, var(--primary), var(--accent))',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.2s, transform 0.1s',
                boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)',
              }} 
              disabled={loading}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {loading ? "Authenticating..." : "Sign In to Portal"}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
            Secure Portal Area &middot; Authorized Access Only
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
