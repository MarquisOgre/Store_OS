export const inr = (n: number, opts: { compact?: boolean } = {}) => {
  if (opts.compact) {
    if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
    if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
    if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  }
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(n))}`;
};

export const num = (n: number) => new Intl.NumberFormat("en-IN").format(n);

export const prettyDate = (iso: string) => {
  const [date] = iso.split(" ");
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const titleCase = (s: string) =>
  s
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
