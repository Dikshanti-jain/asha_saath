import { useState } from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import { router } from "expo-router";
import { useMobile } from "../lib/MobileContext";
import { catalog, place, time, demoDate } from "../lib/catalog";
import type { Stop, Task, PlanParams } from "../lib/types";
import {
  Screen,
  Section,
  Body,
  Heading,
  Button,
  Choice,
  Field,
  Check,
  Badge,
  Notice,
  gov,
} from "../components/ui";

type Outcome =
  "COMPLETED" | "NOT_AVAILABLE" | "DEFERRED" | "ESCALATION_REQUIRED";

function DisclosureButton({
  label,
  expanded,
  onPress,
}: {
  label: string;
  expanded: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ expanded }}
      onPress={onPress}
      style={({ pressed }) => [local.disclosure, pressed && { opacity: 0.8 }]}
    >
      <Text style={local.disclosureLabel}>{label}</Text>
      <Text aria-hidden style={local.disclosureSymbol}>{expanded ? "−" : "+"}</Text>
    </Pressable>
  );
}

function VisitCard({
  task,
  stop,
  canRecord,
}: {
  task: Task;
  stop: Stop;
  canRecord: boolean;
}) {
  const { state, actor, lang, t, busy, command } = useMobile();
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>("COMPLETED");
  const [note, setNote] = useState("");
  const [need, setNeed] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [whyOpenFor, setWhyOpenFor] = useState<string | null>(null);
  const whyIdentity = `${actor?.actorId}:${task.key}:${stop.order}:${stop.why}`;
  const showWhy = whyOpenFor === whyIdentity;
  const existing = state?.needs.find(
    (n) => n.taskKey === task.key && !["CLOSED", "WITHDRAWN"].includes(n.state),
  );
  const requiresHealth =
    task.requiredCadre === "JOINT" ||
    task.status === "ESCALATION_REQUIRED" ||
    ["DEMO-ESCALATION", "DEMO-JOINT"].includes(task.ruleId ?? "") ||
    task.riskFlags?.includes("SYNTHETIC_ESCALATION_FLAG");
  const mutable = ["PLANNED", "PENDING", "NOT_AVAILABLE", "DEFERRED"].includes(
    task.status,
  );
  async function save() {
    if (!actor) return;
    if (note.trim().length > 240) {
      setFeedback(
        t(
          "Use a short reason, up to 240 characters.",
          "कारण 240 अक्षरों तक लिखें।",
        ),
      );
      return;
    }
    if (outcome !== "COMPLETED" && !note.trim()) {
      setFeedback(
        t(
          "Explain why this visit could not be completed.",
          "दौरा पूरा न होने का कारण लिखें।",
        ),
      );
      return;
    }
    setFeedback("");
    try {
      await command("recordVisit", [
        task.key,
        outcome,
        note.trim() || undefined,
        actor.actorId,
      ]);
      setOpen(false);
      setFeedback(
        t(
          "Visit result saved on the server.",
          "दौरे का परिणाम सर्वर पर सुरक्षित है।",
        ),
      );
      if (outcome === "COMPLETED" && need) {
        try {
          const id = await command<string>("createNeed", [
            task.key,
            actor.actorId,
          ]);
          router.push({ pathname: "/needs", params: { id } });
        } catch (err) {
          setFeedback(
            t(
              "Visit saved. Help request was not created: ",
              "दौरा सुरक्षित है। सहायता अनुरोध नहीं बना: ",
            ) + (err instanceof Error ? err.message : String(err)),
          );
        }
      }
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : String(err));
    }
  }
  return (
    <Section>
      <View style={local.row}>
        <Badge label={t("Stop ", "दौरा ") + stop.order} />
        <Badge
          label={
            task.priority + " · " + t("priority", "प्राथमिकता")
          }
          tone={task.priority === "P1" ? "warn" : "info"}
        />
        <Badge
          label={task.status.replaceAll("_", " ")}
          tone={task.status === "COMPLETED" ? "ok" : task.status === "ESCALATION_REQUIRED" ? "danger" : "info"}
        />
      </View>
      <Heading>
        {t("Visit ", "दौरा ") + task.taskId.replace("TASK-", "")}
      </Heading>
      <Body>{place(task.localityId, lang)}</Body>
      <Body>
        {time(stop.start)}–{time(stop.end)} IST ·{" "}
        {t("estimated time", "अनुमानित समय")}
      </Body>
      <Body tone="muted">
        {t("Due: ", "नियत तारीख: ") +
          task.dueDate +
          " · " +
          task.earliest +
          "–" +
          task.latest}
      </Body>
      {requiresHealth && (
        <Notice
          tone="danger"
          title={t("Separate health pathway", "अलग स्वास्थ्य सहायता प्रक्रिया")}
        >
          <Body>
            {t(
              "Contact the authorized health team. NGO availability cannot decide urgent clinical action.",
              "अधिकृत स्वास्थ्य टीम से संपर्क करें। तुरंत स्वास्थ्य सहायता का फैसला NGO उपलब्धता से नहीं होता।",
            )}
          </Body>
        </Notice>
      )}
      {canRecord && mutable && !requiresHealth && !open && (
        <Button
          label={t("Record this visit", "इस दौरे का परिणाम लिखें")}
          onPress={() => {
            setFeedback("");
            setOpen(true);
          }}
          disabled={busy}
        />
      )}
      {open && mutable && !requiresHealth && (
        <View style={local.form}>
          <Choice
            label={t("Visit result", "दौरे का परिणाम")}
            value={outcome}
            onChange={(value) => {
              setOutcome(value as Outcome);
              setNeed(false);
            }}
            options={[
              { value: "COMPLETED", label: t("Completed", "पूरा हुआ") },
              {
                value: "NOT_AVAILABLE",
                label: t("Person was unavailable", "व्यक्ति नहीं मिले"),
              },
              {
                value: "DEFERRED",
                label: t("Deferred with a reason", "कारण के साथ टाला गया"),
              },
              {
                value: "ESCALATION_REQUIRED",
                label: t(
                  "Health-team escalation required",
                  "स्वास्थ्य टीम की सहायता चाहिए",
                ),
              },
            ]}
          />
          <Field
            label={
              outcome === "COMPLETED"
                ? t(
                    "Short visit note (optional)",
                    "दौरे की छोटी टिप्पणी (वैकल्पिक)",
                  )
                : t("Reason (required)", "कारण (ज़रूरी)")
            }
            value={note}
            onChangeText={setNote}
            multiline
            hint={t(
              "Up to 240 characters. Use fictional details only.",
              "240 अक्षरों तक। केवल काल्पनिक जानकारी लिखें।",
            )}
          />
          {outcome === "COMPLETED" && (
            <Check
              label={t(
                "Create a document-help request after saving this visit",
                "दौरा सुरक्षित करने के बाद दस्तावेज़ सहायता अनुरोध बनाएँ",
              )}
              value={need}
              onChange={setNeed}
              disabled={busy}
            />
          )}
          <Button
            label={t("Save visit result", "दौरे का परिणाम सुरक्षित करें")}
            onPress={save}
            disabled={busy || (!note.trim() && outcome !== "COMPLETED")}
          />
          <Button
            label={t("Cancel editing", "लिखना रद्द करें")}
            onPress={() => setOpen(false)}
            secondary
            disabled={busy}
          />
        </View>
      )}
      {feedback && (
        <Notice>
          <Body>{feedback}</Body>
        </Notice>
      )}
      {existing && (
        <Button
          label={t("Open linked help request", "जुड़ा सहायता अनुरोध खोलें")}
          secondary
          onPress={() =>
            router.push({ pathname: "/needs", params: { id: existing.id } })
          }
        />
      )}
      {canRecord && task.status === "COMPLETED" && !existing && (
        <Button
          label={t("Request document help", "दस्तावेज़ सहायता माँगें")}
          secondary
          disabled={busy}
          onPress={async () => {
            if (!actor) return;
            try {
              const id = await command<string>("createNeed", [
                task.key,
                actor.actorId,
              ]);
              router.push({ pathname: "/needs", params: { id } });
            } catch (err) {
              setFeedback(err instanceof Error ? err.message : String(err));
            }
          }}
        />
      )}
      <DisclosureButton
        label={showWhy ? t("Hide order details", "क्रम का विवरण छिपाएं") : t("Explain visit order", "दौरे का क्रम समझें")}
        expanded={showWhy}
        onPress={() => setWhyOpenFor(showWhy ? null : whyIdentity)}
      />
      {showWhy && (
        <View style={local.form}>
          {stop.breakBefore && (
            <Body tone="muted">
              {t(
                "A planned break comes before this stop.",
                "इस दौरे से पहले तय विश्राम है।",
              )}
            </Body>
          )}
          <Body tone="muted">
            {t("Why this order: ", "इस क्रम का कारण: ") + stop.why}
          </Body>
          <Body tone="muted">
            {t("Travel to stop: ", "इस दौरे तक यात्रा: ") +
              stop.travelMin +
              t(" min · Wait: ", " मिनट · प्रतीक्षा: ") +
              stop.waitMin +
              t(" min", " मिनट")}
          </Body>
        </View>
      )}
    </Section>
  );
}

