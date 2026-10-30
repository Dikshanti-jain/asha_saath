export type Role = "worker" | "coordinator" | "provider";
export type Lang = "en" | "hi";
export interface Actor {
  actorId: string;
  role: Role;
  staffId?: string;
  providerId?: string;
  label: string;
  synthetic?: boolean;
}
export interface Task {
  key: string;
  datasetId: string;
  taskId: string;
  staffId: string;
  localityId: string;
  priority: "P1" | "P2" | "P3";
  dueDate: string;
  earliest: string;
  latest: string;
  visitMinutes: number;
  requiredCadre: string;
  status: string;
  deferCount: number;
  lat: number;
  lng: number;
  locationConfidence?: string;
  ruleId?: string;
  riskFlags?: string[];
  outcomeNote?: string;
  holdUntil?: string;
}
export interface Stop {
  order: number;
  taskKey: string;
  taskId: string;
  localityId: string;
  priority: string;
  travelMin: number;
  distanceKm: number;
  arrive: number;
  start: number;
  end: number;
  waitMin: number;
  breakBefore: boolean;
  why: string;
}
export interface PlanParams {
  date: string;
  shiftStart: string;
  shiftEnd: string;
  breakStart: string;
  breakMinutes: number;
  bufferMinutes: number;
  speedKmh: number;
  distanceMultiplier: number;
  start: { lat: number; lng: number };
  finish: { lat: number; lng: number };
  departAt?: string;
  departFrom?: { lat: number; lng: number; label: string };
}
export interface Unserved {
  taskKey: string;
  taskId: string;
  priority: string;
  localityId: string;
  category: string;
  reason: string;
}
export interface Plan {
  staffId: string;
  version: number;
  date: string;
  params: PlanParams;
  stops: Stop[];
  recordedStops: Stop[];
  unserved: Unserved[];
  returnTravelMin: number;
  returnAt: number;
  ruleSnapshot: string;
  policyVersion?: string;
}
export interface History {
  at: number;
  actor: string;
  from?: string;
  to: string;
  note?: string;
}
export interface Need {
  id: string;
  ref: string;
  taskKey: string;
  taskId: string;
  staffId: string;
  localityId: string;
  state: string;
  category: string;
  helpMode: "IN_PERSON" | "PHONE_RELAY" | "EITHER";
  preferredTime: "MORNING" | "AFTERNOON" | "ANY";
  owner: string;
  nextAction: string;
  reason?: string;
  consentId?: string;
  nominatedProviderId?: string;
  privacyWithdrawnAt?: number;
  history: History[];
}
export interface Attempt {
  id: string;
  needId: string;
  providerId: string;
  offerId: string;
  state: string;
  arrangement?: { method: string; window: string };
  delivery?: { help: string; outcome: string; at: number };
  confirmation?: { result: string; by: string; at: number };
  history: History[];
}
export interface ProviderRow {
  attemptId: string;
  ref: string;
  state: string;
  accessRevoked: boolean;
  expiresAt?: number;
  localityId?: string;
  helpMode?: Need["helpMode"];
  preferredTime?: Need["preferredTime"];
  arrangement?: Attempt["arrangement"];
  delivery?: Attempt["delivery"];
  history?: History[];
}
export type FundingPurpose =
  "DOCUMENT_FEES" | "TRAVEL_SUPPORT" | "ACCESSIBILITY_SUPPORT" | "OTHER";
export interface Funding {
  id: string;
  needId: string;
  ref: string;
  staffId: string;
  localityId: string;
  providerId: string;
  purpose: FundingPurpose;
  reason: string;
  requestedRupees: number;
  approvedRupees?: number;
  state: string;
  consent: { state: string; fields: string[] };
  createdAt: number;
  history: History[];
  nextAction: string;
  resourceHeld: boolean;
  payment?: { reference: string; note: string; at: number };
  confirmation?: { receivedRupees: number; by: string; at: number };
  reconciledRupees?: number;
}
export interface FundingRow {
  id: string;
  ref: string;
  providerId: string;
  state: string;
  accessRevoked: boolean;
  purpose?: FundingPurpose;
  localityId?: string;
  reason?: string;
  requestedRupees?: number;
  approvedRupees?: number;
  nextAction?: string;
  payment?: Funding["payment"];
  confirmation?: Funding["confirmation"];
  history?: History[];
}
export interface FundingAvailability {
  totalRupees: number;
  heldRupees: number;
  usedRupees: number;
  availableRupees: number;
}
export interface CaseThread {
  key: string;
  kind: "funding" | "referral";
  ref: string;
  providerId: string;
  providerName: string;
  state: string;
  localityId: string;
  canSend: boolean;
}
export interface Message {
  id: string;
  threadKey: string;
  senderActorId: string;
  senderRole: Role;
  senderLabel: string;
  text: string;
  at: number;
  readBy: string[];
}
export interface MobileState {
  clock: number;
  tasks: Task[];
  plans: Record<string, Plan | undefined>;
  visits: {
    taskKey: string;
    taskId: string;
    staffId: string;
    outcome: string;
    at: number;
  }[];
  needs: Need[];
  attempts: Attempt[];
  consents: {
    id: string;
    needId: string;
    state: string;
    recipientProviderId: string;
    fields: string[];
  }[];
  providerRows?: ProviderRow[];
  fundingRequests: Funding[];
  fundingRows?: FundingRow[];
  fundingAvailability: Record<string, FundingAvailability>;
  fundingBudgets: Record<string, { totalRupees: number; confirmedAt: number }>;
  caseThreads: CaseThread[];
  messages: Message[];
  capacity: Record<
    string,
    { totalUnits: number; confirmedAt: number; freshUntil: number }
  >;
  reservations: { offerId: string; state: string; units: number }[];
}
