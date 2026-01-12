"use client";

import * as React from "react";
import { api } from "@/lib/api";
import { DataTable, Column, FormDialog, FormField, DeleteDialog } from "@/components/crud";
import { useApi, useMutation } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

interface GeneralItem {
  id: number;
  item_code: string;
  name: string;
  category: string;
  description?: string | null;
  unit_name: string;
  quantity_on_hand: number;
  min_quantity?: number | null;
  max_quantity?: number | null;
  unit_cost?: number | null;
  storage_location?: string | null;
  status: string;
  created_at: string;
  updated_at?: string | null;
}

type GeneralItemCreate = Omit<GeneralItem, "id" | "created_at" | "updated_at">;
type GeneralItemUpdate = Partial<GeneralItemCreate>;

const itemColumns: Column<GeneralItem>[] = [
  { key: "item_code", header: "Code", width: "100px" },
  { key: "name", header: "Item Name" },
  { key: "category", header: "Category" },
  { key: "quantity_on_hand", header: "Qty", width: "80px",
    render: (value, row) => {
      const qty = Number(value) || 0;
      const min = row.min_quantity || 0;
      const isLow = min > 0 && qty <= min;
      return (
        <span className={isLow ? "text-destructive font-medium" : ""}>
          {qty} {row.unit_name}
          {isLow && <AlertTriangle className="h-3 w-3 inline ml-1" />}
        </span>
      );
    }
  },
  { key: "min_quantity", header: "Min", width: "60px" },
  { key: "storage_location", header: "Location" },
  { key: "unit_cost", header: "Unit Cost", width: "90px",
    render: (value) => value ? `$${Number(value).toFixed(2)}` : "-"
  },
  { key: "status", header: "Status", width: "100px",
    render: (value) => {
      const status = String(value || "active").toLowerCase();
      const variant = status === "active" ? "default" : status === "discontinued" ? "destructive" : "secondary";
      return <Badge variant={variant}>{String(value)}</Badge>;
    }
  },
];

const categories = [
  { value: "uniform", label: "Uniforms" },
  { value: "equipment", label: "Equipment" },
  { value: "office", label: "Office Supplies" },
  { value: "safety", label: "Safety Gear" },
  { value: "tools", label: "Tools" },
  { value: "consumables", label: "Consumables" },
  { value: "other", label: "Other" },
];

const units = [
  { value: "pcs", label: "Pieces" },
  { value: "sets", label: "Sets" },
  { value: "pairs", label: "Pairs" },
  { value: "boxes", label: "Boxes" },
  { value: "kg", label: "Kilograms" },
  { value: "liters", label: "Liters" },
  { value: "meters", label: "Meters" },
];

const statuses = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "discontinued", label: "Discontinued" },
];

const itemFormFields: FormField[] = [
  { name: "item_code", label: "Item Code", required: true, placeholder: "e.g., GEN-001" },
  { name: "name", label: "Item Name", required: true, placeholder: "Enter item name" },
  { name: "category", label: "Category", type: "select", required: true, options: categories },
  { name: "unit_name", label: "Unit", type: "select", required: true, options: units },
  { name: "quantity_on_hand", label: "Quantity", type: "number", required: true, min: 0 },
  { name: "min_quantity", label: "Min Quantity", type: "number", min: 0, helperText: "Alert when below" },
  { name: "max_quantity", label: "Max Quantity", type: "number", min: 0 },
  { name: "unit_cost", label: "Unit Cost ($)", type: "number", min: 0, step: 0.01 },
  { name: "storage_location", label: "Storage Location", placeholder: "e.g., Warehouse A, Shelf 3" },
  { name: "status", label: "Status", type: "select", required: true, options: statuses },
  { name: "description", label: "Description", type: "textarea", colSpan: 2, rows: 2 },
];

