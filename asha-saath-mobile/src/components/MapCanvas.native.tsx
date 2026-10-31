import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, StyleSheet, Text, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { randomUUID } from "expo-crypto";
import MapSketch, { type MapCanvasProps } from "./MapSketch";
import { Body, Button, gov } from "./ui";
import {
  buildMapDocument, mapPoints, mapCenter, parseMapEvent, mapCommandScript,
  mapNavigationAllowed, MAP_USER_AGENT, OSM_COPYRIGHT, type MapCommand,
} from "../lib/map-document";

type Status = "loading" | "ready" | "tilesError" | "timeout" | "error";

function StreetCanvas(props: MapCanvasProps) {
  const map = useRef<WebView>(null);
  const [document] = useState(() => {
    const id = randomUUID();
    return { id, source: { html: buildMapDocument({
      points: props.points, center: props.center, drawRoute: props.drawRoute,
      title: props.title, document: id,
    }), baseUrl: "about:blank" } };
  });
  const [status, setStatus] = useState<Status>("loading");
  const [ready, setReady] = useState(false);
  const hi = props.language === "hi";
  const t = (en: string, hindi: string) => hi ? hindi : en;
  const send = (command: MapCommand) => {
    const script = mapCommandScript(command, document.id, props.points);
    if (ready && script) map.current?.injectJavaScript(script);
  };
  useEffect(() => {
    if (ready) {
      const script = mapCommandScript({ action: "select", id: props.selectedId ?? null }, document.id, props.points);
      if (script) map.current?.injectJavaScript(script);
    }
  }, [ready, props.selectedId, props.points, document.id]);
  useEffect(() => {
    if (status !== "loading") return;
    const timer = setTimeout(() => setStatus("timeout"), 15000);
    return () => clearTimeout(timer);
  }, [status]);
  const failure = () => { setReady(false); setStatus("error"); };
  const receive = (event: WebViewMessageEvent) => {
    const message = parseMapEvent(event.nativeEvent.data, document.id, props.points);
    if (!message) return;
    if (message.action === "select") props.onSelect(message.id);
    else if (message.action === "ready") setReady(true);
    else if (message.action === "loading") setStatus("loading");
    else if (message.action === "tilesReady") setStatus("ready");
    else if (message.action === "tilesError") setStatus("tilesError");
    else if (message.action === "error") failure();
    else if (message.action === "attribution") void Linking.openURL(OSM_COPYRIGHT).catch(() => {});
  };
  const statusText = status === "ready"
    ? t("Street map loaded. Drag to move; pinch to zoom.", "सड़क नक्शा खुल गया। खिसकाएं या दो उंगलियों से ज़ूम करें।")
    : status === "loading"
      ? t("Loading street map… Your stop list stays available.", "सड़क नक्शा खुल रहा है… दौरों की सूची उपलब्ध है।")
      : status === "tilesError"
        ? t("Some street tiles could not load. Stop pins and the list still work; retry or use the route diagram.", "कुछ सड़क चित्र नहीं खुले। दौरा बिंदु और सूची उपलब्ध हैं। दोबारा खोलें या मार्ग चित्र देखें।")
        : status === "timeout"
          ? t("Street map is taking too long. Check internet, then retry, or use the route diagram below.", "सड़क नक्शा खुलने में समय लग रहा है। इंटरनेट देखें और दोबारा खोलें, या नीचे मार्ग चित्र देखें।")
          : t("Street map could not open. Retry or use the route diagram and stop list.", "सड़क नक्शा नहीं खुला। दोबारा खोलें या मार्ग चित्र और दौरा सूची देखें।");
  return (
    <View style={local.wrap}>
      <View style={local.canvas} accessibilityLabel={props.title}>
        <WebView
          ref={map}
          source={document.source}
          style={local.webview}
          // Static inline HTML requires this whitelist. Navigation is separately denied.
          originWhitelist={["*"]}
          onShouldStartLoadWithRequest={(request) => mapNavigationAllowed(request.url)}
          onOpenWindow={() => {}}
          setSupportMultipleWindows
          javaScriptCanOpenWindowsAutomatically={false}
          javaScriptEnabled
          geolocationEnabled={false}
          domStorageEnabled={false}
          sharedCookiesEnabled={false}
          thirdPartyCookiesEnabled={false}
          allowFileAccess={false}
          allowFileAccessFromFileURLs={false}
          allowUniversalAccessFromFileURLs={false}
          mixedContentMode="never"
          androidLayerType="hardware"
          // Cache only public OSM tile responses; no account/API origin enters this document.
          cacheEnabled
          cacheMode="LOAD_DEFAULT"
          userAgent={MAP_USER_AGENT}
          scrollEnabled={false}
          nestedScrollEnabled
          setBuiltInZoomControls={false}
          setDisplayZoomControls={false}
          onMessage={receive}
          onError={failure}
          onRenderProcessGone={failure}
          onContentProcessDidTerminate={failure}
          accessibilityLabel={props.title}
        />
      </View>
      <View style={local.status} accessibilityLiveRegion="polite">
        {status === "loading" && <ActivityIndicator color={gov.blue} />}
        <Text style={[local.statusText, status !== "ready" && status !== "loading" && local.warning]}>{statusText}</Text>
      </View>
      <View style={local.controls}>
        <View style={local.control}><Button label={props.zoomInLabel ?? t("Zoom in", "नज़दीक देखें")} secondary disabled={!ready} onPress={() => send({ action: "zoomIn" })} /></View>
        <View style={local.control}><Button label={props.zoomOutLabel ?? t("Zoom out", "दूर देखें")} secondary disabled={!ready} onPress={() => send({ action: "zoomOut" })} /></View>
      </View>
      <Button label={props.resetLabel ?? t("Show full route", "पूरा मार्ग देखें")} secondary disabled={!ready} onPress={() => send({ action: "reset" })} />
      <Body tone="muted">{props.mapHint ?? t("Numbered points use the approved fictional positions. Lines show visit order, not road directions.", "क्रमांक वाले बिंदु स्वीकृत काल्पनिक स्थान हैं। रेखाएँ दौरा क्रम दिखाती हैं, सड़क का रास्ता नहीं।")}</Body>
    </View>
  );
}

