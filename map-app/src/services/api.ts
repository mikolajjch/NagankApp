/**
 * HTTP client for the NagankApp backend.
 * Automatically attaches a JWT (Bearer token) to every secured request.
 */

const BASE_URL = import.meta.env.VITE_API_URL as string ?? "http://localhost:8000";

async function request<T>(
  path: string,
  getToken: () => Promise<string>,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────

export interface ApiAction {
  id: string;
  name: string;
  description: string;
  created_by: string;
  group_id: string | null;
  points: { lat: number; lng: number }[];
}

export interface ApiGroup {
  id: string;
  name: string;
  created_by: string;
  members: string[];
}

// ── Actions ───────────────────────────────────────────────────────────────

export const actionsApi = {
  list: (getToken: () => Promise<string>) =>
    request<ApiAction[]>("/api/actions", getToken),

  create: (
    getToken: () => Promise<string>,
    body: { name: string; description?: string; group_id?: string; points: { lat: number; lng: number }[] }
  ) =>
    request<ApiAction>("/api/actions", getToken, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (
    getToken: () => Promise<string>,
    id: string,
    body: { name: string; description?: string; group_id?: string; points: { lat: number; lng: number }[] }
  ) =>
    request<ApiAction>(`/api/actions/${id}`, getToken, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: (getToken: () => Promise<string>, id: string) =>
    request<void>(`/api/actions/${id}`, getToken, { method: "DELETE" }),
};

// ── Groups ────────────────────────────────────────────────────────────────

export const groupsApi = {
  list: (getToken: () => Promise<string>) =>
    request<ApiGroup[]>("/api/groups", getToken),

  create: (getToken: () => Promise<string>, name: string) =>
    request<ApiGroup>("/api/groups", getToken, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
};

// ── Health (unsecured) ────────────────────────────────────────────────────

export async function checkHealth(): Promise<{ status: string }> {
  const res = await fetch(`${BASE_URL}/health`);
  return res.json();
}
