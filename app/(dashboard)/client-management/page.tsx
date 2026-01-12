"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { DataTable, Column, FormDialog, FormField, DeleteDialog } from "@/components/crud";
import { useApi, useMutation } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Users, FileText, ChevronRight } from "lucide-react";

// Types
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

type ClientCreate = Omit<Client, "id" | "created_at" | "updated_at">;
type ClientUpdate = Partial<ClientCreate>;

const clientColumns: Column<Client>[] = [
  { key: "client_code", header: "Code", width: "100px" },
  { key: "client_name", header: "Client Name" },
  { key: "client_type", header: "Type" },
  { key: "industry_type", header: "Industry" },
  { key: "email", header: "Email" },
  { key: "phone", header: "Phone" },
  { 
    key: "status", 
    header: "Status",
    render: (value) => {
      const status = String(value || "active").toLowerCase();
      const variant = status === "active" ? "default" : status === "inactive" ? "secondary" : "outline";
      return <Badge variant={variant}>{String(value) || "Active"}</Badge>;
    }
  },
];

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

// Site columns for expanded view
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

export default function ClientManagementPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const router = useRouter();
  
  // Dialog states
  const [formOpen, setFormOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(null);
  const [formMode, setFormMode] = React.useState<"create" | "edit" | "view">("create");
  const [formError, setFormError] = React.useState<string | null>(null);
  
  // Site management
  const [expandedClientId, setExpandedClientId] = React.useState<number | null>(null);
  const [siteFormOpen, setSiteFormOpen] = React.useState(false);
  const [selectedSite, setSelectedSite] = React.useState<ClientSite | null>(null);
  const [siteFormMode, setSiteFormMode] = React.useState<"create" | "edit">("create");
  const [siteFormError, setSiteFormError] = React.useState<string | null>(null);
  const [siteDeleteOpen, setSiteDeleteOpen] = React.useState(false);

  // Fetch clients
  const { data, loading, error, refetch } = useApi<Client[]>(
    "/api/clients",
    { skip: (page - 1) * pageSize, limit: pageSize, search: search || undefined }
  );

  // Fetch all clients for stats (without pagination)
  const { data: allClients } = useApi<Client[]>("/api/clients", {});

  // Fetch sites for expanded client
  const { data: sitesData, refetch: refetchSites } = useApi<ClientSite[]>(
    expandedClientId ? `/api/clients/${expandedClientId}/sites` : "",
    {},
    { enabled: !!expandedClientId }
  );

  // Calculate stats from all clients
  const [totalSites, setTotalSites] = React.useState(0);
  const [activeContracts, setActiveContracts] = React.useState(0);

  React.useEffect(() => {
    const fetchStats = async () => {
      if (!allClients || allClients.length === 0) {
        setTotalSites(0);
        setActiveContracts(0);
        return;
      }

      try {
        // Fetch all sites and contracts for all clients
        const sitesPromises = allClients.map(client => 
          api.get<ClientSite[]>(`/api/clients/${client.id}/sites`).catch(() => [])
        );
        const contractsPromises = allClients.map(client =>
          api.get<any[]>(`/api/clients/${client.id}/contracts`).catch(() => [])
        );

        const [sitesResults, contractsResults] = await Promise.all([
          Promise.all(sitesPromises),
          Promise.all(contractsPromises)
        ]);

        // Calculate totals
        const totalSitesCount = sitesResults.reduce((sum, sites) => sum + sites.length, 0);
        const activeContractsCount = contractsResults.reduce((sum, contracts) => {
          const active = contracts.filter(c => c.status?.toLowerCase() === "active").length;
          return sum + active;
        }, 0);

        setTotalSites(totalSitesCount);
        setActiveContracts(activeContractsCount);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [allClients]);

  // Client mutations
  const createMutation = useMutation(
    (data: ClientCreate) => api.post<Client>("/api/clients", data),
    {
      onSuccess: () => {
        setFormOpen(false);
        refetch();
      },
      onError: (e) => setFormError(e.message),
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: ClientUpdate }) => api.put<Client>(`/api/clients/${id}`, data),
    {
      onSuccess: () => {
        setFormOpen(false);
        refetch();
      },
      onError: (e) => setFormError(e.message),
    }
  );

  const deleteMutation = useMutation(
    (id: number) => api.del<void>(`/api/clients/${id}`),
    {
      onSuccess: () => {
        setDeleteOpen(false);
        setSelectedClient(null);
        refetch();
      },
    }
  );

  // Site mutations
  const createSiteMutation = useMutation(
    (data: Partial<ClientSite>) => api.post<ClientSite>(`/api/clients/${expandedClientId}/sites`, data),
    {
      onSuccess: () => {
        setSiteFormOpen(false);
        refetchSites();
      },
      onError: (e) => setSiteFormError(e.message),
    }
  );

  const updateSiteMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<ClientSite> }) =>
      api.put<ClientSite>(`/api/clients/${expandedClientId}/sites/${id}`, data),
    {
      onSuccess: () => {
        setSiteFormOpen(false);
        refetchSites();
      },
      onError: (e) => setSiteFormError(e.message),
    }
  );

  const deleteSiteMutation = useMutation(
    (id: number) => api.del<void>(`/api/clients/${expandedClientId}/sites/${id}`),
    {
      onSuccess: () => {
        setSiteDeleteOpen(false);
        setSelectedSite(null);
        refetchSites();
      },
    }
  );

  // Client handlers
  const handleAdd = () => {
    setSelectedClient(null);
    setFormMode("create");
    setFormError(null);
    setFormOpen(true);
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setFormMode("edit");
    setFormError(null);
    setFormOpen(true);
  };

  const handleView = (client: Client) => {
    router.push(`/client-management/${client.id}`);
  };

  const handleDelete = (client: Client) => {
    setSelectedClient(client);
    setDeleteOpen(true);
  };

  const handleFormSubmit = async (values: Record<string, unknown>) => {
    setFormError(null);
    if (formMode === "create") {
      await createMutation.mutate(values as ClientCreate);
    } else if (formMode === "edit" && selectedClient) {
      await updateMutation.mutate({ id: selectedClient.id, data: values as ClientUpdate });
    }
  };

  // Site handlers
  const handleAddSite = () => {
    setSelectedSite(null);
    setSiteFormMode("create");
    setSiteFormError(null);
    setSiteFormOpen(true);
  };

  const handleEditSite = (site: ClientSite) => {
    setSelectedSite(site);
    setSiteFormMode("edit");
    setSiteFormError(null);
    setSiteFormOpen(true);
  };

  const handleDeleteSite = (site: ClientSite) => {
    setSelectedSite(site);
    setSiteDeleteOpen(true);
  };

  const handleSiteFormSubmit = async (values: Record<string, unknown>) => {
    setSiteFormError(null);
    if (siteFormMode === "create") {
      await createSiteMutation.mutate(values as Partial<ClientSite>);
    } else if (siteFormMode === "edit" && selectedSite) {
      await updateSiteMutation.mutate({ id: selectedSite.id, data: values as Partial<ClientSite> });
    }
  };

  const clients = data || [];
  const allClientsArray = allClients || [];
  const total = allClientsArray.length;
  const activeClientsCount = allClientsArray.filter(c => c.status?.toLowerCase() === "active").length;
  const sites = sitesData || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Client Management</h2>
        <p className="text-muted-foreground">Manage clients and their sites.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground">Total Clients</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2">
              <MapPin className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeClientsCount}</p>
              <p className="text-xs text-muted-foreground">Active Clients</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalSites}</p>
              <p className="text-xs text-muted-foreground">Total Sites</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/10 p-2">
              <FileText className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeContracts}</p>
              <p className="text-xs text-muted-foreground">Active Contracts</p>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={clientColumns}
        data={clients}
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
        searchPlaceholder="Search clients..."
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        addLabel="Add Client"
        emptyMessage="No clients found. Add your first client to get started."
      />

      {/* Expanded Sites Section */}
      {expandedClientId && (
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              <h3 className="font-semibold">Sites for {clients.find(c => c.id === expandedClientId)?.client_name}</h3>
            </div>
            <Button size="sm" onClick={handleAddSite}>
              Add Site
            </Button>
          </div>
          <div className="p-4">
            <DataTable
              columns={siteColumns}
              data={sites}
              keyField="id"
              onEdit={handleEditSite}
              onDelete={handleDeleteSite}
              emptyMessage="No sites found for this client."
            />
          </div>
        </div>
      )}

      {/* Client Form Dialog */}
      <FormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === "create" ? "Add Client" : "Edit Client"}
        fields={clientFormFields}
        initialValues={(selectedClient || { status: "active" }) as Record<string, unknown>}
        onSubmit={handleFormSubmit}
        submitLabel={formMode === "create" ? "Create Client" : "Update Client"}
        loading={createMutation.loading || updateMutation.loading}
        error={formError}
        mode={formMode}
        size="lg"
      />

      {/* Client Delete Dialog */}
      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => selectedClient && deleteMutation.mutate(selectedClient.id)}
        title="Delete Client"
        itemName={selectedClient?.client_name}
        loading={deleteMutation.loading}
      />

      {/* Site Form Dialog */}
      <FormDialog
        open={siteFormOpen}
        onClose={() => setSiteFormOpen(false)}
        title={siteFormMode === "create" ? "Add Site" : "Edit Site"}
        fields={siteFormFields}
        initialValues={(selectedSite || { status: "active" }) as Record<string, unknown>}
        onSubmit={handleSiteFormSubmit}
        submitLabel={siteFormMode === "create" ? "Create Site" : "Update Site"}
        loading={createSiteMutation.loading || updateSiteMutation.loading}
        error={siteFormError}
        mode={siteFormMode}
        size="md"
      />

      {/* Site Delete Dialog */}
      <DeleteDialog
        open={siteDeleteOpen}
        onClose={() => setSiteDeleteOpen(false)}
        onConfirm={() => selectedSite && deleteSiteMutation.mutate(selectedSite.id)}
        title="Delete Site"
        itemName={selectedSite?.site_name}
        loading={deleteSiteMutation.loading}
      />
    </div>
  );
}
