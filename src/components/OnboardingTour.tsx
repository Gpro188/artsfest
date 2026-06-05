"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface TourStep {
  id: string;
  target: string; // data-tour attribute value
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
}

interface OnboardingTourProps {
  pageId: string;
  steps: TourStep[];
  autoStartDelay?: number;
}

export default function OnboardingTour({ pageId, steps, autoStartDelay = 800 }: OnboardingTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const storageKey = `tour_seen_${pageId}`;

  const step = steps[currentStep];

  // Check localStorage on mount and auto-start if not seen
  useEffect(() => {
    if (!steps.length) return;
    try {
      const seen = localStorage.getItem(storageKey);
      if (!seen) {
        const timer = setTimeout(() => {
          setIsActive(true);
          setCurrentStep(0);
        }, autoStartDelay);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage not available, show tour
      const timer = setTimeout(() => {
        setIsActive(true);
        setCurrentStep(0);
      }, autoStartDelay);
      return () => clearTimeout(timer);
    }
  }, [storageKey, autoStartDelay, steps.length]);

  // Update target element position
  const updateTargetRect = useCallback(() => {
    if (!isActive || !step) return;
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      // Scroll target into view
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setTargetRect(null);
    }
  }, [isActive, step]);

  useEffect(() => {
    updateTargetRect();
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect);
    return () => {
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect);
    };
  }, [updateTargetRect]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isActive) {
        finishTour();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive]);

  const finishTour = () => {
    setIsActive(false);
    setManualOpen(false);
    try {
      localStorage.setItem(storageKey, "true");
    } catch {}
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      finishTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    finishTour();
  };

  const restartTour = () => {
    setCurrentStep(0);
    setIsActive(true);
    setManualOpen(true);
  };

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      // Center of screen if no target found
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 10002,
      };
    }

    const gap = 16;
    const tooltipWidth = 360;
    const pos = step?.position || "bottom";

    let top = 0;
    let left = 0;

    switch (pos) {
      case "bottom":
        top = targetRect.bottom + gap + window.scrollY;
        left = Math.max(16, targetRect.left + targetRect.width / 2 - tooltipWidth / 2);
        break;
      case "top":
        top = targetRect.top - gap + window.scrollY - 200;
        left = Math.max(16, targetRect.left + targetRect.width / 2 - tooltipWidth / 2);
        break;
      case "right":
        top = targetRect.top + window.scrollY;
        left = targetRect.right + gap;
        break;
      case "left":
        top = targetRect.top + window.scrollY;
        left = Math.max(16, targetRect.left - tooltipWidth - gap);
        break;
    }

    // Clamp to viewport
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));

    return {
      position: "absolute",
      top,
      left,
      width: tooltipWidth,
      zIndex: 10002,
    };
  };

  if (!steps.length) return null;

  // Floating "?" button when tour is not active
  if (!isActive) {
    return (
      <button
        onClick={restartTour}
        title="Show page guide"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 48,
          height: 48,
          borderRadius: "50%",
          backgroundColor: "var(--primary)",
          color: "white",
          border: "none",
          fontSize: "1.25rem",
          fontWeight: 800,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 14px rgba(79, 70, 229, 0.4)",
          zIndex: 9999,
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(79, 70, 229, 0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 14px rgba(79, 70, 229, 0.4)";
        }}
      >
        ?
      </button>
    );
  }

  return (
    <>
      {/* Dark overlay */}
      <div
        onClick={skipTour}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          zIndex: 10000,
        }}
      />

      {/* Spotlight cutout */}
      {targetRect && (
        <div
          style={{
            position: "fixed",
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            border: "2px solid var(--primary)",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 20px rgba(79, 70, 229, 0.3)",
            zIndex: 10001,
            pointerEvents: "none",
            transition: "all 0.3s ease",
          }}
        />
      )}

      {/* Tooltip card */}
      <div ref={tooltipRef} style={getTooltipStyle()}>
        <div
          className="glass-panel"
          style={{
            padding: "20px",
            border: "1px solid var(--primary)",
            position: "relative",
          }}
        >
          {/* Step counter */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: "0.7rem",
                color: "var(--primary)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Step {currentStep + 1} of {steps.length}
            </span>
            <button
              onClick={skipTour}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: "1.1rem",
                padding: "0 4px",
                lineHeight: 1,
              }}
              title="Skip tour"
            >
              x
            </button>
          </div>

          {/* Content */}
          <h4 style={{ color: "white", margin: "0 0 8px 0", fontSize: "1.05rem" }}>
            {step?.title}
          </h4>
          <p
            style={{
              color: "var(--text-secondary)",
              margin: "0 0 16px 0",
              fontSize: "0.85rem",
              lineHeight: 1.5,
            }}
          >
            {step?.description}
          </p>

          {/* Progress bar */}
          <div
            style={{
              width: "100%",
              height: 3,
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 2,
              marginBottom: 16,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
                height: "100%",
                backgroundColor: "var(--primary)",
                borderRadius: 2,
                transition: "width 0.3s ease",
              }}
            />
          </div>

          {/* Navigation buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <button
              onClick={skipTour}
              style={{
                background: "none",
                border: "1px solid var(--border-color)",
                color: "var(--text-secondary)",
                padding: "6px 14px",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              Skip
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              {currentStep > 0 && (
                <button
                  onClick={prevStep}
                  style={{
                    background: "none",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                    padding: "6px 14px",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  Back
                </button>
              )}
              <button
                onClick={nextStep}
                className="btn btn-primary"
                style={{
                  padding: "6px 18px",
                  fontSize: "0.8rem",
                }}
              >
                {currentStep === steps.length - 1 ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
