import React, { useState, useCallback } from "react";
import { View, ActivityIndicator, StyleSheet, Platform, Dimensions } from "react-native";
import {
  SafeAreaProvider,
  SafeAreaInsetsContext,
  SafeAreaFrameContext,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { TabNavigator } from "./src/navigation";
import { OnboardingScreen, SplashEntryScreen, PaywallScreen, TasteScreen } from "./src/screens";
import { UserProfileProvider, useUserProfile } from "./src/context/UserProfileContext";
import { SubscriptionProvider, useSubscription } from "./src/context/SubscriptionContext";
import { RitualProvider } from "./src/context/RitualContext";
import { CustomLoopsProvider } from "./src/context/CustomLoopsContext";
import { ProgressProvider } from "./src/context/ProgressContext";
import { SavedVisualizationsProvider } from "./src/context/SavedVisualizationsContext";

SplashScreen.preventAutoHideAsync();

// ─── Safe Area Web Fix ────────────────────────────────────────
// On web, safe area insets are always 0 (browsers don't have notches).
// The native SafeAreaProvider can fail to initialize its context on web
// deployments (Vercel SSR, timing issues with CSS env() measurement),
// causing "No safe area value available" crashes from consumers like
// @react-navigation/elements which call useSafeAreaInsets() directly.
//
// Fix: On web, wrap everything in explicit context providers that
// guarantee non-null values BEFORE SafeAreaProvider even mounts.
// On native, just render children directly (SafeAreaProvider handles it).

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const WEB_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
const WEB_FRAME = { x: 0, y: 0, width: screenWidth, height: screenHeight };

// Stable reference — same approach as @react-navigation/elements SafeAreaProviderCompat
const SAFE_AREA_INITIAL_METRICS =
  Platform.OS === "web" || initialWindowMetrics == null
    ? { frame: WEB_FRAME, insets: WEB_INSETS }
    : initialWindowMetrics;

function SafeAreaWebGuard({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== "web") {
    // On native, SafeAreaProvider handles everything correctly
    return <>{children}</>;
  }

  // On web, provide guaranteed non-null context values so that
  // useSafeAreaInsets() / useSafeAreaFrame() NEVER throw,
  // even if SafeAreaProvider's internal measurement hasn't fired yet.
  return (
    <SafeAreaInsetsContext.Provider value={WEB_INSETS}>
      <SafeAreaFrameContext.Provider value={WEB_FRAME}>
        {children}
      </SafeAreaFrameContext.Provider>
    </SafeAreaInsetsContext.Provider>
  );
}

// ─── App ──────────────────────────────────────────────────────

type AppPhase = "splash" | "onboarding" | "taste" | "paywall" | "main";

function AppContent() {
  const { isOnboarded, profileLoaded } = useUserProfile();
  const { isPremium, isLoading: subLoading } = useSubscription();
  const [phase, setPhase] = useState<AppPhase>("splash");

  // Wait for profile and subscription to load before deciding phase
  if ((!profileLoaded || subLoading) && phase !== "splash") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color="#FF9F45" />
      </View>
    );
  }

  if (phase === "splash") {
    return (
      <SplashEntryScreen
        onComplete={() => {
          if (!isOnboarded) {
            setPhase("onboarding");
          } else if (isPremium) {
            setPhase("main");
          } else {
            // Returning non-premium user — show paywall directly
            // (taste is only for first-time onboarding flow)
            setPhase("paywall");
          }
        }}
      />
    );
  }

  if (phase === "onboarding") {
    return (
      <OnboardingScreen
        onComplete={() => {
          // After onboarding → taste (micro-transformation before paywall)
          setPhase("taste");
        }}
      />
    );
  }

  if (phase === "taste") {
    // If already premium, skip straight to main
    if (isPremium) {
      setPhase("main");
      return null;
    }
    return <TasteScreen onComplete={() => setPhase("paywall")} />;
  }

  if (phase === "paywall") {
    // If they already have premium (restored, etc.), skip
    if (isPremium) {
      setPhase("main");
      return null;
    }
    return <PaywallScreen onSuccess={() => setPhase("main")} />;
  }

  return (
    <NavigationContainer>
      <TabNavigator />
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    AileronBold: require("./assets/fonts/Aileron Bold Font.otf"),
    RelationshipOfMelodrame: require("./assets/fonts/relationship-of-melodrame.ttf"),
    MuktaExtralight: require("./assets/fonts/Mukta Extralight Font.ttf"),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <SafeAreaWebGuard>
        <SafeAreaProvider initialMetrics={SAFE_AREA_INITIAL_METRICS}>
          <View style={styles.loading}>
            <ActivityIndicator size="small" color="#FF9F45" />
          </View>
        </SafeAreaProvider>
      </SafeAreaWebGuard>
    );
  }

  return (
    <SafeAreaWebGuard>
      <SafeAreaProvider initialMetrics={SAFE_AREA_INITIAL_METRICS}>
        <View style={styles.root} onLayout={onLayoutRootView}>
          <UserProfileProvider>
            <SubscriptionProvider>
              <RitualProvider>
                <CustomLoopsProvider>
                  <ProgressProvider>
                    <SavedVisualizationsProvider>
                      <AppContent />
                    </SavedVisualizationsProvider>
                  </ProgressProvider>
                </CustomLoopsProvider>
              </RitualProvider>
            </SubscriptionProvider>
          </UserProfileProvider>
        </View>
      </SafeAreaProvider>
    </SafeAreaWebGuard>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
  },
});
