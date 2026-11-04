import { distanceMeters, type Coordinate } from "../../src/lib/commute-catalog";
function cumulative(points: Coordinate[]) {
  const lengths = [0];
  for (let i = 1; i < points.length; i++)
    lengths.push(lengths[i - 1] + distanceMeters(points[i - 1], points[i]));
  return lengths;
}
function at(
  points: Coordinate[],
  lengths: number[],
  meters: number,
): Coordinate {
  for (let i = 1; i < points.length; i++)
    if (lengths[i] >= meters) {
      const f = (meters - lengths[i - 1]) / (lengths[i] - lengths[i - 1] || 1);
      return [
        points[i - 1][0] + (points[i][0] - points[i - 1][0]) * f,
        points[i - 1][1] + (points[i][1] - points[i - 1][1]) * f,
      ];
    }
  return points.at(-1)!;
}
function segmentDistance(a: Coordinate, b: Coordinate, p: Coordinate) {
  const scale = Math.cos((p[1] * Math.PI) / 180),
    dx = (b[0] - a[0]) * scale,
    dy = b[1] - a[1],
    px = (p[0] - a[0]) * scale,
    py = p[1] - a[1],
    f = Math.max(
      0,
      Math.min(1, (px * dx + py * dy) / (dx * dx + dy * dy || 1)),
    );
  return distanceMeters(
    [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f],
    p,
  );
}
/** Check the travelled road segments, including a wrap, so 15s ticks cannot skip a small radius. */
export function sweptDistance(
  points: Coordinate[],
  previousPhase: number,
  nextPhase: number,
  target: Coordinate,
) {
  const lengths = cumulative(points),
    total = lengths.at(-1) ?? 0;
  if (!total) return distanceMeters(points[0], target);
  const start = previousPhase * total,
    end = nextPhase * total;
  const ranges =
    end < start
      ? [
          [start, total],
          [0, end],
        ]
      : [[start, end]];
  let minimum = Infinity;
  for (const [from, to] of ranges) {
    const travelled = [
      at(points, lengths, from),
      ...points.filter((_, i) => lengths[i] > from && lengths[i] < to),
      at(points, lengths, to),
    ];
    for (let i = 1; i < travelled.length; i++)
      minimum = Math.min(
        minimum,
        segmentDistance(travelled[i - 1], travelled[i], target),
      );
  }
  return minimum;
}
