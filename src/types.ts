export type Action = "beli" | "jual"; // Sintaks wok :v

export interface Transaction {
  action: Action;
  item_name: string;
  quantity: number;
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
