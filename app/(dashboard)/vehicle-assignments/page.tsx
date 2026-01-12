"use client";

import * as React from "react";
import { api } from "@/lib/api";
import { VehicleAssignment, Vehicle } from "@/lib/types";
import { DataTable, Column, FormDialog, FormField, DeleteDialog } from "@/components/crud";
import { useApi, useMutation } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Car, MapPin, Clock, DollarSign } from "lucide-react";

type AssignmentCreate = {
  vehicle_id: string;
  employee_ids: string[];
  route_from?: string;
  route_to?: string;
  route_stops?: string[];
  assignment_date?: string;
  notes?: string;
};
type AssignmentUpdate = Partial<AssignmentCreate> & { status?: string; distance_km?: number; rate_per_km?: number; amount?: number; };

const assignmentColumns: Column<VehicleAssignment>[] = [
  { key: "assignment_date", header: "Date", width: "100px",
    render: (value) => value ? new Date(String(value)).toLocaleDateString() : "-"
  },
  { key: "vehicle_id", header: "Vehicle" },
  { key: "employee_ids", header: "Employees",
    render: (value) => {
      const ids = value as string[] || [];
      return ids.length > 0 ? ids.slice(0, 2).join(", ") + (ids.length > 2 ? ` +${ids.length - 2}` : "") : "-";
    }
  },
  { key: "route_from", header: "From" },
  { key: "route_to", header: "To" },
  { key: "distance_km", header: "Distance", width: "90px",
    render: (value) => value ? `${Number(value)} km` : "-"
  },
  { key: "amount", header: "Amount", width: "90px",
    render: (value) => value ? `$${Number(value).toFixed(2)}` : "-"
  },
  { key: "status", header: "Status", width: "100px",
    render: (value) => {
      const status = String(value || "pending").toLowerCase();
      const variant = status === "completed" ? "default" : status === "in_progress" ? "secondary" : status === "cancelled" ? "destructive" : "outline";
      return <Badge variant={variant}>{String(value || "pending")}</Badge>;
    }
  },
];

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function VehicleAssignmentsPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  
  const [formOpen, setFormOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedAssignment, setSelectedAssignment] = React.useState<VehicleAssignment | null>(null);
  const [formMode, setFormMode] = React.useState<"create" | "edit" | "view">("create");
  const [formError, setFormError] = React.useState<string | null>(null);

  const { data: vehiclesData } = useApi<Vehicle[]>("/api/vehicles", { limit: 100 });
  const vehicles = vehiclesData || [];
  const vehicleOptions = vehicles.map(v => ({ value: v.vehicle_id, label: `${v.vehicle_id} - ${v.make_model}` }));

  const { data, loading, error, refetch } = useApi<VehicleAssignment[]>(
    "/api/vehicle-assignments",
    { skip: (page - 1) * pageSize, limit: pageSize, search: search || undefined }
  );

  const assignmentFormFields: FormField[] = [
    { name: "vehicle_id", label: "Vehicle", type: "select", required: true, options: vehicleOptions },
    { name: "assignment_date", label: "Date", type: "date", required: true },
    { name: "employee_ids", label: "Employee IDs", placeholder: "Comma separated IDs", helperText: "e.g., EMP001, EMP002" },
    { name: "route_from", label: "From Location", placeholder: "Starting point", required: true },
    { name: "route_to", label: "To Location", placeholder: "Destination", required: true },
    { name: "distance_km", label: "Distance (km)", type: "number", min: 0 },
    { name: "rate_per_km", label: "Rate/km ($)", type: "number", min: 0, step: 0.01 },
    { name: "amount", label: "Amount ($)", type: "number", min: 0, step: 0.01 },
    { name: "status", label: "Status", type: "select", options: statusOptions },
    { name: "start_time", label: "Start Time", placeholder: "HH:MM" },
    { name: "end_time", label: "End Time", placeholder: "HH:MM" },
    { name: "notes", label: "Notes", type: "textarea", colSpan: 2 },
  ];

  const createMutation = useMutation(
    (data: AssignmentCreate) => {
      const payload = { ...data };
      if (typeof payload.employee_ids === "string") {
        payload.employee_ids = (payload.employee_ids as unknown as string).split(",").map(s => s.trim()).filter(Boolean);
      }
      return api.post<VehicleAssignment>("/api/vehicle-assignments", payload);
    },
    { onSuccess: () => { setFormOpen(false); refetch(); }, onError: (e) => setFormError(e.message) }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: AssignmentUpdate }) => {
      const payload = { ...data };
      if (typeof payload.employee_ids === "string") {
        payload.employee_ids = (payload.employee_ids as unknown as string).split(",").map(s => s.trim()).filter(Boolean);
      }
      return api.put<VehicleAssignment>(`/api/vehicle-assignments/${id}`, payload);
    },
    { onSuccess: () => { setFormOpen(false); refetch(); }, onError: (e) => setFormError(e.message) }
  );

  const deleteMutation = useMutation(
    (id: number) => api.del<void>(`/api/vehicle-assignments/${id}`),
    { onSuccess: () => { setDeleteOpen(false); setSelectedAssignment(null); refetch(); } }
  );

  const handleAdd = () => { setSelectedAssignment(null); setFormMode("create"); setFormError(null); setFormOpen(true); };
  const handleEdit = (a: VehicleAssignment) => { 
    const modifiedAssignment = { ...a, employee_ids: a.employee_ids?.join(", ") || "" } as unknown as VehicleAssignment;
    setSelectedAssignment(modifiedAssignment); 
    setFormMode("edit"); setFormError(null); setFormOpen(true); 
  };
  const handleView = (a: VehicleAssignment) => { 
    const modifiedAssignment = { ...a, employee_ids: a.employee_ids?.join(", ") || "" } as unknown as VehicleAssignment;
    setSelectedAssignment(modifiedAssignment); 
    setFormMode("view"); setFormOpen(true); 
  };
  const handleDelete = (a: VehicleAssignment) => { setSelectedAssignment(a); setDeleteOpen(true); };

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    setFormError(null);
    if (formMode === "create") await createMutation.mutate(values as AssignmentCreate);
    else if (formMode === "edit" && selectedAssignment) await updateMutation.mutate({ id: selectedAssignment.id, data: values as AssignmentUpdate });
  };

  const assignments = data || [];
  console.log("assignments", assignments);
  const total = assignments.length;
  const completed = assignments.filter(a => a.status === "completed").length;
  const inProgress = assignments.filter(a => a.status === "in_progress").length;
  const totalAmount = assignments.reduce((sum, a) => sum + (a.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Vehicle Assignments</h2>
        <p className="text-muted-foreground">Manage vehicle assignments and trips.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <Car className="h-5 w-5 text-primary" />
            <div><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">Total</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-yellow-500" />
            <div><p className="text-2xl font-bold">{inProgress}</p><p className="text-xs text-muted-foreground">In Progress</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-green-500" />
            <div><p className="text-2xl font-bold">{completed}</p><p className="text-xs text-muted-foreground">Completed</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-blue-500" />
            <div><p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p><p className="text-xs text-muted-foreground">Total Amount</p></div>
          </div>
        </CardContent></Card>
      </div>

      <DataTable
        columns={assignmentColumns}
        data={assignments}
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
        searchPlaceholder="Search assignments..."
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        addLabel="Add Assignment"
        emptyMessage="No assignments found."
      />

      <FormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === "create" ? "Add Assignment" : formMode === "edit" ? "Edit Assignment" : "Assignment Details"}
        fields={assignmentFormFields}
        initialValues={(selectedAssignment || { assignment_date: new Date().toISOString().split("T")[0], status: "pending" }) as Record<string, unknown>}
        onSubmit={handleFormSubmit}
        submitLabel={formMode === "create" ? "Create Assignment" : "Update Assignment"}
        loading={createMutation.loading || updateMutation.loading}
        error={formError}
        mode={formMode}
        size="lg"
      />

      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => selectedAssignment && deleteMutation.mutate(selectedAssignment.id)}
        title="Delete Assignment"
        itemName={`assignment for ${selectedAssignment?.vehicle_id}`}
        loading={deleteMutation.loading}
      />
    </div>
  );
}
