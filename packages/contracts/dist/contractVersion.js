/**
 * Version compatibility for the shared vocabulary.
 *
 * A contract change that an older app cannot read is a major bump, and a major
 * bump is a coordinated release: the hub refuses the pair and says so, rather
 * than handing an app a manifest shape it will silently misread.
 *
 * The rules are the usual semver ones, written here rather than taken from a
 * package because the whole surface is a hundred lines and a dependency that
 * every app installs is worse than the hundred lines.
 */
/** The contract version this build of the packages implements. */
export const CONTRACT_VERSION = "1.0.0";
const SEMVER_PATTERN = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/u;
/** Parse a version, or null when it is not semver. */
export function parseSemver(value) {
    const match = SEMVER_PATTERN.exec(value);
    if (!match)
        return null;
    const [, major, minor, patch, prerelease] = match;
    if (major === undefined || minor === undefined || patch === undefined)
        return null;
    return {
        major: Number(major),
        minor: Number(minor),
        patch: Number(patch),
        prerelease: prerelease ?? null,
    };
}
function comparePrerelease(left, right) {
    const leftParts = left.split(".");
    const rightParts = right.split(".");
    const length = Math.max(leftParts.length, rightParts.length);
    for (let index = 0; index < length; index += 1) {
        const a = leftParts[index];
        const b = rightParts[index];
        // A shorter identifier list is lower than a longer one with the same prefix.
        if (a === undefined)
            return -1;
        if (b === undefined)
            return 1;
        const aNumeric = /^\d+$/u.test(a);
        const bNumeric = /^\d+$/u.test(b);
        if (aNumeric && bNumeric) {
            const difference = Number(a) - Number(b);
            if (difference !== 0)
                return difference < 0 ? -1 : 1;
            continue;
        }
        // Numeric identifiers always sort below alphanumeric ones.
        if (aNumeric)
            return -1;
        if (bNumeric)
            return 1;
        if (a !== b)
            return a < b ? -1 : 1;
    }
    return 0;
}
/** Standard semver ordering: negative when `left` precedes `right`. */
export function compareSemver(left, right) {
    if (left.major !== right.major)
        return left.major < right.major ? -1 : 1;
    if (left.minor !== right.minor)
        return left.minor < right.minor ? -1 : 1;
    if (left.patch !== right.patch)
        return left.patch < right.patch ? -1 : 1;
    // A release outranks any prerelease of the same version.
    if (left.prerelease === null && right.prerelease === null)
        return 0;
    if (left.prerelease === null)
        return 1;
    if (right.prerelease === null)
        return -1;
    return comparePrerelease(left.prerelease, right.prerelease);
}
/**
 * Whether a thing that requires `required` can run against `available`.
 *
 * Same major and `required <= available`. A newer minor is additive by
 * definition, so an app that asks for 1.2.0 runs on 1.4.0; an app that asks for
 * 2.0.0 does not, whatever is available in the 1.x line.
 */
export function isContractCompatible(required, available = CONTRACT_VERSION) {
    const needed = parseSemver(required);
    const offered = parseSemver(available);
    if (!needed || !offered)
        return false;
    if (needed.major !== offered.major)
        return false;
    return compareSemver(needed, offered) <= 0;
}
//# sourceMappingURL=contractVersion.js.map