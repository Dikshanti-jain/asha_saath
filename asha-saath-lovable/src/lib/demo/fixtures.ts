// Synthetic fixtures — copied verbatim from the authoritative product context.
// Nothing here represents a real person, provider, government body or NGO.

export const DEMO_CSV = `source_dataset_id,source_task_id,patient_id,staff_id,locality_id,latitude,longitude,location_confidence,rule_id,rule_version,priority,due_date,earliest_time,latest_time,visit_minutes,required_cadre,defer_count,risk_flags,status,synthetic
ASHA-SAATH-DEMO-V1,TASK-001,PERSON-DEMO-001,ASHA-DEMO-01,DEMO-VILLAGE-A,26.904,75.704,SYNTHETIC_CONFIRMED,DEMO-ROUTINE,1,P1,2026-10-08,09:00,11:00,25,ASHA,1,SYNTHETIC_PRIORITY_FLAG,PENDING,true
ASHA-SAATH-DEMO-V1,TASK-002,PERSON-DEMO-002,ASHA-DEMO-01,DEMO-VILLAGE-A,26.908,75.708,SYNTHETIC_CONFIRMED,DEMO-ROUTINE,1,P2,2026-10-08,09:00,14:00,20,ASHA,0,,PENDING,true
ASHA-SAATH-DEMO-V1,TASK-003,PERSON-DEMO-003,ASHA-DEMO-01,DEMO-VILLAGE-A,26.912,75.706,SYNTHETIC_CONFIRMED,DEMO-ROUTINE,1,P3,2026-10-08,09:00,14:30,20,ASHA,0,,PENDING,true
ASHA-SAATH-DEMO-V1,TASK-004,PERSON-DEMO-004,ASHA-DEMO-01,DEMO-VILLAGE-B,26.925,75.720,SYNTHETIC_CONFIRMED,DEMO-ROUTINE,1,P1,2026-10-07,09:00,13:00,30,ASHA,2,SYNTHETIC_PRIORITY_FLAG,PENDING,true
ASHA-SAATH-DEMO-V1,TASK-005,PERSON-DEMO-005,ASHA-DEMO-01,DEMO-VILLAGE-B,26.928,75.724,SYNTHETIC_CONFIRMED,DEMO-ROUTINE,1,P2,2026-10-08,10:00,14:00,25,ASHA,1,,PENDING,true
ASHA-SAATH-DEMO-V1,TASK-006,PERSON-DEMO-006,ASHA-DEMO-01,DEMO-VILLAGE-B,26.930,75.718,SYNTHETIC_CONFIRMED,DEMO-ROUTINE,1,P3,2026-10-08,09:00,14:30,20,ASHA,0,,PENDING,true
ASHA-SAATH-DEMO-V1,TASK-007,PERSON-DEMO-007,ASHA-DEMO-01,DEMO-HAMLET-C,26.960,75.770,SYNTHETIC_CONFIRMED,DEMO-ROUTINE,1,P1,2026-10-07,09:00,13:30,30,ASHA,3,SYNTHETIC_REMOTE_FLAG,PENDING,true
ASHA-SAATH-DEMO-V1,TASK-008,PERSON-DEMO-008,ASHA-DEMO-01,DEMO-HAMLET-C,26.964,75.774,SYNTHETIC_CONFIRMED,DEMO-ROUTINE,1,P2,2026-10-08,13:00,14:00,25,ASHA,1,,PENDING,true
ASHA-SAATH-DEMO-V1,TASK-009,PERSON-DEMO-009,ASHA-DEMO-01,DEMO-VILLAGE-A,26.906,75.702,SYNTHETIC_CONFIRMED,DEMO-ROUTINE,1,P2,2026-10-08,09:00,10:00,20,ASHA,0,,PENDING,true
ASHA-SAATH-DEMO-V1,TASK-010,PERSON-DEMO-010,ASHA-DEMO-01,DEMO-VILLAGE-B,26.926,75.722,SYNTHETIC_CONFIRMED,DEMO-ROUTINE,1,P3,2026-10-08,13:00,14:30,30,ASHA,0,,PENDING,true
ASHA-SAATH-DEMO-V1,TASK-011,PERSON-DEMO-011,ASHA-DEMO-01,DEMO-HAMLET-C,26.968,75.776,SYNTHETIC_CONFIRMED,DEMO-ROUTINE,1,P3,2026-10-08,09:00,14:00,25,ASHA,1,,PENDING,true
ASHA-SAATH-DEMO-V1,TASK-012,PERSON-DEMO-001,ASHA-DEMO-01,DEMO-VILLAGE-A,26.904,75.704,SYNTHETIC_CONFIRMED,DEMO-ROUTINE,1,P3,2026-10-09,09:00,14:30,20,ASHA,0,,PENDING,true
ASHA-SAATH-DEMO-V1,TASK-013,PERSON-DEMO-013,ASHA-DEMO-02,DEMO-WARD-1,26.894,75.716,SYNTHETIC_CONFIRMED,DEMO-ROUTINE,1,P1,2026-10-08,09:00,11:00,25,ASHA,1,SYNTHETIC_PRIORITY_FLAG,PENDING,true
ASHA-SAATH-DEMO-V1,TASK-014,PERSON-DEMO-014,ASHA-DEMO-02,DEMO-WARD-1,26.890,75.718,SYNTHETIC_CONFIRMED,DEMO-ROUTINE,1,P2,2026-10-08,09:00,14:00,20,ASHA,0,,PENDING,true
ASHA-SAATH-DEMO-V1,TASK-015,PERSON-DEMO-015,ASHA-DEMO-02,DEMO-WARD-1,26.888,75.714,SYNTHETIC_CONFIRMED,DEMO-ROUTINE,1,P3,2026-10-08,09:00,14:00,20,ASHA,0,,PENDING,true
ASHA-SAATH-DEMO-V1,TASK-016,PERSON-DEMO-016,ASHA-DEMO-02,DEMO-SETTLEMENT-2,26.880,75.730,SYNTHETIC_CONFIRMED,DEMO-ROUTINE,1,P1,2026-10-07,10:00,13:00,25,ASHA,2,SYNTHETIC_PRIORITY_FLAG,PENDING,true
ASHA-SAATH-DEMO-V1,TASK-017,PERSON-DEMO-017,ASHA-DEMO-02,DEMO-SETTLEMENT-2,26.878,75.732,SYNTHETIC_CONFIRMED,DEMO-ROUTINE,1,P2,2026-10-08,09:00,14:00,20,ASHA,0,,PENDING,true
ASHA-SAATH-DEMO-V1,TASK-018,PERSON-DEMO-018,ASHA-DEMO-02,DEMO-SETTLEMENT-2,26.882,75.734,SYNTHETIC_CONFIRMED,DEMO-ROUTINE,1,P3,2026-10-08,09:00,14:00,25,ASHA,0,,PENDING,true
ASHA-SAATH-DEMO-V1,TASK-019,PERSON-DEMO-019,ASHA-DEMO-02,DEMO-WARD-1,26.896,75.720,SYNTHETIC_CONFIRMED,DEMO-ROUTINE,1,P2,2026-10-08,11:00,13:30,20,ASHA,1,,PENDING,true
ASHA-SAATH-DEMO-V1,TASK-020,PERSON-DEMO-020,ASHA-DEMO-02,DEMO-WARD-1,26.892,75.722,SYNTHETIC_CONFIRMED,DEMO-ROUTINE,1,P3,2026-10-08,09:00,10:00,20,ASHA,0,,PENDING,true
ASHA-SAATH-DEMO-V1,TASK-021,PERSON-DEMO-021,ASHA-DEMO-02,DEMO-SETTLEMENT-2,26.876,75.736,SYNTHETIC_CONFIRMED,DEMO-ROUTINE,1,P2,2026-10-08,13:00,14:00,25,ASHA,1,,PENDING,true
ASHA-SAATH-DEMO-V1,TASK-022,PERSON-DEMO-022,ASHA-DEMO-02,DEMO-WARD-1,26.898,75.724,SYNTHETIC_CONFIRMED,DEMO-ROUTINE,1,P3,2026-10-10,09:00,14:00,20,ASHA,0,,PENDING,true
ASHA-SAATH-DEMO-V1,TASK-023,PERSON-DEMO-023,ASHA-DEMO-02,DEMO-SETTLEMENT-2,26.884,75.738,SYNTHETIC_CONFIRMED,DEMO-JOINT,1,P1,2026-10-08,09:00,14:00,30,JOINT,0,SYNTHETIC_JOINT_FLAG,PENDING,true
ASHA-SAATH-DEMO-V1,TASK-024,PERSON-DEMO-024,ASHA-DEMO-02,DEMO-WARD-1,26.900,75.726,SYNTHETIC_CONFIRMED,DEMO-ESCALATION,1,P1,2026-10-08,09:00,14:00,20,ASHA,0,SYNTHETIC_ESCALATION_FLAG,ESCALATION_REQUIRED,true
`;

