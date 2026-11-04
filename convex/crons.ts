import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
const crons = cronJobs();
crons.interval(
  "Simulated corridor operations",
  { seconds: 10 },
  internal.vehicles.tick,
  {},
);
crons.daily(
  "Bounded notification and report retention",
  { hourUTC: 18, minuteUTC: 15 },
  internal.retention.clean,
  {},
);
export default crons;
