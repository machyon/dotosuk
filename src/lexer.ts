export interface TokenLine {
  // Baris Kode
  line: number;
  /** whitespace-separated tokens, comment already stripped */
  tokens: string[];
  /** the original, untouched line text (for error messages) */
  raw: string;
}

export function tokenize(source: string): TokenLine[] {
  const rawLines = source.split("\n");
  const result: TokenLine[] = [];

  rawLines.forEach((raw, idx) => {
    const withoutComment = raw.split("#")[0] ?? ""; // Pisahin comment
    const tokens = withoutComment.trim().split(/\s+/).filter(Boolean); // Filter space kosong

    if (tokens.length === 0) return;

    result.push({ line: idx + 1, tokens, raw });
  });

  return result;
}
