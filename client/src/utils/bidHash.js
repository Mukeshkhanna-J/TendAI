import { sha256 } from "js-sha256";

/**
 * Canonical string form of a bid amount.
 *
 * The commitment stored on-chain is sha256 of this exact string, so every place
 * that hashes an amount must normalise it the same way. Keep in sync with
 * `server/src/utils/bidHash.js`.
 */
export function canonicalAmount(amount) {
    return String(Number(amount));
}

/**
 * 0x-prefixed sha256 commitment for a bid amount (bytes32 on-chain).
 */
export function computeCommitHash(amount) {
    return `0x${sha256(canonicalAmount(amount))}`;
}

/**
 * Case-insensitive comparison of two 0x hex hashes.
 */
export function hashesMatch(a, b) {
    if (!a || !b) return false;
    return String(a).toLowerCase() === String(b).toLowerCase();
}

/**
 * Shorten a hash for table display: 0x1234...abcd
 */
export function shortHash(value, lead = 10, tail = 8) {
    if (!value) return "—";
    const text = String(value);
    if (text.length <= lead + tail + 3) return text;
    return `${text.slice(0, lead)}…${text.slice(-tail)}`;
}
