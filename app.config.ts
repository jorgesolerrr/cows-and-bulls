import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: "Cows & Bulls",
    slug: "cows-and-bulls",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    scheme: "cowsandbulls",
    newArchEnabled: true,
    runtimeVersion: {
      policy: "appVersion",
    },
    updates: {
      url: "https://u.expo.dev/b9c8a109-ce4a-4b1c-a265-1fa528a40826",
    },
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#101014",
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      package: "com.gabycowsandbulls.app",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#101014",
      },
      edgeToEdgeEnabled: true,
    },
    plugins: ["expo-router", "expo-updates"],
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      router: {},
      eas: {
        projectId: "b9c8a109-ce4a-4b1c-a265-1fa528a40826",
      },
    },
  };
};
