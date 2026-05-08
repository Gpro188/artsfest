"use client";

export default function PrintButton({ color = "#4F46E5", label = "Print" }: { color?: string, label?: string }) {
  return (
    <button 
      onClick={() => window.print()} 
      style={{ 
        padding: '10px 20px', 
        backgroundColor: color, 
        color: 'white', 
        border: 'none', 
        borderRadius: '5px', 
        cursor: 'pointer', 
        fontWeight: 'bold' 
      }}
    >
      🖨️ {label}
    </button>
  );
}
