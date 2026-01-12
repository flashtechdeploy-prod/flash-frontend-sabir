"use client";

import * as React from "react";
import { X, Loader2, Upload, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface FormField {
  name: string;
  label: string;
  type?: "text" | "number" | "email" | "password" | "date" | "datetime-local" | "tel" | "url" | "textarea" | "select" | "checkbox" | "file";
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: { value: string; label: string }[];
  multiple?: boolean;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  accept?: string;
  helperText?: string;
  className?: string;
  colSpan?: 1 | 2;
  defaultValue?: unknown;
  validation?: (value: unknown) => string | null;
}

export interface FormDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  fields: FormField[];
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
  submitLabel?: string;
  loading?: boolean;
  error?: string | null;
  mode?: "create" | "edit" | "view";
  size?: "sm" | "md" | "lg" | "xl";
}

export function FormDialog({
  open,
  onClose,
  title,
  description,
  fields,
  initialValues = {},
  onSubmit,
  submitLabel = "Save",
  loading = false,
  error = null,
  mode = "create",
  size = "md",
}: FormDialogProps) {
  const [values, setValues] = React.useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (open) {
      setValues(initialValues);
      setErrors({});
      setTouched({});
    }
  }, [open, JSON.stringify(initialValues)]);

  const handleChange = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    const field = fields.find((f) => f.name === name);
    if (field?.validation) {
      const error = field.validation(values[name]);
      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    for (const field of fields) {
      const value = values[field.name];
      
      // Required validation
      const isEmptyArray = Array.isArray(value) && value.length === 0;
      if (field.required && (value === undefined || value === null || value === "" || isEmptyArray)) {
        newErrors[field.name] = `${field.label} is required`;
        continue;
      }
      
      // Custom validation
      if (field.validation) {
        const error = field.validation(value);
        if (error) {
          newErrors[field.name] = error;
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "view") {
      onClose();
      return;
    }
    
    if (!validate()) return;
    
    await onSubmit(values);
  };

  if (!open) return null;

  const sizeClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  }[size];

  const isReadOnly = mode === "view";

  // Helper to render file input with preview
  const renderFileInput = (field: FormField, value: unknown, fieldError?: string) => {
    const file = value as File | null;
    
    return (
      <div className="space-y-2">
        <div 
          className={cn(
            "relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200 hover:border-primary hover:bg-primary/5",
            fieldError ? "border-destructive" : "border-border",
            file ? "border-primary bg-primary/5" : ""
          )}
        >
          <input
            id={field.name}
            type="file"
            accept={field.accept}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => handleChange(field.name, e.target.files?.[0] || null)}
            disabled={field.disabled || loading || isReadOnly}
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              {field.accept?.includes("image") ? (
                <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt="Preview" 
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <ImageIcon className="h-8 w-8 text-primary" />
              )}
              <div className="text-left">
                <p className="text-sm font-medium truncate max-w-44">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
          ) : (
            <div className="py-2">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Click to upload</p>
              {field.helperText && <p className="text-xs text-muted-foreground mt-1">{field.helperText}</p>}
            </div>
          )}
        </div>
        {file && (
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            className="text-xs text-muted-foreground"
            onClick={() => handleChange(field.name, null)}
          >
            Remove file
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 animate-in fade-in duration-200" onClick={onClose} />
      
      {/* Dialog */}
      <div className={cn(
        "relative z-10 w-full bg-background rounded-xl shadow-lg border max-h-[90vh] overflow-hidden flex flex-col",
        "animate-in zoom-in-95 slide-in-from-bottom-4 duration-300",
        sizeClass
      )}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              {fields.map((field) => {
                const value = values[field.name];
                const fieldError = touched[field.name] ? errors[field.name] : undefined;
                const colSpanClass = field.colSpan === 2 ? "col-span-2" : "";
                
                return (
                  <div key={field.name} className={cn("space-y-1.5", colSpanClass, field.className)}>
                    <Label htmlFor={field.name}>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    
                    {field.type === "textarea" ? (
                      <Textarea
                        id={field.name}
                        value={String(value ?? "")}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        onBlur={() => handleBlur(field.name)}
                        placeholder={field.placeholder}
                        disabled={field.disabled || loading || isReadOnly}
                        rows={field.rows ?? 3}
                        className={cn(fieldError && "border-destructive")}
                      />
                    ) : field.type === "select" ? (
                      <select
                        id={field.name}
                        multiple={field.multiple}
                        value={
                          field.multiple
                            ? (Array.isArray(value) ? value.map((v) => String(v)) : [])
                            : String(value ?? "")
                        }
                        onChange={(e) => {
                          if (field.multiple) {
                            const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
                            handleChange(field.name, selected);
                          } else {
                            handleChange(field.name, e.target.value);
                          }
                        }}
                        onBlur={() => handleBlur(field.name)}
                        disabled={field.disabled || loading || isReadOnly}
                        className={cn(
                          "h-10 w-full rounded-md border bg-input/20 px-2 text-sm",
                          fieldError && "border-destructive"
                        )}
                      >
                        {!field.multiple && <option value="">{field.placeholder ?? "Select..."}</option>}
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "checkbox" ? (
                      <div className="flex items-center gap-2">
                        <input
                          id={field.name}
                          type="checkbox"
                          checked={Boolean(value)}
                          onChange={(e) => handleChange(field.name, e.target.checked)}
                          onBlur={() => handleBlur(field.name)}
                          disabled={field.disabled || loading || isReadOnly}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        {field.helperText && (
                          <span className="text-sm text-muted-foreground">{field.helperText}</span>
                        )}
                      </div>
                    ) : field.type === "file" ? (
                      renderFileInput(field, value, fieldError)
                    ) : (
                      <Input
                        id={field.name}
                        type={field.type ?? "text"}
                        value={String(value ?? "")}
                        onChange={(e) => {
                          if (field.type === "number") {
                            handleChange(field.name, e.target.value === "" ? null : Number(e.target.value));
                          } else {
                            handleChange(field.name, e.target.value);
                          }
                        }}
                        onBlur={() => handleBlur(field.name)}
                        placeholder={field.placeholder}
                        disabled={field.disabled || loading || isReadOnly}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        className={cn(fieldError && "border-destructive")}
                      />
                    )}
                    
                    {fieldError && (
                      <p className="text-xs text-destructive">{fieldError}</p>
                    )}
                    {field.helperText && field.type !== "checkbox" && field.type !== "file" && (
                      <p className="text-xs text-muted-foreground">{field.helperText}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {isReadOnly ? "Close" : "Cancel"}
            </Button>
            {!isReadOnly && (
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {submitLabel}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
