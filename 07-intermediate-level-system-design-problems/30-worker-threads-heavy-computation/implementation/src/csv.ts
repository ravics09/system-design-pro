export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

/** Minimal CSV parser (comma-separated, first row = headers). Pure + testable. */
export function parseCsv(text: string): ParsedCsv {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(',');
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = (cells[i] ?? '').trim()));
    return row;
  });
  return { headers, rows };
}

/** Sum a numeric column (the "heavy" aggregation we offload to a worker). */
export function sumColumn(parsed: ParsedCsv, column: string): number {
  return parsed.rows.reduce((total, row) => total + (Number(row[column]) || 0), 0);
}
