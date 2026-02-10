import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

interface SubscriptionState {
  isSubscribed: boolean;
  isLoading: boolean;
  subscriptionEnd: string | null;
  productId: string | null;
  isTrial: boolean;
  trialEnd: string | null;
}

export function useSubscription() {
  const { user } = useAuthContext();
  const [state, setState] = useState<SubscriptionState>({
    isSubscribed: false,
    isLoading: true,
    subscriptionEnd: null,
    productId: null,
    isTrial: false,
    trialEnd: null,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState({
        isSubscribed: false,
        isLoading: false,
        subscriptionEnd: null,
        productId: null,
        isTrial: false,
        trialEnd: null,
      });
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) {
        console.error("Error checking subscription:", error);
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      setState({
        isSubscribed: data.subscribed ?? false,
        isLoading: false,
        subscriptionEnd: data.subscription_end ?? null,
        productId: data.product_id ?? null,
        isTrial: data.is_trial ?? false,
        trialEnd: data.trial_end ?? null,
      });
    } catch (err) {
      console.error("Error in checkSubscription:", err);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh every minute
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const openCheckout = async (plan: "monthly" | "annual" = "monthly") => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { plan },
      });
      
      if (error) {
        console.error("Error creating checkout:", error);
        throw error;
      }

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Error in openCheckout:", err);
      throw err;
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      
      if (error) {
        console.error("Error opening customer portal:", error);
        throw error;
      }

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Error in openCustomerPortal:", err);
      throw err;
    }
  };

  return {
    ...state,
    checkSubscription,
    openCheckout,
    openCustomerPortal,
  };
}
