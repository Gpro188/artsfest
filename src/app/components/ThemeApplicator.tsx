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
        document.documentElement.style.setProperty("--bg", bgColor);
        
        // Determine if it's a dark or light theme based on background brightness
        const brightness = getBrightness(bgColor);
        const isDark = brightness < 128;
        
        if (isDark) {
          document.documentElement.style.setProperty("--surface", adjustColor(bgColor, 15));
          document.documentElement.style.setProperty("--text", "#f8fafc");
          document.documentElement.style.setProperty("--muted", "#94a3b8");
          document.documentElement.style.setProperty("--border", adjustColor(bgColor, 30));
          document.documentElement.style.setProperty("--ink", adjustColor(bgColor, -10)); // Darker than bg for headers
        } else {
          document.documentElement.style.setProperty("--surface", "#ffffff");
          document.documentElement.style.setProperty("--text", "#0f172a");
          document.documentElement.style.setProperty("--muted", "#64748b");
          document.documentElement.style.setProperty("--border", "#e2e8f0");
          document.documentElement.style.setProperty("--ink", "#0f172a"); // Dark text for headers
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
