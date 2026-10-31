import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { useMobile } from "../lib/MobileContext";
import { BrandMark } from "./BrandMark";
import { AccountPanel } from "./AccountPanel";
import { gov, Screen } from "./ui";
export function AppShell({ children }: { children: ReactNode }) {
  const m = useMobile();
  return (
    <SafeAreaView edges={["top"]} style={s.safe}>
      <StatusBar style="light" />
      <View style={s.utility}>
        <Text style={s.prototype}>
          {m.t(
            "Independent prototype · Fictional data",
            "स्वतंत्र प्रोटोटाइप · काल्पनिक डेटा",
          )}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Switch language / भाषा बदलें"
          onPress={() => m.setLang(m.lang === "en" ? "hi" : "en")}
          style={s.language}
        >
          <Text style={s.utilityText}>
            {m.lang === "en" ? "हिन्दी" : "English"}
          </Text>
        </Pressable>
      </View>
      <View style={s.masthead}>
        <BrandMark />
        <View style={{ flex: 1 }}>
          <Text style={s.brand}>
            आशा साथ <Text style={s.brandEnglish}>ASHA Saath</Text>
          </Text>
          <Text style={s.subtitle}>
            {m.t("Visits & community support", "दौरे और स्थानीय सहायता")}
          </Text>
        </View>
        {m.actor && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={m.t("Account and help", "खाता और मदद")}
            onPress={() => router.push("/more")}
            style={s.account}
          >
            <Ionicons name="person-circle-outline" size={29} color={gov.blue} />
          </Pressable>
        )}
      </View>
      {m.actor && (
        <View style={s.status}>
          <Text style={s.statusText}>
            {m.t(
              m.actor.role === "worker"
                ? "ASHA workspace"
                : m.actor.role === "coordinator"
                  ? "Coordinator desk"
                  : "NGO workspace",
              m.actor.role === "worker"
                ? "आशा कार्यक्षेत्र"
                : m.actor.role === "coordinator"
                  ? "समन्वयक कार्यालय"
                  : "NGO कार्यक्षेत्र",
            )}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={m.t("Refresh workspace", "रिकॉर्ड फिर जांचें")}
            disabled={m.busy}
            onPress={() => void m.refresh().catch(() => {})}
            style={s.refresh}
          >
            {m.busy ? (
              <ActivityIndicator size="small" color={gov.blue} />
            ) : (
              <Ionicons name="refresh" size={17} color={gov.blue} />
            )}
            <Text style={s.checked}>
              {m.lastCheckedAt
                ? new Date(m.lastCheckedAt).toLocaleTimeString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  }) + " IST"
                : m.t("Refresh needed", "जांच जरूरी")}
            </Text>
          </Pressable>
        </View>
      )}
      {m.error && (
        <View accessibilityRole="alert" style={s.error}>
          <Ionicons name="alert-circle-outline" size={20} color={gov.red} />
          <Text style={[s.feedback, { color: gov.red }]}>{m.error}</Text>
        </View>
      )}
      {m.notice && !m.error && (
        <View accessibilityLiveRegion="polite" style={s.success}>
          <Ionicons
            name="checkmark-circle-outline"
            size={19}
            color={gov.green}
          />
          <Text style={[s.feedback, { color: gov.green }]}>{m.notice}</Text>
        </View>
      )}
      <View style={s.content}>
        {m.actor ? (
          children
        ) : (
          <Screen
            title={m.t("Choose your service desk", "अपना कार्यक्षेत्र चुनें")}
            subtitle={m.t(
              "A clear plan. Local help. Confirmed support.",
              "स्पष्ट योजना। स्थानीय मदद। सहायता की पुष्टि।",
            )}
          >
            <AccountPanel />
          </Screen>
        )}
      </View>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: gov.navy },
  utility: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 14,
    borderBottomWidth: 2,
    borderColor: gov.accent,
    gap: 8,
  },
  prototype: { flex: 1, fontSize: 12, lineHeight: 18, color: "#FFF" },
  language: {
    minHeight: 44,
    minWidth: 66,
    paddingHorizontal: 12,
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#334E68",
  },
  utilityText: { color: "#FFF", fontSize: 14 },
  masthead: {
    backgroundColor: "#FFF",
    padding: 14,
    gap: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: gov.border,
  },
  brand: { fontSize: 21, fontWeight: "700", color: gov.navy, lineHeight: 29 },
  brandEnglish: { fontSize: 16 },
  subtitle: { fontSize: 12, lineHeight: 19, color: gov.muted },
  account: {
    minHeight: 48,
    minWidth: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  status: {
    backgroundColor: "#EAF1F8",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 16,
    minHeight: 42,
    borderBottomWidth: 1,
    borderColor: gov.border,
  },
  statusText: { fontSize: 13, color: gov.navy },
  refresh: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
  },
  checked: { fontSize: 12, color: gov.muted },
  content: { flex: 1, backgroundColor: gov.page },
  error: {
    backgroundColor: "#FEF2F2",
    padding: 12,
    flexDirection: "row",
    gap: 8,
  },
  success: {
    backgroundColor: "#F0FDF4",
    padding: 8,
    flexDirection: "row",
    gap: 8,
  },
  feedback: { fontSize: 14, lineHeight: 21, flex: 1 },
});
