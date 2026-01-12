"use client";

import * as React from "react";
import { api } from "@/lib/api";
import { FuelEntry, FuelMileageSummary, Vehicle } from "@/lib/types";
import { DataTable, Column, FormDialog, FormField, DeleteDialog } from "@/components/crud";
import { useApi, useMutation } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Fuel, Gauge, DollarSign, TrendingUp, Activity } from "lucide-react";

type FuelEntryCreate = Omit<FuelEntry, "id" | "created_at" | "updated_at">;
type FuelEntryUpdate = Partial<FuelEntryCreate>;

const fuelColumns: Column<FuelEntry>[] = [
  { key: "entry_date", header: "Date", width: "100px",
    render: (value) => new Date(String(value)).toLocaleDateString()
  },
  { key: "vehicle_id", header: "Vehicle" },
  { key: "fuel_type", header: "Fuel Type" },
  { key: "liters", header: "Liters", width: "80px",
    render: (value) => `${Number(value).toFixed(2)} L`
  },
  { key: "price_per_liter", header: "Price/L", width: "80px",
    render: (value) => value ? `$${Number(value).toFixed(2)}` : "-"
  },
  { key: "total_cost", header: "Total", width: "90px",
    render: (value) => value ? `$${Number(value).toFixed(2)}` : "-"
  },
  { key: "odometer_km", header: "Odometer", width: "100px",
    render: (value) => value ? `${Number(value).toLocaleString()} km` : "-"
  },
  { key: "vendor", header: "Vendor" },
];

const fuelTypes = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "cng", label: "CNG" },
  { value: "lpg", label: "LPG" },
  { value: "electric", label: "Electric" },
];

