import React from "react";
import { Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import DailyIdentityScreen from "../screens/DailyIdentityScreen";
import VisualizationGeneratorScreen from "../screens/VisualizationGeneratorScreen";
import EvidenceScreen from "../screens/EvidenceScreen";
import IdentityScreen from "../screens/IdentityScreen";
import { colors, fonts } from "../theme";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#000000",
          borderTopWidth: 1,
          borderTopColor: "rgba(255,138,43,0.08)",
          height: Platform.OS === "ios" ? 88 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: fonts.headline,
          fontSize: 10,
          letterSpacing: 0.8,
          textTransform: "uppercase",
        },
      }}
    >
      <Tab.Screen name="Ritual" component={DailyIdentityScreen} />
      <Tab.Screen name="Visualize" component={VisualizationGeneratorScreen} />
      <Tab.Screen name="Proof" component={EvidenceScreen} />
      <Tab.Screen name="Identity" component={IdentityScreen} />
    </Tab.Navigator>
  );
}
