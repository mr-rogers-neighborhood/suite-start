import type { IndexFileSystem } from "./fileIndex.js";
import type { RegistryFileSystem } from "./registry.js";
/**
 * The real filesystem behind the two ports.
 *
 * Small on purpose: discovery needs to list a directory and read one file, the
 * index needs the files in a folder and their times. Keeping it to that is what
 * lets the hub's rules be tested without touching a disk.
 */
export declare function nodeRegistryFileSystem(): RegistryFileSystem & IndexFileSystem;
/** Where an install's directory roots live for this platform. */
export declare function defaultRoots(home: string, platform: NodeJS.Platform): readonly string[];
//# sourceMappingURL=nodeFileSystem.d.ts.map