"use client";

import { useEffect } from "react";

interface ThemeApplicatorProps {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  bgColor?: string | null;
}

export default function ThemeApplicator({ primaryColor, secondaryColor, bgColor }: ThemeApplicatorProps) {
  useEffect(() => {
    // Only apply custom colors if explicitly provided and valid
    if (typeof document !== "undefined") {
      if (primaryColor) {
        document.documentElement.style.setProperty("--primary", primaryColor);
      }
      if (secondaryColor) {
        document.documentElement.style.setProperty("--secondary", secondaryColor);
      }
    }
  }, [primaryColor, secondaryColor]);

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
