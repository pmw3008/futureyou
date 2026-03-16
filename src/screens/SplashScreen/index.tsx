import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#000000", "#0D0906", "#000000"]}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Warm ambient glow */}
      <View style={styles.glowContainer}>
        <LinearGradient
          colors={["rgba(229,80,26,0.25)", "rgba(255,138,43,0.12)", "transparent"]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={["rgba(229,80,26,0.25)", "rgba(255,138,43,0.12)", "transparent"]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
      <Text style={styles.title}>FutureYou</Text>
      <Text style={styles.subtitle}>step into your highest self</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  glowContainer: {
    position: "absolute",
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: 9999,
    overflow: "hidden",
    top: height * 0.5 - width * 0.6,
    left: width * 0.5 - width * 0.6,
  },
  title: {
    fontFamily: "RelationshipOfMelodrame",
    fontSize: 42,
    color: "#F5EEE4",
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: "MuktaExtralight",
    fontSize: 15,
    color: "rgba(255,240,225,0.85)",
    letterSpacing: 3.5,
    textTransform: "lowercase",
    marginTop: 16,
  },
});
