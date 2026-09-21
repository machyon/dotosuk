export interface TokenLine {
    /** 1-based line number in the original source */
    line: number;
    /** whitespace-separated tokens, comment already stripped */
    tokens: string[];
    /** the original, untouched line text (for error messages) */
    raw: string;
}
/**
 * Splits source code into lines of tokens.
 * - Anything after `#` on a line is treated as a comment and discarded.
 * - Blank / comment-only lines are dropped entirely (they don't reach the parser).
 */
export declare function tokenize(source: string): TokenLine[];
//# sourceMappingURL=lexer.d.ts.map