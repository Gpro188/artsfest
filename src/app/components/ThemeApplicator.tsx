"use client";

import { useEffect } from "react";

interface ThemeApplicatorProps {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  bgColor?: string | null;
}

export default function ThemeApplicator({ primaryColor, secondaryColor, bgColor }: ThemeApplicatorProps) {
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (primaryColor) {
        document.documentElement.style.setProperty("--primary", primaryColor);
      }
      if (secondaryColor) {
        document.documentElement.style.setProperty("--secondary", secondaryColor);
      }
      if (bgColor) {
        document.documentElement.style.setProperty("--bg-color", bgColor);
        
        const brightness = getBrightness(bgColor);
        if (brightness > 128) {
          // Light background: use dark text and darker surfaces
          document.documentElement.style.setProperty("--text-primary", "#111827");
          document.documentElement.style.setProperty("--text-secondary", "#4b5563");
          document.documentElement.style.setProperty("--surface-color", adjustColor(bgColor, -10));
          document.documentElement.style.setProperty("--surface-hover", adjustColor(bgColor, -20));
        } else {
          // Dark background: use light text and lighter surfaces
          document.documentElement.style.setProperty("--text-primary", "#f8fafc");
          document.documentElement.style.setProperty("--text-secondary", "#94a3b8");
          document.documentElement.style.setProperty("--surface-color", adjustColor(bgColor, 10));
          document.documentElement.style.setProperty("--surface-hover", adjustColor(bgColor, 20));
        }
      }
    }
  }, [primaryColor, secondaryColor, bgColor]);

  return null;
}

// Helper to lighten/darken hex colors for surfaces
function adjustColor(color: string, amount: number) {
  return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

function getBrightness(hex: string) {
  const rgb = parseInt(hex.replace(/^#/, ''), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >>  8) & 0xff;
  const b = (rgb >>  0) & 0xff;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
