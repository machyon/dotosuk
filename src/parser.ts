import { tokenize } from "./lexer.js";
import type { Action, ParseResult, Transaction } from "./types.js";

const ACTION_MAP: Record<string, Action> = {
  beli: "beli",
  jual: "jual",
};
const DEFAULT_ACTION: Action = "jual";

const BULLET_MARKERS = new Set(["*", "-"]);

const HEADER_ACTION_PATTERNS: Array<{ pattern: RegExp; action: Action }> = [
  { pattern: /beli/i, action: "beli" }, // beli, pembelian, dibeli, membeli, dll masih bekerja dengan normal
  { pattern: /jual/i, action: "jual" }, // jual, penjualan, terjual, menjual, dll masih bekerja dengan normal
];

type Mode = { kind: "none" } | { kind: "list"; action: Action; headerLine: number };

function detectHeaderAction(headerText: string): Action | null {
  for (const { pattern, action } of HEADER_ACTION_PATTERNS) {
    if (pattern.test(headerText)) return action;
  }
  return null;
}

function parseStatement(
  tokens: string[],
  contextAction: Action
): { action: Action; itemName: string; quantityToken: string } | { error: string } {
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

export function parse(source: string): ParseResult {
  const data: Transaction[] = [];
  const errors: ParseResult["errors"] = [];
  let mode: Mode = { kind: "none" };

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
      } else {
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
