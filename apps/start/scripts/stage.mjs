import { copyFileSync, cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Copy what `tsc` does not.
 *
 * The preload is CommonJS (a sandboxed preload has no ESM), and the launcher's
 * page is plain HTML, CSS and one script. Neither is TypeScript, so neither is
 * compiled, and this is the whole build step beyond `tsc`.
 */
const root = dirname(fileURLToPath(import.meta.url));
const app = join(root, "..");

mkdirSync(join(app, "dist", "preload"), { recursive: true });
copyFileSync(join(app, "src", "preload", "index.cjs"), join(app, "dist", "preload", "index.cjs"));
cpSync(join(app, "src", "renderer"), join(app, "dist", "renderer"), { recursive: true });
