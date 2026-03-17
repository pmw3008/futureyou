/**
 * Subscription Context
 *
 * Manages RevenueCat subscription state. Exposes premium status,
 * plan info, purchase actions, and restore functionality.
 *
 * Caches subscription state to AsyncStorage for offline access.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from "react-native-purchases";
import type { SubscriptionPlan, SubscriptionStatus } from "../types";

const SUBSCRIPTION_STORAGE_KEY = "@futureyou_subscription";

// RevenueCat entitlement identifier — set this in RevenueCat dashboard
const ENTITLEMENT_ID = "premium";

interface SubscriptionContextType {
  /** Whether user has premium access */
  isPremium: boolean;
  /** Whether user is currently in free trial */
  isTrialing: boolean;
  /** Current plan */
  plan: SubscriptionPlan | null;
  /** Subscription status */
  status: SubscriptionStatus;
  /** Expiration date */
  expirationDate: string | null;
  /** Whether subscription state is still loading */
  isLoading: boolean;
  /** Available packages from RevenueCat */
  packages: PurchasesPackage[];
  /** Purchase a package */
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  /** Restore previous purchases */
  restorePurchases: () => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

function extractSubscriptionState(customerInfo: CustomerInfo): {
  isPremium: boolean;
  isTrialing: boolean;
  plan: SubscriptionPlan | null;
  status: SubscriptionStatus;
  expirationDate: string | null;
} {
  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

  if (!entitlement) {
    return {
      isPremium: false,
      isTrialing: false,
      plan: null,
      status: "none",
      expirationDate: null,
    };
  }

  const isTrialing = entitlement.periodType === "TRIAL";
  const expirationDate = entitlement.expirationDate;

  // Determine plan from product identifier
  const productId = entitlement.productIdentifier?.toLowerCase() ?? "";
  let plan: SubscriptionPlan | null = null;
  if (productId.includes("annual") || productId.includes("yearly")) {
    plan = "annual";
  } else {
    plan = "weekly";
  }

  return {
    isPremium: true,
    isTrialing,
    plan,
    status: isTrialing ? "trialing" : "active",
    expirationDate: expirationDate ?? null,
  };
}

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isPremium, setIsPremium] = useState(false);
  const [isTrialing, setIsTrialing] = useState(false);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [status, setStatus] = useState<SubscriptionStatus>("none");
  const [expirationDate, setExpirationDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const initialized = useRef(false);

  const updateState = useCallback(
    (state: {
      isPremium: boolean;
      isTrialing: boolean;
      plan: SubscriptionPlan | null;
      status: SubscriptionStatus;
      expirationDate: string | null;
    }) => {
      setIsPremium(state.isPremium);
      setIsTrialing(state.isTrialing);
      setPlan(state.plan);
      setStatus(state.status);
      setExpirationDate(state.expirationDate);

      // Cache to AsyncStorage
      AsyncStorage.setItem(
        SUBSCRIPTION_STORAGE_KEY,
        JSON.stringify(state)
      ).catch(() => {});
    },
    []
  );

  // Initialize RevenueCat
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      try {
        // Load cached state first for instant UI
        const cached = await AsyncStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setIsPremium(parsed.isPremium ?? false);
            setIsTrialing(parsed.isTrialing ?? false);
            setPlan(parsed.plan ?? null);
            setStatus(parsed.status ?? "none");
            setExpirationDate(parsed.expirationDate ?? null);
          } catch {}
        }

        // Skip RevenueCat initialization on web — it's not supported
        if (Platform.OS === "web") {
          setIsLoading(false);
          return;
        }

        // Configure RevenueCat (mobile only)
        Purchases.setLogLevel(LOG_LEVEL.ERROR);

        // API keys should be set in app.config.js extra
        const Constants = require("expo-constants").default;
        const apiKey =
          Platform.OS === "ios"
            ? Constants.expoConfig?.extra?.revenueCatAppleKey ?? ""
            : Constants.expoConfig?.extra?.revenueCatGoogleKey ?? "";

        if (apiKey) {
          Purchases.configure({ apiKey });

          // Fetch customer info
          const customerInfo = await Purchases.getCustomerInfo();
          const state = extractSubscriptionState(customerInfo);
          updateState(state);

          // Fetch available packages
          try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current?.availablePackages) {
              setPackages(offerings.current.availablePackages);
            }
          } catch {}

          // Listen for changes
          Purchases.addCustomerInfoUpdateListener((info) => {
            const newState = extractSubscriptionState(info);
            updateState(newState);
          });
        }
      } catch (err) {
        console.warn("[Subscription] Init error:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [updateState]);

  const purchasePackage = useCallback(
    async (pkg: PurchasesPackage): Promise<boolean> => {
      if (Platform.OS === "web") {
        console.warn("[Subscription] Purchase not supported on web");
        return false;
      }
      try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        const state = extractSubscriptionState(customerInfo);
        updateState(state);
        return state.isPremium;
      } catch (err: any) {
        if (!err.userCancelled) {
          console.warn("[Subscription] Purchase error:", err);
        }
        return false;
      }
    },
    [updateState]
  );

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") {
      console.warn("[Subscription] Restore purchases not supported on web");
      return false;
    }
    try {
      const customerInfo = await Purchases.restorePurchases();
      const state = extractSubscriptionState(customerInfo);
      updateState(state);
      return state.isPremium;
    } catch (err) {
      console.warn("[Subscription] Restore error:", err);
      return false;
    }
  }, [updateState]);

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        isTrialing,
        plan,
        status,
        expirationDate,
        isLoading,
        packages,
        purchasePackage,
        restorePurchases,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextType {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
}
