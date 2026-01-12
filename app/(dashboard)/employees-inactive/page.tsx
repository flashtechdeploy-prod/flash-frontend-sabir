"use client";

import * as React from "react";
import { api } from "@/lib/api";
import { Employee2ListItem } from "@/lib/types";
import { DataTable, Column } from "@/components/crud";
import { useApi, useMutation } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserX, RefreshCcw, Download, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

const employeeColumns: Column<Employee2ListItem>[] = [
  { key: "employee_id", header: "Emp ID", width: "100px" },
  { key: "fss_number", header: "FSS No" },
  { 
    key: "first_name", 
    header: "Name",
    render: (_, row) => `${row.first_name || ""} ${row.last_name || ""}`.trim() || "-"
  },
  { key: "service_rank", header: "Rank" },
  { key: "mobile_number", header: "Mobile" },
  { key: "service_unit", header: "Unit" },
  { key: "designation", header: "Designation" },
  { key: "employment_status", header: "Status", width: "110px",
    render: (value) => {
      const status = String(value || "Inactive").toLowerCase();
      const variant = status === "terminated" ? "destructive" : status === "resigned" ? "secondary" : "outline";
      return <Badge variant={variant}>{String(value || "Inactive")}</Badge>;
    }
  },
];

export default function EmployeesInactivePage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee2ListItem | null>(null);
  const [reactivateOpen, setReactivateOpen] = React.useState(false);

  const { data, loading, error, refetch } = useApi<{ employees: Employee2ListItem[]; total: number }>(
    "/api/employees",
    { skip: (page - 1) * pageSize, limit: pageSize, search: search || undefined, employment_status: "Inactive" }
  );

  const reactivateMutation = useMutation(
    (employee_id: string) => api.put<void>(`/api/employees/${employee_id}`, { employment_status: "Active" }),
    { onSuccess: () => { setReactivateOpen(false); setSelectedEmployee(null); refetch(); } }
  );

  const employees = data?.employees || [];
  const total = data?.total || 0;

  const terminated = employees.filter(e => e.employment_status?.toLowerCase() === "terminated").length;
  const resigned = employees.filter(e => e.employment_status?.toLowerCase() === "resigned").length;

  const handleReactivate = (emp: Employee2ListItem) => {
    setSelectedEmployee(emp);
    setReactivateOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inactive Employees</h2>
          <p className="text-muted-foreground">View and manage inactive employee records.</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <UserX className="h-5 w-5 text-muted-foreground" />
            <div><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">Total Inactive</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div><p className="text-2xl font-bold">{terminated}</p><p className="text-xs text-muted-foreground">Terminated</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <RefreshCcw className="h-5 w-5 text-yellow-500" />
            <div><p className="text-2xl font-bold">{resigned}</p><p className="text-xs text-muted-foreground">Resigned</p></div>
          </div>
        </CardContent></Card>
      </div>

      <DataTable
        columns={employeeColumns}
        data={employees}
        loading={loading}
        error={error}
        keyField="employee_id"
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search inactive employees..."
        emptyMessage="No inactive employees found."
        rowActions={(row) => (
          <Button variant="ghost" size="sm" onClick={() => handleReactivate(row)}>
            <RefreshCcw className="h-4 w-4 mr-1" /> Reactivate
          </Button>
        )}
      />

      <Dialog open={reactivateOpen} onOpenChange={setReactivateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reactivate Employee</DialogTitle>
            <DialogDescription>
              Are you sure you want to reactivate {selectedEmployee?.first_name} {selectedEmployee?.last_name}? This will move them back to active status.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReactivateOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => selectedEmployee && reactivateMutation.mutate(selectedEmployee.employee_id)}
              disabled={reactivateMutation.loading}
            >
              {reactivateMutation.loading ? "Reactivating..." : "Reactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
