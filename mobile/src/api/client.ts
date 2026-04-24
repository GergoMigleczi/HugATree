// src/api/client.ts
import { API_URL } from "../config/config";

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  accessToken?: string; // optional bearer token
};

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (error: unknown) {
    console.error("parseJsonSafe failed", { status: res.status, text, error });
    return {};
  }
}

export async function apiRequest<T>(path: string, opts: ApiRequestOptions = {}): Promise<T> {
  const method = opts.method ?? "GET";
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (opts.accessToken) headers.Authorization = `Bearer ${opts.accessToken}`;

  const fullUrl = `${API_URL}${path}`;
  let res: Response;
  try {
    console.log(`[API] ${method} ${fullUrl}`, opts.body || "");
    res = await fetch(fullUrl, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[API] Network error: ${method} ${fullUrl}`, errMsg);
    throw new Error(
      `Network error: ${errMsg}. Check that API_URL="${API_URL}" is correct and the backend is running.`
    );
  }

  const data = await parseJsonSafe(res);
  console.log(`[API] ${method} ${fullUrl} -> status ${res.status}`, data);

  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    const err = new Error(msg) as Error & { status?: number; data?: any };
    err.status = res.status;
    err.data = data;
    console.error(`[API] Error response:`, err.message, data);
    throw err;
  }

  console.log(`API Response: ${method} ${API_URL}${path}`, data, res);
  return data as T;
}