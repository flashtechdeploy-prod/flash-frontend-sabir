"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useApi, useMutation } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit2, Trash2, Plus } from "lucide-react";
import { DataTable, Column, FormDialog, FormField, DeleteDialog } from "@/components/crud";

interface Client {
  id: number;
  client_code: string;
  client_name: string;
  client_type: string;
  industry_type?: string | null;
  status: string;
  location?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  registration_number?: string | null;
  vat_gst_number?: string | null;
  website?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string | null;
}

type ClientUpdate = Partial<Omit<Client, "id" | "created_at" | "updated_at">>;

interface ClientSite {
  id: number;
  client_id: number;
  site_name: string;
  site_type?: string | null;
  site_address?: string | null;
  city?: string | null;
  risk_level?: string | null;
  status: string;
  created_at: string;
}

interface ClientContract {
  id: number;
  client_id: number;
  contract_number: string;
  start_date?: string | null;
  end_date?: string | null;
  contract_type?: string | null;
  billing_cycle?: string | null;
  payment_terms?: string | null;
  monthly_cost?: number;
  penalty_overtime_rules?: string | null;
  notes?: string | null;
  status: string;
  created_at: string;
  updated_at?: string | null;
}

const industries = [
  { value: "security", label: "Security Services" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "retail", label: "Retail" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "government", label: "Government" },
  { value: "hospitality", label: "Hospitality" },
  { value: "real_estate", label: "Real Estate" },
  { value: "banking", label: "Banking & Finance" },
  { value: "other", label: "Other" },
];

const clientStatuses = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "prospect", label: "Prospect" },
  { value: "suspended", label: "Suspended" },
];

const clientTypes = [
  { value: "Corporate", label: "Corporate" },
  { value: "Individual", label: "Individual" },
  { value: "Government", label: "Government" },
];

const clientFormFields: FormField[] = [
  { name: "client_code", label: "Client Code", required: true, placeholder: "e.g., CL-001" },
  { name: "client_name", label: "Client Name", required: true, placeholder: "Enter client name" },
  { name: "client_type", label: "Client Type", type: "select", required: true, options: clientTypes },
  { name: "industry_type", label: "Industry", type: "select", options: industries },
  { name: "status", label: "Status", type: "select", required: true, options: clientStatuses },
  { name: "location", label: "Location", placeholder: "City/Region" },
  { name: "address", label: "Address", placeholder: "Street address", colSpan: 2 },
  { name: "email", label: "Contact Email", type: "email", placeholder: "email@example.com" },
  { name: "phone", label: "Contact Phone", type: "tel", placeholder: "+1234567890" },
  { name: "registration_number", label: "Registration Number", placeholder: "Company registration" },
  { name: "vat_gst_number", label: "VAT/GST Number", placeholder: "Tax ID" },
  { name: "website", label: "Website", type: "url", placeholder: "https://example.com" },
  { name: "notes", label: "Notes", type: "textarea", colSpan: 2, rows: 3 },
];

const siteColumns: Column<ClientSite>[] = [
  { key: "site_name", header: "Site Name" },
  { key: "site_type", header: "Type" },
  { key: "site_address", header: "Address" },
  { key: "city", header: "City" },
  { key: "risk_level", header: "Risk Level" },
  { 
    key: "status", 
    header: "Status",
    render: (value) => {
      const status = String(value || "active").toLowerCase();
      return <Badge variant={status === "active" ? "default" : "secondary"}>{String(value)}</Badge>;
    }
  },
];

const siteFormFields: FormField[] = [
  { name: "site_name", label: "Site Name", required: true, placeholder: "Enter site name" },
  { name: "site_type", label: "Site Type", placeholder: "e.g., Office, Warehouse, Store" },
  { name: "site_address", label: "Address", placeholder: "Street address", colSpan: 2 },
  { name: "city", label: "City", placeholder: "City name" },
  { name: "risk_level", label: "Risk Level", type: "select", options: [
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
  ]},
  { name: "status", label: "Status", type: "select", required: true, options: [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
  ]},
];

