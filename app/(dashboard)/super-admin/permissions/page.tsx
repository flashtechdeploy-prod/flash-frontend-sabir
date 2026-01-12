"use client";

import { useMemo, useState } from "react";
import { DataTable, Column } from "@/components/crud/DataTable";
import { DeleteDialog } from "@/components/crud/DeleteDialog";
import { FormDialog, FormField } from "@/components/crud/FormDialog";
import { useApi, useMutation } from "@/hooks/use-api";
import { api } from "@/lib/api";

type Permission = {
  id: number;
  key: string;
  description?: string | null;
};

export default function PermissionsPage() {
  const { data, loading, error, refetch, setData } = useApi<Permission[]>("/api/admin/permissions");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<Permission | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Permission | null>(null);

  const createPermission = useMutation<Permission, Record<string, unknown>>((values) =>
    api.post<Permission>("/api/admin/permissions", {
      key: values.key,
      description: values.description ?? null,
    })
  );

  const updatePermission = useMutation<Permission, { id: number; values: Record<string, unknown> }>(({ id, values }) =>
    api.put<Permission>(`/api/admin/permissions/${id}`, {
      key: values.key,
      description: values.description ?? null,
    })
  );

  const deletePermission = useMutation<void, number>((id) => api.del<void>(`/api/admin/permissions/${id}`));

  const columns = useMemo<Column<Permission>[]>(
    () => [
      { key: "key", header: "Key", className: "font-semibold" },
      { key: "description", header: "Description", className: "text-muted-foreground" },
    ],
    []
  );

  const fields: FormField[] = [
    { name: "key", label: "Permission Key", required: true, placeholder: "e.g. rbac:admin" },
    { name: "description", label: "Description", type: "textarea", placeholder: "What does this permission allow?", rows: 3 },
  ];

  const openCreate = () => {
    setMode("create");
    setSelected(null);
    setDialogOpen(true);
  };

  const openEdit = (permission: Permission) => {
    setMode("edit");
    setSelected(permission);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (mode === "create") {
      const created = await createPermission.mutate(values);
      if (created) {
        setData((prev) => (prev ? [...prev, created] : [created]));
        setDialogOpen(false);
      }
    } else if (selected) {
      const updated = await updatePermission.mutate({ id: selected.id, values });
      if (updated) {
        setData((prev) => prev?.map((p) => (p.id === updated.id ? updated : p)) ?? [updated]);
        setDialogOpen(false);
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    const ok = await deletePermission.mutate(targetId);
    if (ok === null) return;
    setData((prev) => prev?.filter((p) => p.id !== targetId) ?? []);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Permissions</h2>
        <p className="text-muted-foreground">Manage system permissions.</p>
      </div>

      <DataTable
        columns={columns}
        data={data ?? []}
        loading={loading}
        error={error ?? createPermission.error ?? updatePermission.error ?? deletePermission.error}
        keyField="id"
        onAdd={openCreate}
        addLabel="Add Permission"
        onEdit={openEdit}
        onDelete={(row) => setDeleteTarget(row)}
        emptyMessage="No permissions found."
      />

      <FormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={mode === "create" ? "Add Permission" : "Edit Permission"}
        description="Define granular access control rules."
        fields={fields}
        initialValues={
          selected || {
            key: "",
            description: "",
          }
        }
        onSubmit={handleSubmit}
        submitLabel={mode === "create" ? "Create" : "Save changes"}
        loading={createPermission.loading || updatePermission.loading}
        error={createPermission.error || updatePermission.error}
        mode={mode}
      />

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.key}
        loading={deletePermission.loading}
        title="Delete permission"
      />
    </div>
  );
}
