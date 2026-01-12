"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { DataTable, Column } from "@/components/crud/DataTable";
import { DeleteDialog } from "@/components/crud/DeleteDialog";
import { FormDialog, FormField } from "@/components/crud/FormDialog";
import { useApi, useMutation } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

type Permission = {
  id: number;
  key: string;
  description?: string | null;
};

type Role = {
  id: number;
  name: string;
  description?: string | null;
  is_system: boolean;
  permissions: Permission[];
};

export default function RolesPage() {
  const { data: roles, loading: rolesLoading, error: rolesError, setData: setRoles } = useApi<Role[]>("/api/admin/roles");
  const { data: permissions, loading: permsLoading } = useApi<Permission[]>("/api/admin/permissions");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const createRole = useMutation<Role, Record<string, unknown>>((values) =>
    api.post<Role>("/api/admin/roles", {
      name: values.name,
      description: values.description ?? null,
      permission_keys: Array.isArray(values.permission_keys)
        ? values.permission_keys.map((v) => String(v))
        : [],
    })
  );

  const updateRole = useMutation<Role, { id: number; values: Record<string, unknown> }>(({ id, values }) =>
    api.put<Role>(`/api/admin/roles/${id}`, {
      name: values.name,
      description: values.description ?? null,
      permission_keys: Array.isArray(values.permission_keys)
        ? values.permission_keys.map((v) => String(v))
        : [],
    })
  );

  const deleteRole = useMutation<void, number>((id) => api.del<void>(`/api/admin/roles/${id}`));

  const columns = useMemo<Column<Role>[]>(
    () => [
      { key: "name", header: "Role", className: "font-semibold" },
      { key: "description", header: "Description", className: "text-muted-foreground" },
      {
        key: "permissions",
        header: "Permissions",
        render: (_v, row) => (row.permissions.length ? row.permissions.map((p) => p.key).join(", ") : "-"),
      },
      {
        key: "is_system",
        header: "System",
        render: (v) => (v ? "Yes" : "No"),
        className: "text-muted-foreground",
      },
    ],
    []
  );

  const permissionOptions = useMemo(
    () => permissions?.map((p) => ({ value: p.key, label: p.key })) ?? [],
    [permissions]
  );

  const fields: FormField[] = [
    { name: "name", label: "Role name", required: true, placeholder: "e.g. Manager" },
    { name: "description", label: "Description", type: "textarea", rows: 3, placeholder: "What does this role cover?" },
    {
      name: "permission_keys",
      label: "Permissions",
      type: "select",
      multiple: true,
      options: permissionOptions,
      placeholder: "Select permissions",
    },
  ];

  const openCreate = () => {
    setMode("create");
    setSelected(null);
    setDialogOpen(true);
  };

  const openEdit = (role: Role) => {
    setMode("edit");
    setSelected(role);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    const payloadKeys = Array.isArray(values.permission_keys)
      ? values.permission_keys.map((v) => String(v))
      : [];

    if (mode === "create") {
      const created = await createRole.mutate({ ...values, permission_keys: payloadKeys });
      if (created) {
        setRoles((prev) => (prev ? [...prev, created] : [created]));
        setDialogOpen(false);
      }
    } else if (selected) {
      const updated = await updateRole.mutate({ id: selected.id, values: { ...values, permission_keys: payloadKeys } });
      if (updated) {
        setRoles((prev) => prev?.map((r) => (r.id === updated.id ? updated : r)) ?? [updated]);
        setDialogOpen(false);
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    const ok = await deleteRole.mutate(targetId);
    if (ok === null) return;
    setRoles((prev) => prev?.filter((r) => r.id !== targetId) ?? []);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Roles</h2>
        <p className="text-muted-foreground">Manage user roles and their permissions.</p>
      </div>

      <DataTable
        columns={columns}
        data={roles ?? []}
        loading={rolesLoading}
        error={rolesError ?? createRole.error ?? updateRole.error ?? deleteRole.error}
        keyField="id"
        onAdd={openCreate}
        addLabel="Add Role"
        onEdit={openEdit}
        rowActions={(row) =>
          !row.is_system ? (
            <DropdownMenuItem
              onClick={() => setDeleteTarget(row)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          ) : null
        }
        emptyMessage="No roles found."
      />

      <FormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={mode === "create" ? "Add Role" : "Edit Role"}
        description="Bundle permissions into reusable roles."
        fields={fields}
        initialValues={
          selected
            ? {
                name: selected.name,
                description: selected.description ?? "",
                permission_keys: selected.permissions.map((p) => p.key),
              }
            : { name: "", description: "", permission_keys: [] }
        }
        onSubmit={handleSubmit}
        submitLabel={mode === "create" ? "Create" : "Save changes"}
        loading={createRole.loading || updateRole.loading || permsLoading}
        error={createRole.error || updateRole.error}
        mode={mode}
      />

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.name}
        loading={deleteRole.loading}
        title="Delete role"
        description={deleteTarget?.is_system ? "System roles cannot be deleted." : undefined}
      />
    </div>
  );
}
