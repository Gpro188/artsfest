/**
 * Central team color mapper and helper utilities
 * Resolves colors for Yaqooth, Marjaan, Fairooz, or any dynamic team name / flag color
 */

export interface TeamColorInfo {
  accent: string;
  soft: string;
  text: string;
  name: string;
}

export function getTeamColor(teamName?: string | null, fallbackColor?: string | null): string {
  if (!teamName) return fallbackColor || 'var(--primary)';
  const normalized = teamName.toUpperCase();

  if (normalized.includes('YAQOOTH') || normalized.includes('YAQUTH') || normalized.includes('YAQOOT')) {
    return '#9c2b3c'; // --maroon
  }
  if (normalized.includes('MARJAAN') || normalized.includes('MARJAN')) {
    return '#1e7a5b'; // --emerald
  }
  if (normalized.includes('FAIROOZ') || normalized.includes('FAYROOZ') || normalized.includes('FIROZ')) {
    return '#4b4f9e'; // --indigo
  }

  return fallbackColor || '#4b4f9e';
}

export function getTeamSoftColor(teamName?: string | null, fallbackColor?: string | null): string {
  const color = getTeamColor(teamName, fallbackColor);
  if (color === '#9c2b3c') return '#fbf0f2';
  if (color === '#1e7a5b') return '#edf8f4';
  if (color === '#4b4f9e') return '#eaebf8';
  return 'rgba(75, 79, 158, 0.1)';
}

export function getTeamInitials(name?: string | null): string {
  if (!name) return 'TM';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
