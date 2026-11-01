import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext } from "node:vm";

const bundle = stripTypeScriptTypes(await readFile(new URL("../src/lib/leaflet-bundle.ts", import.meta.url), "utf8"), { mode: "transform" });
const bundleURL = "data:text/javascript;base64," + Buffer.from(bundle).toString("base64");
const source = await readFile(new URL("../src/lib/map-document.ts", import.meta.url), "utf8");
const compiled = stripTypeScriptTypes(source.replace(/from\s*["']\.\/leaflet-bundle["']/, "from " + JSON.stringify(bundleURL)), { mode: "transform" });
const maps = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));
const id = "11111111-2222-4333-8444-555555555555";
const point = { id: "TASK-A", lat: 26.904, lng: 75.704, label: "Stop 1", detail: "Fictional village · 09:00", kind: "visit", number: 1 };
const build = (extra = {}) => maps.buildMapDocument({ points: [point], document: id, title: "Visit route", ...extra });
const message = (value = {}) => JSON.stringify({ version: 1, document: id, action: "select", id: point.id, ...value });

test("map document copies only validated map fields and safely contains hostile labels", () => {
  const unsafe = { ...point, label: '</script><script>window.stolen=true</script>', detail: '<img src="https://evil.example/x">\u2028\u2029', token: "SECRET-CREDENTIAL", need: { patient: "PRIVATE-CASE" } };
  const html = build({ points: [unsafe, { ...point, id: "BAD", lat: NaN }, { ...point, id: "POLE", lat: 90 }, point] });
  assert.equal(maps.mapPoints([unsafe, point]).length, 1);
  assert.ok(!html.includes("SECRET-CREDENTIAL"));
  assert.ok(!html.includes("PRIVATE-CASE"));
  assert.ok(!html.includes(unsafe.label));
  assert.equal((html.match(/<\/script>/g) ?? []).length, 2);
  assert.ok(html.includes("\\u003c/script\\u003e"));
  assert.ok(html.includes("heading.textContent=point.label"));
  assert.ok(html.includes("detail.textContent=point.detail"));
});

test("bundled document has a nonce CSP, OSM-only tiles, attribution and no remote engine", () => {
  const html = build();
  assert.ok(html.includes("BSD 2-Clause License"));
  assert.ok(html.includes("Leaflet 1.9.4"));
  assert.ok(html.includes("script-src 'nonce-" + id + "'"));
  assert.ok(html.includes("img-src https://tile.openstreetmap.org data:"));
  assert.ok(html.includes("connect-src 'none'"));
  assert.ok(html.includes("object-src 'none'"));
  assert.ok(html.includes("base-uri 'none'"));
  assert.ok(html.includes("OpenStreetMap contributors"));
  assert.ok(!/<script[^>]+src=/.test(html));
  assert.ok(!html.includes("unsafe-eval"));
  assert.ok(html.includes("keepBuffer:0,updateWhenIdle:true,updateWhenZooming:false"));
  assert.throws(() => build({ document: 'evil" onclick="' }), /identifier/);
});

test("bridge rejects stale, cross-route, unknown-action and augmented messages", () => {
  assert.deepEqual(maps.parseMapEvent(message(), id, [point]), { action: "select", id: "TASK-A" });
  for (const raw of [
    message({ document: "stale-map" }), message({ version: 2 }), message({ id: "OTHER-WORKER-TASK" }),
    message({ action: "approveFunding" }), message({ token: "fake" }), message({ id: [point.id] }),
    "null", "[]", "{", "x".repeat(2049),
  ]) assert.equal(maps.parseMapEvent(raw, id, [point]), null);
  assert.equal(maps.parseMapEvent(message(), id, []), null);
  assert.deepEqual(maps.parseMapEvent(JSON.stringify({ version: 1, document: id, action: "tilesError" }), id, [point]), { action: "tilesError" });
});

test("native selection commands cannot inject JavaScript or select another task", () => {
  const dangerous = { ...point, id: '</script>\";window.stolen=true;//' };
  const script = maps.mapCommandScript({ action: "select", id: dangerous.id }, id, [dangerous]);
  const captured = [];
  const window = { AshaMapCommand: (value) => captured.push(value) };
  runInNewContext(script, { window });
  assert.equal(window.stolen, undefined);
  assert.equal(captured[0].id, dangerous.id);
  assert.equal(captured[0].document, id);
  assert.equal(maps.mapCommandScript({ action: "select", id: "OTHER" }, id, [point]), null);
  assert.equal(maps.mapCommandScript({ action: "pay", amount: 500 }, id, [point]), null);
  for (const action of ["zoomIn", "zoomOut", "reset"]) assert.ok(maps.mapCommandScript({ action }, id, [point]).endsWith("true;"));
});

test("zero-pin map needs an approved center and invents no stop or route", () => {
  assert.throws(() => build({ points: [], center: undefined }), /approved/);
  assert.throws(() => build({ points: [], center: { lat: Infinity, lng: 75 } }), /approved/);
  const html = build({ points: [], center: { lat: 26.9, lng: 75.7 }, drawRoute: false });
  assert.ok(html.includes('"points":[]'));
  assert.ok(html.includes('"center":{"lat":26.9,"lng":75.7}'));
  assert.ok(html.includes('"drawRoute":false'));
  for (const url of ["https://evil.example", "file:///x", "data:text/html,x", "about:blank#x", "https://www.openstreetmap.org/copyright"]) assert.equal(maps.mapNavigationAllowed(url), false);
  assert.equal(maps.mapNavigationAllowed("about:blank"), true);
});

test("native WebView keeps tile caching while isolating account, geolocation and navigation", async () => {
  const canvas = await readFile(new URL("../src/components/MapCanvas.native.tsx", import.meta.url), "utf8");
  for (const flag of ["geolocationEnabled", "domStorageEnabled", "sharedCookiesEnabled", "thirdPartyCookiesEnabled", "allowFileAccess", "allowFileAccessFromFileURLs", "allowUniversalAccessFromFileURLs"]) assert.ok(canvas.includes(flag + "={false}"));
  assert.ok(canvas.includes('cacheMode="LOAD_DEFAULT"'));
  assert.ok(canvas.includes("userAgent={MAP_USER_AGENT}"));
  assert.ok(canvas.includes('androidLayerType="hardware"'));
  assert.ok(canvas.includes("onShouldStartLoadWithRequest="));
  assert.ok(canvas.includes("onOpenWindow="));
  assert.ok(canvas.includes("nestedScrollEnabled"));
  assert.ok(!canvas.includes("incognito"));
  assert.ok(!canvas.includes("Authorization"));
  assert.ok(!canvas.includes("react-native-maps"));
  assert.ok(!canvas.includes("onLoadEnd="));
});

test("document emits truthful tile failures and never draws a route for area-only view", () => {
  const emitted = [];
  const listeners = {};
  const calls = { markers: 0, lines: 0, zooms: 0 };
  const node = { setAttribute() {}, addEventListener() {} };
  const map = { attributionControl: { setPrefix() {} }, fitBounds() {}, setView() {}, invalidateSize() {}, zoomIn() { calls.zooms++; }, zoomOut() {}, closePopup() {}, panTo() {} };
  const L = {
    map: () => map,
    tileLayer: () => ({ on(type, callback) { listeners[type] = callback; }, addTo() {} }),
    polyline: () => { calls.lines++; return { addTo() {} }; },
    marker: () => { calls.markers++; return { addTo() { return this; }, bindPopup() {}, on() {}, openPopup() {}, getLatLng() {} }; },
    divIcon: () => ({}),
  };
  const document = { getElementById: () => node, createElement: () => ({ appendChild() {}, classList: { toggle() {} } }) };
  const window = { ReactNativeWebView: { postMessage: (raw) => emitted.push(JSON.parse(raw)) } };
  const html = build({ points: [], center: { lat: 26.9, lng: 75.7 }, drawRoute: false });
  const scripts = [...html.matchAll(/<script nonce="[^"]+">([\s\S]*?)<\/script>/g)];
  runInNewContext(scripts[1][1], { L, document, window, setTimeout: () => 0, Element: class {} });
  assert.equal(calls.markers, 0);
  assert.equal(calls.lines, 0);
  listeners.loading(); listeners.tileerror(); listeners.load();
  assert.equal(emitted.at(-1).action, "tilesError");
  listeners.loading(); listeners.load();
  assert.equal(emitted.at(-1).action, "tilesReady");
  window.AshaMapCommand({ version: 1, document: "old", action: "zoomIn" });
  assert.equal(calls.zooms, 0);
  window.AshaMapCommand({ version: 1, document: id, action: "zoomIn" });
  assert.equal(calls.zooms, 1);
});
