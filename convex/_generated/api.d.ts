/* prettier-ignore-start */

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
  filteredFunctionReference,
  FunctionReference,
} from "convex/server";
import type * as analytics from "../analytics.js";
import type * as coverLetters from "../coverLetters.js";
import type * as cv from "../cv.js";
import type * as linkedinImport from "../linkedinImport.js";
import type * as themes from "../themes.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage for example:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  coverLetters: typeof coverLetters;
  cv: typeof cv;
  linkedinImport: typeof linkedinImport;
  themes: typeof themes;
}>;
export declare const api: typeof fullApi;

/* prettier-ignore-end */