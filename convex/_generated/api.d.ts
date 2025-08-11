/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as analytics from "../analytics.js";
import type * as collaboration from "../collaboration.js";
import type * as coverLetters from "../coverLetters.js";
import type * as cv from "../cv.js";
import type * as linkedinImport from "../linkedinImport.js";
import type * as privacy from "../privacy.js";
import type * as rateLimiting from "../rateLimiting.js";
import type * as themes from "../themes.js";
import type * as themesAndTemplates from "../themesAndTemplates.js";
import type * as versioning from "../versioning.js";
import type * as workspaces from "../workspaces.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  collaboration: typeof collaboration;
  coverLetters: typeof coverLetters;
  cv: typeof cv;
  linkedinImport: typeof linkedinImport;
  privacy: typeof privacy;
  rateLimiting: typeof rateLimiting;
  themes: typeof themes;
  themesAndTemplates: typeof themesAndTemplates;
  versioning: typeof versioning;
  workspaces: typeof workspaces;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
