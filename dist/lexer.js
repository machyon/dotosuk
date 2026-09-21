/**
 * Splits source code into lines of tokens.
 * - Anything after `#` on a line is treated as a comment and discarded.
 * - Blank / comment-only lines are dropped entirely (they don't reach the parser).
 */
export function tokenize(source) {
    const rawLines = source.split("\n");
    const result = [];
    rawLines.forEach((raw, idx) => {
        const withoutComment = raw.split("#")[0] ?? "";
        const tokens = withoutComment.trim().split(/\s+/).filter(Boolean);
        if (tokens.length === 0)
            return; // skip empty/comment-only lines
        result.push({ line: idx + 1, tokens, raw });
    });
    return result;
}
//# sourceMappingURL=lexer.js.map