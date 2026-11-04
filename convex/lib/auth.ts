import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "../_generated/server";
export async function user(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Sign in to continue.");
  return identity;
}
export function text(value: string, min: number, max: number, label: string) {
  const t = value.trim();
  if (t.length < min || t.length > max)
    throw new ConvexError(`${label} must be ${min}–${max} characters.`);
  return t;
}
