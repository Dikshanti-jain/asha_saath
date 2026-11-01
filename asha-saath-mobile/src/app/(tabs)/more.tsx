import { router } from "expo-router";
import { Linking } from "react-native";
import { useMobile } from "../../lib/MobileContext";
import { Screen, Section, Body, Button, Notice } from "../../components/ui";
import { AccountPanel } from "../../components/AccountPanel";
const websiteFor = (base: string) => {
  if (!base) return "http://127.0.0.1:5173";
  const url = new URL(base);
  if (url.protocol === "http:" && ["5186", "5187", "4318"].includes(url.port))
    url.port = "5173";
  return url.origin;
};
export default function More() {
  const m = useMobile();
  const website = process.env.EXPO_PUBLIC_WEBSITE_URL ?? websiteFor(m.base);
  return (
    <Screen title={m.t("Services, account and help", "सेवाएं, खाता और मदद")}>
      <Section title={m.t("Local services", "स्थानीय सेवाएं")}>
        {m.actor?.role !== "provider" && (
          <Button
            label={m.t("Visit route map", "दौरे का नक्शा")}
            secondary
            onPress={() => router.push("/map")}
          />
        )}
        <Button
          label={m.t("NGO service areas", "NGO सेवा क्षेत्र")}
          secondary
          onPress={() => router.push("/network")}
        />
        <Button
          label={m.t("Open companion website", "वेबसाइट खोलें")}
          secondary
          onPress={() => Linking.openURL(website)}
        />
      </Section>
      <Section title={m.t("How to use", "कैसे इस्तेमाल करें")}>
        <Body>
          {m.t(
            "1. Follow your saved visit plan. Record the actual outcome.",
            "1. सेव की गई योजना के अनुसार दौरा करें। वास्तविक परिणाम दर्ज करें।",
          )}
        </Body>
        <Body>
          {m.t(
            "2. Capture a document-help need and check the official public-service pathway first.",
            "2. दस्तावेज़ मदद की जरूरत दर्ज करें। पहले अधिकृत सार्वजनिक सेवा की प्रक्रिया देखें।",
          )}
        </Body>
        <Body>
          {m.t(
            "3. Ask permission for one named NGO. Request cash support only for a nonclinical service-access cost.",
            "3. चुनी NGO के लिए अनुमति लें। गैर-चिकित्सीय सेवा खर्च के लिए ही नकद मदद मांगें।",
          )}
        </Body>
        <Body>
          {m.t(
            "4. Use case messages to arrange help. Ask the person what they received before closure.",
            "4. सेवा व्यवस्था के लिए अनुरोध संदेश भेजें। बंद करने से पहले व्यक्ति से प्राप्ति की पुष्टि करें।",
          )}
        </Body>
      </Section>
      <Notice title={m.t("Privacy and demo limits", "गोपनीयता और डेमो सीमा")}>
        {m.t(
          "Only case participants may read permitted details. Withdrawal ends NGO access. Do not enter real names, IDs, medical records, bank or contact details. No money transfer, live NGO connection or offline saving is configured.",
          "केवल अधिकृत प्रतिभागी जानकारी देख सकते हैं। अनुमति वापसी से NGO की पहुंच बंद होती है। वास्तविक नाम, पहचान, स्वास्थ्य, बैंक या संपर्क जानकारी न दें। पैसे भेजना, लाइव NGO जुड़ाव और ऑफलाइन सेव उपलब्ध नहीं हैं।",
        )}
      </Notice>
      <Section title={m.t("Your demo account", "आपका डेमो खाता")}>
        <Body>{m.actor?.label}</Body>
        <Button
          label={m.t("Sign out", "खाता बंद करें")}
          danger
          disabled={m.busy}
          onPress={() => m.logout()}
        />
      </Section>
      <AccountPanel />
    </Screen>
  );
}
