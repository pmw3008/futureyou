import React, { useState, useCallback } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { TabNavigator } from "./src/navigation";
import { OnboardingScreen, SplashEntryScreen, PaywallScreen } from "./src/screens";
import { UserProfileProvider, useUserProfile } from "./src/context/UserProfileContext";
import { SubscriptionProvider, useSubscription } from "./src/context/SubscriptionContext";
import { RitualProvider } from "./src/context/RitualContext";
import { CustomLoopsProvider } from "./src/context/CustomLoopsContext";
import { ProgressProvider } from "./src/context/ProgressContext";
import { SavedVisualizationsProvider } from "./src/context/SavedVisualizationsContext";

SplashScreen.preventAutoHideAsync();

type AppPhase = "splash" | "onboarding" | "paywall" | "main";

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
          // After onboarding → paywall (they need to subscribe)
          setPhase("paywall");
        }}
      />
    );
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
      <View style={styles.loading}>
        <ActivityIndicator size="small" color="#FF9F45" />
      </View>
    );
  }

  return (
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
