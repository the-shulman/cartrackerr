import { useState, useEffect } from "react";
import { BrandingConfig, DEFAULT_BRANDING } from "@/types/branding";

const STORAGE_KEY = "workshop-branding";

export function useBranding() {
  const [branding, setBrandingState] = useState<BrandingConfig>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_BRANDING;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(branding));
  }, [branding]);

  const updateBranding = (updates: Partial<BrandingConfig>) => {
    setBrandingState((prev) => ({ ...prev, ...updates }));
  };

  const resetBranding = () => {
    setBrandingState(DEFAULT_BRANDING);
  };

  return { branding, updateBranding, resetBranding };
}
