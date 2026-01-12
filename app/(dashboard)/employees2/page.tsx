"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import { Employee2, Employee2ListItem } from "@/lib/types";
import { DataTable, Column, FormDialog, FormField, DeleteDialog } from "@/components/crud";
import { useApi, useMutation } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, UserX, Shield, Download, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Employee2Create = Omit<Employee2, "id" | "created_at" | "updated_at">;
type Employee2Update = Partial<Employee2Create>;

const employeeColumns: Column<Employee2ListItem>[] = [
  { key: "profile_photo", header: "", width: "50px",
    render: (value, row) => (
      <Avatar className="h-8 w-8">
        <AvatarImage src={value as string || ""} alt={`${row.first_name} ${row.last_name}`} />
        <AvatarFallback>{row.first_name?.charAt(0) || "?"}</AvatarFallback>
      </Avatar>
    )
  },
  { key: "employee_id", header: "S.No", width: "90px" },
  { key: "fss_number", header: "FSS No", width: "90px" },
  { key: "first_name", header: "Name",
    render: (value, row) => `${row.first_name || ""} ${row.last_name || ""}`.trim()
  },
  { key: "service_rank", header: "Rank" },
  { key: "designation", header: "Designation" },
  { key: "mobile_number", header: "Mobile" },
  { key: "service_unit", header: "Unit" },
  { key: "employment_status", header: "Status", width: "90px",
    render: (value) => {
      const status = String(value || "Active").toLowerCase();
      const variant = status === "active" ? "default" : status === "inactive" ? "secondary" : "destructive";
      return <Badge variant={variant}>{String(value || "Active")}</Badge>;
    }
  },
];

const statuses = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "Terminated", label: "Terminated" },
  { value: "Resigned", label: "Resigned" },
];

// Form fields matching backend Employee schema
const employeeFormFields: FormField[] = [
  { name: "profile_photo_file", label: "Profile Photo", type: "file", accept: "image/*", helperText: "Upload employee photo (JPG, PNG)" },
  { name: "first_name", label: "First Name", required: true, placeholder: "Enter first name" },
  { name: "last_name", label: "Last Name", required: true, placeholder: "Enter last name" },
  { name: "father_name", label: "Father's Name", placeholder: "Father's name" },
  { name: "fss_number", label: "FSS Number", placeholder: "FSS number" },
  { name: "service_rank", label: "Service Rank", placeholder: "e.g., Havildar" },
  { name: "designation", label: "Designation", placeholder: "e.g., Security Guard" },
  { name: "service_unit", label: "Service Unit", placeholder: "e.g., 15 Punjab Regiment" },
  { name: "base_location", label: "Base Location", placeholder: "Current duty location" },
  { name: "basic_salary", label: "Basic Salary", placeholder: "Monthly salary" },
  { name: "mobile_number", label: "Mobile Number", placeholder: "Contact number" },
  { name: "home_contact_no", label: "Home Contact" },
  { name: "email", label: "Email", type: "email", placeholder: "email@example.com" },
  { name: "cnic", label: "CNIC", placeholder: "National ID" },
  { name: "date_of_birth", label: "Date of Birth", type: "date" },
  { name: "cnic_expiry_date", label: "CNIC Expiry", type: "date" },
  { name: "blood_group", label: "Blood Group", placeholder: "e.g., A+, O-" },
  { name: "domicile", label: "Domicile" },
  { name: "permanent_village", label: "Village" },
  { name: "permanent_post_office", label: "Post Office" },
  { name: "permanent_thana", label: "Thana" },
  { name: "permanent_tehsil", label: "Tehsil" },
  { name: "permanent_district", label: "District" },
  { name: "service_enrollment_date", label: "Enrollment Date", type: "date" },
  { name: "service_reenrollment_date", label: "Re-enrollment Date", type: "date" },
  { name: "particulars_verified_by_sho_on", label: "Verified by SHO", type: "date" },
  { name: "particulars_verified_by_ssp_on", label: "Verified by SSP", type: "date" },
  { name: "verified_by_khidmat_markaz", label: "Khidmat Markaz Verified" },
  { name: "police_training_letter_date", label: "Police Training Letter Date", type: "date" },
  { name: "eobi_no", label: "EOBI No" },
  { name: "insurance", label: "Insurance" },
  { name: "social_security", label: "Social Security" },
  { name: "original_doc_held", label: "Documents Held" },
  { name: "documents_handed_over_to", label: "Documents Handed Over To" },
  { name: "vaccination_certificate", label: "Vaccination Certificate" },
  { name: "employment_status", label: "Status", type: "select", options: statuses },
];

