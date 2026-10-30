import type { MapPoint } from "../components/MapSketch";
import { leafletJs, leafletCss, leafletLicense } from "./leaflet-bundle";

export const MAP_PROTOCOL = 1;
export const MAP_USER_AGENT = "ASHA-Saath/1.0.1 (Android; synthetic-prototype map)";
export const OSM_COPYRIGHT = "https://www.openstreetmap.org/copyright";
const LIMIT = 200;
const coordinate = (lat: number, lng: number) =>
  Number.isFinite(lat) && Math.abs(lat) <= 85.051128 &&
  Number.isFinite(lng) && Math.abs(lng) <= 180;

/** Copy an explicit map-only projection; never serialize the caller's object. */
export function mapPoints(input: readonly MapPoint[]): MapPoint[] {
  const ids = new Set<string>();
  return input.slice(0, LIMIT).flatMap((point) => {
    if (!point || typeof point.id !== "string" || !point.id || point.id.length > 200 ||
      ids.has(point.id) || !coordinate(point.lat, point.lng) ||
      !["start", "visit", "finish"].includes(point.kind) || typeof point.label !== "string") return [];
    ids.add(point.id);
    return [{
      id: point.id, lat: point.lat, lng: point.lng, kind: point.kind,
      label: point.label.slice(0, 400),
      ...(typeof point.detail === "string" ? { detail: point.detail.slice(0, 600) } : {}),
      ...(Number.isInteger(point.number) && point.number! >= 1 && point.number! <= 10000 ? { number: point.number } : {}),
    }];
  });
}

export function mapCenter(center?: { lat: number; lng: number }) {
  return center && coordinate(center.lat, center.lng) ? { lat: center.lat, lng: center.lng } : undefined;
}

export function scriptJSON(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

function documentId(value: string) {
  if (!/^[A-Za-z0-9-]{16,80}$/.test(value)) throw new Error("Invalid map document identifier.");
  return value;
}

export type MapEvent =
  | { action: "select"; id: string }
  | { action: "ready" | "loading" | "tilesReady" | "tilesError" | "error" | "attribution" };

/** Bridge messages cannot perform commands or select another route's task. */
export function parseMapEvent(raw: string, currentDocument: string, points: readonly MapPoint[]): MapEvent | null {
  if (typeof raw !== "string" || raw.length > 2048) return null;
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value) || value.version !== MAP_PROTOCOL || value.document !== currentDocument) return null;
    const allowed = value.action === "select" ? ["version", "document", "action", "id"] : ["version", "document", "action"];
    if (Object.keys(value).some((key) => !allowed.includes(key))) return null;
    if (value.action === "select") return typeof value.id === "string" && points.some((point) => point.id === value.id)
      ? { action: "select", id: value.id } : null;
    return ["ready", "loading", "tilesReady", "tilesError", "error", "attribution"].includes(value.action)
      ? { action: value.action } : null;
  } catch { return null; }
}

export type MapCommand = { action: "select"; id: string | null } | { action: "zoomIn" | "zoomOut" | "reset" };
export function mapCommandScript(command: MapCommand, currentDocument: string, points: readonly MapPoint[]) {
  documentId(currentDocument);
  if (command.action === "select" && command.id !== null && !points.some((point) => point.id === command.id)) return null;
  if (!["select", "zoomIn", "zoomOut", "reset"].includes(command.action)) return null;
  const safe = command.action === "select" ? { action: command.action, id: command.id } : { action: command.action };
  return `window.AshaMapCommand&&window.AshaMapCommand(${scriptJSON({ version: MAP_PROTOCOL, document: currentDocument, ...safe })});true;`;
}

/** The inline document never navigates. External attribution opens a fixed URL natively. */
export const mapNavigationAllowed = (url: string) => url === "about:blank";