export default function VisitsScreen() {
  const { state, actor, lang, t, busy, command } = useMobile();
  const [selectedStaff, setSelectedStaff] = useState(
    catalog.config.staff[0].id,
  );
  const [feedback, setFeedback] = useState("");
  const [showUnserved, setShowUnserved] = useState(false);
  const [showRecorded, setShowRecorded] = useState(false);
  const [planDetailsFor, setPlanDetailsFor] = useState<string | null>(null);
  const staffId =
    actor?.role === "worker" ? (actor.staffId ?? selectedStaff) : selectedStaff;
  const plan = state?.plans[staffId];
  const planIdentity = `${actor?.actorId}:${staffId}:${plan?.date}:${plan?.version}`;
  const showPlanDetails = planDetailsFor === planIdentity;
  const tasks = state?.tasks.filter((x) => x.staffId === staffId) ?? [];
  const recordedKeys = new Set(
    state?.visits.filter((v) => v.staffId === staffId).map((v) => v.taskKey) ??
      [],
  );
  const remaining = (plan?.stops ?? []).filter(
    (stop) => !recordedKeys.has(stop.taskKey),
  );
  const recorded = [
    ...(plan?.recordedStops ?? []),
    ...(plan?.stops ?? []).filter((stop) => recordedKeys.has(stop.taskKey)),
  ].filter(
    (stop, i, rows) =>
      rows.findIndex((row) => row.taskKey === stop.taskKey) === i,
  );
  async function build(replan: boolean) {
    if (!state) return;
    setFeedback("");
    try {
      if (replan) {
        await command("replan", [staffId]);
      } else {
        const shift = catalog.config.shift;
        const params: PlanParams = {
          date: demoDate(state.clock),
          shiftStart: shift.start,
          shiftEnd: shift.end,
          breakStart: shift.breakStart,
          breakMinutes: shift.breakMinutes,
          bufferMinutes: shift.safetyBufferMinutes,
          speedKmh: catalog.config.travel.speedKmh,
          distanceMultiplier: catalog.config.travel.distanceMultiplier,
          start: shift.startPoint,
          finish: shift.finishPoint,
        };
        await command("savePlan", [staffId, { params }]);
      }
      setFeedback(
        t(
          "Server plan saved. Recorded results and approved due dates are preserved.",
          "सर्वर पर योजना सुरक्षित है। लिखे परिणाम और स्वीकृत नियत तारीखें बनी हुई हैं।",
        ),
      );
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : String(err));
    }
  }
  if (actor?.role === "provider")
    return (
      <Screen title={t("Visit plans", "दौरा योजना")}>
        <Notice>
          <Body>
            {t(
              "Household visits belong to the ASHA and coordinator workspace. Open your permitted NGO cases instead.",
              "घरेलू दौरे ASHA और समन्वयक के कार्यक्षेत्र में हैं। अपने अनुमत NGO मामले खोलें।",
            )}
          </Body>
          <Button
            label={t("Open NGO cases", "NGO मामले खोलें")}
            onPress={() => router.push("/needs")}
          />
        </Notice>
      </Screen>
    );
  return (
    <Screen
      title={
        actor?.role === "coordinator"
          ? t("Daily visit plans", "दैनिक दौरा योजना")
          : t("My visits", "मेरे दौरे")
      }
      subtitle={actor?.role === "coordinator" ? t(
        "Record the visit, then arrange needed help.",
        "दौरे का परिणाम लिखें, फिर जरूरी मदद जोड़ें।",
      ) : undefined}
    >
      {actor?.role === "coordinator" && (
        <Section title={t("Choose an ASHA plan", "ASHA की योजना चुनें")}>
          <Choice
            label={t("ASHA worker", "ASHA कार्यकर्ता")}
            value={selectedStaff}
            onChange={(value) => {
              setSelectedStaff(value);
              setFeedback("");
              setShowUnserved(false);
              setShowRecorded(false);
              setPlanDetailsFor(null);
            }}
            options={catalog.config.staff.map((s) => ({
              value: s.id,
              label:
                s.id +
                " · " +
                (s.id.endsWith("01")
                  ? t("Rural", "ग्रामीण")
                  : t("Urban", "शहरी")),
            }))}
          />
          <Body tone="muted">
            {t(
              "Generate and save uses the approved demo shift 09:00–15:00, a 30-minute break and a 20-minute safety buffer. The server computes the route.",
              "बनाकर सुरक्षित करने पर स्वीकृत डेमो समय 09:00–15:00, 30 मिनट विश्राम और 20 मिनट सुरक्षा समय उपयोग होगा। सर्वर मार्ग बनाता है।",
            )}
          </Body>
          <Button
            label={
              plan
                ? t(
                    "Generate and save current-day plan",
                    "आज की योजना दोबारा बनाकर सुरक्षित करें",
                  )
                : t(
                    "Generate and save daily plan",
                    "दैनिक योजना बनाकर सुरक्षित करें",
                  )
            }
            disabled={busy || !state}
            onPress={() => build(false)}
          />
        </Section>
      )}
      {!state && (
        <Notice>
          <Body>
            {t(
              "Connect to the server to load your saved visits.",
              "सुरक्षित दौरे देखने के लिए सर्वर से जुड़ें।",
            )}
          </Body>
        </Notice>
      )}
      {state && !plan && (
        <Notice title={t("No saved plan", "सुरक्षित योजना नहीं है")}>
          <Body>
            {t(
              "Ask the coordinator to generate and save this ASHA’s plan. No visits have been invented on this device.",
              "समन्वयक से इस ASHA की योजना बनाकर सुरक्षित करने को कहें।",
            )}
          </Body>
        </Notice>
      )}
      {plan && (
        <>
          <Section title={actor?.role === "coordinator" ? t("Saved plan", "सहेजी गई योजना") : undefined}>
            <Body>
              {plan.date +
                " · " +
                t("Version ", "संस्करण ") +
                plan.version + "\n" + remaining.length +
                t(" visits left · ", " बाकी दौरे · ") +
                recorded.length +
                t(" recorded", " दर्ज हुए")}
            </Body>
            <View style={local.planActions}>
              <View style={local.planAction}>
                <Button
                  label={t("Route map", "मार्ग नक्शा")}
                  secondary
                  onPress={() => router.push({ pathname: "/map", params: { staff: staffId } })}
                />
              </View>
              <View style={local.planAction}>
                <DisclosureButton
                  label={showPlanDetails ? t("Hide details", "विवरण छिपाएं") : t("Plan details", "योजना विवरण")}
                  expanded={showPlanDetails}
                  onPress={() => setPlanDetailsFor(showPlanDetails ? null : planIdentity)}
                />
              </View>
            </View>
            {showPlanDetails && <View style={local.form}>
            <Body tone="muted">{staffId}</Body>
            <Body tone="muted">
              {t(
                "Priority → approved due date → deferral → window → locality and nearest stop. Grouping cannot override a higher obligation.",
                "प्राथमिकता → स्वीकृत नियत तारीख → टाले गए दौरे → समय सीमा → क्षेत्र और नज़दीकी दौरा। क्षेत्र समूह ज़्यादा ज़रूरी कार्य को पीछे नहीं करते।",
              )}
            </Body>
            <Body tone="muted">
              {t("Travel is an estimate: ", "यात्रा अनुमान है: ") +
                plan.params.speedKmh +
                " km/h · " +
                plan.params.distanceMultiplier +
                t(
                  "× distance allowance. No road, GPS or traffic measurement.",
                  "× दूरी बढ़ोतरी। यह सड़क, GPS या ट्रैफ़िक माप नहीं है।",
                )}
            </Body>
            <Body tone="muted">
              {t("Return by ", "वापसी समय ") +
                time(plan.returnAt) +
                " IST · " +
                t("Return travel ", "वापसी यात्रा ") +
                plan.returnTravelMin +
                t(" min", " मिनट")}
            </Body>
            <Body tone="muted">
              {t("Shift: ", "कार्य समय: ") + plan.params.shiftStart + "–" + plan.params.shiftEnd +
                t(" · Break: ", " · विश्राम: ") + plan.params.breakMinutes +
                t(" min · Safety buffer: ", " मिनट · सुरक्षा समय: ") + plan.params.bufferMinutes + t(" min", " मिनट")}
            </Body>
            <Button
              label={t("Replan remaining visits", "बाकी दौरों की योजना बनाएँ")}
              secondary
              disabled={busy}
              onPress={() => build(true)}
            />
            </View>}
          </Section>
          {feedback && (
            <Notice>
              <Body>{feedback}</Body>
            </Notice>
          )}
          {actor?.role === "coordinator" && <Heading>{t("Next visits", "अगले दौरे")}</Heading>}
          {!remaining.length && (
            <Notice>
              <Body>
                {t(
                  "No remaining stops in this plan. Review the unserved list before treating coverage as complete.",
                  "इस योजना में बाकी दौरे नहीं हैं। पूरे क्षेत्र का काम पूरा मानने से पहले छूटे कार्य देखें।",
                )}
              </Body>
            </Notice>
          )}
          {remaining.map((stop) => {
            const task = tasks.find((task) => task.key === stop.taskKey);
            return task ? (
              <VisitCard
                key={task.key}
                task={task}
                stop={stop}
                canRecord={actor?.role === "worker"}
              />
            ) : null;
          })}
          <Section>
            <Button
              label={
                (showUnserved ? t("Hide", "छिपाएँ") : t("Review", "देखें")) +
                " " +
                (plan.unserved?.length ?? 0) +
                t(" unserved tasks", " छूटे कार्य")
              }
              secondary
              onPress={() => setShowUnserved((x) => !x)}
            />
            {showUnserved && (
              <View style={local.form}>
                {!plan.unserved.length && (
                  <Body>
                    {t(
                      "No unserved rows in this saved plan. This applies only to the selected ASHA/date.",
                      "इस सुरक्षित योजना में छूटे कार्य नहीं हैं। यह केवल चुनी ASHA और तारीख के लिए है।",
                    )}
                  </Body>
                )}
                {plan.unserved.map((row) => (
                  <View key={row.taskKey} style={local.unserved}>
                    <Heading>
                      {row.taskId.replace("TASK-", "") +
                        " · " +
                        place(row.localityId, lang)}
                    </Heading>
                    <Badge
                      label={
                        row.priority + " · " + row.category.replaceAll("_", " ")
                      }
                      tone={
                        row.category.includes("ESCALATION") ? "danger" : "warn"
                      }
                    />
                    <Body>{row.reason}</Body>
                  </View>
                ))}
              </View>
            )}
          </Section>
          <Section>
            <Button
              label={
                (showRecorded ? t("Hide", "छिपाएँ") : t("Review", "देखें")) +
                " " +
                recorded.length +
                t(" recorded results", " लिखे परिणाम")
              }
              secondary
              onPress={() => setShowRecorded((x) => !x)}
            />
            {showRecorded &&
              recorded.map((stop) => {
                const task = tasks.find((task) => task.key === stop.taskKey);
                return task ? (
                  <VisitCard
                    key={task.key}
                    task={task}
                    stop={stop}
                    canRecord={actor?.role === "worker"}
                  />
                ) : null;
              })}
          </Section>
        </>
      )}
      {!plan && feedback && (
        <Notice>
          <Body>{feedback}</Body>
        </Notice>
      )}
    </Screen>
  );
}

const local = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  form: { gap: 12 },
  planActions: { flexDirection: "row", gap: 10 },
  planAction: { flex: 1 },
  disclosure: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 10, paddingVertical: 12, borderWidth: 1, borderColor: gov.blue, borderRadius: 6, backgroundColor: "#FFFFFF" },
  disclosureLabel: { flexShrink: 1, fontSize: 16, lineHeight: 23, fontWeight: "600", color: gov.blue, textAlign: "center" },
  disclosureSymbol: { fontSize: 20, lineHeight: 23, color: gov.blue },
  unserved: {
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
  },
});
