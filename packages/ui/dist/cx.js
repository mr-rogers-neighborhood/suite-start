export function cx(...values) {
    const out = [];
    for (const value of values) {
        if (value === false || value === null || value === undefined)
            continue;
        if (typeof value === "string") {
            if (value.length > 0)
                out.push(value);
            continue;
        }
        if (Array.isArray(value)) {
            const nested = cx(...value);
            if (nested.length > 0)
                out.push(nested);
            continue;
        }
        for (const [key, on] of Object.entries(value))
            if (on === true)
                out.push(key);
    }
    return out.join(" ");
}
//# sourceMappingURL=cx.js.map