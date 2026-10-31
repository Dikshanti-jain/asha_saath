import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMobile } from "../../lib/MobileContext";
import { gov } from "../../components/ui";
export default function TabLayout() {
  const { t, state, actor } = useMobile();
  const unread =
    state?.messages.filter((x) => !x.readBy.includes(actor?.actorId ?? ""))
      .length ?? 0;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: gov.blue,
        tabBarInactiveTintColor: gov.muted,
        tabBarStyle: {
          borderTopWidth: 2,
          borderTopColor: gov.accent,
          backgroundColor: "#FFF",
          minHeight: 70,
        },
        tabBarLabelStyle: { fontSize: 12, lineHeight: 16, fontWeight: "600" },
        sceneStyle: { backgroundColor: gov.page },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t(
            actor?.role === "worker" ? "Today" : "Desk",
            actor?.role === "worker" ? "आज" : "कार्यालय",
          ),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="needs"
        options={{
          title: t("Help", "सहायता"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="funding"
        options={{
          title: t("Funding", "धन मदद"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t("Messages", "संदेश"),
          tabBarBadge: unread || undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="chatbubble-ellipses-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t("More", "और"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