export default function Employees2Page() {
  const router = useRouter();
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [search, setSearch] = React.useState("");
  
  const [formOpen, setFormOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee2 | null>(null);
  const [formMode, setFormMode] = React.useState<"create" | "edit" | "view">("create");
  const [formError, setFormError] = React.useState<string | null>(null);

  const { data, loading, error, refetch } = useApi<{ employees: Employee2ListItem[]; total: number }>(
    "/api/employees",
    { skip: (page - 1) * pageSize, limit: pageSize, search: search || undefined }
  );


  const createMutation = useMutation(
    (data: Employee2Create) => api.post<Employee2>("/api/employees", data),
    { onSuccess: () => { setFormOpen(false); refetch(); }, onError: (e) => setFormError(e.message) }
  );

  const updateMutation = useMutation(
    ({ employeeId, data }: { employeeId: string; data: Employee2Update }) => api.put<Employee2>(`/api/employees/${employeeId}`, data),
    { onSuccess: () => { setFormOpen(false); refetch(); }, onError: (e) => setFormError(e.message) }
  );

  const deleteMutation = useMutation(
    (employeeId: string) => api.del<void>(`/api/employees/${employeeId}`),
    { onSuccess: () => { setDeleteOpen(false); setSelectedEmployee(null); refetch(); } }
  );

  const handleAdd = () => { setSelectedEmployee(null); setFormMode("create"); setFormError(null); setFormOpen(true); };
  
  const handleEdit = async (emp: Employee2ListItem) => {
    try {
      const fullEmployee = await api.get<Employee2>(`/api/employees/by-db-id/${emp.id}`);
      setSelectedEmployee(fullEmployee);
      setFormMode("edit");
      setFormError(null);
      setFormOpen(true);
    } catch (e) {
      console.error("Failed to fetch employee details", e);
    }
  };

  const handleView = (emp: Employee2ListItem) => {
    router.push(`/employees2/${emp.id}`);
  };

  const handleDelete = (emp: Employee2ListItem) => {
    setSelectedEmployee(emp as unknown as Employee2);
    setDeleteOpen(true);
  };

  // Helper function to upload profile photo
  const uploadProfilePhoto = async (employeeDbId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    
    // Get auth token from localStorage
    const token = localStorage.getItem("access_token");
    
    const response = await fetch(
      `${API_BASE_URL}/api/employees/by-db-id/${employeeDbId}/profile-photo`,
      { 
        method: "POST", 
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to upload profile photo");
    }
    
    return response.json();
  };

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    setFormError(null);
    
    // Extract file from values (don't send to API)
    const profilePhotoFile = values.profile_photo_file as File | undefined;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { profile_photo_file: _photoFile, ...employeeData } = values;
    
    try {
      if (formMode === "create") {
        // Create employee first
        const newEmployee = await api.post<Employee2>("/api/employees", employeeData as Employee2Create);
        
        // Upload photo if provided
        if (profilePhotoFile && newEmployee.id) {
          try {
            await uploadProfilePhoto(newEmployee.id, profilePhotoFile);
          } catch (photoErr) {
            console.error("Photo upload failed:", photoErr);
            // Don't fail the whole operation, employee was created
          }
        }
        
        setFormOpen(false);
        refetch();
      } else if (formMode === "edit" && selectedEmployee) {
        // Update employee
        await api.put<Employee2>(`/api/employees/${selectedEmployee.employee_id}`, employeeData as Employee2Update);
        
        // Upload new photo if provided
        if (profilePhotoFile && selectedEmployee.id) {
          try {
            await uploadProfilePhoto(selectedEmployee.id, profilePhotoFile);
          } catch (photoErr) {
            console.error("Photo upload failed:", photoErr);
          }
        }
        
        setFormOpen(false);
        refetch();
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const employees = data?.employees || [];
  const total = data?.total || 0;
  const activeCount = employees.filter(e => (e.employment_status || "Active").toLowerCase() === "active").length;
  const allocatedCount = employees.filter(e => e.last_site_assigned).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Master Profiles</h2>
          <p className="text-muted-foreground">Manage employee master profiles and records.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">Total Employees</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <UserCheck className="h-5 w-5 text-green-500" />
            <div><p className="text-2xl font-bold">{activeCount}</p><p className="text-xs text-muted-foreground">Active</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-blue-500" />
            <div><p className="text-2xl font-bold">{allocatedCount}</p><p className="text-xs text-muted-foreground">Allocated</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <UserX className="h-5 w-5 text-yellow-500" />
            <div><p className="text-2xl font-bold">{total - activeCount}</p><p className="text-xs text-muted-foreground">Inactive</p></div>
          </div>
        </CardContent></Card>
      </div>

      <DataTable
        columns={employeeColumns}
        data={employees}
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
        searchPlaceholder="Search employees..."
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        addLabel="Add Employee"
        emptyMessage="No employees found."
      />

      <FormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === "create" ? "Add Employee" : formMode === "edit" ? "Edit Employee" : "Employee Details"}
        fields={employeeFormFields}
        initialValues={(selectedEmployee || { status: "active", allocation_status: "unallocated" }) as Record<string, unknown>}
        onSubmit={handleFormSubmit}
        submitLabel={formMode === "create" ? "Create Employee" : "Update Employee"}
        loading={createMutation.loading || updateMutation.loading}
        error={formError}
        mode={formMode}
        size="xl"
      />

      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => selectedEmployee && deleteMutation.mutate(selectedEmployee.employee_id)}
        title="Delete Employee"
        itemName={selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : undefined}
        loading={deleteMutation.loading}
      />
    </div>
  );
}