export function buildMapDocument(options: {
  points: readonly MapPoint[]; document: string; title: string;
  center?: { lat: number; lng: number }; drawRoute?: boolean;
}) {
  const id = documentId(options.document);
  const points = mapPoints(options.points);
  const center = mapCenter(options.center) ?? (points[0] ? { lat: points[0].lat, lng: points[0].lng } : undefined);
  if (!center) throw new Error("An approved map center or confirmed location is required.");
  const payload = scriptJSON({ points, center, drawRoute: options.drawRoute !== false, title: options.title.slice(0, 400), document: id, version: MAP_PROTOCOL });
  const csp = `default-src 'none'; script-src 'nonce-${id}'; style-src 'unsafe-inline'; img-src https://tile.openstreetmap.org data:; connect-src 'none'; font-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; media-src 'none'; base-uri 'none'; form-action 'none'`;
  const license = leafletLicense.replace(/-->/g, "--&gt;");
  const script = leafletJs.replace(/<\/script/gi, "<\\/script");
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><!-- Leaflet 1.9.4\n${license} --><style>${leafletCss}
html,body,#map{height:100%;width:100%;margin:0;background:#e8eef4}body{font-family:system-ui,sans-serif}.asha-marker{width:46px;height:46px;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#1D4E89;color:white;font-size:17px;font-weight:700;box-sizing:border-box;box-shadow:0 1px 5px #475569}.asha-marker.is-base{background:#102A43}.asha-marker.is-selected{background:#7A3E00;border-color:#F29D38}.leaflet-control-attribution{font-size:12px;line-height:18px;max-width:95vw;white-space:normal}.leaflet-control-attribution a{color:#1D4E89}.leaflet-popup-content{font-size:14px;line-height:21px}.leaflet-container:focus-visible{outline:3px solid #F29D38}
</style></head><body><div id="map" role="region"></div><script nonce="${id}">${script}</script><script nonce="${id}">
(function(){'use strict';
const data=${payload};
function send(action,id){const message={version:data.version,document:data.document,action:action};if(id!==undefined)message.id=id;if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(message));}
try {
const node=document.getElementById('map');node.setAttribute('aria-label',data.title);
const map=L.map(node,{zoomControl:false,attributionControl:true,minZoom:3,maxZoom:17,scrollWheelZoom:false,zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false,dragging:true,touchZoom:true,doubleClickZoom:true});
map.attributionControl.setPrefix(false);
const positions=data.points.map(p=>[p.lat,p.lng]);
function fit(){if(positions.length)map.fitBounds(positions,{padding:[35,35],maxZoom:14,animate:false});else map.setView([data.center.lat,data.center.lng],12,{animate:false});}
const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',maxZoom:19,keepBuffer:0,updateWhenIdle:true,updateWhenZooming:false});
let failures=0;
tiles.on('loading',()=>{failures=0;send('loading');});
tiles.on('tileerror',()=>{failures++;send('tilesError');});
tiles.on('load',()=>send(failures?'tilesError':'tilesReady'));
const markers=new Map();
if(data.drawRoute&&positions.length>1)L.polyline(positions,{color:'#1D4E89',weight:4,dashArray:'8 6',opacity:0.9}).addTo(map);
data.points.forEach(point=>{
const visual=document.createElement('span');visual.className='asha-marker'+(point.kind==='visit'?'':' is-base');visual.textContent=point.number!==undefined?String(point.number):(point.kind==='start'?'S':'F');
const marker=L.marker([point.lat,point.lng],{icon:L.divIcon({html:visual,className:'asha-icon',iconSize:[46,46],iconAnchor:[23,23]}),title:point.label,alt:point.label,keyboard:true}).addTo(map);
const popup=document.createElement('div');const heading=document.createElement('strong');heading.textContent=point.label;popup.appendChild(heading);if(point.detail){const detail=document.createElement('div');detail.textContent=point.detail;popup.appendChild(detail);}marker.bindPopup(popup,{maxWidth:230});marker.on('click',()=>send('select',point.id));markers.set(point.id,{marker:marker,visual:visual});
});
window.AshaMapCommand=function(command){if(!command||command.version!==data.version||command.document!==data.document)return;
if(command.action==='reset'){fit();return;}if(command.action==='zoomIn'){map.zoomIn(1,{animate:false});return;}if(command.action==='zoomOut'){map.zoomOut(1,{animate:false});return;}
if(command.action==='select'&&(command.id===null||markers.has(command.id))){markers.forEach((entry,id)=>entry.visual.classList.toggle('is-selected',id===command.id));if(command.id!==null){const entry=markers.get(command.id);entry.marker.openPopup();map.panTo(entry.marker.getLatLng(),{animate:false});}else map.closePopup();}};
node.addEventListener('click',function(event){const target=event.target instanceof Element?event.target.closest('a'):null;if(target){event.preventDefault();if(target.getAttribute('href')==='https://www.openstreetmap.org/copyright')send('attribution');}});
fit();tiles.addTo(map);send('ready');setTimeout(()=>map.invalidateSize({animate:false}),100);
}catch(error){send('error');}
})();true;
</script></body></html>`;
}
