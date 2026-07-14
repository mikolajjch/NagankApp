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

export interface ApiGroupMember {
  sub: string;
  display_name: string;
  reputation: number;
}

export interface ApiGroupComment {
  id: string;
  owner_sub: string;
  owner_name: string;
  text: string;
  created_at: number;
}

export interface ApiGroup {
  id: string;
  name: string;
  created_by: string;
  members: ApiGroupMember[];
  comments: ApiGroupComment[];
}

export interface ApiTrackPoint {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number | null;
}

export interface ApiTrack {
  owner_sub: string;
  points: ApiTrackPoint[];
}

export interface ApiRoutePoint {
  lat: number;
  lng: number;
}

export interface ApiRoute {
  id: string;
  owner_sub: string;
  points: ApiRoutePoint[];
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

  getTracks: (getToken: () => Promise<string>, actionId: string) =>
    request<ApiTrack[]>(`/api/actions/${actionId}/tracks`, getToken),

  postTrackPoint: (
    getToken: () => Promise<string>,
    actionId: string,
    point: ApiTrackPoint
  ) =>
    request<void>(`/api/actions/${actionId}/tracks/points`, getToken, {
      method: "POST",
      body: JSON.stringify(point),
    }),

  clearAllTracks: (getToken: () => Promise<string>) =>
    request<void>("/api/actions/tracks", getToken, { method: "DELETE" }),

  getRoutes: (getToken: () => Promise<string>, actionId: string) =>
    request<ApiRoute[]>(`/api/actions/${actionId}/routes`, getToken),

  saveRoute: (
    getToken: () => Promise<string>,
    actionId: string,
    points: ApiRoutePoint[]
  ) =>
    request<ApiRoute>(`/api/actions/${actionId}/routes`, getToken, {
      method: "POST",
      body: JSON.stringify({ points }),
    }),
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

  delete: (getToken: () => Promise<string>, id: string) =>
    request<void>(`/api/groups/${id}`, getToken, { method: "DELETE" }),

  join: (getToken: () => Promise<string>, id: string) =>
    request<ApiGroup>(`/api/groups/${id}/join`, getToken, { method: "POST" }),

  addComment: (getToken: () => Promise<string>, groupId: string, text: string) =>
    request<ApiGroupComment>(`/api/groups/${groupId}/comments`, getToken, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  deleteComment: (getToken: () => Promise<string>, groupId: string, commentId: string) =>
    request<void>(`/api/groups/${groupId}/comments/${commentId}`, getToken, {
      method: "DELETE",
    }),
};

// ── Health (unsecured) ────────────────────────────────────────────────────

export async function checkHealth(): Promise<{ status: string }> {
  const res = await fetch(`${BASE_URL}/health`);
  return res.json();
}
