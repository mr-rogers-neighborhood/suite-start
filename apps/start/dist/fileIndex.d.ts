import type { SuiteAppEntry } from "@suite/contracts";
/**
 * The index of every app's documents.
 *
 * Start lists files; it does not own them. No name, no pin and no last-board is
 * stored here, because a second list that disagrees with the app's own would be
 * worse than no list at all. Opening a file is the only thing a row offers.
 *
 * The filesystem is a port, so the rules below are a test rather than a fixture
 * directory, and the read is per folder and top level only: a person with
 * thousands of files pays for names and stats, not for a walk.
 */
/** Enough rows to be useful and few enough to render without a virtual list. */
export declare const INDEX_LIMIT = 500;
export interface IndexedFile {
    readonly path: string;
    readonly name: string;
    readonly appId: string;
    readonly appName: string;
    /** The app's folder under the documents root, for the row's second line. */
    readonly folder: string;
    readonly modifiedAt: number;
    /** False when the app that claims this extension is not installed. */
    readonly installed: boolean;
}
export interface IndexFileSystem {
    /** File names directly inside `path`. A folder that is not there is an error. */
    readonly listFiles: (path: string) => Promise<readonly string[]>;
    readonly modifiedAt: (path: string) => Promise<number>;
}
export interface DocumentsFolder {
    readonly app: SuiteAppEntry;
    readonly path: string;
}
/**
 * Name, app, folder and modification time for every matching file.
 *
 * A folder that does not exist yet is normal on a fresh machine, so it is
 * skipped rather than reported: an empty index is the truth, not a failure.
 */
export declare function indexDocuments(folders: readonly DocumentsFolder[], fileSystem: IndexFileSystem, installedAppIds: ReadonlySet<string>): Promise<readonly IndexedFile[]>;
/**
 * Whether a path the page asked to open is inside one of the indexed folders.
 *
 * `openFile` is the one channel that takes a path, and this is the guard: the
 * page may only ask for something Start itself just listed.
 */
export declare function isInsideDocuments(path: string, folders: readonly string[]): boolean;
//# sourceMappingURL=fileIndex.d.ts.map