
import 'dotenv/config';

export default {
  expo: {
    name: "Safe Space",
    slug: "Natively",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/safe-space-logo-gradient.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/safe-space-logo-gradient.png",
      resizeMode: "contain",
      backgroundColor: "#FFFFFF"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.anonymous.Natively",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        CFBundleDisplayName: "Safe Space"
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/safe-space-logo-gradient.png",
        backgroundColor: "#FFFFFF"
      },
      edgeToEdgeEnabled: true,
      package: "com.anonymous.Natively"
    },
    web: {
      favicon: "./assets/images/safe-space-logo-gradient.png",
      bundler: "metro"
    },
    plugins: [
      "expo-font",
      "expo-router",
      "expo-web-browser"
    ],
    scheme: "natively",
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
