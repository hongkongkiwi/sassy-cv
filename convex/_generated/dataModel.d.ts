/* prettier-ignore-start */

/* eslint-disable */
/**
 * Generated data model types.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import { AnyDataModel } from "convex/server";
import type { DataModelFromSchemaDefinition } from "convex/server";
import type schema from "../schema.js";

/**
 * The names of all of your Convex tables.
 */
export type TableNames = "analytics" | "contactInfo" | "coverLetters" | "education" | "experiences" | "linkedinImports" | "projects" | "skills" | "themes" | "userSettings";

/**
 * The type of a document stored in Convex.
 */
export type Doc<TableName extends TableNames> = DataModelFromSchemaDefinition<typeof schema>[TableName]["document"];

/**
 * The type of an ID for a given Convex table.
 */
export type Id<TableName extends TableNames> = DataModelFromSchemaDefinition<typeof schema>[TableName]["_id"];

/**
 * A type describing your Convex data model.
 */
export type DataModel = DataModelFromSchemaDefinition<typeof schema>;

/* prettier-ignore-end */