const contractColumns: Column<ClientContract>[] = [
  { key: "contract_number", header: "Contract #" },
  { key: "contract_type", header: "Type" },
  { key: "start_date", header: "Start Date" },
  { key: "end_date", header: "End Date" },
  { key: "billing_cycle", header: "Billing Cycle" },
  { 
    key: "monthly_cost", 
    header: "Monthly Cost",
    render: (value) => value ? `$${Number(value).toFixed(2)}` : "N/A"
  },
  { 
    key: "status", 
    header: "Status",
    render: (value) => {
      const status = String(value || "active").toLowerCase();
      return <Badge variant={status === "active" ? "default" : "secondary"}>{String(value)}</Badge>;
    }
  },
];

const contractFormFields: FormField[] = [
  { name: "contract_number", label: "Contract Number", required: true, placeholder: "e.g., CNT-001" },
  { name: "contract_type", label: "Contract Type", placeholder: "e.g., Security Services" },
  { name: "start_date", label: "Start Date", type: "date" },
  { name: "end_date", label: "End Date", type: "date" },
  { name: "billing_cycle", label: "Billing Cycle", type: "select", options: [
    { value: "Monthly", label: "Monthly" },
    { value: "Quarterly", label: "Quarterly" },
    { value: "Annually", label: "Annually" },
  ]},
  { name: "payment_terms", label: "Payment Terms", placeholder: "e.g., Net 30" },
  { name: "monthly_cost", label: "Monthly Cost", type: "number", placeholder: "0.00" },
  { name: "penalty_overtime_rules", label: "Penalty/OT Rules", type: "textarea", colSpan: 2, rows: 2 },
  { name: "notes", label: "Notes", type: "textarea", colSpan: 2, rows: 3 },
  { name: "status", label: "Status", type: "select", required: true, options: [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
    { value: "Expired", label: "Expired" },
  ]},
];

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = parseInt(params.id as string);

  const { data: client, loading, error, refetch } = useApi<Client>(`/api/clients/${clientId}`);
  const { data: sites, refetch: refetchSites } = useApi<ClientSite[]>(`/api/clients/${clientId}/sites`);
  const { data: contracts, refetch: refetchContracts } = useApi<ClientContract[]>(`/api/clients/${clientId}/contracts`);
  
  console.log("Client Data:", client);

  const [clientFormOpen, setClientFormOpen] = React.useState(false);
  const [siteFormOpen, setSiteFormOpen] = React.useState(false);
  const [selectedSite, setSelectedSite] = React.useState<ClientSite | null>(null);
  const [siteFormMode, setSiteFormMode] = React.useState<"create" | "edit">("create");

  const [contractFormOpen, setContractFormOpen] = React.useState(false);
  const [selectedContract, setSelectedContract] = React.useState<ClientContract | null>(null);
  const [contractFormMode, setContractFormMode] = React.useState<"create" | "edit">("create");

  const updateClientMutation = useMutation(
    (data: ClientUpdate) => api.put<Client>(`/api/clients/${clientId}`, data),
    {
      onSuccess: () => {
        setClientFormOpen(false);
        refetch();
      }
    }
  );

  const createSiteMutation = useMutation(
    (data: Record<string, unknown>) => api.post<ClientSite>(`/api/clients/${clientId}/sites`, data),
    {
      onSuccess: () => {
        setSiteFormOpen(false);
        refetchSites();
      }
    }
  );

  const updateSiteMutation = useMutation(
    ({ id, data }: { id: number; data: Record<string, unknown> }) => 
      api.put<ClientSite>(`/api/clients/${clientId}/sites/${id}`, data),
    {
      onSuccess: () => {
        setSiteFormOpen(false);
        refetchSites();
      }
    }
  );

  const createContractMutation = useMutation(
    (data: Record<string, unknown>) => api.post<ClientContract>(`/api/clients/${clientId}/contracts`, data),
    {
      onSuccess: () => {
        setContractFormOpen(false);
        refetchContracts();
      }
    }
  );

  const updateContractMutation = useMutation(
    ({ id, data }: { id: number; data: Record<string, unknown> }) => 
      api.put<ClientContract>(`/api/clients/${clientId}/contracts/${id}`, data),
    {
      onSuccess: () => {
        setContractFormOpen(false);
        refetchContracts();
      }
    }
  );

  const handleAddSite = () => {
    setSelectedSite(null);
    setSiteFormMode("create");
    setSiteFormOpen(true);
  };

  const handleAddContract = () => {
    setSelectedContract(null);
    setContractFormMode("create");
    setContractFormOpen(true);
  };

  const handleEditClient = () => {
    setClientFormOpen(true);
  };

  const handleEditSite = (site: ClientSite) => {
    setSelectedSite(site);
    setSiteFormMode("edit");
    setSiteFormOpen(true);
  };

  const handleEditContract = (contract: ClientContract) => {
    setSelectedContract(contract);
    setContractFormMode("edit");
    setContractFormOpen(true);
  };

  const handleClientSubmit = async (values: Record<string, unknown>) => {
    await updateClientMutation.mutate(values as ClientUpdate);
  };

  const handleSiteSubmit = async (values: Record<string, unknown>) => {
    if (siteFormMode === "create") {
      await createSiteMutation.mutate(values);
    } else if (siteFormMode === "edit" && selectedSite) {
      await updateSiteMutation.mutate({ id: selectedSite.id, data: values });
    }
  };

  const handleContractSubmit = async (values: Record<string, unknown>) => {
    if (contractFormMode === "create") {
      await createContractMutation.mutate(values);
    } else if (contractFormMode === "edit" && selectedContract) {
      await updateContractMutation.mutate({ id: selectedContract.id, data: values });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border b-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="space-y-4">
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
        <div className="text-destructive">Failed to load client details</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.back()} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{client.client_name}</h1>
            <p className="text-muted-foreground">{client.client_code}</p>
          </div>
        </div>
        <Badge variant={client.status === "active" ? "default" : "secondary"}>
          {client.status}
        </Badge>
      </div>

      {/* Main Info Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Client Information</CardTitle>
          <Button 
            onClick={handleEditClient}
            variant="outline"
            size="sm"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Client Type</p>
              <p className="text-lg">{client.client_type}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Industry</p>
              <p className="text-lg">{client.industry_type || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-lg">{client.email || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p className="text-lg">{client.phone || "N/A"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Address</p>
              <p className="text-lg">{client.address || "N/A"}</p>
            </div>
            {client.registration_number && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Registration Number</p>
                <p className="text-lg">{client.registration_number}</p>
              </div>
            )}
            {client.vat_gst_number && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">VAT/GST Number</p>
                <p className="text-lg">{client.vat_gst_number}</p>
              </div>
            )}
            {client.website && (
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Website</p>
                <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-lg text-primary hover:underline">
                  {client.website}
                </a>
              </div>
            )}
            {client.notes && (
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Notes</p>
                <p className="text-lg">{client.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sites Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Sites</h2>
          <Button onClick={handleAddSite} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Site
          </Button>
        </div>

        {sites && sites.length > 0 ? (
          <DataTable
            columns={siteColumns}
            data={sites}
            keyField="id"
            onEdit={handleEditSite}
          />
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">No sites added yet</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Contracts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Contracts</h2>
          <Button onClick={handleAddContract} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Contract
          </Button>
        </div>

        {contracts && contracts.length > 0 ? (
          <DataTable
            columns={contractColumns}
            data={contracts}
            keyField="id"
            onEdit={handleEditContract}
          />
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">No contracts added yet</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Client Edit Dialog */}
      <FormDialog
        open={clientFormOpen}
        onClose={() => setClientFormOpen(false)}
        title="Edit Client"
        fields={clientFormFields}
        initialValues={client || {}}
        onSubmit={handleClientSubmit}
        loading={updateClientMutation.isLoading}
        error={updateClientMutation.error}
      />

      {/* Site Form Dialog */}
      <FormDialog
        open={siteFormOpen}
        onClose={() => setSiteFormOpen(false)}
        title={siteFormMode === "create" ? "Add New Site" : "Edit Site"}
        fields={siteFormFields}
        initialValues={selectedSite || {}}
        onSubmit={handleSiteSubmit}
        loading={createSiteMutation.isLoading || updateSiteMutation.isLoading}
        error={createSiteMutation.error || updateSiteMutation.error}
      />

      {/* Contract Form Dialog */}
      <FormDialog
        open={contractFormOpen}
        onClose={() => setContractFormOpen(false)}
        title={contractFormMode === "create" ? "Add New Contract" : "Edit Contract"}
        fields={contractFormFields}
        initialValues={selectedContract || {}}
        onSubmit={handleContractSubmit}
        loading={createContractMutation.isLoading || updateContractMutation.isLoading}
        error={createContractMutation.error || updateContractMutation.error}
      />
    </div>
  );
}
