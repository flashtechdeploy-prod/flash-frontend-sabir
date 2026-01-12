"use client";

import * as React from "react";
import { api } from "@/lib/api";
import { PayrollEmployeeRow } from "@/lib/types";
import { DataTable, Column } from "@/components/crud";
import { useApi, useMutation } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Users, Clock, Calendar, Download, Calculator } from "lucide-react";

const payrollColumns: Column<PayrollEmployeeRow>[] = [
  { key: "employee_id", header: "ID", width: "80px" },
  { key: "name", header: "Name",
    render: (value, row) => {
      // If name is empty, generate a placeholder name from employee ID
      if (!value || value === "") {
        return `Employee ${row.employee_id}`;
      }
      return value;
    }
  },
  { key: "department", header: "Dept" },
  { key: "present_days", header: "P", width: "40px" },
  { key: "absent_days", header: "A", width: "40px" },
  { key: "late_days", header: "L", width: "40px" },
  { key: "base_salary", header: "Base", width: "90px",
    render: (value) => `$${Number(value).toFixed(0)}`
  },
  { key: "overtime_pay", header: "OT", width: "70px",
    render: (value) => value ? `+$${Number(value).toFixed(0)}` : "-"
  },
  { key: "late_deduction", header: "Late", width: "70px",
    render: (value) => value ? `-$${Number(value).toFixed(0)}` : "-"
  },
  { key: "advance_deduction", header: "Adv", width: "70px",
    render: (value) => value ? `-$${Number(value).toFixed(0)}` : "-"
  },
  { key: "net_pay", header: "Net Pay", width: "100px",
    render: (value) => <span className="font-semibold">${Number(value).toFixed(2)}</span>
  },
  { key: "paid_status", header: "Status", width: "90px",
    render: (value) => {
      const status = String(value || "unpaid").toLowerCase();
      const variant = status === "paid" ? "default" : status === "partial" ? "secondary" : "outline";
      return <Badge variant={variant}>{String(value || "Unpaid")}</Badge>;
    }
  },
];

export default function Payroll2Page() {
  const [year, setYear] = React.useState(new Date().getFullYear());
  const [month, setMonth] = React.useState(new Date().getMonth() + 1);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [search, setSearch] = React.useState("");

  // Format month as YYYY-MM for the API
  const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
  
  const { data, loading, error, refetch } = useApi<{ month: string; summary: object; rows: PayrollEmployeeRow[] }>(
    "/api/payroll/report",
    { month: monthStr }
  );

  console.log("Payroll Data:", data);
  const generateMutation = useMutation(
    (_: void) => api.post<void>("/api/payroll/report", { month: monthStr }),
    { onSuccess: () => refetch() }
  );

  const employees = data?.rows || [];
  const total = employees.length;

  const totalBaseSalary = employees.reduce((sum, e) => sum + (e.base_salary || 0), 0);
  const totalNetPay = employees.reduce((sum, e) => sum + (e.net_pay || 0), 0);
  const totalOT = employees.reduce((sum, e) => sum + (e.overtime_pay || 0), 0);
  const paidCount = employees.filter(e => e.paid_status === "paid").length;

  const months = [
    { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
    { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
    { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
    { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Salaries</h2>
          <p className="text-muted-foreground">Manage employee salaries and payroll.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => generateMutation.mutate(undefined as unknown as void)} disabled={generateMutation.loading}>
            <Calculator className="mr-2 h-4 w-4" />
            {generateMutation.loading ? "Generating..." : "Generate Payroll"}
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <select
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
        >
          {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Refresh</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">Employees</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-blue-500" />
            <div><p className="text-2xl font-bold">${totalBaseSalary.toFixed(0)}</p><p className="text-xs text-muted-foreground">Base Salaries</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-green-500" />
            <div><p className="text-2xl font-bold">+${totalOT.toFixed(0)}</p><p className="text-xs text-muted-foreground">Overtime</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-purple-500" />
            <div><p className="text-2xl font-bold">${totalNetPay.toFixed(0)}</p><p className="text-xs text-muted-foreground">Total Net</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-orange-500" />
            <div><p className="text-2xl font-bold">{paidCount}/{total}</p><p className="text-xs text-muted-foreground">Paid</p></div>
          </div>
        </CardContent></Card>
      </div>

      <DataTable
        columns={payrollColumns}
        data={employees}
        loading={loading}
        error={error}
        keyField="employee_db_id"
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search employees..."
        emptyMessage="No payroll data found for this period."
      />
    </div>
  );
}