export default function FuelMileagePage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const [selectedVehicle, setSelectedVehicle] = React.useState<string>("");
  
  const [formOpen, setFormOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedEntry, setSelectedEntry] = React.useState<FuelEntry | null>(null);
  const [formMode, setFormMode] = React.useState<"create" | "edit" | "view">("create");
  const [formError, setFormError] = React.useState<string | null>(null);

  const { data: vehiclesData } = useApi<Vehicle[]>("/api/vehicles", { limit: 100 });
  const vehicles = vehiclesData || [];
  const vehicleOptions = vehicles.map(v => ({ value: v.vehicle_id, label: `${v.vehicle_id} - ${v.make_model}` }));

  const params: Record<string, string | number | boolean | null | undefined> = { skip: (page - 1) * pageSize, limit: pageSize };
  if (search) params.search = search;
  if (selectedVehicle) params.vehicle_id = selectedVehicle;

  const { data, loading, error, refetch } = useApi<FuelEntry[]>(
    "/api/fuel-entries", params
  );

  const { data: summaryData } = useApi<FuelMileageSummary>(
    `/api/fuel-entries/summary`,
    selectedVehicle ? { vehicle_id: selectedVehicle } : {}
  );

  const fuelFormFields: FormField[] = [
    { name: "vehicle_id", label: "Vehicle", type: "select", required: true, options: vehicleOptions },
    { name: "entry_date", label: "Date", type: "date", required: true },
    { name: "fuel_type", label: "Fuel Type", type: "select", required: true, options: fuelTypes },
    { name: "liters", label: "Liters", type: "number", required: true, min: 0, step: 0.01 },
    { name: "price_per_liter", label: "Price per Liter", type: "number", min: 0, step: 0.01 },
    { name: "total_cost", label: "Total Cost", type: "number", min: 0, step: 0.01 },
    { name: "odometer_km", label: "Odometer (km)", type: "number", min: 0 },
    { name: "vendor", label: "Vendor/Station", placeholder: "e.g., Shell, Total" },
    { name: "location", label: "Location", placeholder: "e.g., City name" },
    { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
  ];

  const createMutation = useMutation(
    (data: FuelEntryCreate) => api.post<FuelEntry>("/api/fuel-entries", data),
    { onSuccess: () => { setFormOpen(false); refetch(); }, onError: (e) => setFormError(e.message) }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: FuelEntryUpdate }) => api.put<FuelEntry>(`/api/fuel-entries/${id}`, data),
    { onSuccess: () => { setFormOpen(false); refetch(); }, onError: (e) => setFormError(e.message) }
  );

  const deleteMutation = useMutation(
    (id: number) => api.del<void>(`/api/fuel-entries/${id}`),
    { onSuccess: () => { setDeleteOpen(false); setSelectedEntry(null); refetch(); } }
  );

  const handleAdd = () => { setSelectedEntry(null); setFormMode("create"); setFormError(null); setFormOpen(true); };
  const handleEdit = (entry: FuelEntry) => { setSelectedEntry(entry); setFormMode("edit"); setFormError(null); setFormOpen(true); };
  const handleView = (entry: FuelEntry) => { setSelectedEntry(entry); setFormMode("view"); setFormOpen(true); };
  const handleDelete = (entry: FuelEntry) => { setSelectedEntry(entry); setDeleteOpen(true); };

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    setFormError(null);
    if (formMode === "create") await createMutation.mutate(values as FuelEntryCreate);
    else if (formMode === "edit" && selectedEntry) await updateMutation.mutate({ id: selectedEntry.id, data: values as FuelEntryUpdate });
  };

  const entries = data || [];
  const total = entries.length;
  const summary = summaryData;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Fuel & Mileage</h2>
        <p className="text-muted-foreground">Track fuel consumption and mileage efficiency.</p>
      </div>

      <div className="flex gap-4 items-center">
        <select
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={selectedVehicle}
          onChange={(e) => setSelectedVehicle(e.target.value)}
        >
          <option value="">All Vehicles</option>
          {vehicleOptions.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
        </select>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card><CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Fuel className="h-5 w-5 text-blue-500" />
              <div><p className="text-2xl font-bold">{summary.total_liters.toFixed(1)}</p><p className="text-xs text-muted-foreground">Total Liters</p></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div><p className="text-2xl font-bold">${summary.total_cost.toFixed(2)}</p><p className="text-xs text-muted-foreground">Total Cost</p></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Gauge className="h-5 w-5 text-purple-500" />
              <div><p className="text-2xl font-bold">{summary.distance_km?.toLocaleString() || "-"}</p><p className="text-xs text-muted-foreground">Distance (km)</p></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div><p className="text-2xl font-bold">{summary.avg_km_per_liter?.toFixed(2) || "-"}</p><p className="text-xs text-muted-foreground">Avg km/L</p></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-red-500" />
              <div><p className="text-2xl font-bold">${summary.avg_cost_per_km?.toFixed(2) || "-"}</p><p className="text-xs text-muted-foreground">Cost/km</p></div>
            </div>
          </CardContent></Card>
        </div>
      )}

      <DataTable
        columns={fuelColumns}
        data={entries}
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
        searchPlaceholder="Search entries..."
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        addLabel="Add Entry"
        emptyMessage="No fuel entries found."
      />

      <FormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === "create" ? "Add Fuel Entry" : formMode === "edit" ? "Edit Entry" : "Entry Details"}
        fields={fuelFormFields}
        initialValues={(selectedEntry || { entry_date: new Date().toISOString().split("T")[0], fuel_type: "petrol", liters: 0 }) as Record<string, unknown>}
        onSubmit={handleFormSubmit}
        submitLabel={formMode === "create" ? "Create Entry" : "Update Entry"}
        loading={createMutation.loading || updateMutation.loading}
        error={formError}
        mode={formMode}
        size="lg"
      />

      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => selectedEntry && deleteMutation.mutate(selectedEntry.id)}
        title="Delete Fuel Entry"
        itemName={`entry from ${selectedEntry?.entry_date}`}
        loading={deleteMutation.loading}
      />
    </div>
  );
}
