import type { ExpoConfig, ConfigContext } from "expo/config";
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "ASHA Saath",
  slug: "asha-saath-mobile",
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-font",
    [
      "expo-build-properties",
      {
        android: {
          usesCleartextTraffic: process.env.ASHA_ALLOW_LOCAL_HTTP === "1",
        },
      },
    ],
  ],
  extra: { ...config.extra, mapRenderer: "leaflet-webview" },
});
