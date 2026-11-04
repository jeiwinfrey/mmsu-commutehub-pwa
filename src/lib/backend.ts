export { api } from "../../convex/_generated/api";
export type { Id, Doc } from "../../convex/_generated/dataModel";
export function errorMessage(e: unknown) {
  if (e && typeof e === "object" && "data" in e && typeof e.data === "string")
    return e.data;
  return "Something went wrong. Check your connection and try again.";
}
export const localDate = (timestamp: number) =>
  new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
