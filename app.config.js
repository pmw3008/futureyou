import "dotenv/config";

export default {
  expo: {
    name: "futureyou",
    slug: "futureyou",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      openaiApiKey: process.env.OPENAI_API_KEY || "",
      elevenlabsApiKey: process.env.ELEVENLABS_API_KEY || "",
      revenueCatAppleKey: process.env.REVENUECAT_APPLE_KEY || "",
      revenueCatGoogleKey: process.env.REVENUECAT_GOOGLE_KEY || "",
    },
  },
};
