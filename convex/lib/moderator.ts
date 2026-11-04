import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import { user } from "./auth";
/** Server deployment configuration only. Never infer privileges from profile/email. */
export function isModerator(subject: string) {
  return (process.env.MODERATOR_SUBJECTS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .includes(subject);
}
export async function moderator(ctx: QueryCtx | MutationCtx) {
  const identity = await user(ctx);
  if (!isModerator(identity.subject))
    throw new ConvexError("Moderator access required.");
  return identity;
}
