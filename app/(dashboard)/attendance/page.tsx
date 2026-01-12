"use client";

import * as React from "react";
import { api, ApiError } from "@/lib/api";
import { AttendanceRow, AttendanceStatus, Employee2ListItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Save, 
  Loader2, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusOptions: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: "present", label: "Present", color: "bg-green-500" },
  { value: "late", label: "Late", color: "bg-yellow-500" },
  { value: "absent", label: "Absent", color: "bg-red-500" },
  { value: "leave", label: "Leave", color: "bg-blue-500" },
  { value: "unmarked", label: "Unmarked", color: "bg-gray-400" },
];

const leaveTypes = [
  { value: "", label: "N/A" },
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
];

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function parseDate(str: string): Date {
  return new Date(str + "T00:00:00");
}

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = React.useState<string>(formatDate(new Date()));
  const [employees, setEmployees] = React.useState<Employee2ListItem[]>([]);
  const [attendance, setAttendance] = React.useState<Map<string, AttendanceRow>>(new Map());
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [search, setSearch] = React.useState("");

  // Fetch employees and attendance for the selected date
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch employees
      const empResponse = await api.get<{ employees: Employee2ListItem[]; total: number }>(
        "/api/employees",
        { query: { skip: 0, limit: 500 } }
      );
      console.log("empResponse", empResponse);
      setEmployees(empResponse.employees || []);

      // Fetch attendance for the date
      const attResponse = await api.get<{ date: string; records: Array<{
        employee_id: string;
        status: string;
        note?: string;
        overtime_minutes?: number;
        overtime_rate?: number;
        late_minutes?: number;
        late_deduction?: number;
        leave_type?: string;
        fine_amount?: number;
      }> }>(
        `/api/attendance`,
        { query: { date: selectedDate } }
      );

      // Build attendance map
      const attMap = new Map<string, AttendanceRow>();
      for (const emp of empResponse.employees || []) {
        const empId = emp.employee_id || String(emp.id);
        const record = attResponse.records?.find(r => r.employee_id === empId);
        const fullName = [emp.first_name, emp.last_name].filter(Boolean).join(" ") || emp.name || "";
        attMap.set(empId, {
          employee_id: empId,
          serial_no: emp.employee_id || emp.serial_no,
          name: fullName,
          rank: emp.service_rank || emp.rank,
          unit: emp.service_unit || emp.unit,
          status: (record?.status as AttendanceStatus) || "unmarked",
          leave_type: (record?.leave_type as "paid" | "unpaid" | "") || "",
          overtime_hours: record?.overtime_minutes ? record.overtime_minutes / 60 : 0,
          overtime_rate: record?.overtime_rate || 0,
          late_hours: record?.late_minutes ? record.late_minutes / 60 : 0,
          late_deduction: record?.late_deduction || 0,
          fine_amount: record?.fine_amount || 0,
          note: record?.note || "",
        });
      }
      setAttendance(attMap);
      setHasChanges(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateChange = (days: number) => {
    const date = parseDate(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(formatDate(date));
  };

  const handleStatusChange = (employeeId: string, status: AttendanceStatus) => {
    setAttendance(prev => {
      const next = new Map(prev);
      const row = next.get(employeeId);
      if (row) {
        next.set(employeeId, { 
          ...row, 
          status,
          leave_type: status === "leave" ? row.leave_type || "paid" : ""
        });
      }
      return next;
    });
    setHasChanges(true);
  };

  const handleFieldChange = (employeeId: string, field: keyof AttendanceRow, value: unknown) => {
    setAttendance(prev => {
      const next = new Map(prev);
      const row = next.get(employeeId);
      if (row) {
        next.set(employeeId, { ...row, [field]: value });
      }
      return next;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    
    try {
      const records = Array.from(attendance.values())
        .filter(row => row.status !== "unmarked")
        .map(row => ({
          employee_id: row.employee_id,
          status: row.status,
          note: row.note || null,
          overtime_minutes: row.overtime_hours ? Math.round(row.overtime_hours * 60) : null,
          overtime_rate: row.overtime_rate || null,
          late_minutes: row.late_hours ? Math.round(row.late_hours * 60) : null,
          late_deduction: row.late_deduction || null,
          leave_type: row.status === "leave" ? row.leave_type || "paid" : null,
          fine_amount: row.fine_amount || null,
        }));

      await api.put("/api/attendance", {
        date: selectedDate,
        records,
      });

      setHasChanges(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setAttendance(prev => {
      const next = new Map(prev);
      for (const [key, row] of next) {
        next.set(key, { ...row, status });
      }
      return next;
    });
    setHasChanges(true);
  };

  // Filter employees based on search
  const filteredEmployees = React.useMemo(() => {
    if (!search) return employees;
    const lower = search.toLowerCase();
    return employees.filter(emp => {
      const fullName = [emp.first_name, emp.last_name].filter(Boolean).join(" ").toLowerCase();
      return fullName.includes(lower) ||
        emp.fss_number?.toLowerCase().includes(lower) ||
        emp.employee_id?.toLowerCase().includes(lower);
    });
  }, [employees, search]);

  // Stats
  const stats = React.useMemo(() => {
    const values = Array.from(attendance.values());
    return {
      total: values.length,
      present: values.filter(r => r.status === "present").length,
      late: values.filter(r => r.status === "late").length,
      absent: values.filter(r => r.status === "absent").length,
      leave: values.filter(r => r.status === "leave").length,
      unmarked: values.filter(r => r.status === "unmarked").length,
    };
  }, [attendance]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attendance</h2>
          <p className="text-muted-foreground">Mark daily attendance for employees.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => handleDateChange(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 rounded-md border px-3 py-1.5">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-0 bg-transparent p-0 h-auto w-[130px]"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => handleDateChange(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.present}</p>
              <p className="text-xs text-muted-foreground">Present</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{stats.late}</p>
              <p className="text-xs text-muted-foreground">Late</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{stats.absent}</p>
              <p className="text-xs text-muted-foreground">Absent</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.leave}</p>
              <p className="text-xs text-muted-foreground">On Leave</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-2xl font-bold">{stats.unmarked}</p>
              <p className="text-xs text-muted-foreground">Unmarked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground mr-2">Quick mark all:</span>
        {statusOptions.filter(s => s.value !== "unmarked").map(opt => (
          <Button 
            key={opt.value} 
            variant="outline" 
            size="sm"
            onClick={() => handleMarkAll(opt.value)}
          >
            <span className={cn("w-2 h-2 rounded-full mr-2", opt.color)} />
            {opt.label}
          </Button>
        ))}
        <div className="flex-1" />
        <Input
          placeholder="Search employees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-[200px]"
        />
        <Button onClick={handleSave} disabled={!hasChanges || saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          Save Changes
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Attendance Table */}
      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium w-20">S.No</th>
                <th className="px-4 py-3 text-left font-medium w-24">FSS No</th>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium w-20">Rank</th>
                <th className="px-4 py-3 text-left font-medium w-24">Unit</th>
                <th className="px-4 py-3 text-center font-medium w-48">Status</th>
                <th className="px-4 py-3 text-left font-medium w-24">Leave Type</th>
                <th className="px-4 py-3 text-left font-medium w-20">OT (hrs)</th>
                <th className="px-4 py-3 text-left font-medium w-20">Late (hrs)</th>
                <th className="px-4 py-3 text-left font-medium w-20">Fine</th>
                <th className="px-4 py-3 text-left font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                    Loading attendance data...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">
                    No employees found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const empId = emp.employee_id || String(emp.id);
                  const row = attendance.get(empId);
                  if (!row) return null;
                  const fullName = [emp.first_name, emp.last_name].filter(Boolean).join(" ");
                  
                  return (
                    <tr key={emp.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-2 text-muted-foreground">{emp.employee_id || "-"}</td>
                      <td className="px-4 py-2 font-mono text-xs">{emp.fss_number || "-"}</td>
                      <td className="px-4 py-2 font-medium">{fullName || "-"}</td>
                      <td className="px-4 py-2">{emp.service_rank || "-"}</td>
                      <td className="px-4 py-2">{emp.service_unit || "-"}</td>
                      <td className="px-4 py-2">
                        <div className="flex justify-center gap-1">
                          {statusOptions.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => handleStatusChange(row.employee_id, opt.value)}
                              className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                                row.status === opt.value
                                  ? cn(opt.color, "text-white ring-2 ring-offset-1 ring-offset-background")
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              )}
                              title={opt.label}
                            >
                              {opt.label[0]}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {row.status === "leave" ? (
                          <select
                            value={row.leave_type || "paid"}
                            onChange={(e) => handleFieldChange(row.employee_id, "leave_type", e.target.value)}
                            className="h-7 w-full rounded border bg-background px-2 text-xs"
                          >
                            {leaveTypes.filter(t => t.value).map(t => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          value={row.overtime_hours || ""}
                          onChange={(e) => handleFieldChange(row.employee_id, "overtime_hours", parseFloat(e.target.value) || 0)}
                          className="h-7 w-16 text-xs"
                          min={0}
                          step={0.5}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          value={row.late_hours || ""}
                          onChange={(e) => handleFieldChange(row.employee_id, "late_hours", parseFloat(e.target.value) || 0)}
                          className="h-7 w-16 text-xs"
                          min={0}
                          step={0.25}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          value={row.fine_amount || ""}
                          onChange={(e) => handleFieldChange(row.employee_id, "fine_amount", parseFloat(e.target.value) || 0)}
                          className="h-7 w-16 text-xs"
                          min={0}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="text"
                          value={row.note || ""}
                          onChange={(e) => handleFieldChange(row.employee_id, "note", e.target.value)}
                          placeholder="Note..."
                          className="h-7 text-xs"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Save Button */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button size="lg" onClick={handleSave} disabled={saving} className="shadow-lg">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Attendance
          </Button>
        </div>
      )}
    </div>
  );
}
