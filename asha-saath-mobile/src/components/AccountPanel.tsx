import { useState } from "react";
import { View } from "react-native";
import { useMobile } from "../lib/MobileContext";
import { Body, Button, Field, Section, Notice } from "./ui";
export function AccountPanel() {
  const m = useMobile();
  const [server, setServer] = useState(m.base),
    [settings, setSettings] = useState(false);
  const labels: Record<string, [string, string]> = {
    "ASHA-DEMO-01": ["Rural ASHA", "ग्रामीण आशा"],
    "ASHA-DEMO-02": ["Urban ASHA", "शहरी आशा"],
    "COORD-DEMO-01": ["District coordinator", "ज़िला समन्वयक"],
    "ORG-DEMO-A": ["NGO partner A", "NGO संस्था A"],
    "ORG-DEMO-B": ["NGO partner B", "NGO संस्था B"],
    "ORG-DEMO-C": ["NGO partner C", "NGO संस्था C"],
  };
  return (
    <View style={{ gap: 16 }}>
      <Notice title={m.t("Fictional demo accounts", "काल्पनिक डेमो खाते")}>
        {m.t(
          "Try the workflow as an ASHA, coordinator or NGO. These accounts do not verify real staff identity.",
          "आशा, समन्वयक या NGO का काम आज़माएं। ये खाते वास्तविक कर्मचारी की पहचान सत्यापित नहीं करते।",
        )}
      </Notice>
      {m.actors.length ? (
        ["worker", "coordinator", "provider"].map((role) => (
          <Section
            key={role}
            title={
              role === "worker"
                ? m.t("ASHA field team", "आशा दल")
                : role === "coordinator"
                  ? m.t("District desk", "ज़िला कार्यालय")
                  : m.t("NGO support desk", "NGO सहायता")
            }
          >
            <Body tone="muted">
              {role === "worker"
                ? m.t(
                    "Follow visits, ask for help and confirm receipt.",
                    "दौरे करें, मदद मांगें और प्राप्ति की पुष्टि करें।",
                  )
                : role === "coordinator"
                  ? m.t(
                      "Plan work and follow unresolved requests.",
                      "कार्य योजना और लंबित अनुरोध देखें।",
                    )
                  : m.t(
                      "Respond within your service capacity and budget.",
                      "क्षमता और बजट के अनुसार अनुरोध का उत्तर दें।",
                    )}
            </Body>
            {m.actors
              .filter((a) => a.role === role)
              .map((a) => (
                <Button
                  key={a.actorId}
                  label={m.t(...(labels[a.actorId] ?? [a.label, a.label]))}
                  secondary={m.actor?.actorId !== a.actorId}
                  disabled={m.busy}
                  onPress={() => m.login(a.actorId)}
                />
              ))}
          </Section>
        ))
      ) : (
        <Section>
          <Body>
            {m.ready
              ? m.t(
                  "Connect to the ASHA Saath server to load demo accounts.",
                  "डेमो खाते देखने के लिए सर्वर से जुड़ें।",
                )
              : m.t(
                  "Loading available accounts…",
                  "उपलब्ध खाते लोड हो रहे हैं…",
                )}
          </Body>
          <Button
            label={m.t("Try connection again", "फिर जुड़ने की कोशिश करें")}
            secondary
            disabled={m.busy}
            onPress={() => m.setServer(server)}
          />
        </Section>
      )}
      <Button
        label={m.t(
          settings ? "Hide server settings" : "Server connection",
          settings ? "सर्वर सेटिंग छिपाएं" : "सर्वर कनेक्शन",
        )}
        secondary
        onPress={() => setSettings(!settings)}
      />
      {settings && (
        <Section title={m.t("Server address", "सर्वर का पता")}>
          <Field
            label={m.t("API server origin", "API सर्वर का पता")}
            value={server}
            onChangeText={setServer}
            hint={m.t(
              "On a physical phone, use your hosted HTTPS address or the computer’s LAN address. An empty address uses this browser preview.",
              "फ़ोन पर होस्ट किया HTTPS पता या कंप्यूटर का स्थानीय नेटवर्क पता दें। ब्राउज़र डेमो में खाली पता इस्तेमाल होता है।",
            )}
          />
          <Button
            label={m.t("Connect to server", "सर्वर से जुड़ें")}
            disabled={m.busy}
            onPress={() => m.setServer(server)}
          />
        </Section>
      )}
    </View>
  );
}
