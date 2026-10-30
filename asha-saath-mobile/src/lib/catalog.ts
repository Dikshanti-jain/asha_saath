import data from "./catalog.json";
import type { Lang } from "./types";
export const catalog = data;
export const providers = data.providers;
export function place(id: string | undefined, lang: Lang = "en") {
  const g = data.geographies.find((g) => g.id === id);
  return g
    ? (lang === "hi" ? g.nameHi : g.name)
        .replace(/^Demo /, "")
        .replace(/^डेमो /, "")
    : (id ?? "—");
}
export function ngoName(id: string | undefined) {
  return (
    data.providers
      .find((p) => p.organizationId === id)
      ?.name.replace(/^Demo /, "")
      .replace(" (fictional)", "") ?? "NGO"
  );
}
export function money(n: number | undefined) {
  return n === undefined ? "—" : "₹" + n.toLocaleString("en-IN");
}
export function time(min: number) {
  return (
    Math.floor(min / 60)
      .toString()
      .padStart(2, "0") +
    ":" +
    (min % 60).toString().padStart(2, "0")
  );
}
export function demoDate(clock: number) {
  return new Date(
    new Date(data.config.demoClock).getTime() + clock * 60000,
  ).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}
export function demoTime(clock: number) {
  return (
    new Date(
      new Date(data.config.demoClock).getTime() + clock * 60000,
    ).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }) + " IST · demo clock"
  );
}
