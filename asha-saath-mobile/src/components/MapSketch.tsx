import { useMemo, useState } from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import Svg, { Polyline, Line } from "react-native-svg";
import { Button, Body } from "./ui";

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  number?: number;
  label: string;
  detail?: string;
  kind: "start" | "visit" | "finish";
}
export interface MapCanvasProps {
  points: MapPoint[];
  selectedId?: string;
  onSelect: (id: string) => void;
  title: string;
  nativeMapsEnabled?: boolean;
  zoomInLabel?: string;
  zoomOutLabel?: string;
  resetLabel?: string;
  mapHint?: string;
  language?: "en" | "hi";
  center?: { lat: number; lng: number };
  drawRoute?: boolean;
}

/** No location lookup, tile provider or real-person coordinates are used here. */
export default function MapSketch({
  points,
  selectedId,
  onSelect,
  title,
  zoomInLabel = "Zoom in",
  zoomOutLabel = "Zoom out",
  resetLabel = "Show full route",
  mapHint = "Illustrative coordinates; use the stop list below.",
}: MapCanvasProps) {
  const [zoom, setZoom] = useState(1);
  const positions = useMemo(() => {
    const minLat = Math.min(...points.map((p) => p.lat));
    const maxLat = Math.max(...points.map((p) => p.lat));
    const minLng = Math.min(...points.map((p) => p.lng));
    const maxLng = Math.max(...points.map((p) => p.lng));
    return points.map((p) => ({
      ...p,
      x: 28 + ((p.lng - minLng) / Math.max(maxLng - minLng, 0.001)) * 264,
      y: 28 + ((maxLat - p.lat) / Math.max(maxLat - minLat, 0.001)) * 204,
    }));
  }, [points]);
  const selectedPosition = positions.find((p) => p.id === selectedId);
  const center =
    zoom > 1 && selectedPosition
      ? { x: selectedPosition.x, y: selectedPosition.y }
      : { x: 160, y: 130 };
  const width = 320 / zoom,
    height = 260 / zoom;
  const left = center.x - width / 2,
    top = center.y - height / 2;
  const selected = points.find((p) => p.id === selectedId);
  return (
    <View style={local.wrap}>
      <View style={local.map} accessibilityLabel={title}>
        <Svg
          width="100%"
          height="100%"
          viewBox={`${left} ${top} ${width} ${height}`}
          preserveAspectRatio="none"
        >
          {[0, 64, 128, 192, 256, 320].map((x) => (
            <Line
              key={"v" + x}
              x1={x}
              y1={0}
              x2={x}
              y2={260}
              stroke="#D9E2EC"
              strokeWidth={1 / zoom}
            />
          ))}
          {[0, 52, 104, 156, 208, 260].map((y) => (
            <Line
              key={"h" + y}
              x1={0}
              y1={y}
              x2={320}
              y2={y}
              stroke="#D9E2EC"
              strokeWidth={1 / zoom}
            />
          ))}
          <Polyline
            points={positions.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="#1D4E89"
            strokeWidth={3 / zoom}
            strokeDasharray={`${7 / zoom} ${5 / zoom}`}
          />
        </Svg>
        {positions.map((point) => {
          const x = ((point.x - left) / width) * 100,
            y = ((point.y - top) / height) * 100;
          if (x < 0 || x > 100 || y < 0 || y > 100) return null;
          return (
            <Pressable
              key={point.id}
              accessibilityRole="button"
              accessibilityLabel={
                point.label + (point.detail ? " · " + point.detail : "")
              }
              accessibilityState={{ selected: selectedId === point.id }}
              onPress={() => onSelect(point.id)}
              style={[
                local.marker,
                {
                  left: `${x}%`,
                  top: `${y}%`,
                  backgroundColor:
                    selectedId === point.id
                      ? "#7A3E00"
                      : point.kind === "visit"
                        ? "#1D4E89"
                        : "#102A43",
                },
              ]}
            >
              <Text style={local.number}>
                {point.number ?? (point.kind === "start" ? "S" : "F")}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={local.controls}>
        <Button
          label={zoomInLabel}
          secondary
          onPress={() => setZoom((z) => Math.min(4, z * 1.5))}
          disabled={zoom >= 4}
        />
        <Button
          label={zoomOutLabel}
          secondary
          onPress={() => setZoom((z) => Math.max(1, z / 1.5))}
          disabled={zoom <= 1}
        />
      </View>
      <Button label={resetLabel} secondary onPress={() => setZoom(1)} />
      <Body tone="muted">{mapHint}</Body>
      {selected && (
        <Body>
          {selected.label + (selected.detail ? " · " + selected.detail : "")}
        </Body>
      )}
    </View>
  );
}

const local = StyleSheet.create({
  wrap: { gap: 12 },
  map: {
    height: 300,
    width: "100%",
    backgroundColor: "#EFF6FF",
    borderRadius: 6,
    borderColor: "#64748B",
    borderWidth: 1,
    overflow: "hidden",
  },
  controls: { gap: 8 },
  marker: {
    position: "absolute",
    marginLeft: -24,
    marginTop: -24,
    minWidth: 48,
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  number: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
