import React, { type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
export const gov = {
  navy: "#102A43",
  blue: "#1D4E89",
  accent: "#F29D38",
  page: "#F5F7FA",
  border: "#CBD5E1",
  muted: "#475569",
  green: "#166534",
  red: "#991B1B",
  amber: "#78350F",
};
export function Body({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: "muted" | "danger";
}) {
  return (
    <Text
      style={[
        styles.body,
        tone === "muted" && styles.muted,
        tone === "danger" && { color: gov.red },
      ]}
    >
      {children}
    </Text>
  );
}
export function Heading({ children }: { children: ReactNode }) {
  return (
    <Text accessibilityRole="header" style={styles.heading}>
      {children}
    </Text>
  );
}
export function Screen({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {subtitle && <Body tone="muted">{subtitle}</Body>}
      {children}
      <Text style={styles.footer}>
        ASHA Saath · Independent prototype{"\n"}Fictional data · Not an official
        government app
      </Text>
    </ScrollView>
  );
}
export function Section({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      {title && <Heading>{title}</Heading>}
      {children}
    </View>
  );
}
export function Button({
  label,
  onPress,
  disabled,
  secondary,
  danger,
}: {
  label: string;
  onPress: () => unknown;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      onPress={() => {
        const result = onPress();
        if (result instanceof Promise) void result.catch(() => {});
      }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        danger && { backgroundColor: gov.red, borderColor: gov.red },
        disabled && { opacity: 0.48 },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text
        style={[styles.buttonText, secondary && !danger && { color: gov.blue }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChangeText,
  multiline,
  numeric,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
  numeric?: boolean;
  hint?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        style={[
          styles.input,
          multiline && { minHeight: 106, textAlignVertical: "top" },
        ]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        inputMode={numeric ? "numeric" : "text"}
        autoCapitalize={numeric ? "none" : "sentences"}
        autoCorrect={!numeric}
        maxLength={multiline ? 1000 : 250}
      />
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}
export function Choice({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  const [openFor, setOpenFor] = React.useState<string | null>(null);
  const choiceKey = label + options.map((o) => o.value).join("|");
  const open = !disabled && openFor === choiceKey;
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open, disabled: !!disabled }}
        disabled={disabled}
        onPress={() => setOpenFor(open ? null : choiceKey)}
        style={[styles.input, styles.choice, disabled && { opacity: 0.5 }]}
      >
        <Text style={[styles.body, { flex: 1 }]}>
          {options.find((o) => o.value === value)?.label ?? "—"}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={20}
          color={gov.blue}
        />
      </Pressable>
      {open && (
        <View style={styles.options}>
          {options.map((o) => (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: o.value === value }}
              accessibilityLabel={o.label}
              onPress={() => {
                onChange(o.value);
                setOpenFor(null);
              }}
              style={[
                styles.option,
                o.value === value && { backgroundColor: "#EFF6FF" },
              ]}
            >
              <Text style={[styles.body, { flex: 1 }]}>{o.label}</Text>
              {o.value === value && (
                <Ionicons name="checkmark" size={20} color={gov.blue} />
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
export function Check({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={styles.check}
    >
      <Ionicons
        name={value ? "checkbox" : "square-outline"}
        size={26}
        color={gov.blue}
      />
      <Text style={[styles.body, { flex: 1 }]}>{label}</Text>
    </Pressable>
  );
}
export function Badge({
  label,
  tone = "info",
}: {
  label: string;
  tone?: "info" | "ok" | "warn" | "danger";
}) {
  const colors = {
    info: [gov.blue, "#EFF6FF"],
    ok: [gov.green, "#F0FDF4"],
    warn: [gov.amber, "#FFFBEB"],
    danger: [gov.red, "#FEF2F2"],
  };
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors[tone][1], borderColor: colors[tone][0] },
      ]}
    >
      <Text style={[styles.badgeText, { color: colors[tone][0] }]}>
        {label}
      </Text>
    </View>
  );
}
export function Notice({
  title,
  children,
  tone = "info",
}: {
  title?: string;
  children: ReactNode;
  tone?: "info" | "ok" | "warn" | "danger";
}) {
  const color =
    tone === "danger"
      ? gov.red
      : tone === "ok"
        ? gov.green
        : tone === "warn"
          ? gov.amber
          : gov.blue;
  return (
    <View
      accessibilityRole={tone === "danger" ? "alert" : undefined}
      style={[
        styles.notice,
        {
          borderLeftColor: color,
          backgroundColor:
            tone === "danger"
              ? "#FEF2F2"
              : tone === "ok"
                ? "#F0FDF4"
                : tone === "warn"
                  ? "#FFFBEB"
                  : "#EFF6FF",
        },
      ]}
    >
      {title && <Text style={[styles.label, { color }]}>{title}</Text>}
      {typeof children === "string" ? <Body>{children}</Body> : children}
    </View>
  );
}
export function Loading() {
  return (
    <View style={styles.section}>
      <ActivityIndicator color={gov.blue} />
      <Body>Loading authorized workspace…</Body>
    </View>
  );
}
export const styles = StyleSheet.create({
  screen: {
    padding: 16,
    gap: 16,
    paddingBottom: 36,
    flexGrow: 1,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  title: { fontSize: 25, lineHeight: 34, fontWeight: "700", color: gov.navy },
  heading: { fontSize: 19, lineHeight: 28, fontWeight: "700", color: gov.navy },
  body: { fontSize: 16, lineHeight: 25, color: gov.navy },
  muted: { color: gov.muted },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: gov.border,
    borderRadius: 8,
  },
  button: {
    minHeight: 50,
    backgroundColor: gov.blue,
    borderColor: gov.blue,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  secondary: { backgroundColor: "#FFF" },
  buttonText: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
    color: "#FFF",
    textAlign: "center",
  },
  fieldWrap: { gap: 6 },
  label: { fontSize: 16, lineHeight: 24, fontWeight: "600", color: gov.navy },
  input: {
    minHeight: 50,
    padding: 12,
    borderWidth: 1,
    borderColor: "#64748B",
    borderRadius: 6,
    fontSize: 16,
    lineHeight: 24,
    color: gov.navy,
    backgroundColor: "#FFF",
  },
  choice: { flexDirection: "row", alignItems: "center", gap: 8 },
  hint: { fontSize: 14, lineHeight: 22, color: gov.muted },
  options: {
    borderWidth: 1,
    borderColor: "#64748B",
    borderRadius: 6,
    overflow: "hidden",
  },
  option: {
    minHeight: 48,
    padding: 12,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: gov.border,
  },
  check: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 10,
    alignItems: "flex-start",
    minHeight: 48,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 14, lineHeight: 21, fontWeight: "600" },
  notice: {
    borderWidth: 1,
    borderColor: gov.border,
    borderLeftWidth: 4,
    borderRadius: 6,
    padding: 14,
    gap: 8,
  },
  footer: {
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
    color: gov.muted,
    paddingTop: 10,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
  },
});
