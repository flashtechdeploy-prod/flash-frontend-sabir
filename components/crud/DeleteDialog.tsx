"use client";

import * as React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void | null> | void | null;
  title?: string;
  description?: string;
  itemName?: string;
  loading?: boolean;
}

export function DeleteDialog({
  open,
  onClose,
  onConfirm,
  title = "Delete Item",
  description,
  itemName,
  loading = false,
}: DeleteDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  if (!open) return null;

  const displayDescription = description ?? (
    itemName 
      ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
      : "Are you sure you want to delete this item? This action cannot be undone."
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Dialog */}
      <div className="relative z-10 w-full max-w-sm bg-background rounded-xl shadow-lg border p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {displayDescription}
            </p>
          </div>
          
          <div className="flex items-center gap-2 w-full mt-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleConfirm} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
