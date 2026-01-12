import { API_BASE_URL } from "./config";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type QueryValue = string | number | boolean | null | undefined;

function buildQuery(params: Record<string, QueryValue>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

async function request<T>(
  path: string,
  opts: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    query?: Record<string, QueryValue>;
    body?: unknown;
    signal?: AbortSignal;
    timeoutMs?: number;
  } = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}${buildQuery(opts.query ?? {})}`;

  const token = typeof window !== "undefined" ? window.localStorage.getItem("access_token") : null;

  const controller = new AbortController();
  const timeoutMs = typeof opts.timeoutMs === "number" ? opts.timeoutMs : 60000;
  let didTimeout = false;
  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);

  const onAbort = () => controller.abort();
  if (opts.signal) {
    if (opts.signal.aborted) controller.abort();
    else opts.signal.addEventListener("abort", onAbort, { once: true });
  }

  const isFormData = opts.body instanceof FormData;
  const body: BodyInit | undefined = isFormData
    ? (opts.body as FormData)
    : opts.body
      ? JSON.stringify(opts.body)
      : undefined;

  let res: Response;
  try {
    try {
      res = await fetch(url, {
        method: opts.method ?? "GET",
        headers: {
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body,
        signal: controller.signal,
        cache: "no-store",
      });
    } catch (e: unknown) {
      const name = (e && typeof e === "object" && "name" in e) ? (e as { name?: unknown }).name : undefined;
      if (name === "AbortError") {
        if (didTimeout) {
          throw new ApiError("Request timed out", 408, null);
        }
      }
      throw e;
    }
  } finally {
    clearTimeout(timeoutId);
    if (opts.signal) opts.signal.removeEventListener("abort", onAbort);
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    if (typeof data === "object" && data !== null && "detail" in data) {
      const maybeDetail = (data as { detail?: unknown }).detail;
      if (typeof maybeDetail === "string") msg = maybeDetail;
      else if (maybeDetail !== undefined && maybeDetail !== null) {
        try {
          msg = JSON.stringify(maybeDetail);
        } catch {
          msg = String(maybeDetail);
        }
      }
    } else if (typeof data === "string" && data.trim()) {
      msg = data;
    }
    throw new ApiError(msg, res.status, data);
  }

  return data as T;
}

export const api = {
  baseUrl: API_BASE_URL,
  get: request,
  post: <T>(path: string, body: unknown, opts?: { timeoutMs?: number }) => 
    request<T>(path, { method: "POST", body, timeoutMs: opts?.timeoutMs }),
  put: <T>(path: string, body: unknown, opts?: { timeoutMs?: number }) => 
    request<T>(path, { method: "PUT", body, timeoutMs: opts?.timeoutMs }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  deleteBulk: <T>(path: string, body: unknown) => request<T>(path, { method: "DELETE", body }),
};
