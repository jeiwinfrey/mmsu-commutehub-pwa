/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accountDeletion from "../accountDeletion.js";
import type * as accounts from "../accounts.js";
import type * as community from "../community.js";
import type * as crons from "../crons.js";
import type * as delivery from "../delivery.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_geometry from "../lib/geometry.js";
import type * as lib_moderator from "../lib/moderator.js";
import type * as lib_planOptions from "../lib/planOptions.js";
import type * as lib_planning from "../lib/planning.js";
import type * as lib_reports from "../lib/reports.js";
import type * as lib_tripLifecycle from "../lib/tripLifecycle.js";
import type * as moderation from "../moderation.js";
import type * as notifications from "../notifications.js";
import type * as planner from "../planner.js";
import type * as push from "../push.js";
import type * as retention from "../retention.js";
import type * as trips from "../trips.js";
import type * as vehicles from "../vehicles.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accountDeletion: typeof accountDeletion;
  accounts: typeof accounts;
  community: typeof community;
  crons: typeof crons;
  delivery: typeof delivery;
  "lib/auth": typeof lib_auth;
  "lib/geometry": typeof lib_geometry;
  "lib/moderator": typeof lib_moderator;
  "lib/planOptions": typeof lib_planOptions;
  "lib/planning": typeof lib_planning;
  "lib/reports": typeof lib_reports;
  "lib/tripLifecycle": typeof lib_tripLifecycle;
  moderation: typeof moderation;
  notifications: typeof notifications;
  planner: typeof planner;
  push: typeof push;
  retention: typeof retention;
  trips: typeof trips;
  vehicles: typeof vehicles;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
