"use client";

export interface TourStep {
  id?: string;
  target?: string;
  targetSelector?: string;
  title: string;
  content?: string;
  description?: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
  icon?: string;
  [key: string]: unknown;
}

interface OnboardingTourProps {
  pageId: string;
  steps: TourStep[];
  autoStartDelay?: number;
}

export default function OnboardingTour(_props: OnboardingTourProps) {
  return null;
}
