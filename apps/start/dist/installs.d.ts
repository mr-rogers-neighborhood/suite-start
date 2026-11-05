import type { InstallRecord } from "./registry.js";
/**
 * The installs Start knows about.
 *
 * A record is the only place an executable path lives. A manifest cannot name
 * one, so a tampered manifest cannot redirect a launch; the worst it can do is
 * describe itself wrongly, and discovery refuses an id that has no record.
 *
 * `installs.json` sits in the data directory, under Start's own name, because it
 * is Start's knowledge rather than any app's.
 */
export declare const REGISTRY_FILENAME = "installs.json";
export interface RegistryStore {
    readonly path: string;
    list(): Promise<readonly InstallRecord[]>;
    add(record: InstallRecord): Promise<void>;
    remove(id: string): Promise<void>;
}
export declare function registryStore(dataDirectory: string): RegistryStore;
//# sourceMappingURL=installs.d.ts.map