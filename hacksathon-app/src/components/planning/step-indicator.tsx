"use client";

import { TOTAL_STEPS, getStep } from "@/lib/planning/steps";

interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const step = getStep(currentStep);

  return (
    <div className="flex items-center justify-between">
      <span className="mono-label">
        Step {currentStep} of {TOTAL_STEPS}
      </span>
      {step && (
        <span className="mono-label">{step.title}</span>
      )}
    </div>
  );
}
