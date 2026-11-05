import { type SuiteAppName, type SuitePathOptions } from "./paths.js";
/**
 * The apps the suite knows how to list, and where each keeps its files.
 *
 * Start lists a planner's documents without importing a line of planner: the
 * table says which folder belongs to which app and which extension it claims.
 * That is the whole reason it exists, and the reason nothing here is a store.
 *
 * The folder is the display name `suitePaths` already uses under
 * `~/Documents/Suite`, so the table and the path convention cannot disagree
 * without failing a test.
 */
export interface SuiteAppEntry {
    /** The manifest id, which is also the deep-link host. */
    readonly id: string;
    /** What a person calls the app. */
    readonly name: string;
    /** The folder under the documents root: `~/Documents/Suite/<folder>`. */
    readonly folder: SuiteAppName;
    /** The file extension the app claims, lower-case and without the dot. */
    readonly extension: string;
}
export declare const SUITE_APPS: readonly [{
    readonly id: "canvas";
    readonly name: "Canvas";
    readonly folder: "Canvas";
    readonly extension: "canvas";
}, {
    readonly id: "planner";
    readonly name: "Planner";
    readonly folder: "Planner";
    readonly extension: "planner";
}, {
    readonly id: "budget";
    readonly name: "Budget";
    readonly folder: "Budget";
    readonly extension: "budget";
}];
/** One app id from the table. */
export type SuiteDocumentAppId = (typeof SUITE_APPS)[number]["id"];
/**
 * The root every app's documents folder sits under.
 *
 * An override exists for a test and a portable install. It is never read from a
 * document, so no file can steer where Start looks.
 */
export declare function suiteDocumentsRoot(platform: string, home: string, rootOverride?: string | undefined): string;
export interface SuiteAppDocumentsOptions extends SuitePathOptions {
    /** Replaces the documents root, keeping each app's folder under it. */
    readonly rootOverride?: string | undefined;
}
/** One app's documents folder, with the root and the folder resolved together. */
export declare function appDocumentsFolder(entry: Pick<SuiteAppEntry, "folder">, options: SuiteAppDocumentsOptions): string;
//# sourceMappingURL=suiteApps.d.ts.map