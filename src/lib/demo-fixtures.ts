import type {
  AlertItem,
  CommuteReport,
  PlannerResult,
  Profile,
  RouteOption,
  Stop,
  Trip,
  Vehicle,
} from "@/types/commute";
// Read-only UI samples. No terminal is verified; prices/times are illustrative.
const laoag = {
  id: "laoag",
  name: "Laoag candidate boarding area",
  verification: "candidate",
} as const;
const sanNicolas = {
  id: "san-nicolas",
  name: "San Nicolas candidate stop",
  verification: "candidate",
} as const;
const batac = {
  id: "batac",
  name: "Batac candidate stop",
  verification: "candidate",
} as const;
const paoay = {
  id: "paoay",
  name: "Paoay candidate boarding area",
  verification: "candidate",
} as const;
const badoc = {
  id: "badoc",
  name: "Badoc candidate boarding area",
  verification: "candidate",
} as const;
const vigan = {
  id: "vigan",
  name: "Vigan candidate boarding area",
  verification: "candidate",
} as const;
export const sampleStops = [
  laoag,
  sanNicolas,
  batac,
  paoay,
  badoc,
  vigan,
] as const satisfies readonly Stop[];
export const sampleRoutes = [
  ...(["traditional-jeepney", "modern-jeepney"] as const).flatMap(
    (mode) =>
      [
        {
          id: `${mode}-outbound`,
          name: "Laoag–Batac–Paoay",
          mode,
          direction: "outbound",
          stops: [laoag, sanNicolas, batac, paoay],
          source: "sample",
        },
        {
          id: `${mode}-inbound`,
          name: "Paoay–Batac–Laoag",
          mode,
          direction: "inbound",
          stops: [paoay, batac, sanNicolas, laoag],
          source: "sample",
        },
      ] as const,
  ),
  ...([badoc, vigan] as const).flatMap(
    (end) =>
      [
        {
          id: `bus-${end.id}-outbound`,
          name: `Laoag–${end.id === "badoc" ? "Badoc" : "Vigan"}`,
          mode: "bus",
          direction: "outbound",
          stops: [laoag, end],
          source: "sample",
        },
        {
          id: `bus-${end.id}-inbound`,
          name: `${end.id === "badoc" ? "Badoc" : "Vigan"}–Laoag`,
          mode: "bus",
          direction: "inbound",
          stops: [end, laoag],
          source: "sample",
        },
      ] as const,
  ),
] as const satisfies readonly RouteOption[];
export const sampleVehicles = [
  {
    id: "sample-vehicle-01",
    routeId: "modern-jeepney-outbound",
    label: "Sample modern jeepney 01",
    mode: "modern-jeepney",
    etaMinutes: 8,
    speedKmh: 25,
    occupancy: "seats-available",
    fare: {
      regularCentavos: 5000,
      studentCentavos: 4000,
      discountPercent: 20,
      source: "sample",
    },
    source: "sample",
  },
] as const satisfies readonly Vehicle[];
export const sampleTrips = [
  {
    id: "sample-trip-01",
    routeId: "modern-jeepney-outbound",
    vehicleId: "sample-vehicle-01",
    status: "waiting",
    pickup: { stopId: "laoag", radiusMeters: 500 },
    destinationStopId: "batac",
    source: "sample",
  },
] as const satisfies readonly Trip[];
export const samplePlans = [
  {
    id: "sample-plan-01",
    routeId: "modern-jeepney-outbound",
    classStartsAt: "2026-11-03T08:00:00+08:00",
    leaveAt: "2026-11-03T07:00:00+08:00",
    arriveAt: "2026-11-03T07:50:00+08:00",
    walkMinutes: 12,
    waitMinutes: 8,
    rideMinutes: 30,
    bufferMinutes: 10,
    source: "sample",
  },
] as const satisfies readonly PlannerResult[];
export const sampleReports = [
  {
    id: "sample-report-01",
    routeId: "modern-jeepney-outbound",
    category: "queue",
    area: "Laoag candidate boarding area",
    description: "Sample report: a queue is forming at the boarding area.",
    observedAt: "2026-11-03T07:00:00+08:00",
    verification: "unverified",
    source: "sample",
  },
] as const satisfies readonly CommuteReport[];
export const sampleAlerts = [
  {
    id: "sample-alert-01",
    reportId: "sample-report-01",
    read: false,
    status: "active",
    source: "sample",
  },
] as const satisfies readonly AlertItem[];
export const sampleProfile = {
  displayName: "Sample student",
  campus: "MMSU Batac Main Campus",
  preferredMode: "any",
  studentFare: true,
  savedRouteIds: ["modern-jeepney-outbound"],
  source: "sample",
} as const satisfies Profile;
