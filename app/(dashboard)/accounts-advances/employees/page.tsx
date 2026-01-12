"use client";

import * as React from "react";
import { api } from "@/lib/api";
import { EmployeeAdvance, Employee2ListItem } from "@/lib/types";
import { DataTable, Column, FormDialog, FormField, DeleteDialog } from "@/components/crud";
import { useApi, useMutation } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Users, Calendar, TrendingUp } from "lucide-react";

type AdvanceCreate = {
  employee_db_id: number;
  amount: number;
  note?: string;
  advance_date: string;
};

const advanceColumns: Column<EmployeeAdvance>[] = [
  { key: "advance_date", header: "Date", width: "100px",
    render: (value) => new Date(String(value)).toLocaleDateString()
  },
  { key: "employee_db_id", header: "Employee ID", width: "100px" },
  { key: "amount", header: "Amount", width: "100px",
    render: (value) => `$${Number(value).toFixed(2)}`
  },
  { key: "note", header: "Note" },
  { key: "created_at", header: "Created", width: "100px",
    render: (value) => new Date(String(value)).toLocaleDateString()
  },
];

export default function AccountsEmployeesPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [search, setSearch] = React.useState("");
  
  const [formOpen, setFormOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedAdvance, setSelectedAdvance] = React.useState<EmployeeAdvance | null>(null);
  const [formMode, setFormMode] = React.useState<"create" | "edit" | "view">("create");
  const [formError, setFormError] = React.useState<string | null>(null);

  const { data: employeesData } = useApi<{ employees: Employee2ListItem[] }>("/api/employees", { limit: 500 });
  const employees = employeesData?.employees || [];
  console.log("Employees List:", employees);
  const employeeOptions = employees.map(e => ({ value: e.id.toString(), label: `${e.first_name} (${e.fss_no || e.serial_no || e.id})` }));

  // Get current month in YYYY-MM format
  const currentMonth = `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;
  
  const { data, loading, error, refetch } = useApi<EmployeeAdvance[]>(
    "/api/advances/monthly",
    { month: currentMonth }
  );

  const advanceFormFields: FormField[] = [
    { name: "employee_db_id", label: "Employee", type: "select", required: true, options: employeeOptions },
    { name: "advance_date", label: "Date", type: "date", required: true },
    { name: "amount", label: "Amount ($)", type: "number", required: true, min: 0, step: 0.01 },
    { name: "note", label: "Note", type: "textarea", placeholder: "Reason for advance..." },
  ];

  const createMutation = useMutation(
    (data: AdvanceCreate) => {
      const payload = { ...data, employee_db_id: Number(data.employee_db_id) };
      return api.post<EmployeeAdvance>(`/api/advances/employees/${payload.employee_db_id}/advances`, payload);
    },
    { onSuccess: () => { setFormOpen(false); refetch(); }, onError: (e) => setFormError(e.message) }
  );

  const deleteMutation = useMutation(
    (id: number) => api.del<void>(`/api/advances/employees/${selectedAdvance?.employee_db_id}/advances/${id}`),
    { onSuccess: () => { setDeleteOpen(false); setSelectedAdvance(null); refetch(); } }
  );

  const handleAdd = () => { setSelectedAdvance(null); setFormMode("create"); setFormError(null); setFormOpen(true); };
  const handleView = (adv: EmployeeAdvance) => { setSelectedAdvance(adv); setFormMode("view"); setFormOpen(true); };
  const handleDelete = (adv: EmployeeAdvance) => { setSelectedAdvance(adv); setDeleteOpen(true); };

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    setFormError(null);
    if (formMode === "create") await createMutation.mutate(values as AdvanceCreate);
  };

  const advances = data || [];
  const total = advances.length;
  const totalAmount = advances.reduce((sum, a) => sum + (a.amount || 0), 0);
  const thisMonth = advances.filter(a => {
    const d = new Date(a.advance_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthAmount = thisMonth.reduce((sum, a) => sum + (a.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Employee Advances</h2>
        <p className="text-muted-foreground">Manage employee advance payments and records.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-primary" />
            <div><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">Total Advances</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <div><p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p><p className="text-xs text-muted-foreground">Total Amount</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-green-500" />
            <div><p className="text-2xl font-bold">{thisMonth.length}</p><p className="text-xs text-muted-foreground">This Month</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-purple-500" />
            <div><p className="text-2xl font-bold">${thisMonthAmount.toFixed(2)}</p><p className="text-xs text-muted-foreground">This Month Amt</p></div>
          </div>
        </CardContent></Card>
      </div>

      <DataTable
        columns={advanceColumns}
        data={advances}
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
        searchPlaceholder="Search advances..."
        onAdd={handleAdd}
        onView={handleView}
        onDelete={handleDelete}
        addLabel="Add Advance"
        emptyMessage="No advances found."
      />

      <FormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === "create" ? "Add Advance" : "Advance Details"}
        fields={advanceFormFields}
        initialValues={(selectedAdvance || { advance_date: new Date().toISOString().split("T")[0], amount: 0 }) as Record<string, unknown>}
        onSubmit={handleFormSubmit}
        submitLabel="Create Advance"
        loading={createMutation.loading}
        error={formError}
        mode={formMode}
      />

      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => selectedAdvance && deleteMutation.mutate(selectedAdvance.id)}
        title="Delete Advance"
        itemName={`advance of $${selectedAdvance?.amount}`}
        loading={deleteMutation.loading}
      />
    </div>
  );
}