export const DEMO_CONFIG = {
  synthetic: true,
  demoClock: "2026-10-08T09:00:00+05:30",
  timezone: "Asia/Kolkata",
  sourceDatasetId: "ASHA-SAATH-DEMO-V1",
  tenantLabel: "Fictional demonstration catchment",
  shift: {
    start: "09:00",
    end: "15:00",
    breakStart: "12:00",
    breakMinutes: 30,
    safetyBufferMinutes: 20,
    startPoint: { lat: 26.9, lng: 75.7 },
    finishPoint: { lat: 26.9, lng: 75.7 },
  },
  travel: { model: "haversine-estimate", distanceMultiplier: 1.4, speedKmh: 12, rounding: "ceil-minutes", fieldValidated: false },
  offerTtlMinutes: 60,
  projectionMaxDays: 7,
  supportCategory: "DOCUMENT_NAVIGATION",
  coordinator: { id: "COORD-DEMO-01", label: "Demo coordinator" },
  staff: [
    { id: "ASHA-DEMO-01", cadre: "ASHA", label: "ASHA-DEMO-01 (rural)", assignedLocalities: ["DEMO-VILLAGE-A", "DEMO-VILLAGE-B", "DEMO-HAMLET-C"] },
    { id: "ASHA-DEMO-02", cadre: "ASHA", label: "ASHA-DEMO-02 (urban)", assignedLocalities: ["DEMO-WARD-1", "DEMO-SETTLEMENT-2"] },
  ],
  rules: [
    { id: "DEMO-ROUTINE", version: 1, description: "Generic invented visit task; priority supplied by fixture" },
    { id: "DEMO-JOINT", version: 1, description: "Joint visit requires authorized coordination; not assigned as an independent ASHA completion" },
    { id: "DEMO-ESCALATION", version: 1, description: "Invented escalation flag; no live clinical instruction/contact" },
  ],
  publicPathway: {
    title: "Public scheme discovery and document checklist navigation",
    sourceUrl: "https://www.myscheme.gov.in/",
    checkedAt: "2026-10-08",
    jurisdiction: "Informational discovery; authority-specific application process",
    steps: [
      "Open the official programme page",
      "Read that programme's current eligibility and document checklist",
      "Confirm next application step with the authorized service channel",
    ],
  },
} as const;

