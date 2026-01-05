
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
      image: "./assets/images/safe-space-logo-black.png",
      resizeMode: "contain",
      backgroundColor: "#000000"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.anonymous.SafeSpace",
      icon: "./assets/images/safe-space-logo-gradient.png",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        CFBundleDisplayName: "Safe Space"
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/safe-space-logo-gradient.png",
        backgroundColor: "#000000"
      },
      icon: "./assets/images/safe-space-logo-gradient.png",
      edgeToEdgeEnabled: true,
      package: "com.anonymous.SafeSpace",
      softwareKeyboardLayoutMode: "resize"
    },
    web: {
      favicon: "./assets/images/safe-space-logo-gradient.png",
      bundler: "metro"
    },
    plugins: [
      "expo-font",
      "expo-router",
      "expo-web-browser",
      "expo-apple-authentication"
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