export default function GeneralInventoryPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  
  const [formOpen, setFormOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<GeneralItem | null>(null);
  const [formMode, setFormMode] = React.useState<"create" | "edit" | "view">("create");
  const [formError, setFormError] = React.useState<string | null>(null);

  const { data, loading, error, refetch } = useApi<{ items: GeneralItem[]; total: number }>(
    "/api/general-inventory/items",
    { skip: (page - 1) * pageSize, limit: pageSize, search: search || undefined }
  );

  const { data: summaryData, refetch: refetchSummary } = useApi<{
    total_items: number;
    total_value: number;
    low_stock_count: number;
    out_of_stock_count: number;
  }>("/api/general-inventory/summary");

  const createMutation = useMutation(
    (data: GeneralItemCreate) => api.post<GeneralItem>("/api/general-inventory/items", data),
    { onSuccess: () => { setFormOpen(false); refetch(); refetchSummary(); }, onError: (e) => setFormError(e.message) }
  );

  const updateMutation = useMutation(
    ({ item_code, data }: { item_code: string; data: GeneralItemUpdate }) => api.put<GeneralItem>(`/api/general-inventory/items/${item_code}`, data),
    { onSuccess: () => { setFormOpen(false); refetch(); refetchSummary(); }, onError: (e) => setFormError(e.message) }
  );

  const deleteMutation = useMutation(
    (item_code: string) => api.del<void>(`/api/general-inventory/items/${item_code}`),
    { onSuccess: () => { setDeleteOpen(false); setSelectedItem(null); refetch(); refetchSummary(); } }
  );

  const handleAdd = () => { setSelectedItem(null); setFormMode("create"); setFormError(null); setFormOpen(true); };
  const handleEdit = (item: GeneralItem) => { setSelectedItem(item); setFormMode("edit"); setFormError(null); setFormOpen(true); };
  const handleView = (item: GeneralItem) => { setSelectedItem(item); setFormMode("view"); setFormOpen(true); };
  const handleDelete = (item: GeneralItem) => { setSelectedItem(item); setDeleteOpen(true); };

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    setFormError(null);
    if (formMode === "create") await createMutation.mutate(values as GeneralItemCreate);
    else if (formMode === "edit" && selectedItem) await updateMutation.mutate({ item_code: selectedItem.item_code, data: values as GeneralItemUpdate });
  };

  console.log("data", data);
  const items: GeneralItem[] = Array.isArray(data) ? data : (data?.items || []);

  const total = summaryData?.total_items ?? (Array.isArray(data) ? data.length : (data?.total || 0));
  const lowStockCount = summaryData?.low_stock_count ?? 0;
  const outOfStockCount = summaryData?.out_of_stock_count ?? 0;
  const totalValue = summaryData?.total_value ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">General Inventory</h2>
        <p className="text-muted-foreground">Manage general inventory items and stock levels.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-primary" />
            <div><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">Total Items</p></div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <div><p className="text-2xl font-bold">${totalValue.toFixed(2)}</p><p className="text-xs text-muted-foreground">Total Value</p></div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <TrendingDown className="h-5 w-5 text-yellow-500" />
            <div><p className="text-2xl font-bold">{lowStockCount}</p><p className="text-xs text-muted-foreground">Low Stock</p></div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div><p className="text-2xl font-bold">{outOfStockCount}</p><p className="text-xs text-muted-foreground">Out of Stock</p></div>
          </div>
        </div>
      </div>

      <DataTable
        columns={itemColumns}
        data={items}
        loading={loading}
        error={error}
        keyField="id"
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search items..."
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        addLabel="Add Item"
        emptyMessage="No inventory items found."
      />

      <FormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === "create" ? "Add Item" : formMode === "edit" ? "Edit Item" : "Item Details"}
        fields={itemFormFields}
        initialValues={(selectedItem || { status: "active", quantity_on_hand: 0, unit_name: "pcs" }) as Record<string, unknown>}
        onSubmit={handleFormSubmit}
        submitLabel={formMode === "create" ? "Create Item" : "Update Item"}
        loading={createMutation.loading || updateMutation.loading}
        error={formError}
        mode={formMode}
        size="lg"
      />

      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => selectedItem && deleteMutation.mutate(selectedItem.item_code)}
        title="Delete Item"
        itemName={selectedItem?.name}
        loading={deleteMutation.loading}
      />
    </div>
  );
}
