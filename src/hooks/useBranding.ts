import { useState, useEffect } from "react";
import { BrandingConfig, DEFAULT_BRANDING } from "@/types/branding";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "workshop-branding";

export function useBranding() {
  const [branding, setBrandingState] = useState<BrandingConfig>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_BRANDING;
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch workshop name from database when user is authenticated
  useEffect(() => {
    const fetchWorkshopBranding = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsLoaded(true);
          return;
        }

        const { data: workshop, error } = await supabase
          .from("workshops")
          .select("workshop_name, phone")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching workshop:", error);
          setIsLoaded(true);
          return;
        }

        if (workshop) {
          // Update branding with workshop name from database
          const stored = localStorage.getItem(STORAGE_KEY);
          const existingBranding = stored ? JSON.parse(stored) : DEFAULT_BRANDING;
          
          const updatedBranding = {
            ...existingBranding,
            workshopName: workshop.workshop_name || existingBranding.workshopName,
          };
          
          setBrandingState(updatedBranding);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBranding));
        }
      } catch (err) {
        console.error("Error in fetchWorkshopBranding:", err);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchWorkshopBranding();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(branding));
  }, [branding]);

  const updateBranding = (updates: Partial<BrandingConfig>) => {
    setBrandingState((prev) => ({ ...prev, ...updates }));
  };

  const resetBranding = () => {
    setBrandingState(DEFAULT_BRANDING);
  };

  return { branding, updateBranding, resetBranding, isLoaded };
}
