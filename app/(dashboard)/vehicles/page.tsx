"use client";

import * as React from "react";
import { api } from "@/lib/api";
import { Vehicle, VehicleCreate, VehicleUpdate } from "@/lib/types";
import { DataTable, Column, FormDialog, FormField, DeleteDialog } from "@/components/crud";
import { useApi, useMutation } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";

const vehicleColumns: Column<Vehicle>[] = [
  { key: "vehicle_id", header: "Vehicle ID", width: "120px" },
  { key: "vehicle_type", header: "Type" },
  { key: "category", header: "Category" },
  { key: "make_model", header: "Make/Model" },
  { key: "license_plate", header: "License Plate" },
  { key: "year", header: "Year", width: "80px" },
  { 
    key: "status", 
    header: "Status",
    render: (value) => {
      const status = String(value || "unknown").toLowerCase();
      const variant = status === "active" ? "default" : status === "maintenance" ? "secondary" : "outline";
      return <Badge variant={variant}>{String(value) || "Unknown"}</Badge>;
    }
  },
  { 
    key: "compliance", 
    header: "Compliance",
    render: (value) => {
      const compliance = String(value || "pending").toLowerCase();
      const variant = compliance === "compliant" ? "default" : compliance === "expired" ? "destructive" : "secondary";
      return <Badge variant={variant}>{String(value) || "Pending"}</Badge>;
    }
  },
];

const vehicleTypes = [
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
  { value: "pickup", label: "Pickup Truck" },
  { value: "van", label: "Van" },
  { value: "bus", label: "Bus" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "truck", label: "Truck" },
  { value: "other", label: "Other" },
];

const vehicleCategories = [
  { value: "company", label: "Company Owned" },
  { value: "leased", label: "Leased" },
  { value: "rented", label: "Rented" },
  { value: "personal", label: "Personal" },
];

const vehicleStatuses = [
  { value: "active", label: "Active" },
  { value: "maintenance", label: "Under Maintenance" },
  { value: "inactive", label: "Inactive" },
  { value: "disposed", label: "Disposed" },
];

const complianceStatuses = [
  { value: "compliant", label: "Compliant" },
  { value: "pending", label: "Pending" },
  { value: "expired", label: "Expired" },
];

const permitStatuses = [
  { value: "valid", label: "Valid" },
  { value: "expired", label: "Expired" },
  { value: "not_required", label: "Not Required" },
];

const vehicleFormFields: FormField[] = [
  { name: "vehicle_id", label: "Vehicle ID", required: true, placeholder: "e.g., VH-001" },
  { name: "vehicle_type", label: "Vehicle Type", type: "select", required: true, options: vehicleTypes },
  { name: "category", label: "Category", type: "select", required: true, options: vehicleCategories },
  { name: "make_model", label: "Make/Model", required: true, placeholder: "e.g., Toyota Corolla" },
  { name: "license_plate", label: "License Plate", required: true, placeholder: "e.g., ABC-1234" },
  { name: "chassis_number", label: "Chassis Number", placeholder: "Optional" },
  { name: "asset_tag", label: "Asset Tag", placeholder: "Optional" },
  { name: "year", label: "Year", type: "number", required: true, min: 1990, max: 2030, placeholder: "e.g., 2023" },
  { name: "status", label: "Status", type: "select", required: true, options: vehicleStatuses },
  { name: "compliance", label: "Compliance", type: "select", required: true, options: complianceStatuses },
  { name: "government_permit", label: "Government Permit", type: "select", required: true, options: permitStatuses },
];

export default function VehiclesPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  
  // Dialog states
  const [formOpen, setFormOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedVehicle, setSelectedVehicle] = React.useState<Vehicle | null>(null);
  const [formMode, setFormMode] = React.useState<"create" | "edit" | "view">("create");
  const [formError, setFormError] = React.useState<string | null>(null);

  // Fetch vehicles - backend returns array directly
  const { data, loading, error, refetch } = useApi<Vehicle[]>(
    "/api/vehicles",
    { skip: (page - 1) * pageSize, limit: pageSize, search: search || undefined }
  );

  // Mutations
  const createMutation = useMutation(
    (data: VehicleCreate) => api.post<Vehicle>("/api/vehicles", data),
    {
      onSuccess: () => {
        setFormOpen(false);
        refetch();
      },
      onError: (e) => setFormError(e.message),
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: VehicleUpdate }) => api.put<Vehicle>(`/api/vehicles/${id}`, data),
    {
      onSuccess: () => {
        setFormOpen(false);
        refetch();
      },
      onError: (e) => setFormError(e.message),
    }
  );

  const deleteMutation = useMutation(
    (id: number) => api.del<void>(`/api/vehicles/${id}`),
    {
      onSuccess: () => {
        setDeleteOpen(false);
        setSelectedVehicle(null);
        refetch();
      },
    }
  );

  const handleAdd = () => {
    setSelectedVehicle(null);
    setFormMode("create");
    setFormError(null);
    setFormOpen(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFormMode("edit");
    setFormError(null);
    setFormOpen(true);
  };

  const handleView = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFormMode("view");
    setFormError(null);
    setFormOpen(true);
  };

  const handleDelete = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setDeleteOpen(true);
  };

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    setFormError(null);
    
    if (formMode === "create") {
      await createMutation.mutate(values as VehicleCreate);
    } else if (formMode === "edit" && selectedVehicle) {
      await updateMutation.mutate({ id: selectedVehicle.id, data: values as VehicleUpdate });
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedVehicle) {
      await deleteMutation.mutate(selectedVehicle.id);
    }
  };

  const vehicles = data || [];
  const total = vehicles.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Vehicles</h2>
        <p className="text-muted-foreground">Manage your fleet vehicles.</p>
      </div>

      <DataTable
        columns={vehicleColumns}
        data={vehicles}
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
        searchPlaceholder="Search vehicles..."
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        addLabel="Add Vehicle"
        emptyMessage="No vehicles found. Add your first vehicle to get started."
      />

      <FormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === "create" ? "Add Vehicle" : formMode === "edit" ? "Edit Vehicle" : "Vehicle Details"}
        fields={vehicleFormFields}
        initialValues={(selectedVehicle || { status: "active", compliance: "pending", government_permit: "valid" }) as Record<string, unknown>}
        onSubmit={handleFormSubmit}
        submitLabel={formMode === "create" ? "Create Vehicle" : "Update Vehicle"}
        loading={createMutation.loading || updateMutation.loading}
        error={formError}
        mode={formMode}
        size="lg"
      />

      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Vehicle"
        itemName={selectedVehicle?.vehicle_id}
        loading={deleteMutation.loading}
      />
    </div>
  );
}
