/** Presentation contracts only. These are not backend schemas. */
export type TransportMode = "traditional-jeepney" | "modern-jeepney" | "bus";
export type Direction = "outbound" | "inbound";
export type DemoSource = "sample";
export type Stop = { id: string; name: string; verification: "candidate" };
export type RouteOption = { id: string; name: string; mode: TransportMode; direction: Direction; stops: readonly Stop[]; source: DemoSource };
export type FareEstimate = { regularCentavos: number; studentCentavos: number; discountPercent: 20; source: DemoSource };
export type Vehicle = { id: string; routeId: string; label: string; mode: TransportMode; etaMinutes: number; speedKmh: number; occupancy: "seats-available" | "limited" | "full" | "unknown"; fare: FareEstimate; source: DemoSource };
export type PickupSelection = { stopId: string; radiusMeters: 100 | 250 | 500 | 1000 };
export type Trip = { id: string; routeId: string; vehicleId: string; status: "waiting" | "approaching" | "riding" | "completed" | "cancelled"; pickup: PickupSelection; destinationStopId: string; source: DemoSource };
export type PlannerResult = { id: string; routeId: string; classStartsAt: string; leaveAt: string; arriveAt: string; walkMinutes: number; waitMinutes: number; rideMinutes: number; bufferMinutes: number; source: DemoSource };
export type ReportCategory = "traffic" | "queue" | "crowding" | "service" | "safety";
export type CommuteReport = { id: string; routeId: string; category: ReportCategory; area: string; description: string; observedAt: string; verification: "unverified"; source: DemoSource };
/** Alerts refer to reports; they do not duplicate report text. */
export type AlertItem = { id: string; reportId: string; read: boolean; status: "active" | "expired" | "resolved"; source: DemoSource };
export type Profile = { displayName: string; campus: string; preferredMode: TransportMode | "any"; studentFare: boolean; savedRouteIds: readonly string[]; source: DemoSource };
