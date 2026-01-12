"use client";

import { useMemo, useState } from "react";
import { DataTable, Column } from "@/components/crud/DataTable";
import { DeleteDialog } from "@/components/crud/DeleteDialog";
import { FormDialog, FormField } from "@/components/crud/FormDialog";
import { useApi, useMutation } from "@/hooks/use-api";
import { api } from "@/lib/api";

type Role = {
  id: number;
  name: string;
};

type AdminUser = {
  id: number;
  email: string;
  username: string;
  full_name?: string | null;
  is_active: boolean;
  is_superuser: boolean;
  roles: Role[];
};

export default function UsersPage() {
  const { data: users, loading: usersLoading, error: usersError, setData: setUsers } = useApi<AdminUser[]>("/api/admin/users");
  const { data: roles, loading: rolesLoading } = useApi<Role[]>("/api/admin/roles");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const createUser = useMutation<AdminUser, Record<string, unknown>>((values) => {
    const roleIds = Array.isArray(values.role_ids) ? values.role_ids.map((v) => Number(v)) : [];
    return api.post<AdminUser>("/api/admin/users", {
      email: values.email,
      username: values.username,
      full_name: values.full_name ?? null,
      password: values.password,
      is_active: Boolean(values.is_active),
      is_superuser: Boolean(values.is_superuser),
      role_ids: roleIds,
    });
  });

  const updateUser = useMutation<AdminUser, { id: number; values: Record<string, unknown> }>(({ id, values }) => {
    const roleIds = Array.isArray(values.role_ids) ? values.role_ids.map((v) => Number(v)) : [];
    const payload: Record<string, unknown> = {
      email: values.email,
      username: values.username,
      full_name: values.full_name ?? null,
      is_active: Boolean(values.is_active),
      is_superuser: Boolean(values.is_superuser),
      role_ids: roleIds,
    };

    if (values.password) {
      payload.password = values.password;
    }

    return api.put<AdminUser>(`/api/admin/users/${id}`, payload);
  });

  const deleteUser = useMutation<void, number>((id) => api.del<void>(`/api/admin/users/${id}`));

  const columns = useMemo<Column<AdminUser>[]>(
    () => [
      { key: "username", header: "Username", className: "font-semibold" },
      { key: "email", header: "Email" },
      { key: "full_name", header: "Full Name", className: "text-muted-foreground" },
      {
        key: "roles",
        header: "Roles",
        render: (_v, row) => (row.roles.length ? row.roles.map((r) => r.name).join(", ") : "-"),
      },
      {
        key: "is_active",
        header: "Active",
        render: (v) => (v ? "Yes" : "No"),
        className: "text-muted-foreground",
      },
      {
        key: "is_superuser",
        header: "Superuser",
        render: (v) => (v ? "Yes" : "No"),
        className: "text-muted-foreground",
      },
    ],
    []
  );

  const roleOptions = useMemo(() => roles?.map((r) => ({ value: String(r.id), label: r.name })) ?? [], [roles]);

  const fields: FormField[] = [
    { name: "email", label: "Email", type: "email", required: true },
    { name: "username", label: "Username", required: true },
    { name: "full_name", label: "Full name", placeholder: "Optional" },
    {
      name: "password",
      label: "Password",
      type: "password",
      required: mode === "create",
      helperText: mode === "edit" ? "Leave blank to keep current password." : undefined,
    },
    { name: "is_active", label: "Active", type: "checkbox", helperText: "Allow login" },
    { name: "is_superuser", label: "Superuser", type: "checkbox", helperText: "Bypass permission checks" },
    {
      name: "role_ids",
      label: "Roles",
      type: "select",
      multiple: true,
      options: roleOptions,
      placeholder: "Assign roles",
    },
  ];

  const openCreate = () => {
    setMode("create");
    setSelected(null);
    setDialogOpen(true);
  };

  const openEdit = (user: AdminUser) => {
    setMode("edit");
    setSelected(user);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (mode === "create") {
      const created = await createUser.mutate(values);
      if (created) {
        setUsers((prev) => (prev ? [...prev, created] : [created]));
        setDialogOpen(false);
      }
    } else if (selected) {
      const updated = await updateUser.mutate({ id: selected.id, values });
      if (updated) {
        setUsers((prev) => prev?.map((u) => (u.id === updated.id ? updated : u)) ?? [updated]);
        setDialogOpen(false);
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    const ok = await deleteUser.mutate(targetId);
    if (ok === null) return;
    setUsers((prev) => prev?.filter((u) => u.id !== targetId) ?? []);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Users</h2>
        <p className="text-muted-foreground">Manage system users and their access.</p>
      </div>

      <DataTable
        columns={columns}
        data={users ?? []}
        loading={usersLoading}
        error={usersError ?? createUser.error ?? updateUser.error ?? deleteUser.error}
        keyField="id"
        onAdd={openCreate}
        addLabel="Add User"
        onEdit={openEdit}
        onDelete={(row) => setDeleteTarget(row)}
        emptyMessage="No users found."
      />

      <FormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={mode === "create" ? "Add User" : "Edit User"}
        description="Create or update system users."
        fields={fields}
        initialValues={
          selected
            ? {
                email: selected.email,
                username: selected.username,
                full_name: selected.full_name ?? "",
                password: "",
                is_active: selected.is_active,
                is_superuser: selected.is_superuser,
                role_ids: selected.roles.map((r) => String(r.id)),
              }
            : {
                email: "",
                username: "",
                full_name: "",
                password: "",
                is_active: true,
                is_superuser: false,
                role_ids: [],
              }
        }
        onSubmit={handleSubmit}
        submitLabel={mode === "create" ? "Create" : "Save changes"}
        loading={createUser.loading || updateUser.loading || rolesLoading}
        error={createUser.error || updateUser.error}
        mode={mode}
      />

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.username}
        loading={deleteUser.loading}
        title="Delete user"
      />
    </div>
  );
}
