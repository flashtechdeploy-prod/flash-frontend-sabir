"use client";

import * as React from "react";
import { api } from "@/lib/api";
import { DataTable, Column, FormDialog, FormField, DeleteDialog } from "@/components/crud";
import { useApi, useMutation } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar, FileText } from "lucide-react";

interface Expense {
  id: number;
  expense_date: string;
  category: string;
  description: string;
  amount: string | number;
  vendor_name?: string | null;
  receipt_number?: string | null;
  notes?: string | null;
  attachment_url?: string | null;
  employee_id?: number | null;
  status: string;
  account_id?: number | null;
  journal_entry_id?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
  approved_at?: string | null;
  paid_at?: string | null;
}

type ExpenseCreate = Omit<Expense, "id" | "created_at" | "updated_at">;
type ExpenseUpdate = Partial<ExpenseCreate>;

const expenseColumns: Column<Expense>[] = [
  { key: "expense_date", header: "Date", width: "100px",
    render: (value) => new Date(String(value)).toLocaleDateString()
  },
  { key: "category", header: "Category" },
  { key: "description", header: "Description" },
  { key: "vendor_name", header: "Vendor" },
  { key: "amount", header: "Amount", width: "100px",
    render: (value) => `$${Number(value).toFixed(2)}`
  },
  { key: "receipt_number", header: "Receipt #" },
  { key: "status", header: "Status", width: "100px",
    render: (value) => {
      const status = String(value || "PENDING").toUpperCase();
      const variant = status === "APPROVED" ? "default" : status === "REJECTED" ? "destructive" : "secondary";
      return <Badge variant={variant}>{status}</Badge>;
    }
  },
];

const categories = [
  { value: "office", label: "Office Supplies" },
  { value: "utilities", label: "Utilities" },
  { value: "rent", label: "Rent" },
  { value: "travel", label: "Travel" },
  { value: "equipment", label: "Equipment" },
  { value: "maintenance", label: "Maintenance" },
  { value: "fuel", label: "Fuel" },
  { value: "other", label: "Other" },
];

const statuses = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "PAID", label: "Paid" },
];

export default function ExpensesPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [search, setSearch] = React.useState("");
  
  const [formOpen, setFormOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedExpense, setSelectedExpense] = React.useState<Expense | null>(null);
  const [formMode, setFormMode] = React.useState<"create" | "edit" | "view">("create");
  const [formError, setFormError] = React.useState<string | null>(null);

  const { data, loading, error, refetch } = useApi<Expense[]>(
    "/api/expenses",
    { skip: (page - 1) * pageSize, limit: pageSize, search: search || undefined }
  );



  const expenseFormFields: FormField[] = [
    { name: "expense_date", label: "Date", type: "date", required: true },
    { name: "category", label: "Category", type: "select", required: true, options: categories },
    { name: "description", label: "Description", required: true, placeholder: "Expense description" },
    { name: "amount", label: "Amount ($)", type: "number", required: true, min: 0, step: 0.01 },
    { name: "vendor_name", label: "Vendor", placeholder: "Vendor/Supplier name" },
    { name: "receipt_number", label: "Receipt Number", placeholder: "Receipt/Invoice number" },
    { name: "notes", label: "Notes", type: "textarea", placeholder: "Additional notes" },
    { name: "status", label: "Status", type: "select", options: statuses },
  ];

  const createMutation = useMutation(
    (data: ExpenseCreate) => api.post<Expense>("/api/expenses", data),
    { onSuccess: () => { setFormOpen(false); refetch(); }, onError: (e) => setFormError(e.message) }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: ExpenseUpdate }) => api.put<Expense>(`/api/expenses/${id}`, data),
    { onSuccess: () => { setFormOpen(false); refetch(); }, onError: (e) => setFormError(e.message) }
  );

  const deleteMutation = useMutation(
    (id: number) => api.del<void>(`/api/expenses/${id}`),
    { onSuccess: () => { setDeleteOpen(false); setSelectedExpense(null); refetch(); } }
  );

  const handleAdd = () => { setSelectedExpense(null); setFormMode("create"); setFormError(null); setFormOpen(true); };
  const handleEdit = (exp: Expense) => { setSelectedExpense(exp); setFormMode("edit"); setFormError(null); setFormOpen(true); };
  const handleView = (exp: Expense) => { setSelectedExpense(exp); setFormMode("view"); setFormOpen(true); };
  const handleDelete = (exp: Expense) => { setSelectedExpense(exp); setDeleteOpen(true); };

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    setFormError(null);
    if (formMode === "create") await createMutation.mutate(values as ExpenseCreate);
    else if (formMode === "edit" && selectedExpense) await updateMutation.mutate({ id: selectedExpense.id, data: values as ExpenseUpdate });
  };

  const expenses: Expense[] = data || [];
  const total = expenses.length;
  const totalAmount = expenses.reduce((sum: number, e: Expense) => sum + Number(e.amount || 0), 0);
  const approved = expenses.filter((e: Expense) => e.status?.toUpperCase() === "APPROVED");
  const approvedAmount = approved.reduce((sum: number, e: Expense) => sum + Number(e.amount || 0), 0);
  const pending = expenses.filter((e: Expense) => e.status?.toUpperCase() === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Expenses</h2>
        <p className="text-muted-foreground">Track and manage company expenses.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">Total Expenses</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-blue-500" />
            <div><p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p><p className="text-xs text-muted-foreground">Total Amount</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <div><p className="text-2xl font-bold">${approvedAmount.toFixed(2)}</p><p className="text-xs text-muted-foreground">Approved</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-yellow-500" />
            <div><p className="text-2xl font-bold">{pending}</p><p className="text-xs text-muted-foreground">Pending</p></div>
          </div>
        </CardContent></Card>
      </div>

      <DataTable
        columns={expenseColumns}
        data={expenses}
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
        searchPlaceholder="Search expenses..."
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        addLabel="Add Expense"
        emptyMessage="No expenses found."
      />

      <FormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === "create" ? "Add Expense" : formMode === "edit" ? "Edit Expense" : "Expense Details"}
        fields={expenseFormFields}
        initialValues={(selectedExpense || { expense_date: new Date().toISOString().split("T")[0], status: "pending" }) as Record<string, unknown>}
        onSubmit={handleFormSubmit}
        submitLabel={formMode === "create" ? "Create Expense" : "Update Expense"}
        loading={createMutation.loading || updateMutation.loading}
        error={formError}
        mode={formMode}
      />

      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => selectedExpense && deleteMutation.mutate(selectedExpense.id)}
        title="Delete Expense"
        itemName={selectedExpense?.description}
        loading={deleteMutation.loading}
      />
    </div>
  );
}
