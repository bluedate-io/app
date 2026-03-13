// ─── API Client ───────────────────────────────────────────────────────────────
// Typed fetch wrapper for internal server-to-server or client-side calls.
// Used by front-end components or server actions to call your own API.

import { config } from "@/config";
import type { ApiResponse } from "@/types/api.types";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string> = {};

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private buildUrl(path: string, params?: RequestOptions["params"]): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) url.searchParams.set(k, String(v));
      });
    }
    return url.toString();
  }

  private async request<T>(
    method: string,
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const { body, params, headers, ...rest } = options;

    const res = await fetch(this.buildUrl(path, params), {
      method,
      headers: {
        "Content-Type": "application/json",
        ...this.defaultHeaders,
        ...headers,
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
      ...rest,
    });

    const data = (await res.json()) as ApiResponse<T>;
    return data;
  }

  get<T>(path: string, options?: RequestOptions) {
    return this.request<T>("GET", path, options);
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>("POST", path, { ...options, body });
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>("PATCH", path, { ...options, body });
  }

  delete<T>(path: string, options?: RequestOptions) {
    return this.request<T>("DELETE", path, options);
  }

  // Returns a new client with an Authorization header pre-attached
  withToken(token: string): ApiClient {
    const child = new ApiClient(this.baseUrl);
    child.defaultHeaders = { Authorization: `Bearer ${token}` };
    return child;
  }
}

export const apiClient = new ApiClient(config.app.url + "/api");
