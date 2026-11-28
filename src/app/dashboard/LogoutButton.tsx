"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function LogoutButton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="btn btn-secondary"
        title="Sign Out"
        aria-label="Sign Out"
        style={{
          width: "38px",
          height: "38px",
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderColor: "rgba(239, 68, 68, 0.35)",
          color: "var(--error)",
          borderRadius: "10px",
        }}
      >
        <LogOut size={16} strokeWidth={2} />
      </button>
    );
  }

  return (
    <button 
      onClick={() => signOut({ callbackUrl: "/login" })} 
      className="btn btn-secondary" 
      style={{
        width: '100%',
        borderColor: 'var(--error)',
        color: 'var(--error)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.45rem',
      }}
    >
      <LogOut size={15} strokeWidth={2} />
      <span>Sign Out</span>
    </button>
  );
}
