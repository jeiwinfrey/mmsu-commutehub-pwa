import {
  commuteRoutes,
  distanceMeters,
  estimateFare,
  modeLabel,
  type Coordinate,
  type DemoRoute,
} from "./commute-catalog";
import type { Vehicle } from "../types/commute";
export const FLEET_VERSION = "roundtrip-v1";
export const TERMINAL_DWELL_SECONDS = 60,
  STOP_DWELL_SECONDS = 20,
  BOARDING_GRACE_SECONDS = 45;
export type StoredRoad = {
  routeId: string;
  points: number[][];
  updatedAt: number;
  source: string;
};
export type FleetActor = {
  key: string;
  routeId: string;
  homeRouteId?: string;
  label: string;
  occupancy: string;
  speedKmh: number;
  phase: number;
  updatedAt: number;
  _creationTime: number;
  scenarioEpoch?: number;
  scenarioOffsetSeconds?: number;
};
export type RunStop = {
  id: string;
  meters: number;
  arriveSeconds: number;
  departSeconds: number;
};
export type RunLeg = {
  route: DemoRoute;
  points: Coordinate[];
  distances: number[];
  stops: RunStop[];
  meters: number;
  seconds: number;
  revision: number;
  source: string;
};
export function fleetNetwork(roads: readonly StoredRoad[]) {
  const network = new Map<string, RunLeg>();
  for (const route of commuteRoutes) {
    const road = roads.find((p) => p.routeId === route.id),
      points = (road?.points ??
        route.stops.map((s) => s.coordinates)) as Coordinate[],
      distances = [0];
    for (let j = 1; j < points.length; j++)
      distances.push(
        distances[j - 1] + distanceMeters(points[j - 1], points[j]),
      );
    let previousIndex = 0,
      previousMeters = 0,
      previousDeparture = 0;
    const stops: RunStop[] = route.stops.map((stop, i) => {
      let best = Infinity,
        index = previousIndex;
      for (let j = previousIndex; j < points.length; j++) {
        const d = distanceMeters(stop.coordinates, points[j]);
        if (d < best) {
          best = d;
          index = j;
        }
      }
      if (i === route.stops.length - 1) index = points.length - 1;
      const meters = i === 0 ? 0 : distances[index];
      const arriveSeconds =
          i === 0
            ? 0
            : previousDeparture +
              (meters - previousMeters) / (route.speedKmh / 3.6),
        departSeconds =
          arriveSeconds +
          (i === 0
            ? TERMINAL_DWELL_SECONDS
            : i === route.stops.length - 1
              ? 0
              : STOP_DWELL_SECONDS);
      previousIndex = index;
      previousMeters = meters;
      previousDeparture = departSeconds;
      return { id: stop.id, meters, arriveSeconds, departSeconds };
    });
    network.set(route.id, {
      route,
      points,
      distances,
      stops,
      meters: distances.at(-1) ?? 1,
      seconds: stops.at(-1)!.arriveSeconds,
      revision: road?.updatedAt ?? 0,
      source: road?.source ?? "schematic",
    });
  }
  return network;
}
export type FleetNetwork = ReturnType<typeof fleetNetwork>;
export function positionAt(leg: RunLeg, meters: number): Coordinate {
  if (meters <= 0) return leg.points[0];
  for (let i = 1; i < leg.points.length; i++) {
    if (leg.distances[i] >= meters) {
      const f =
        (meters - leg.distances[i - 1]) /
        (leg.distances[i] - leg.distances[i - 1] || 1);
      return [
        leg.points[i - 1][0] + (leg.points[i][0] - leg.points[i - 1][0]) * f,
        leg.points[i - 1][1] + (leg.points[i][1] - leg.points[i - 1][1]) * f,
      ];
    }
  }
  return leg.points.at(-1)!;
}
function setup(actor: FleetActor, network: FleetNetwork) {
  const home = network.get(actor.homeRouteId ?? actor.routeId)!;
  const reverse = network.get(
    home.route.id.replace(/outbound|inbound$/, (d) =>
      d === "outbound" ? "inbound" : "outbound",
    ),
  )!;
  const epoch = actor.scenarioEpoch ?? Math.floor(actor._creationTime),
    slot =
      Math.max(0, Number(actor.key.match(/vehicle-(\d+)$/)?.[1] ?? 1) - 1) % 4,
    cycleSeconds = home.seconds + reverse.seconds,
    offset = actor.scenarioOffsetSeconds ?? (slot * cycleSeconds) / 4;
  return {
    home,
    reverse,
    epoch,
    cycleSeconds,
    originAt: epoch - offset * 1000,
    version: `${FLEET_VERSION}:${epoch}:${home.revision}:${reverse.revision}`,
  };
}
export function runAtOrdinal(
  actor: FleetActor,
  network: FleetNetwork,
  ordinal: number,
) {
  const { home, reverse, epoch, originAt, cycleSeconds, version } = setup(
      actor,
      network,
    ),
    cycle = Math.floor(ordinal / 2),
    returning = ordinal % 2 !== 0,
    leg = returning ? reverse : home,
    startAt =
      originAt + (cycle * cycleSeconds + (returning ? home.seconds : 0)) * 1000;
  return {
    leg,
    ordinal,
    startAt,
    endAt: startAt + leg.seconds * 1000,
    id: `${actor.key}:${epoch}:${ordinal}`,
    version,
  };
}
export function runMetersAt(
  run: ReturnType<typeof runAtOrdinal>,
  time: number,
) {
  const elapsed = (time - run.startAt) / 1000;
  for (let j = 0; j < run.leg.stops.length; j++) {
    const stop = run.leg.stops[j];
    if (elapsed <= stop.departSeconds && elapsed >= stop.arriveSeconds)
      return {
        meters: stop.meters,
        speedKmh: 0,
        state: j === 0 ? ("terminal" as const) : ("dwelling" as const),
      };
    const next = run.leg.stops[j + 1];
    if (next && elapsed < next.arriveSeconds)
      return {
        meters: Math.max(
          stop.meters,
          Math.min(
            next.meters,
            stop.meters +
              (Math.max(0, elapsed - stop.departSeconds) *
                run.leg.route.speedKmh) /
                3.6,
          ),
        ),
        speedKmh: run.leg.route.speedKmh,
        state: "moving" as const,
      };
  }
  return { meters: run.leg.meters, speedKmh: 0, state: "terminal" as const };
}
export function projectFleetVehicle<T extends FleetActor>(
  actor: T,
  network: FleetNetwork,
  now: number,
) {
  const { home, originAt, cycleSeconds } = setup(actor, network),
    elapsed = Math.max(0, (now - originAt) / 1000),
    cycle = Math.floor(elapsed / cycleSeconds),
    part = elapsed - cycle * cycleSeconds,
    ordinal = cycle * 2 + (part >= home.seconds ? 1 : 0),
    run = runAtOrdinal(actor, network, ordinal),
    frame = runMetersAt(run, now),
    capacity =
      home.route.mode === "bus"
        ? 45
        : home.route.mode === "modern-jeepney"
          ? 23
          : 20,
    occupancy = (
      ["seats-available", "limited", "full", "unknown"].includes(
        actor.occupancy,
      )
        ? actor.occupancy
        : "unknown"
    ) as Vehicle["occupancy"],
    passengers =
      occupancy === "unknown"
        ? null
        : occupancy === "full"
          ? capacity
          : occupancy === "limited"
            ? capacity - 2
            : Math.floor(capacity * 0.4);
  return {
    ...actor,
    label: `Simulated ${modeLabel(home.route.mode).toLowerCase()} ${(actor.homeRouteId ?? actor.routeId).endsWith("outbound") ? "A" : "B"}${(actor.key.match(/vehicle-(\d+)$/)?.[1] ?? "1").padStart(2, "0")}`,
    homeRouteId: actor.homeRouteId ?? actor.routeId,
    scenarioEpoch: actor.scenarioEpoch ?? Math.floor(actor._creationTime),
    routeId: run.leg.route.id,
    phase: frame.meters / run.leg.meters,
    speedKmh: frame.speedKmh,
    state: frame.state,
    position: positionAt(run.leg, frame.meters),
    runId: run.id,
    runOrdinal: ordinal,
    runStartAt: run.startAt,
    runEndAt: run.endAt,
    runVersion: run.version,
    updatedAt: now,
    occupancy,
    capacity,
    passengers,
  };
}
export function offerForRoute(
  actor: FleetActor,
  network: FleetNetwork,
  routeId: string,
  from: string,
  to: string,
  now: number,
  requestedRunId?: string,
) {
  const current = projectFleetVehicle(actor, network, now);
  for (
    let ordinal = current.runOrdinal;
    ordinal <= current.runOrdinal + 3;
    ordinal++
  ) {
    const run = runAtOrdinal(actor, network, ordinal);
    if (
      run.leg.route.id !== routeId ||
      (requestedRunId && run.id !== requestedRunId)
    )
      continue;
    const a = run.leg.stops.findIndex((s) => s.id === from),
      b = run.leg.stops.findIndex((s) => s.id === to);
    if (a < 0 || b <= a) return null;
    const pickup = run.leg.stops[a],
      destination = run.leg.stops[b],
      pickupArrivesAt = run.startAt + pickup.arriveSeconds * 1000,
      pickupDepartsAt = run.startAt + pickup.departSeconds * 1000;
    if (now > pickupDepartsAt + BOARDING_GRACE_SECONDS * 1000) continue;
    if (
      ordinal === current.runOrdinal &&
      runMetersAt(run, now).meters > pickup.meters + 30
    )
      continue;
    const fare = estimateFare(run.leg.route, from, to);
    if (!fare) return null;
    const group = (actor.homeRouteId ?? actor.routeId).endsWith("outbound")
        ? "A"
        : "B",
      slot = actor.key.match(/vehicle-(\d+)$/)?.[1] ?? "1";
    return {
      id: actor.key,
      routeId,
      runId: run.id,
      runOrdinal: ordinal,
      runVersion: run.version,
      runStartAt: run.startAt,
      runEndAt: run.endAt,
      pickupArrivesAt,
      pickupDepartsAt,
      destinationArrivesAt: run.startAt + destination.arriveSeconds * 1000,
      label: `Simulated ${modeLabel(run.leg.route.mode).toLowerCase()} ${group}${slot.padStart(2, "0")}`,
      mode: run.leg.route.mode,
      etaMinutes: Math.max(0, Math.ceil((pickupArrivesAt - now) / 60000)),
      speedKmh: current.speedKmh,
      occupancy: current.occupancy,
      capacity: current.capacity,
      passengers: current.passengers,
      fare,
      source: "sample" as const,
      scheduled: now < run.startAt,
    };
  }
  return null;
}
