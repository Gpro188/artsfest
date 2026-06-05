"use client";

import OnboardingTour from "@/components/OnboardingTour";
import { getTourSteps } from "@/lib/tourSteps";

export default function LandingTourWrapper() {
  const steps = getTourSteps("landing");
  if (steps.length === 0) return null;
  return <OnboardingTour pageId="landing" steps={steps} />;
}
