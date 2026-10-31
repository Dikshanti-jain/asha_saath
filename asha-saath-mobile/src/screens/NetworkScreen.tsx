import { useState } from "react";
import { router } from "expo-router";
import { useMobile } from "../lib/MobileContext";
import {
  catalog,
  providers,
  ngoName,
  place,
  money,
  demoTime,
} from "../lib/catalog";
import {
  Screen,
  Section,
  Body,
  Heading,
  Button,
  Field,
  Choice,
  Badge,
  Notice,
  Check,
} from "../components/ui";

function ProviderCard({ provider }: { provider: (typeof providers)[number] }) {
  const { state, actor, lang, t, busy, command } = useMobile();
  const capacity = state?.capacity[provider.offer.id];
  const isOwner =
    actor?.role === "provider" && actor.providerId === provider.organizationId;
  const [total, setTotal] = useState(
    String(capacity?.totalUnits ?? provider.offer.capacity.totalUnits),
  );
  const [confirm, setConfirm] = useState(false);
  const [feedback, setFeedback] = useState("");
  const held = (state?.reservations ?? [])
    .filter(
      (r) =>
        r.offerId === provider.offer.id &&
        ["RESERVED", "COMMITTED", "RECONCILIATION_REQUIRED"].includes(r.state),
    )
    .reduce((sum, row) => sum + row.units, 0);
  const allReservationsKnown = actor?.role === "coordinator" || isOwner;
  const budget = state?.fundingAvailability[provider.organizationId];
  async function save() {
    const n = Number(total);
    if (!/^\d+$/.test(total) || !Number.isInteger(n) || n < 0 || n > 1000) {
      setFeedback(
        t(
          "Enter whole service slots between 0 and 1,000.",
          "0 से 1,000 तक पूरे सेवा स्लॉट लिखें।",
        ),
      );
      return;
    }
    if (!confirm) {
      setFeedback(
        t(
          "Confirm that the NGO reviewed this declared capacity.",
          "NGO द्वारा क्षमता की समीक्षा की पुष्टि करें।",
        ),
      );
      return;
    }
    setFeedback("");
    try {
      await command("updateCapacity", [provider.offer.id, n, true]);
      setConfirm(false);
      setFeedback(
        t(
          "Service capacity saved and reconfirmed on the server.",
          "सेवा क्षमता सर्वर पर सुरक्षित और दोबारा पुष्ट है।",
        ),
      );
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : String(err));
    }
  }
  return (
    <Section>
      <Badge label={t("Fictional participating NGO", "काल्पनिक सहभागी NGO")} />
      <Heading>{ngoName(provider.organizationId)}</Heading>
      <Body>
        {t(
          "Document checklist and application-step navigation",
          "दस्तावेज़ सूची और आवेदन के अगले कदम की सहायता",
        )}
      </Body>
      <Body>
        {provider.offer.mode === "ASSISTED_REMOTE"
          ? t(
              "Phone assistance through coordinator relay",
              "समन्वयक के माध्यम से फ़ोन सहायता",
            )
          : t(
              "In-person help desk or worker-supported visit",
              "सहायता केंद्र या कार्यकर्ता के साथ व्यक्तिगत सहायता",
            )}
      </Body>
      <Body>
        {t("Listed service area: ", "सूचीबद्ध सेवा क्षेत्र: ") +
          provider.offer.catchments.map((id) => place(id, lang)).join(", ")}
      </Body>
      <Body tone="muted">
        {t(
          "Catchment describes where assistance is offered. It does not prove live coverage, official endorsement or scheme approval.",
          "सेवा क्षेत्र सहायता देने की जगह बताता है। यह लाइव उपलब्धता, सरकारी समर्थन या योजना मंज़ूरी का प्रमाण नहीं है।",
        )}
      </Body>
      {capacity && (
        <>
          <Body>
            {capacity.totalUnits +
              t(
                " declared document-help slots",
                " घोषित दस्तावेज़ सहायता स्लॉट",
              )}
          </Body>
          {allReservationsKnown && (
            <Body>
              {Math.max(0, capacity.totalUnits - held) +
                t(" free · ", " खाली · ") +
                held +
                t(" held or consumed", " आरक्षित या उपयोग किए गए")}
            </Body>
          )}
          <Badge
            label={
              state && state.clock < capacity.freshUntil
                ? t("Capacity within demo validity", "क्षमता डेमो वैधता में है")
                : t(
                    "Capacity must be reconfirmed",
                    "क्षमता दोबारा पुष्ट करनी है",
                  )
            }
            tone={state && state.clock < capacity.freshUntil ? "ok" : "warn"}
          />
          <Body tone="muted">
            {t("NGO last confirmed: ", "NGO की अंतिम पुष्टि: ") +
              demoTime(capacity.confirmedAt)}
          </Body>
          {!allReservationsKnown && (
            <Body tone="muted">
              {t(
                "ASHA view does not expose all NGO allocations. The server checks available capacity when the NGO accepts a case.",
                "ASHA को NGO के सभी आवंटन नहीं दिखते। NGO के मामला स्वीकार करते समय सर्वर खाली क्षमता जाँचता है।",
              )}
            </Body>
          )}
        </>
      )}
      {!capacity && (
        <Body tone="muted">
          {t(
            "Current capacity is not shared with this account. The catalogue describes the service only.",
            "इस खाते के साथ वर्तमान क्षमता साझा नहीं है। सूची केवल सेवा बताती है।",
          )}
        </Body>
      )}
      {budget && (
        <Body>
          {t("Declared demo cash budget: ", "घोषित डेमो नकद बजट: ") +
            money(budget.totalRupees) +
            " · " +
            money(budget.availableRupees) +
            t(" available", " उपलब्ध")}
        </Body>
      )}
      {isOwner && (
        <>
          <Field
            label={t("Total declared service slots", "कुल घोषित सेवा स्लॉट")}
            value={total}
            onChangeText={(value) => {
              setTotal(value);
              setConfirm(false);
            }}
            numeric
            hint={t(
              "Whole number 0–1,000. Cannot be lower than held and used slots.",
              "पूरे अंक 0–1,000। आरक्षित और उपयोग किए स्लॉट से कम नहीं हो सकते।",
            )}
          />
          <Check
            label={t(
              "Our NGO reviewed and reconfirms this capacity",
              "हमारे NGO ने इस क्षमता की समीक्षा और दोबारा पुष्टि की है",
            )}
            value={confirm}
            onChange={setConfirm}
            disabled={busy}
          />
          <Button
            label={t(
              "Save and reconfirm service capacity",
              "सेवा क्षमता सुरक्षित और पुष्ट करें",
            )}
            onPress={save}
            disabled={busy || !confirm}
          />
        </>
      )}
      {feedback && (
        <Notice>
          <Body>{feedback}</Body>
        </Notice>
      )}
    </Section>
  );
}

