
import 'dotenv/config';

export default {
  expo: {
    name: "Safe Space",
    slug: "Safe Space",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/safe-space-logo-gradient.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/safe-space-logo-black.png",
      resizeMode: "contain",
      backgroundColor: "#000000"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.anonymous.SafeSpace",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/safe-space-logo-gradient.png",
        backgroundColor: "#000000"
      },
      edgeToEdgeEnabled: true,
      package: "com.anonymous.SafeSpace"
    },
    web: {
      favicon: "./assets/images/final_quest_240x240.png",
      bundler: "metro"
    },
    plugins: [
      "expo-font",
      "expo-router",
      "expo-web-browser"
    ],
    scheme: "safespace",
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      // Backend configuration
      backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "",
      // Supabase configuration
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "",
    }
  }
};
