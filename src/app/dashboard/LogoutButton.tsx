"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: "/login" })} 
      className="btn btn-secondary" 
      style={{ width: '100%', borderColor: 'var(--error)', color: 'var(--error)' }}
    >
      Sign Out
    </button>
  );
}
