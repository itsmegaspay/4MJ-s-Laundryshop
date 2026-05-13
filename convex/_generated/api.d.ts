/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as alertSystem from "../alertSystem.js";
import type * as analytics from "../analytics.js";
import type * as auditLogs from "../auditLogs.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as customers from "../customers.js";
import type * as http from "../http.js";
import type * as laundryOrders from "../laundryOrders.js";
import type * as laundryOrdersQueries from "../laundryOrdersQueries.js";
import type * as pricingConfig from "../pricingConfig.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  alertSystem: typeof alertSystem;
  analytics: typeof analytics;
  auditLogs: typeof auditLogs;
  auth: typeof auth;
  crons: typeof crons;
  customers: typeof customers;
  http: typeof http;
  laundryOrders: typeof laundryOrders;
  laundryOrdersQueries: typeof laundryOrdersQueries;
  pricingConfig: typeof pricingConfig;
  users: typeof users;
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
