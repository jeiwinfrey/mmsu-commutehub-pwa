import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
const crons = cronJobs();
crons.interval(
  "Simulated corridor operations",
  { seconds: 15 },
  internal.vehicles.tick,
  {},
);
export default crons;
