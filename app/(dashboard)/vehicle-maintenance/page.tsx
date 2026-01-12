"use client";

import * as React from "react";
import { api } from "@/lib/api";
import { VehicleMaintenance, Vehicle } from "@/lib/types";
import { DataTable, Column, FormDialog, FormField, DeleteDialog } from "@/components/crud";
import { useApi, useMutation } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, DollarSign, Calendar, Gauge } from "lucide-react";

type MaintenanceCreate = Omit<VehicleMaintenance, "id" | "created_at" | "updated_at">;
type MaintenanceUpdate = Partial<MaintenanceCreate>;

const maintenanceColumns: Column<VehicleMaintenance>[] = [
  { key: "maintenance_date", header: "Date", width: "100px",
    render: (value) => new Date(String(value)).toLocaleDateString()
  },
  { key: "vehicle_id", header: "Vehicle" },
  { key: "description", header: "Description" },
  { key: "service_vendor", header: "Vendor" },
  { key: "cost", header: "Cost", width: "90px",
    render: (value) => value ? `$${Number(value).toFixed(2)}` : "-"
  },
  { key: "odometer_km", header: "Odometer", width: "100px",
    render: (value) => value ? `${Number(value).toLocaleString()} km` : "-"
  },
];

export default function VehicleMaintenancePage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const [selectedVehicle, setSelectedVehicle] = React.useState<string>("");
  
  const [formOpen, setFormOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<VehicleMaintenance | null>(null);
  const [formMode, setFormMode] = React.useState<"create" | "edit" | "view">("create");
  const [formError, setFormError] = React.useState<string | null>(null);

  const { data: vehiclesData } = useApi<Vehicle[]>("/api/vehicles", { limit: 100 });
  const vehicles = vehiclesData || [];
  const vehicleOptions = vehicles.map(v => ({ value: v.vehicle_id, label: `${v.vehicle_id} - ${v.make_model}` }));

  const params: Record<string, string | number | boolean | null | undefined> = { skip: (page - 1) * pageSize, limit: pageSize };
  if (search) params.search = search;
  if (selectedVehicle) params.vehicle_id = selectedVehicle;

  const { data, loading, error, refetch } = useApi<VehicleMaintenance[]>(
    "/api/vehicle-maintenance", params
  );

  const maintenanceFormFields: FormField[] = [
    { name: "vehicle_id", label: "Vehicle", type: "select", required: true, options: vehicleOptions },
    { name: "maintenance_date", label: "Date", type: "date", required: true },
    { name: "description", label: "Description", required: true, placeholder: "e.g., Oil change, Tire replacement" },
    { name: "service_vendor", label: "Vendor/Workshop", placeholder: "e.g., ABC Motors" },
    { name: "cost", label: "Cost ($)", type: "number", min: 0, step: 0.01 },
    { name: "odometer_km", label: "Odometer (km)", type: "number", min: 0 },
    { name: "employee_id", label: "Reported By", placeholder: "Employee ID" },
  ];

  const createMutation = useMutation(
    (data: MaintenanceCreate) => api.post<VehicleMaintenance>("/api/vehicle-maintenance", data),
    { onSuccess: () => { setFormOpen(false); refetch(); }, onError: (e) => setFormError(e.message) }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: MaintenanceUpdate }) => api.put<VehicleMaintenance>(`/api/vehicle-maintenance/${id}`, data),
    { onSuccess: () => { setFormOpen(false); refetch(); }, onError: (e) => setFormError(e.message) }
  );

  const deleteMutation = useMutation(
    (id: number) => api.del<void>(`/api/vehicle-maintenance/${id}`),
    { onSuccess: () => { setDeleteOpen(false); setSelectedRecord(null); refetch(); } }
  );

  const handleAdd = () => { setSelectedRecord(null); setFormMode("create"); setFormError(null); setFormOpen(true); };
  const handleEdit = (record: VehicleMaintenance) => { setSelectedRecord(record); setFormMode("edit"); setFormError(null); setFormOpen(true); };
  const handleView = (record: VehicleMaintenance) => { setSelectedRecord(record); setFormMode("view"); setFormOpen(true); };
  const handleDelete = (record: VehicleMaintenance) => { setSelectedRecord(record); setDeleteOpen(true); };

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    setFormError(null);
    if (formMode === "create") await createMutation.mutate(values as MaintenanceCreate);
    else if (formMode === "edit" && selectedRecord) await updateMutation.mutate({ id: selectedRecord.id, data: values as MaintenanceUpdate });
  };

  const records = data || [];
  const total = records.length;
  const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);
  const thisMonth = records.filter(r => {
    const d = new Date(r.maintenance_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Vehicle Maintenance</h2>
        <p className="text-muted-foreground">Track and manage vehicle maintenance records.</p>
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <Wrench className="h-5 w-5 text-primary" />
            <div><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">Total Records</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-blue-500" />
            <div><p className="text-2xl font-bold">{thisMonth.length}</p><p className="text-xs text-muted-foreground">This Month</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-green-500" />
            <div><p className="text-2xl font-bold">${totalCost.toFixed(2)}</p><p className="text-xs text-muted-foreground">Total Cost</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <Gauge className="h-5 w-5 text-purple-500" />
            <div><p className="text-2xl font-bold">${total > 0 ? (totalCost / total).toFixed(2) : "0"}</p><p className="text-xs text-muted-foreground">Avg Cost</p></div>
          </div>
        </CardContent></Card>
      </div>

      <DataTable
        columns={maintenanceColumns}
        data={records}
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
        searchPlaceholder="Search records..."
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        addLabel="Add Record"
        emptyMessage="No maintenance records found."
      />

      <FormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === "create" ? "Add Maintenance" : formMode === "edit" ? "Edit Record" : "Record Details"}
        fields={maintenanceFormFields}
        initialValues={(selectedRecord || { maintenance_date: new Date().toISOString().split("T")[0] }) as Record<string, unknown>}
        onSubmit={handleFormSubmit}
        submitLabel={formMode === "create" ? "Create Record" : "Update Record"}
        loading={createMutation.loading || updateMutation.loading}
        error={formError}
        mode={formMode}
      />

      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => selectedRecord && deleteMutation.mutate(selectedRecord.id)}
        title="Delete Record"
        itemName={`maintenance record from ${selectedRecord?.maintenance_date}`}
        loading={deleteMutation.loading}
      />
    </div>
  );
}
