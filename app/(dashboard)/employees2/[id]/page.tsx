"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Employee2 } from "@/lib/types";
import { useApi } from "@/hooks/use-api";
import { API_BASE_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  Shield, 
  FileText, 
  Building2,
  CreditCard,
  Heart,
  Edit,
  Camera
} from "lucide-react";

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: employee, loading, error, refetch } = useApi<Employee2>(
    `/api/employees/by-db-id/${employeeId}`
  );

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Get auth token from localStorage
      const token = localStorage.getItem("access_token");

      const response = await fetch(`${API_BASE_URL}/api/employees/by-db-id/${employeeId}/profile-photo`, {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to upload photo");
      }

      // Refresh employee data to get new photo URL
      refetch();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }


  if (error || !employee) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Employee not found or error loading data.</p>
        </div>
      </div>
    );
  }

  const fullName = `${employee.first_name || ""} ${employee.last_name || ""}`.trim();

  const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
    value ? (
      <div className="flex justify-between py-2 border-b border-border/50 last:border-0">
        <span className="text-muted-foreground text-sm">{label}</span>
        <span className="font-medium text-sm">{value}</span>
      </div>
    ) : null
  );

    console.log(employee);


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Employee Profile</h2>
            <p className="text-muted-foreground">{employee.employee_id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/employees2`)}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
        </div>
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            {/* Avatar with upload functionality */}
            <div className="relative group">
              <Avatar className="h-24 w-24">
                <AvatarImage src={employee.profile_photo || ""} alt={fullName} />
                <AvatarFallback className="text-2xl">{employee.first_name?.charAt(0) || "?"}</AvatarFallback>
              </Avatar>
              {/* Upload overlay */}
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={uploading}
              />
            </div>
            <div className="flex-1">
              {uploadError && (
                <div className="mb-2 text-sm text-destructive bg-destructive/10 px-3 py-1 rounded">
                  {uploadError}
                </div>
              )}
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold">{fullName}</h3>
                <Badge variant={employee.employment_status?.toLowerCase() === "active" ? "default" : "secondary"}>
                  {employee.employment_status || "Active"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Designation</p>
                  <p className="font-medium">{employee.designation || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Service Rank</p>
                  <p className="font-medium">{employee.service_rank || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Service Unit</p>
                  <p className="font-medium">{employee.service_unit || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">FSS Number</p>
                  <p className="font-medium">{employee.fss_number || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="Profile Photo" value={employee.profile_photo || "Not uploaded"} />
            <InfoRow label="Father's Name" value={employee.father_name} />
            <InfoRow label="Date of Birth" value={employee.date_of_birth} />
            <InfoRow label="Gender" value={employee.gender} />
            <InfoRow label="Blood Group" value={employee.blood_group} />
            <InfoRow label="CNIC" value={employee.cnic} />
            <InfoRow label="CNIC Expiry" value={employee.cnic_expiry_date} />
            <InfoRow label="Domicile" value={employee.domicile} />
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="h-5 w-5" /> Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="Mobile Number" value={employee.mobile_number} />
            <InfoRow label="Home Contact" value={employee.home_contact_no} />
            <InfoRow label="Personal Phone" value={employee.personal_phone_number} />
            <InfoRow label="Email" value={employee.email} />
            <InfoRow label="Emergency Contact" value={employee.emergency_contact_name} />
            <InfoRow label="Emergency Number" value={employee.emergency_contact_number} />
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" /> Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="Permanent Address" value={employee.permanent_address} />
            <InfoRow label="Temporary Address" value={employee.temporary_address} />
            <InfoRow label="Village" value={employee.permanent_village} />
            <InfoRow label="Post Office" value={employee.permanent_post_office} />
            <InfoRow label="Thana" value={employee.permanent_thana} />
            <InfoRow label="Tehsil" value={employee.permanent_tehsil} />
            <InfoRow label="District" value={employee.permanent_district} />
            <InfoRow label="City" value={employee.city} />
          </CardContent>
        </Card>

        {/* Employment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" /> Employment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="Employee ID" value={employee.employee_id} />
            <InfoRow label="Department" value={employee.department} />
            <InfoRow label="Employment Type" value={employee.employment_type} />
            <InfoRow label="Shift Type" value={employee.shift_type} />
            <InfoRow label="Base Location" value={employee.base_location} />
            <InfoRow label="Last Site Assigned" value={employee.last_site_assigned} />
            <InfoRow label="Reporting Manager" value={employee.reporting_manager} />
            <InfoRow label="Enrolled As" value={employee.enrolled_as} />
          </CardContent>
        </Card>

        {/* Service History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" /> Service History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="Service Enrollment Date" value={employee.service_enrollment_date} />
            <InfoRow label="Re-enrollment Date" value={employee.service_reenrollment_date} />
            <InfoRow label="Retired From" value={employee.retired_from?.join(", ")} />
            <InfoRow label="Medical Category" value={employee.medical_category} />
            <InfoRow label="Discharge Cause" value={employee.discharge_cause} />
            <InfoRow label="Interviewed By" value={employee.interviewed_by} />
            <InfoRow label="Introduced By" value={employee.introduced_by} />
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" /> Financial Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="Basic Salary" value={employee.basic_salary} />
            <InfoRow label="Allowances" value={employee.allowances} />
            <InfoRow label="Total Salary" value={employee.total_salary} />
            <InfoRow label="Bank Name" value={employee.bank_name} />
            <InfoRow label="Account Number" value={employee.account_number} />
            <InfoRow label="EOBI No" value={employee.eobi_no} />
            <InfoRow label="Insurance" value={employee.insurance} />
            <InfoRow label="Social Security" value={employee.social_security} />
          </CardContent>
        </Card>

        {/* Verification & Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" /> Verification & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="Security Clearance" value={employee.security_clearance} />
            <InfoRow label="Verified by SHO On" value={employee.particulars_verified_by_sho_on} />
            <InfoRow label="Verified by SSP On" value={employee.particulars_verified_by_ssp_on} />
            <InfoRow label="Khidmat Markaz Verified" value={employee.verified_by_khidmat_markaz} />
            <InfoRow label="Police Clearance" value={employee.police_clearance ? "Yes" : "No"} />
            <InfoRow label="Background Screening" value={employee.background_screening ? "Yes" : "No"} />
            <InfoRow label="Guard Card" value={employee.guard_card ? "Yes" : "No"} />
          </CardContent>
        </Card>

        {/* Training & Certifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="h-5 w-5" /> Training & Certifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="Basic Security Training" value={employee.basic_security_training ? "Yes" : "No"} />
            <InfoRow label="Fire Safety Training" value={employee.fire_safety_training ? "Yes" : "No"} />
            <InfoRow label="First Aid Certification" value={employee.first_aid_certification ? "Yes" : "No"} />
            <InfoRow label="Police Training Letter Date" value={employee.police_training_letter_date} />
            <InfoRow label="Vaccination Certificate" value={employee.vaccination_certificate} />
          </CardContent>
        </Card>
      </div>

      {/* Remarks */}
      {employee.remarks && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Remarks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{employee.remarks}</p>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Created: {new Date(employee.created_at).toLocaleString()}</span>
            {employee.updated_at && <span>Updated: {new Date(employee.updated_at).toLocaleString()}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
