import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MobileProvider } from "../lib/MobileContext";
import { AppShell } from "../components/AppShell";
export default function Layout() {
  return (
    <SafeAreaProvider>
      <MobileProvider>
        <AppShell>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#F5F7FA" },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="map" />
            <Stack.Screen name="visits" />
            <Stack.Screen name="network" />
          </Stack>
        </AppShell>
      </MobileProvider>
    </SafeAreaProvider>
  );
}