function MapModes(props: MapCanvasProps) {
  const [diagram, setDiagram] = useState(false);
  const [retry, setRetry] = useState(0);
  const hi = props.language === "hi";
  const t = (en: string, hindi: string) => hi ? hindi : en;
  return (
    <View style={local.wrap}>
      {diagram ? (props.points.length ? <MapSketch {...props} /> :
        <Body>{t("No confirmed stops for a route diagram. The street map can still show the approved demo area.", "मार्ग चित्र के लिए पुष्ट दौरे नहीं हैं। सड़क नक्शे में स्वीकृत डेमो क्षेत्र देख सकते हैं।")}</Body>) : <StreetCanvas key={retry} {...props} />}
      {!diagram && <Button label={t("Reload street map", "सड़क नक्शा दोबारा खोलें")} secondary onPress={() => setRetry((value) => value + 1)} />}
      <Button label={diagram ? t("Show street map", "सड़क नक्शा देखें") : t("Use route diagram", "मार्ग चित्र देखें")} secondary onPress={() => setDiagram((value) => !value)} />
    </View>
  );
}

export default function MapCanvas(props: MapCanvasProps) {
  const points = mapPoints(props.points);
  const center = mapCenter(props.center);
  if (!points.length && !center) return <Body>{props.language === "hi" ? "नक्शे के लिए पुष्ट स्थान उपलब्ध नहीं है। दौरों की सूची देखें।" : "No confirmed map location is available. Use the stop list."}</Body>;
  // Remount when route/locale changes, retaining the view for selection-only changes.
  const identity = JSON.stringify({ points, center, drawRoute: props.drawRoute, title: props.title, language: props.language });
  return <MapModes key={identity} {...props} points={points} center={center} />;
}
export type { MapPoint, MapCanvasProps } from "./MapSketch";
const local = StyleSheet.create({
  wrap: { gap: 12 },
  canvas: { height: 330, width: "100%", borderRadius: 6, overflow: "hidden", borderWidth: 1, borderColor: gov.border, backgroundColor: "#E8EEF4" },
  webview: { flex: 1, backgroundColor: "#E8EEF4" },
  status: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  statusText: { flex: 1, color: gov.muted, fontSize: 14, lineHeight: 21 },
  warning: { color: gov.amber },
  controls: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  control: { flexGrow: 1, flexBasis: 120 },
});
