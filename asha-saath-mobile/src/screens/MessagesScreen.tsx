import { useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMobile } from "../lib/MobileContext";
import { place, demoTime } from "../lib/catalog";
import {
  Screen,
  Section,
  Body,
  Button,
  Field,
  Choice,
  Badge,
  Notice,
  Heading,
} from "../components/ui";

export default function MessagesScreen() {
  const { actor } = useMobile();
  const params = useLocalSearchParams<{ thread?: string | string[] }>();
  const routeThread = Array.isArray(params.thread)
    ? params.thread[0]
    : params.thread;
  return (
    <MessagesWorkspace
      key={`${actor?.actorId}:${routeThread ?? ""}`}
      routeThread={routeThread}
    />
  );
}
function MessagesWorkspace({ routeThread }: { routeThread?: string }) {
  const { state, actor, lang, t, busy, command } = useMobile();
  const [selected, setSelected] = useState(routeThread ?? "");
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState("");
  const [failed, setFailed] = useState(false);
  const threads = state?.caseThreads ?? [];
  const thread = threads.find((row) => row.key === selected);
  const messages = (state?.messages ?? [])
    .filter((row) => row.threadKey === thread?.key)
    .sort((a, b) => a.at - b.at);
  const unread = (key: string) =>
    (state?.messages ?? []).filter(
      (row) =>
        row.threadKey === key &&
        row.senderActorId !== actor?.actorId &&
        actor &&
        !row.readBy.includes(actor.actorId),
    ).length;

  const identity = `${selected}:${thread?.canSend ?? "unavailable"}`;
  const [draftIdentity, setDraftIdentity] = useState(identity);
  // A changed or ended grant clears drafts before the new conversation renders.
  if (draftIdentity !== identity) {
    setDraftIdentity(identity);
    setDraft("");
    setFeedback("");
  }

  async function run(name: string, args: unknown[], success: string) {
    setFeedback("");
    try {
      await command(name, args);
      setFailed(false);
      setFeedback(success);
      return true;
    } catch (e) {
      setFailed(true);
      setFeedback(e instanceof Error ? e.message : String(e));
      return false;
    }
  }
  async function send() {
    if (!thread?.canSend || !draft.trim() || draft.trim().length > 1000) {
      setFailed(true);
      setFeedback(
        t(
          "Choose an open conversation and write 1–1,000 characters.",
          "खुला संवाद चुनें और 1–1,000 अक्षर का संदेश लिखें।",
        ),
      );
      return;
    }
    const sent = await run(
      "sendCaseMessage",
      [thread.key, draft.trim()],
      t("Message saved for this case.", "इस अनुरोध का संदेश सेव हुआ।"),
    );
    if (sent) setDraft("");
  }

  return (
    <Screen
      title={t("Case messages", "अनुरोध के संदेश")}
      subtitle={t(
        "Talk to the named NGO about one specific request.",
        "एक अनुरोध के बारे में चुनी NGO से बात करें।",
      )}
    >
      <Notice title={t("Fictional participants", "काल्पनिक प्रतिभागी")}>
        {t(
          "Case messages stay in this demo. No live NGO, SMS or WhatsApp is connected. Use fictional service details only.",
          "संदेश इसी डेमो में सेव होते हैं। लाइव NGO, SMS या WhatsApp जुड़ी नहीं है। केवल काल्पनिक सेवा जानकारी लिखें।",
        )}
      </Notice>
      {!threads.length ? (
        <Section
          title={t("No case conversations yet", "अभी कोई अनुरोध संवाद नहीं")}
        >
          <Body>
            {t(
              "A conversation opens after a help or cash request reaches a named NGO with permission. Ended NGO access removes its messages.",
              "अनुमति के साथ सहायता या नकद अनुरोध एक NGO को भेजने पर संवाद खुलता है। NGO की पहुंच समाप्त होने पर उसके संदेश हटते हैं।",
            )}
          </Body>
          <Button
            label={t("Open help requests", "सहायता अनुरोध खोलें")}
            onPress={() => router.push("/needs")}
            secondary
          />
        </Section>
      ) : (
        <>
          <Section>
            <Choice
              label={t("Choose a case", "अनुरोध चुनें")}
              value={thread?.key ?? ""}
              onChange={setSelected}
              disabled={busy}
              options={[
                {
                  value: "",
                  label: t("Choose request and NGO", "अनुरोध और NGO चुनें"),
                },
                ...threads.map((row) => ({
                  value: row.key,
                  label: `${row.ref} · ${row.providerName} · ${row.kind === "funding" ? t("Cash support", "नकद सहायता") : t("Document help", "दस्तावेज़ सहायता")}${unread(row.key) ? ` · ${unread(row.key)} ${t("unread", "बिना पढ़े")}` : ""}`,
                })),
              ]}
            />
            <Body tone="muted">
              {t(
                "Only the assigned ASHA, coordinator and named NGO can participate in this case.",
                "केवल इस अनुरोध की आशा, समन्वयक और चुनी NGO इसमें भाग लेते हैं।",
              )}
            </Body>
          </Section>
          {selected && !thread && (
            <Notice tone="warn">
              {t(
                "This conversation is unavailable or permission ended. Choose another case.",
                "यह संवाद उपलब्ध नहीं है या अनुमति समाप्त हुई। दूसरा अनुरोध चुनें।",
              )}
            </Notice>
          )}
          {thread && (
            <Section>
              <Heading>{`${thread.ref} · ${thread.providerName}`}</Heading>
              <Body>{`${thread.kind === "funding" ? t("Cash-support coordination", "नकद सहायता समन्वय") : t("Document assistance", "दस्तावेज़ सहायता")} · ${place(thread.localityId, lang)}`}</Body>
              {unread(thread.key) > 0 && (
                <Button
                  secondary
                  disabled={busy}
                  label={t(
                    `Mark ${unread(thread.key)} read`,
                    `${unread(thread.key)} पढ़े हुए दर्ज करें`,
                  )}
                  onPress={() =>
                    void run(
                      "markCaseRead",
                      [thread.key],
                      t("Read status saved.", "पढ़ने की स्थिति सेव हुई।"),
                    )
                  }
                />
              )}
              {messages.length === 0 && (
                <Body tone="muted">
                  {t(
                    "No messages yet. Agree a time, clarify a cost or ask for the next step.",
                    "अभी संदेश नहीं हैं। समय तय करें, खर्च समझें या अगला कदम पूछें।",
                  )}
                </Body>
              )}
              {messages.map((message) => {
                const mine = message.senderActorId === actor?.actorId;
                const isUnread =
                  !mine && !!actor && !message.readBy.includes(actor.actorId);
                const role =
                  message.senderRole === "provider"
                    ? "NGO"
                    : message.senderRole === "worker"
                      ? t("ASHA", "आशा")
                      : t("Coordinator", "समन्वयक");
                return (
                  <View
                    key={message.id}
                    style={{
                      borderWidth: 1,
                      borderColor: "#CDD5DF",
                      backgroundColor: mine ? "#EFF5FC" : "#FFFFFF",
                      padding: 14,
                      gap: 8,
                      borderRadius: 6,
                    }}
                  >
                    <Heading>{`${message.senderLabel} · ${role}${mine ? ` · ${t("You", "आप")}` : ""}`}</Heading>
                    <Body tone="muted">{demoTime(message.at)}</Body>
                    <Body>{message.text}</Body>
                    {isUnread ? (
                      <Badge
                        label={t("Unread for you", "आपने नहीं पढ़ा")}
                        tone="info"
                      />
                    ) : !mine ? (
                      <Body tone="muted">{t("Read by you", "आपने पढ़ा")}</Body>
                    ) : null}
                  </View>
                );
              })}
              {thread.canSend ? (
                <>
                  <Field
                    label={t("Message to this case", "इस अनुरोध का संदेश")}
                    value={draft}
                    onChangeText={(value) => setDraft(value.slice(0, 1000))}
                    multiline
                    hint={t(
                      "Service arrangements only. No personal, medical or payment account information.",
                      "केवल सेवा व्यवस्था लिखें। व्यक्तिगत, चिकित्सा या भुगतान खाते की जानकारी नहीं।",
                    )}
                  />
                  <Body tone="muted">{`${draft.length}/1000`}</Body>
                  <Button
                    label={
                      busy
                        ? t("Saving…", "सेव हो रहा है…")
                        : t("Send case message", "अनुरोध संदेश भेजें")
                    }
                    onPress={() => void send()}
                    disabled={busy || !draft.trim()}
                  />
                </>
              ) : (
                <Notice>
                  {t(
                    "This conversation is read-only. The request has ended; new messages are blocked.",
                    "यह संवाद केवल पढ़ने के लिए है। अनुरोध समाप्त है; नए संदेश नहीं भेज सकते।",
                  )}
                </Notice>
              )}
            </Section>
          )}
        </>
      )}
      {!!feedback && (
        <Notice tone={failed ? "danger" : "ok"}>{feedback}</Notice>
      )}
    </Screen>
  );
}
