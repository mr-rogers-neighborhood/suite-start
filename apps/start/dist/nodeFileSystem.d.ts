import type { RegistryFileSystem } from "./registry.js";
/**
 * The real filesystem behind the registry port.
 *
 * Small on purpose: discovery needs to list a directory and read one file, and
 * keeping it to that is what lets the launcher's rules be tested without
 * touching a disk.
 */
export declare function nodeRegistryFileSystem(): RegistryFileSystem;
/** Where an install's directory roots live for this platform. */
export declare function defaultRoots(home: string, platform: NodeJS.Platform): readonly string[];
//# sourceMappingURL=nodeFileSystem.d.ts.map