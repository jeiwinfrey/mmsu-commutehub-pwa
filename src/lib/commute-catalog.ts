import type {
  FareEstimate,
  RouteOption,
  Stop,
  TransportMode,
  Vehicle,
} from "../types/commute";
export type Coordinate = [number, number]; // longitude, latitude
export type DemoStop = Stop & {
  shortName: string;
  coordinates: Coordinate;
  hint: string;
};
export type DemoRoute = Omit<RouteOption, "stops"> & {
  stops: readonly DemoStop[];
  fullFareCentavos: number;
  speedKmh: number;
  corridor: string;
};
// Approximate demo waypoints, not surveyed terminal bays or verified boarding permissions.
export const places: readonly DemoStop[] = [
  {
    id: "laoag",
    name: "Laoag candidate boarding area",
    shortName: "Laoag",
    coordinates: [120.5937, 18.1955],
    verification: "candidate",
    hint: "City-center area · exact jeepney / modern jeepney bay unverified",
  },
  {
    id: "san-nicolas",
    name: "San Nicolas candidate stop",
    shortName: "San Nicolas",
    coordinates: [120.5936, 18.1725],
    verification: "candidate",
    hint: "Town-center corridor · check road side before real travel",
  },
  {
    id: "batac",
    name: "Batac candidate stop",
    shortName: "Batac",
    coordinates: [120.5647, 18.0554],
    verification: "candidate",
    hint: "City-center area · boarding bay unverified",
  },
  {
    id: "mmsu",
    name: "MMSU Batac campus access",
    shortName: "MMSU Batac",
    coordinates: [120.5501, 18.0587],
    verification: "candidate",
    hint: "Approximate access area · campus gate and walking leg unverified",
  },
  {
    id: "paoay",
    name: "Paoay candidate boarding area",
    shortName: "Paoay",
    coordinates: [120.5213, 18.0616],
    verification: "candidate",
    hint: "Market/church vicinity · turnaround bay unverified",
  },
  {
    id: "badoc",
    name: "Badoc candidate boarding area",
    shortName: "Badoc",
    coordinates: [120.4775, 17.927],
    verification: "candidate",
    hint: "Approximate town access · endpoint unverified",
  },
  {
    id: "vigan",
    name: "Vigan candidate boarding area",
    shortName: "Vigan",
    coordinates: [120.3866, 17.5748],
    verification: "candidate",
    hint: "City/market vicinity · do not confuse with Bantay highway stops",
  },
];
export const place = (id: string) => places.find((p) => p.id === id);
const getStops = (ids: string[]) => ids.map((id) => place(id)!);
const definitions: {
  corridor: string;
  name: string;
  mode: TransportMode;
  ids: string[];
  fare: number;
  speed: number;
}[] = [
  {
    corridor: "jeepney",
    name: "Laoag–Batac–Paoay",
    mode: "traditional-jeepney",
    ids: ["laoag", "san-nicolas", "batac", "mmsu", "paoay"],
    fare: 5000,
    speed: 26,
  },
  {
    corridor: "jeepney",
    name: "Laoag–Batac–Paoay",
    mode: "modern-jeepney",
    ids: ["laoag", "san-nicolas", "batac", "mmsu", "paoay"],
    fare: 6000,
    speed: 30,
  },
  {
    corridor: "badoc",
    name: "Laoag–Badoc",
    mode: "bus",
    ids: ["laoag", "san-nicolas", "batac", "badoc"],
    fare: 9000,
    speed: 40,
  },
  {
    corridor: "vigan",
    name: "Laoag–Vigan",
    mode: "bus",
    ids: ["laoag", "san-nicolas", "batac", "badoc", "vigan"],
    fare: 18000,
    speed: 45,
  },
];
export const commuteRoutes: readonly DemoRoute[] = definitions.flatMap((d) =>
  (["outbound", "inbound"] as const).map((direction) => ({
    id: `${d.mode}-${d.corridor}-${direction}`,
    name: d.name,
    mode: d.mode,
    direction,
    stops: getStops(direction === "outbound" ? d.ids : [...d.ids].reverse()),
    fullFareCentavos: d.fare,
    speedKmh: d.speed,
    corridor: d.corridor,
    source: "sample" as const,
  })),
);
export const modeLabel = (mode: TransportMode) =>
  ({
    "traditional-jeepney": "Traditional jeepney",
    "modern-jeepney": "Modern jeepney",
    bus: "Bus",
  })[mode];
export const matchingRoutes = (from: string, to: string) =>
  commuteRoutes.filter((r) => {
    const a = r.stops.findIndex((s) => s.id === from),
      b = r.stops.findIndex((s) => s.id === to);
    return a >= 0 && b > a;
  });
export function routeLabel(route: DemoRoute) {
  return `${route.stops[0].shortName} → ${route.stops.at(-1)!.shortName}`;
}
export function distanceMeters(a: Coordinate, b: Coordinate) {
  const rad = Math.PI / 180;
  const dl = (b[1] - a[1]) * rad;
  const dn = (b[0] - a[0]) * rad;
  const h =
    Math.sin(dl / 2) ** 2 +
    Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dn / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}
export function estimateFare(
  route: DemoRoute,
  from: string,
  to: string,
): FareEstimate | null {
  const a = route.stops.findIndex((s) => s.id === from),
    b = route.stops.findIndex((s) => s.id === to);
  if (a < 0 || b <= a) return null;
  let total = 0,
    part = 0;
  for (let i = 1; i < route.stops.length; i++) {
    const d = distanceMeters(
      route.stops[i - 1].coordinates,
      route.stops[i].coordinates,
    );
    total += d;
    if (i > a && i <= b) part += d;
  }
  const regularCentavos = Math.max(
    1500,
    Math.round((route.fullFareCentavos * (part / total)) / 100) * 100,
  );
  return {
    regularCentavos,
    studentCentavos: Math.round(regularCentavos * 0.8),
    discountPercent: 20,
    source: "sample",
  };
}
export const money = (centavos: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: centavos % 100 ? 2 : 0,
  }).format(centavos / 100);
export const occupancyLabel = (value: Vehicle["occupancy"]) =>
  ({
    "seats-available": "Seats available",
    limited: "Limited space",
    full: "Full",
    unknown: "Unknown occupancy",
  })[value];
export function vehiclesFor(
  route: DemoRoute,
  from: string,
  to: string,
): Vehicle[] {
  const fare = estimateFare(route, from, to);
  if (!fare) return [];
  return (["seats-available", "limited", "full", "unknown"] as const).map(
    (occupancy, i) => ({
      id: `${route.id}-vehicle-${i + 1}`,
      routeId: route.id,
      label: `Sample ${modeLabel(route.mode).toLowerCase()} ${String(i + 1).padStart(2, "0")}`,
      mode: route.mode,
      etaMinutes: 8 + i * 4,
      speedKmh: route.speedKmh,
      occupancy,
      fare,
      source: "sample",
    }),
  );
}
