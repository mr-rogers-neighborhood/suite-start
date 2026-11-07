import type { SuiteHub } from "@suite/contracts";
/**
 * Write the hub's report about itself.
 *
 * Through a temporary file, because a reader may open it at any moment and half a JSON
 * document is not a document. A failed write is logged by the caller rather than thrown: not
 * being able to tell other apps where the hub is must not stop the hub from running.
 */
export declare function writeHubReport(path: string, report: SuiteHub): Promise<void>;
//# sourceMappingURL=hubReport.d.ts.map