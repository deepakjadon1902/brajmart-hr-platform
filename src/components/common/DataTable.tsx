import { ReactNode, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  className?: string;
  render?: (row: T) => ReactNode;
}

interface Props<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchKeys?: (keyof T)[];
  emptyMessage?: string;
  toolbar?: ReactNode;
}

export function DataTable<T extends { id: string | number }>({
  data, columns, pageSize = 8, searchKeys, emptyMessage = "No records found", toolbar,
}: Props<T>) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!q || !searchKeys?.length) return data;
    const lower = q.toLowerCase();
    return data.filter((r) => searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(lower)));
  }, [data, q, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {searchKeys?.length ? (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search..." className="pl-9 bg-card" />
          </div>
        ) : null}
        <div className="ml-auto flex items-center gap-2">{toolbar}</div>
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th key={String(c.key)} className={cn("px-4 py-3 text-left font-medium", c.className)}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">{emptyMessage}</td></tr>
            ) : rows.map((row) => (
              <tr key={String(row.id)} className="border-t hover:bg-muted/30 transition-colors">
                {columns.map((c) => (
                  <td key={String(c.key)} className={cn("px-4 py-3", c.className)}>
                    {c.render ? c.render(row) : String((row as any)[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{filtered.length} records</span>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
          <span className="px-2">Page {page} of {totalPages}</span>
          <Button size="icon" variant="ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
