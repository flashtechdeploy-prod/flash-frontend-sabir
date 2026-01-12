"use client";

import * as React from "react";
import { api } from "@/lib/api";
import { RestrictedItem } from "@/lib/types";
import { DataTable, Column, FormDialog, FormField, DeleteDialog } from "@/components/crud";
import { useApi, useMutation } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle, Wrench } from "lucide-react";

type RestrictedItemCreate = Omit<RestrictedItem, "id" | "created_at" | "updated_at" | "serial_total" | "serial_in_stock">;
type RestrictedItemUpdate = Partial<RestrictedItemCreate>;

const itemColumns: Column<RestrictedItem>[] = [
  { key: "item_code", header: "Code", width: "100px" },
  { key: "name", header: "Item Name" },
  { key: "category", header: "Category" },
  { key: "make_model", header: "Make/Model" },
  { key: "caliber", header: "Caliber" },
  { key: "quantity_on_hand", header: "Qty", width: "80px",
    render: (value, row) => {
      const qty = Number(value) || 0;
      const min = row.min_quantity || 0;
      const isLow = min > 0 && qty <= min;
      return (
        <span className={isLow ? "text-destructive font-medium" : ""}>
          {row.is_serial_tracked ? `${row.serial_in_stock || 0}/${row.serial_total || 0}` : qty}
          {isLow && <AlertTriangle className="h-3 w-3 inline ml-1" />}
        </span>
      );
    }
  },
  { key: "storage_location", header: "Location" },
  { key: "status", header: "Status", width: "100px",
    render: (value) => {
      const status = String(value || "active").toLowerCase();
      const variant = status === "active" ? "default" : status === "decommissioned" ? "destructive" : "secondary";
      return <Badge variant={variant}>{String(value)}</Badge>;
    }
  },
];

const categories = [
  { value: "firearm", label: "Firearm" },
  { value: "ammunition", label: "Ammunition" },
  { value: "explosive", label: "Explosive" },
  { value: "tactical", label: "Tactical Equipment" },
  { value: "protective", label: "Protective Gear" },
  { value: "communication", label: "Communication" },
  { value: "other", label: "Other" },
];

const statuses = [
  { value: "active", label: "Active" },
  { value: "maintenance", label: "Under Maintenance" },
  { value: "decommissioned", label: "Decommissioned" },
];

const itemFormFields: FormField[] = [
  { name: "item_code", label: "Item Code", required: true, placeholder: "e.g., WPN-001" },
  { name: "name", label: "Item Name", required: true, placeholder: "Enter item name" },
  { name: "category", label: "Category", type: "select", required: true, options: categories },
  { name: "make_model", label: "Make/Model", placeholder: "e.g., Glock 19" },
  { name: "caliber", label: "Caliber", placeholder: "e.g., 9mm" },
  { name: "is_serial_tracked", label: "Serial Tracked", type: "checkbox", helperText: "Track individual units by serial number" },
  { name: "unit_name", label: "Unit", required: true, placeholder: "e.g., units, rounds" },
  { name: "quantity_on_hand", label: "Quantity", type: "number", required: true, min: 0 },
  { name: "min_quantity", label: "Min Quantity", type: "number", min: 0 },
  { name: "storage_location", label: "Storage Location", placeholder: "e.g., Armory, Locker 5" },
  { name: "requires_maintenance", label: "Requires Maintenance", type: "checkbox" },
  { name: "requires_cleaning", label: "Requires Cleaning", type: "checkbox" },
  { name: "status", label: "Status", type: "select", required: true, options: statuses },
  { name: "description", label: "Description", type: "textarea", colSpan: 2, rows: 2 },
];

export default function RestrictedInventoryPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  
  const [formOpen, setFormOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<RestrictedItem | null>(null);
  const [formMode, setFormMode] = React.useState<"create" | "edit" | "view">("create");
  const [formError, setFormError] = React.useState<string | null>(null);

  const { data, loading, error, refetch } = useApi<RestrictedItem[]>(
    "/api/restricted-inventory/items",
    { skip: (page - 1) * pageSize, limit: pageSize, search: search || undefined }
  );

  const createMutation = useMutation(
    (data: RestrictedItemCreate) => api.post<RestrictedItem>("/api/restricted-inventory/items", data),
    { onSuccess: () => { setFormOpen(false); refetch(); }, onError: (e) => setFormError(e.message) }
  );

  const updateMutation = useMutation(
    ({ item_code, data }: { item_code: string; data: RestrictedItemUpdate }) => api.put<RestrictedItem>(`/api/restricted-inventory/items/${item_code}`, data),
    { onSuccess: () => { setFormOpen(false); refetch(); }, onError: (e) => setFormError(e.message) }
  );

  const deleteMutation = useMutation(
    (item_code: string) => api.del<void>(`/api/restricted-inventory/items/${item_code}`),
    { onSuccess: () => { setDeleteOpen(false); setSelectedItem(null); refetch(); } }
  );

  const handleAdd = () => { setSelectedItem(null); setFormMode("create"); setFormError(null); setFormOpen(true); };
  const handleEdit = (item: RestrictedItem) => { setSelectedItem(item); setFormMode("edit"); setFormError(null); setFormOpen(true); };
  const handleView = (item: RestrictedItem) => { setSelectedItem(item); setFormMode("view"); setFormOpen(true); };
  const handleDelete = (item: RestrictedItem) => { setSelectedItem(item); setDeleteOpen(true); };

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    setFormError(null);
    if (formMode === "create") await createMutation.mutate(values as RestrictedItemCreate);
    else if (formMode === "edit" && selectedItem) await updateMutation.mutate({ item_code: selectedItem.item_code, data: values as RestrictedItemUpdate });
  };

  const items = data || [];
  const total = items.length;
  const activeCount = items.filter(i => i.status === "active").length;
  const maintenanceCount = items.filter(i => i.status === "maintenance").length;
  const lowStockCount = items.filter(i => i.min_quantity && i.quantity_on_hand <= i.min_quantity).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Restricted Weapons</h2>
        <p className="text-muted-foreground">Manage restricted weapons and tactical equipment inventory.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">Total Items</p></div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div><p className="text-2xl font-bold">{activeCount}</p><p className="text-xs text-muted-foreground">Active</p></div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <Wrench className="h-5 w-5 text-yellow-500" />
            <div><p className="text-2xl font-bold">{maintenanceCount}</p><p className="text-xs text-muted-foreground">Maintenance</p></div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div><p className="text-2xl font-bold">{lowStockCount}</p><p className="text-xs text-muted-foreground">Low Stock</p></div>
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
        searchPlaceholder="Search weapons..."
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        addLabel="Add Item"
        emptyMessage="No restricted items found."
      />

      <FormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === "create" ? "Add Restricted Item" : formMode === "edit" ? "Edit Restricted Item" : "Item Details"}
        fields={itemFormFields}
        initialValues={(selectedItem || { status: "active", quantity_on_hand: 0, unit_name: "units", is_serial_tracked: false, requires_maintenance: false, requires_cleaning: false }) as Record<string, unknown>}
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
        title="Delete Restricted Item"
        itemName={selectedItem?.name}
        loading={deleteMutation.loading}
      />
    </div>
  );
}
