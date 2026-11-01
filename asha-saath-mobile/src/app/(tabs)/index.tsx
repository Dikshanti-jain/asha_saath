import { router } from "expo-router";
import { useMobile } from "../../lib/MobileContext";
import { Screen, Section, Body, Button, Notice } from "../../components/ui";
import VisitsScreen from "../../screens/VisitsScreen";
import NeedsScreen from "../../screens/NeedsScreen";
import { demoDate } from "../../lib/catalog";
export default function Home() {
  const m = useMobile();
  if (m.actor?.role === "worker") return <VisitsScreen />;
  if (m.actor?.role === "provider") return <NeedsScreen />;
  if (!m.state) return null;
  const s = m.state;
  return (
    <Screen
      title={m.t("District coordination desk", "ज़िला समन्वय कार्यालय")}
      subtitle={m.t(
        "Keep visits and local assistance moving.",
        "दौरे और स्थानीय सहायता आगे बढ़ाएं।",
      )}
    >
      <Notice title={m.t("Fictional catchment", "काल्पनिक क्षेत्र")}>
        {demoDate(s.clock)} · {m.t("Demonstration date", "डेमो तारीख")}
      </Notice>
      <Section title={m.t("Visit coverage", "दौरों की स्थिति")}>
        <Body>
          {m.t("Recorded visits", "दर्ज दौरे")}: {s.visits.length} ·{" "}
          {m.t("Visit tasks", "दौरा कार्य")}: {s.tasks.length}
        </Body>
        <Button
          label={m.t("Review ASHA plans", "आशा की योजना देखें")}
          onPress={() => router.push("/visits")}
        />
        <Button
          label={m.t("Maps and service coverage", "नक्शे और सेवा क्षेत्र")}
          secondary
          onPress={() => router.push("/map")}
        />
      </Section>
      <Section title={m.t("Pending community help", "लंबित स्थानीय मदद")}>
        <Body>
          {
            s.needs.filter((n) => !["CLOSED", "WITHDRAWN"].includes(n.state))
              .length
          }{" "}
          {m.t("open document-help requests", "खुले दस्तावेज़ सहायता अनुरोध")}
        </Body>
        <Button
          label={m.t("Review help requests", "सहायता अनुरोध देखें")}
          onPress={() => router.push("/needs")}
        />
        <Button
          label={m.t("Find local NGO services", "स्थानीय NGO सेवा देखें")}
          secondary
          onPress={() => router.push("/network")}
        />
      </Section>
      <Section title={m.t("Cash assistance", "नकद सहायता")}>
        <Body>
          {
            s.fundingRequests.filter(
              (f) =>
                !["CLOSED", "WITHDRAWN", "CANCELLED", "DECLINED"].includes(
                  f.state,
                ),
            ).length
          }{" "}
          {m.t("open cash requests", "खुले धन अनुरोध")}
        </Body>
        <Body tone="muted">
          {m.t(
            "NGO approval, payment report and person confirmation are separate. All amounts are fictional.",
            "NGO की स्वीकृति, भुगतान विवरण और व्यक्ति की पुष्टि अलग हैं। सभी राशि काल्पनिक हैं।",
          )}
        </Body>
        <Button
          label={m.t("Review cash support", "धन सहायता देखें")}
          secondary
          onPress={() => router.push("/funding")}
        />
      </Section>
      <Section
        title={m.t("Separate health pathway", "अलग स्वास्थ्य प्रक्रिया")}
      >
        <Body>
          {s.tasks.filter((t) => t.status === "ESCALATION_REQUIRED").length}{" "}
          {m.t(
            "escalation tasks — follow the approved health-team pathway.",
            "स्वास्थ्य संदर्भ — अधिकृत स्वास्थ्य दल की प्रक्रिया अपनाएं।",
          )}
        </Body>
      </Section>
    </Screen>
  );
}
