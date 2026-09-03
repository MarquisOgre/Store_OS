import { useState, type ReactNode } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "./PageHeader";
import { DataTable, type Column, type FilterDef } from "./DataTable";
import { ConfirmDialog } from "./ConfirmDialog";
import { RecordFormDialog, type FieldDef, type FormValues } from "./RecordFormDialog";

interface ResourcePageProps<T extends { id: string }> {
  title: string;
  subtitle?: string;
  singular: string;
  rows: T[];
  columns: Column<T>[];
  fields: FieldDef[];
  searchText?: (row: T) => string;
  filters?: FilterDef[];
  toValues?: (row: T) => FormValues;
  onCreate: (values: FormValues) => void;
  onUpdate: (row: T, values: FormValues) => void;
  onDelete: (row: T) => void;
  labelOf: (row: T) => string;
  rowActions?: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
  headerActions?: ReactNode;
  exportName?: string;
  children?: ReactNode;
  pageSize?: number;
}

export function ResourcePage<T extends { id: string }>({
  title,
  subtitle,
  singular,
  rows,
  columns,
  fields,
  searchText,
  filters,
  toValues,
  onCreate,
  onUpdate,
  onDelete,
  labelOf,
  rowActions,
  onRowClick,
  headerActions,
  exportName,
  children,
  pageSize,
}: ResourcePageProps<T>) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            {headerActions}
            <Button onClick={() => setCreating(true)} className="gap-1.5">
              <Plus className="size-4" /> New {singular}
            </Button>
          </>
        }
      />

      {children}

      <DataTable
        rows={rows}
        columns={columns}
        searchText={searchText}
        filters={filters}
        exportName={exportName}
        onRowClick={onRowClick}
        pageSize={pageSize}
        emptyTitle={`No ${singular.toLowerCase()} records`}
        emptyBody={`Create your first ${singular.toLowerCase()} or clear the active filters.`}
        actions={(row) => (
          <>
            {rowActions?.(row)}
            <Button variant="ghost" size="sm" className="size-7 p-0" onClick={() => setEditing(row)} title="Edit">
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-coral hover:text-coral size-7 p-0"
              onClick={() => setDeleting(row)}
              title="Delete"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </>
        )}
      />

      <RecordFormDialog
        open={creating}
        onOpenChange={setCreating}
        title={`New ${singular}`}
        description={`Fields marked * are required. This is demo data held in memory.`}
        fields={fields}
        allowSaveAndAdd
        onSubmit={(values) => {
          onCreate(values);
          toast.success(`${singular} created`);
        }}
      />

      <RecordFormDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        title={`Edit ${singular}`}
        fields={fields}
        initial={editing && toValues ? toValues(editing) : undefined}
        submitLabel="Save changes"
        onSubmit={(values) => {
          if (editing) {
            onUpdate(editing, values);
            toast.success(`${singular} updated`);
          }
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${singular.toLowerCase()}?`}
        description={
          deleting ? `“${labelOf(deleting)}” will be removed from the demo dataset. This cannot be undone.` : ""
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleting) {
            onDelete(deleting);
            toast.success(`${singular} deleted`);
            setDeleting(null);
          }
        }}
      />
    </div>
  );
}
