import { join } from "node:path";
export function resolveAppIcon(options) {
    const exists = options.exists ?? (() => true);
    const candidate = options.isPackaged
        ? join(options.resourcesPath, "icons", `${options.id}.png`)
        : join(options.appPath, "build", "app-icons", `${options.id}.png`);
    return exists(candidate) ? candidate : null;
}
//# sourceMappingURL=appIconFile.js.map