import { tokenize } from "./lexer.js";
/**
 * Grammar (informal):
 *
 *   line      := HEADER | BULLET | statement
 *   statement := (ACTION)? ITEM_NAME QUANTITY
 *   BULLET    := ("*" | "-") statement
 *   HEADER    := <free text ending in ":">
 *   ACTION    := "beli" | "jual"      (case-insensitive)
 *   ITEM_NAME := a single word (no spaces) — see note below to extend this
 *   QUANTITY  := a positive number
 *
 * If ACTION is omitted in a statement, it defaults to whatever "context
 * action" is active: the action of the most recent HEADER, if a run of
 * BULLETs is still in progress — otherwise DEFAULT_ACTION.
 *
 * A HEADER opens a context: bullets right after it (blank lines are
 * ignored — only content matters) inherit its action. The context ends
 * the moment a non-bullet line appears; it does NOT persist past that,
 * and does not require an explicit "end" marker.
 *
 * To recognize more verbs later (e.g. "retur" for returns), just add
 * entries to ACTION_MAP. To recognize more header phrasings, add entries
 * to HEADER_ACTION_PATTERNS.
 */
const ACTION_MAP = {
    beli: "beli",
    jual: "jual",
};
const DEFAULT_ACTION = "jual";
const BULLET_MARKERS = new Set(["*", "-"]);
// Indonesian derives "penjualan" (sales) from "jual" (sell) and
// "pembelian" (purchasing) from "beli" (buy), so a plain substring
// match on the header text is enough to infer intent. Order doesn't
// matter here since the two patterns can't both match the same word.
const HEADER_ACTION_PATTERNS = [
    { pattern: /beli/i, action: "beli" }, // beli, pembelian, dibeli, membeli, ...
    { pattern: /jual/i, action: "jual" }, // jual, penjualan, terjual, menjual, ...
];
function detectHeaderAction(headerText) {
    for (const { pattern, action } of HEADER_ACTION_PATTERNS) {
        if (pattern.test(headerText))
            return action;
    }
    return null;
}
/** Parses "[<aksi>] <nama_barang> <jumlah>" tokens, falling back to contextAction when no verb is given. */
function parseStatement(tokens, contextAction) {
    const maybeAction = ACTION_MAP[(tokens[0] ?? "").toLowerCase()];
    if (maybeAction) {
        if (tokens.length !== 3) {
            return { error: `Expected "${tokens[0]} <nama_barang> <jumlah>", got ${tokens.length} token(s).` };
        }
        const itemName = tokens[1];
        const quantityToken = tokens[2];
        if (itemName === undefined || quantityToken === undefined) {
            return { error: `Expected "${tokens[0]} <nama_barang> <jumlah>", got ${tokens.length} token(s).` };
        }
        return { action: maybeAction, itemName, quantityToken };
    }
    if (tokens.length !== 2) {
        return {
            error: `Expected "<nama_barang> <jumlah>" (optionally prefixed with "beli"/"jual"), got ${tokens.length} token(s).`,
        };
    }
    const itemName = tokens[0];
    const quantityToken = tokens[1];
    if (itemName === undefined || quantityToken === undefined) {
        return {
            error: `Expected "<nama_barang> <jumlah>" (optionally prefixed with "beli"/"jual"), got ${tokens.length} token(s).`,
        };
    }
    return { action: contextAction, itemName, quantityToken };
}
export function parse(source) {
    const data = [];
    const errors = [];
    let mode = { kind: "none" };
    for (const { line, tokens, raw } of tokenize(source)) {
        const firstToken = tokens[0];
        const isBullet = firstToken !== undefined && BULLET_MARKERS.has(firstToken);
        const lastToken = tokens[tokens.length - 1];
        const isHeader = !isBullet && tokens.length > 0 && lastToken !== undefined && /:$/.test(lastToken);
        if (isHeader) {
            const headerText = tokens.join(" ");
            const action = detectHeaderAction(headerText);
            if (action === null) {
                errors.push({ line, raw, message: `Can't tell if this heading means "beli" or "jual": "${headerText}"` });
                mode = { kind: "none" };
            }
            else {
                mode = { kind: "list", action, headerLine: line };
            }
            continue; // a header produces no transaction on its own
        }
        if (!isBullet) {
            // Any non-bullet, non-header line ends whatever context was active.
            mode = { kind: "none" };
        }
        const contentTokens = isBullet ? tokens.slice(1) : tokens;
        const contextAction = mode.kind === "list" ? mode.action : DEFAULT_ACTION;
        const parsed = parseStatement(contentTokens, contextAction);
        if ("error" in parsed) {
            errors.push({ line, raw, message: parsed.error });
            continue;
        }
        const quantity = Number(parsed.quantityToken);
        if (!Number.isFinite(quantity) || quantity <= 0) {
            errors.push({ line, raw, message: `Invalid quantity: "${parsed.quantityToken}"` });
            continue;
        }
        data.push({ action: parsed.action, item_name: parsed.itemName, quantity, line });
    }
    return { success: errors.length === 0, data, errors };
}
//# sourceMappingURL=parser.js.map