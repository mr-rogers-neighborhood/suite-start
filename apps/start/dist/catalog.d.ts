import { type SuiteReleaseCatalog } from "@suite/contracts";
/**
 * The release catalog, read from a file the operator names.
 *
 * Nothing here reaches the network: a catalog is a document on disk, and a
 * malformed one is refused by field name rather than trusted. Three states, and
 * "none" is a state rather than a default, because "no catalog configured" is
 * true and "up to date" would not be.
 */
export type CatalogRead = {
    readonly state: "none";
} | {
    readonly state: "configured";
    readonly path: string;
    readonly catalog: SuiteReleaseCatalog;
} | {
    readonly state: "refused";
    readonly path: string;
    readonly reason: string;
};
/** Only reading a file is needed, so the port is one method. */
export interface CatalogFileSystem {
    readonly readText: (path: string) => Promise<string>;
}
/** The path named by `SUITE_START_CATALOG`, or null when none is named. */
export declare function catalogPathFromEnv(env?: NodeJS.ProcessEnv): string | null;
export declare function readCatalog(path: string | null, fileSystem: CatalogFileSystem): Promise<CatalogRead>;
//# sourceMappingURL=catalog.d.ts.map