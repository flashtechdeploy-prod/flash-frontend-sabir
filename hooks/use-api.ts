"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ApiError } from "@/lib/api";

type QueryValue = string | number | boolean | null | undefined;

export interface UseApiOptions<T> {
  initialData?: T;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

export function useApi<T>(
  path: string | null,
  query?: Record<string, QueryValue>,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const { initialData = null, enabled = true, onSuccess, onError } = options;
  const [data, setData] = useState<T | null>(initialData as T | null);
  const [loading, setLoading] = useState(enabled && !!path);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled || !path) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get<T>(path, { query });
      setData(response);
      onSuccess?.(response);
    } catch (e) {
      const errorMessage = e instanceof ApiError ? e.message : "Failed to fetch data";
      setError(errorMessage);
      onError?.(e instanceof Error ? e : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [path, JSON.stringify(query), enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData, setData };
}

export interface UseMutationOptions<T, V> {
  onSuccess?: (data: T, variables: V) => void;
  onError?: (error: Error, variables: V) => void;
}

export interface UseMutationResult<T, V> {
  mutate: (variables: V) => Promise<T | null>;
  loading: boolean;
  error: string | null;
  data: T | null;
  reset: () => void;
}

export function useMutation<T, V = unknown>(
  mutationFn: (variables: V) => Promise<T>,
  options: UseMutationOptions<T, V> = {}
): UseMutationResult<T, V> {
  const { onSuccess, onError } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (variables: V): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mutationFn(variables);
      setData(result);
      onSuccess?.(result, variables);
      return result;
    } catch (e) {
      const errorMessage = e instanceof ApiError ? e.message : "Operation failed";
      setError(errorMessage);
      onError?.(e instanceof Error ? e : new Error(errorMessage), variables);
      return null;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { mutate, loading, error, data, reset };
}

// CRUD API helper functions
export const createCrudApi = <T, TCreate, TUpdate>(basePath: string) => ({
  getAll: (query?: Record<string, QueryValue>) => 
    api.get<{ items?: T[]; employees?: T[]; vehicles?: T[]; clients?: T[]; total: number }>(basePath, { query }),
  
  getOne: (id: number | string) => 
    api.get<T>(`${basePath}/${id}`),
  
  create: (data: TCreate) => 
    api.post<T>(basePath, data),
  
  update: (id: number | string, data: TUpdate) => 
    api.put<T>(`${basePath}/${id}`, data),
  
  delete: (id: number | string) => 
    api.del<void>(`${basePath}/${id}`),
});
