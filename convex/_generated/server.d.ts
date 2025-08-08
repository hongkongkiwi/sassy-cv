/* prettier-ignore-start */

/* eslint-disable */
/**
 * Generated server utilities.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import {
  ActionBuilder,
  MutationBuilder,
  QueryBuilder,
  SchemaType,
  TableDefinition,
  DataModelFromSchemaDefinition,
} from "convex/server";
import type schema from "../schema.js";

/**
 * Define a query in this Convex app's public API.
 *
 * This function will be allowed to read your Convex database and will be accessible from the client.
 *
 * @param func - The query function. It receives a `QueryCtx` as its first argument.
 * @returns The wrapped query. Include this as an `export` to add it to your app's API.
 */
export declare const query: QueryBuilder<DataModelFromSchemaDefinition<SchemaType<typeof schema>>, "public">;

/**
 * Define a mutation in this Convex app's public API.
 *
 * This function will be allowed to modify your Convex database and will be accessible from the client.
 *
 * @param func - The mutation function. It receives a `MutationCtx` as its first argument.
 * @returns The wrapped mutation. Include this as an `export` to add it to your app's API.
 */
export declare const mutation: MutationBuilder<DataModelFromSchemaDefinition<SchemaType<typeof schema>>, "public">;

/**
 * Define an action in this Convex app's public API.
 *
 * An action can run any JavaScript code, including non-deterministic
 * code and code with side-effects. Actions can call into third party services.
 * Actions execute in a Node.js environment and can interact with the database
 * indirectly by calling queries and mutations using the provided `runQuery`
 * and `runMutation` functions.
 *
 * @param func - The action function. It receives an `ActionCtx` as its first argument.
 * @returns The wrapped action. Include this as an `export` to add it to your app's API.
 */
export declare const action: ActionBuilder<DataModelFromSchemaDefinition<SchemaType<typeof schema>>, "public">;

/* prettier-ignore-end */