export type AreaType = "rural" | "urban";
export interface Geography { id: string; parentId?: string; level: string; name: string; nameHi: string; areaType?: AreaType }

export const GEOGRAPHIES: Geography[] = [
  { id: "DEMO-STATE", level: "state", name: "Fictional State", nameHi: "काल्पनिक राज्य" },
  { id: "DEMO-DISTRICT", parentId: "DEMO-STATE", level: "district", name: "Fictional District", nameHi: "काल्पनिक ज़िला" },
  { id: "DEMO-BLOCK", parentId: "DEMO-DISTRICT", level: "block", name: "Demo Rural Block", nameHi: "डेमो ग्रामीण ब्लॉक", areaType: "rural" },
  { id: "DEMO-VILLAGE-A", parentId: "DEMO-BLOCK", level: "village", name: "Demo Village A", nameHi: "डेमो गाँव A", areaType: "rural" },
  { id: "DEMO-VILLAGE-B", parentId: "DEMO-BLOCK", level: "village", name: "Demo Village B", nameHi: "डेमो गाँव B", areaType: "rural" },
  { id: "DEMO-HAMLET-C", parentId: "DEMO-VILLAGE-B", level: "hamlet", name: "Demo Hamlet C", nameHi: "डेमो पुरवा C", areaType: "rural" },
  { id: "DEMO-WARD-1", parentId: "DEMO-DISTRICT", level: "ward", name: "Demo Ward 1", nameHi: "डेमो वार्ड 1", areaType: "urban" },
  { id: "DEMO-SETTLEMENT-2", parentId: "DEMO-WARD-1", level: "settlement", name: "Demo Settlement 2", nameHi: "डेमो बस्ती 2", areaType: "urban" },
];

