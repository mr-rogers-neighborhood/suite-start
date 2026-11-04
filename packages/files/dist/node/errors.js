export class FileMechanicsError extends Error {
    code;
    path;
    constructor(code, path, cause) {
        super(`${code}: ${path}`, cause === undefined ? undefined : { cause });
        this.name = "FileMechanicsError";
        this.code = code;
        this.path = path;
    }
}
//# sourceMappingURL=errors.js.map