export default function NetworkScreen() {
  const { state, actor, lang, t } = useMobile();
  const [area, setArea] = useState("all");
  const areas = catalog.geographies.filter((g) =>
    ["village", "hamlet", "ward", "settlement"].includes(g.level),
  );
  const rows = providers.filter(
    (p) => area === "all" || p.offer.catchments.includes(area),
  );
  return (
    <Screen
      title={t("NGO service network", "NGO सेवा नेटवर्क")}
      subtitle={t(
        "Choose help by service area, then coordinate through a permitted case.",
        "सेवा क्षेत्र के अनुसार सहायता चुनें और अनुमत मामले से समन्वय करें।",
      )}
    >
      <Notice title={t("Three fictional partners", "तीन काल्पनिक साथी")}>
        <Body>
          {t(
            "This demonstration supports one document-navigation service and a separate cash-assistance record. Real partner verification and payment connections are pending.",
            "इस डेमो में दस्तावेज़ मार्गदर्शन की एक सेवा और अलग नकद सहायता रिकॉर्ड है। वास्तविक साथी जाँच और भुगतान जुड़ाव बाकी हैं।",
          )}
        </Body>
      </Notice>
      <Section title={t("Find a listed service", "सूचीबद्ध सेवा खोजें")}>
        <Choice
          label={t("Service locality", "सेवा क्षेत्र")}
          value={area}
          onChange={setArea}
          options={[
            {
              value: "all",
              label: t("All demo localities", "सभी डेमो क्षेत्र"),
            },
            ...areas.map((g) => ({
              value: g.id,
              label:
                place(g.id, lang) +
                " · " +
                (g.areaType === "urban"
                  ? t("Urban", "शहरी")
                  : t("Rural", "ग्रामीण")),
            })),
          ]}
        />
        <Body tone="muted">
          {t(
            "The demo belongs to one fictional district/state. A national network is not connected.",
            "यह डेमो एक काल्पनिक ज़िले/राज्य का है। राष्ट्रीय नेटवर्क जुड़ा नहीं है।",
          )}
        </Body>
      </Section>
      {!rows.length && (
        <Notice
          tone="warn"
          title={t(
            "No listed provider for this locality",
            "इस क्षेत्र के लिए सूचीबद्ध NGO नहीं है",
          )}
        >
          <Body>
            {t(
              "Keep the help need with the coordinator for follow-up. An unlisted area is not assumed to be covered.",
              "सहायता की ज़रूरत समन्वयक के पास अनुवर्ती कार्य के लिए रखें। सूची से बाहर क्षेत्र में सेवा मानकर नहीं चलें।",
            )}
          </Body>
          <Button
            label={t("Open help requests", "सहायता अनुरोध खोलें")}
            onPress={() => router.push("/needs")}
          />
        </Notice>
      )}
      {rows.map((provider) => (
        <ProviderCard
          key={
            provider.organizationId +
            ":" +
            actor?.actorId +
            ":" +
            state?.capacity[provider.offer.id]?.totalUnits +
            ":" +
            state?.capacity[provider.offer.id]?.confirmedAt
          }
          provider={provider}
        />
      ))}
      <Section title={t("Coordinate the next step", "अगले कदम का समन्वय करें")}>
        <Button
          label={
            actor?.role === "provider"
              ? t("Open my permitted requests", "मेरे अनुमत अनुरोध खोलें")
              : t(
                  "Open document-help requests",
                  "दस्तावेज़ सहायता अनुरोध खोलें",
                )
          }
          onPress={() => router.push("/needs")}
        />
        <Button
          label={t("Open cash assistance", "नकद सहायता खोलें")}
          secondary
          onPress={() => router.push("/funding")}
        />
        <Button
          label={t("Open case conversations", "मामलों की बातचीत खोलें")}
          secondary
          onPress={() => router.push("/messages")}
        />
        <Body tone="muted">
          {t(
            "Messages are scoped to currently permitted referrals or funding requests. This does not send SMS, WhatsApp or email.",
            "संदेश केवल वर्तमान अनुमति वाले सहायता या नकद अनुरोध तक हैं। इससे SMS, WhatsApp या ईमेल नहीं जाता।",
          )}
        </Body>
      </Section>
    </Screen>
  );
}
