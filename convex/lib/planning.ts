import {
  distanceMeters,
  type DemoRoute,
  type Coordinate,
  estimateFare,
} from "../../src/lib/commute-catalog";
const MINUTE = 60000,
  DAY = 86400000,
  OFFSET = 8 * 3600000;
export const SERVICE_VERSION = "corridor-simulation-v1";
export function serviceFor(route: DemoRoute) {
  return {
    opens: 5 * 60,
    closes: 21 * 60,
    headway:
      route.mode === "bus" ? 30 : route.mode === "modern-jeepney" ? 12 : 10,
  };
}
function cumulative(points: Coordinate[]) {
  const distances = [0];
  for (let i = 1; i < points.length; i++)
    distances.push(distances[i - 1] + distanceMeters(points[i - 1], points[i]));
  return distances;
}
function stopDistance(
  points: Coordinate[],
  distances: number[],
  coordinate: Coordinate,
) {
  let best = Infinity,
    at = 0;
  points.forEach((point, i) => {
    const d = distanceMeters(point, coordinate);
    if (d < best) {
      best = d;
      at = distances[i];
    }
  });
  return at;
}
export function planRoute(
  route: DemoRoute,
  points: Coordinate[],
  from: string,
  to: string,
  classAt: number,
  bufferMinutes: number,
  now: number,
) {
  const a = route.stops.findIndex((s) => s.id === from),
    b = route.stops.findIndex((s) => s.id === to);
  if (a < 0 || b <= a) return null;
  const distances = cumulative(points),
    originDistance = stopDistance(
      points,
      distances,
      route.stops[a].coordinates,
    ),
    destinationDistance = stopDistance(
      points,
      distances,
      route.stops[b].coordinates,
    );
  const rideMinutes = Math.max(
    1,
    Math.ceil(
      ((destinationDistance - originDistance) / (route.speedKmh * 1000)) * 60,
    ),
  );
  const originOffset = Math.ceil(
      (originDistance / (route.speedKmh * 1000)) * 60,
    ),
    originWalkMinutes = 5,
    campusWalkMinutes = to === "mmsu" ? 7 : 3,
    waitMinutes = 5,
    walkMinutes = originWalkMinutes + campusWalkMinutes;
  const deadline = classAt - bufferMinutes * MINUTE,
    latestPickup = deadline - (rideMinutes + campusWalkMinutes) * MINUTE;
  const service = serviceFor(route);
  let departureAt: number | null = null;
  // Include the previous local date for a class just after midnight.
  const localDay = Math.floor((latestPickup + OFFSET) / DAY) * DAY - OFFSET;
  for (const day of [localDay, localDay - DAY]) {
    const first = day + (service.opens + originOffset) * MINUTE,
      last = day + (service.closes + originOffset) * MINUTE;
    const candidate =
      first +
      Math.floor(
        (Math.min(latestPickup, last) - first) / (service.headway * MINUTE),
      ) *
        service.headway *
        MINUTE;
    if (candidate >= first && candidate <= last) {
      departureAt = candidate;
      break;
    }
  }
  if (departureAt === null) return null;
  const leaveAt = departureAt - (originWalkMinutes + waitMinutes) * MINUTE,
    arriveAt = departureAt + (rideMinutes + campusWalkMinutes) * MINUTE;
  if (leaveAt <= now) return null;
  const fare = estimateFare(route, from, to);
  if (!fare) return null;
  return {
    routeId: route.id,
    selectedMode: route.mode,
    departureAt,
    leaveAt,
    arriveAt,
    rideMinutes,
    waitMinutes,
    walkMinutes,
    originWalkMinutes,
    campusWalkMinutes,
    headwayMinutes: service.headway,
    regularFareCentavos: fare.regularCentavos,
    studentFareCentavos: fare.studentCentavos,
    serviceVersion: SERVICE_VERSION,
  };
}
