/**
 * The two verbs the language understands.
 * Add more Indonesian verbs here later (e.g. "retur", "pesan") — see parser.ts's ACTION_MAP.
 */
export type Action = "beli" | "jual";
/**
 * One parsed line of the language.
 */
export interface Transaction {
    action: Action;
    item_name: string;
    quantity: number;
    /** 1-based source line number, useful for error messages / debugging */
    line: number;
}
export interface ParseError {
    line: number;
    message: string;
    raw: string;
}
export interface ParseResult {
    success: boolean;
    data: Transaction[];
    errors: ParseError[];
}
//# sourceMappingURL=types.d.ts.map