export const geo = (id: string) => GEOGRAPHIES.find((g) => g.id === id);

export interface ProviderFixture {
  organizationId: string;
  name: string;
  branchId: string;
  registrationStatus: string;
  governmentEndorsement: false;
  offer: {
    id: string;
    category: string;
    mode: "ASSISTED_LOCAL" | "ASSISTED_REMOTE";
    officeLocality: string;
    catchments: string[];
    eligibilityRule: string;
    verificationStatus: string;
    verifiedAt: string;
    expiresAt: string;
    unitsPerCase: number;
    capacity: { id: string; totalUnits: number; confirmedAt: string; freshUntil: string };
  };
}

export const PROVIDERS: ProviderFixture[] = [
  {
    organizationId: "ORG-DEMO-A", name: "Demo Outreach A (fictional)", branchId: "BRANCH-DEMO-A",
    registrationStatus: "SYNTHETIC_REFERENCE_ONLY", governmentEndorsement: false,
    offer: { id: "OFFER-DEMO-A", category: "DOCUMENT_NAVIGATION", mode: "ASSISTED_LOCAL", officeLocality: "DEMO-VILLAGE-A", catchments: ["DEMO-VILLAGE-B"],
      eligibilityRule: "Synthetic document-navigation need within listed catchment", verificationStatus: "SYNTHETIC_SERVICE_VERIFIED",
      verifiedAt: "2026-10-08T08:00:00+05:30", expiresAt: "2026-10-09T17:00:00+05:30", unitsPerCase: 1,
      capacity: { id: "CAP-DEMO-A", totalUnits: 2, confirmedAt: "2026-10-08T08:30:00+05:30", freshUntil: "2026-10-08T12:00:00+05:30" } },
  },
  {
    organizationId: "ORG-DEMO-B", name: "Demo Help Desk B (fictional)", branchId: "BRANCH-DEMO-B",
    registrationStatus: "SYNTHETIC_REFERENCE_ONLY", governmentEndorsement: false,
    offer: { id: "OFFER-DEMO-B", category: "DOCUMENT_NAVIGATION", mode: "ASSISTED_REMOTE", officeLocality: "DEMO-WARD-1", catchments: ["DEMO-VILLAGE-A", "DEMO-WARD-1"],
      eligibilityRule: "Synthetic document-navigation need within listed catchment; person prefers assisted remote contact", verificationStatus: "SYNTHETIC_SERVICE_VERIFIED",
      verifiedAt: "2026-10-08T08:00:00+05:30", expiresAt: "2026-10-09T17:00:00+05:30", unitsPerCase: 1,
      capacity: { id: "CAP-DEMO-B", totalUnits: 1, confirmedAt: "2026-10-08T08:30:00+05:30", freshUntil: "2026-10-08T12:00:00+05:30" } },
  },
  {
    organizationId: "ORG-DEMO-C", name: "Demo Support Centre C (fictional)", branchId: "BRANCH-DEMO-C",
    registrationStatus: "SYNTHETIC_REFERENCE_ONLY", governmentEndorsement: false,
    offer: { id: "OFFER-DEMO-C", category: "DOCUMENT_NAVIGATION", mode: "ASSISTED_LOCAL", officeLocality: "DEMO-VILLAGE-B", catchments: ["DEMO-VILLAGE-A", "DEMO-VILLAGE-B", "DEMO-WARD-1"],
      eligibilityRule: "Synthetic document-navigation need within listed catchment", verificationStatus: "SYNTHETIC_SERVICE_VERIFIED",
      verifiedAt: "2026-10-08T08:00:00+05:30", expiresAt: "2026-10-09T17:00:00+05:30", unitsPerCase: 1,
      capacity: { id: "CAP-DEMO-C", totalUnits: 1, confirmedAt: "2026-10-08T08:30:00+05:30", freshUntil: "2026-10-08T12:00:00+05:30" } },
  },
];

export const provider = (id: string) => PROVIDERS.find((p) => p.organizationId === id)!;

