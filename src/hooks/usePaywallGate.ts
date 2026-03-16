/**
 * usePaywallGate
 *
 * Convenience hook for gating premium features.
 * Returns `gate(action)` — runs the action if premium, otherwise shows paywall.
 * Also returns `showPaywall` / `hidePaywall` / `paywallVisible` for the modal.
 */

import { useState, useCallback } from "react";
import { useSubscription } from "../context/SubscriptionContext";

export function usePaywallGate() {
  const { isPremium } = useSubscription();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [featureName, setFeatureName] = useState<string | undefined>();

  const showPaywall = useCallback((feature?: string) => {
    setFeatureName(feature);
    setPaywallVisible(true);
  }, []);

  const hidePaywall = useCallback(() => {
    setPaywallVisible(false);
    setFeatureName(undefined);
  }, []);

  /**
   * Gate an action behind premium.
   * If premium → runs the action immediately.
   * If not premium → shows the paywall modal.
   */
  const gate = useCallback(
    (action: () => void, feature?: string) => {
      if (isPremium) {
        action();
      } else {
        showPaywall(feature);
      }
    },
    [isPremium, showPaywall]
  );

  return {
    /** Whether the user has premium access */
    isPremium,
    /** Gate an action — runs it if premium, shows paywall otherwise */
    gate,
    /** Whether the paywall modal is showing */
    paywallVisible,
    /** The feature name to display in the modal */
    featureName,
    /** Show the paywall modal */
    showPaywall,
    /** Hide the paywall modal */
    hidePaywall,
  };
}
