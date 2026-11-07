import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { SuiteHub } from "@suite/contracts";

/**
 * Write the hub's report about itself.
 *
 * Through a temporary file, because a reader may open it at any moment and half a JSON
 * document is not a document. A failed write is logged by the caller rather than thrown: not
 * being able to tell other apps where the hub is must not stop the hub from running.
 */
export async function writeHubReport(path: string, report: SuiteHub): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  await writeFile(temporary, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o644 });
  await rename(temporary, path);
}
