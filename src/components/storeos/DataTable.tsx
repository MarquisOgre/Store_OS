import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Download, Inbox, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { downloadCsv } from "@/lib/format";
import { toast } from "sonner";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  sortable?: boolean;
  value?: (row: T) => string | number;
  render?: (row: T) => ReactNode;
  className?: string;
}

export interface FilterDef {
  key: string;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

interface DataTableProps<T extends { id: string }> {
  rows: T[];
  columns: Column<T>[];
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  filters?: FilterDef[];
  actions?: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyTitle?: string;
  emptyBody?: string;
  toolbar?: ReactNode;
  exportName?: string;
  pageSize?: number;
  selectable?: boolean;
  bulkActions?: (ids: string[], clear: () => void) => ReactNode;
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  searchText,
  searchPlaceholder = "Search…",
  filters = [],
  actions,
  onRowClick,
  loading = false,
  emptyTitle = "Nothing here yet",
  emptyBody = "Adjust your filters or add a new record to get started.",
  toolbar,
  exportName,
  pageSize = 8,
  selectable = false,
  bulkActions,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);

  const cellValue = (row: T, col: Column<T>) => col.value?.(row) ?? "";

  const filtered = useMemo(() => {
    let out = rows;
    if (query.trim() && searchText) {
      const q = query.toLowerCase();
      out = out.filter((r) => searchText(r).toLowerCase().includes(q));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col) {
        out = [...out].sort((a, b) => {
          const av = cellValue(a, col);
          const bv = cellValue(b, col);
          const res = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
          return sort.dir === "asc" ? res : -res;
        });
      }
    }
    return out;
  }, [rows, query, sort, columns, searchText]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const visible = filtered.slice(current * pageSize, current * pageSize + pageSize);

  const toggleSort = (key: string) =>
    setSort((prev) =>
      prev?.key === key ? (prev.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" },
    );

  const handleExport = () => {
    downloadCsv(
      `${exportName ?? "storeos-export"}.csv`,
      filtered.map((row) =>
        columns.reduce<Record<string, unknown>>((acc, col) => {
          acc[col.header] = col.value ? col.value(row) : "";
          return acc;
        }, {}),
      ),
    );
    toast.success(`Exported ${filtered.length} rows to CSV`);
  };

  return (
    <div className="surface-card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        {searchText && (
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder={searchPlaceholder}
              className="h-9 w-56 bg-card pl-8 text-[13px]"
            />
          </div>
        )}
        {filters.map((f) => (
          <Select
            key={f.key}
            value={f.value}
            onValueChange={(v) => {
              f.onChange(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="h-9 w-auto min-w-[9rem] bg-card text-[13px]">
              <SelectValue placeholder={f.label} />
            </SelectTrigger>
            <SelectContent>
              {f.options.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-[13px]">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {selectable && selected.length > 0 && bulkActions?.(selected, () => setSelected([]))}
          {exportName && (
            <Button variant="outline" size="sm" onClick={handleExport} className="h-9 gap-1.5 bg-card text-[13px]">
              <Download className="size-3.5" /> Export
            </Button>
          )}
          {toolbar}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-muted-foreground border-b border-border text-left text-[11px] tracking-wide uppercase">
              {selectable && (
                <th className="w-9 px-4 py-2.5">
                  <input
                    type="checkbox"
                    className="accent-brand size-3.5"
                    aria-label="Select page"
                    checked={visible.length > 0 && visible.every((r) => selected.includes(r.id))}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...new Set([...selected, ...visible.map((r) => r.id)])]
                          : selected.filter((id) => !visible.some((r) => r.id === id)),
                      )
                    }
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-2.5 font-semibold",
                    col.align === "right" && "text-right",
                    col.sortable && "cursor-pointer select-none",
                  )}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                >
                  <span className={cn("inline-flex items-center gap-1", col.align === "right" && "justify-end")}>
                    {col.header}
                    {col.sortable &&
                      (sort?.key === col.key ? (
                        sort.dir === "asc" ? (
                          <ArrowUp className="size-3" />
                        ) : (
                          <ArrowDown className="size-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3 opacity-40" />
                      ))}
                  </span>
                </th>
              ))}
              {actions && <th className="px-4 py-2.5 text-right font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={columns.length + (actions ? 1 : 0) + (selectable ? 1 : 0)} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                </tr>
              ))}
            {!loading &&
              visible.map((row) => (
                <tr
                  key={row.id}
                  className={cn("hover:bg-brand/5 transition-colors", onRowClick && "cursor-pointer")}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {selectable && (
                    <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="accent-brand size-3.5"
                        aria-label={`Select ${row.id}`}
                        checked={selected.includes(row.id)}
                        onChange={(e) =>
                          setSelected(e.target.checked ? [...selected, row.id] : selected.filter((id) => id !== row.id))
                        }
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-4 py-2.5 align-middle", col.align === "right" && "text-right", col.className)}
                    >
                      {col.render ? col.render(row) : String(cellValue(row, col))}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">{actions(row)}</div>
                    </td>
                  )}
                </tr>
              ))}
            {!loading && visible.length === 0 && (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0) + (selectable ? 1 : 0)} className="px-4 py-14">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="bg-sun grid size-10 place-items-center rounded-full">
                      <Inbox className="text-brand size-4" />
                    </span>
                    <p className="font-display text-[15px]">{emptyTitle}</p>
                    <p className="text-muted-foreground max-w-sm text-[12px]">{emptyBody}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-muted-foreground flex items-center justify-between border-t border-border px-4 py-2.5 text-[12px]">
        <span>
          {filtered.length === 0
            ? "No records"
            : `Showing ${current * pageSize + 1}–${Math.min(filtered.length, (current + 1) * pageSize)} of ${filtered.length}`}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="size-7 bg-card p-0"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            ‹
          </Button>
          {Array.from({ length: pageCount })
            .slice(0, 5)
            .map((_, i) => (
              <Button
                key={i}
                size="sm"
                variant={i === current ? "default" : "outline"}
                className={cn("size-7 p-0", i !== current && "bg-card")}
                onClick={() => setPage(i)}
              >
                {i + 1}
              </Button>
            ))}
          <Button
            variant="outline"
            size="sm"
            className="size-7 bg-card p-0"
            disabled={current >= pageCount - 1}
            onClick={() => setPage(current + 1)}
          >
            ›
          </Button>
        </div>
      </div>
    </div>
  );
}
