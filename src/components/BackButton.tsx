"use client";

export default function BackButton({ label = "Go Back", className = "" }: { label?: string, className?: string }) {
  return (
    <button 
      onClick={() => window.history.back()} 
      className={className}
      style={{ 
        padding: '10px 20px', 
        backgroundColor: '#9ca3af', 
        color: 'white', 
        border: 'none', 
        borderRadius: '5px', 
        cursor: 'pointer', 
        fontWeight: 'bold' 
      }}
    >
      {label}
    </button>
  );
}
