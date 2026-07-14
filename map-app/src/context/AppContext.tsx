import React, { createContext, useCallback, useContext, useEffect, useReducer } from "react";
import type { ActionArea } from "../types/ActionArea.ts";
import type { Track, TrackPoint } from "../types/Track";
import type { Route, RoutePoint } from "../types/Route.ts";
import type { Group } from "../types/Group.ts";
import { useAuth } from "../auth/AuthContext";
import {
  actionsApi,
  groupsApi,
  type ApiAction,
  type ApiGroup,
  type ApiRoute,
  type ApiTrack,
} from "../services/api";

// ── API → local type mapping ─────────────────────────────────────────────

function apiActionToActionArea(a: ApiAction): ActionArea {
  return {
    id: a.id,
    name: a.name,
    description: a.description,
    area: a.points,
    groupId: a.group_id,
  };
}

function apiGroupToGroup(g: ApiGroup): Group {
  return {
    id: g.id,
    name: g.name,
    ownerId: g.created_by,
    members: g.members.map((m) => ({
      sub: m.sub,
      displayName: m.display_name,
      reputation: m.reputation,
    })),
    comments: g.comments.map((c) => ({
      id: c.id,
      groupId: g.id,
      ownerSub: c.owner_sub,
      ownerName: c.owner_name,
      text: c.text,
      createdAt: c.created_at,
    })),
  };
}

function apiTrackToTrack(actionId: string, t: ApiTrack): Track {
  return {
    actionId,
    ownerSub: t.owner_sub,
    points: t.points.map((p) => ({
      lat: p.lat,
      lng: p.lng,
      timestamp: p.timestamp,
      accuracy: p.accuracy,
    })),
  };
}

function apiRouteToRoute(actionId: string, r: ApiRoute): Route {
  return { id: r.id, actionId, ownerSub: r.owner_sub, points: r.points };
}

// ── State ─────────────────────────────────────────────────────────────────

interface AppState {
  actions: ActionArea[];
  groups: Group[];
  tracks: Track[]; // tracks for the currently active action only
  routes: Route[]; // routes for the currently active action only

  activeActionId: string | null;
  editActionMode: boolean;

  drawingPoints: { lat: number; lng: number }[];
  drawMode: boolean;

  routeDrawMode: boolean;
  routePoints: { lat: number; lng: number }[];

  lastMapClick: { lat: number; lng: number } | null;

  activeGroupId: string | null;
}

type Action =
  | { type: "ADD_DRAW_POINT"; payload: { lat: number; lng: number } }
  | { type: "CLEAR_DRAW_POINTS" }
  | { type: "SET_ACTIVE_ACTION"; payload: string }
  | { type: "SET_EDIT_ACTION_MODE"; payload: boolean }
  | { type: "SET_DRAW_MODE"; payload: boolean }
  | { type: "SET_ROUTE_DRAW_MODE"; payload: boolean }
  | { type: "ADD_ROUTE_POINT"; payload: { lat: number; lng: number } }
  | { type: "CLEAR_ROUTE_POINTS" }
  | { type: "SET_LAST_MAP_CLICK"; payload: { lat: number; lng: number } }
  | { type: "SET_ACTIVE_GROUP"; payload: string | null }
  | { type: "SET_ACTIONS"; payload: ActionArea[] }
  | { type: "SET_GROUPS"; payload: Group[] }
  | { type: "SET_TRACKS"; payload: Track[] }
  | { type: "SET_ROUTES"; payload: Route[] };

const initialState: AppState = {
  actions: [],
  groups: [],
  tracks: [],
  routes: [],

  activeActionId: null,
  editActionMode: false,

  drawingPoints: [],
  drawMode: false,

  routeDrawMode: false,
  routePoints: [],

  lastMapClick: null,

  activeGroupId: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "ADD_DRAW_POINT":
      return { ...state, drawingPoints: [...state.drawingPoints, action.payload] };
    case "CLEAR_DRAW_POINTS":
      return { ...state, drawingPoints: [] };
    case "SET_ACTIVE_ACTION":
      return { ...state, activeActionId: action.payload };
    case "SET_EDIT_ACTION_MODE":
      return { ...state, editActionMode: action.payload };
    case "SET_DRAW_MODE":
      return { ...state, drawMode: action.payload };
    case "SET_ROUTE_DRAW_MODE":
      return { ...state, routeDrawMode: action.payload };
    case "ADD_ROUTE_POINT":
      return { ...state, routePoints: [...state.routePoints, action.payload] };
    case "CLEAR_ROUTE_POINTS":
      return { ...state, routePoints: [] };
    case "SET_LAST_MAP_CLICK":
      return { ...state, lastMapClick: action.payload };
    case "SET_ACTIVE_GROUP":
      return {
        ...state,
        activeGroupId: action.payload,
        activeActionId: null,
        editActionMode: false,
      };
    case "SET_ACTIONS":
      return { ...state, actions: action.payload };
    case "SET_GROUPS":
      return { ...state, groups: action.payload };
    case "SET_TRACKS":
      return { ...state, tracks: action.payload };
    case "SET_ROUTES":
      return { ...state, routes: action.payload };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────

interface AppApi {
  createAction: (name: string, description: string, area: { lat: number; lng: number }[]) => Promise<string>;
  updateAction: (actionId: string, name: string, description: string, area: { lat: number; lng: number }[]) => Promise<void>;
  deleteAction: (actionId: string) => Promise<void>;
  createGroup: (name: string) => Promise<string>;
  deleteGroup: (groupId: string) => Promise<void>;
  joinGroup: (groupId: string) => Promise<void>;
  addComment: (groupId: string, text: string) => Promise<void>;
  deleteComment: (groupId: string, commentId: string) => Promise<void>;
  postTrackPoint: (point: Omit<TrackPoint, "accuracy"> & { accuracy?: number | null }) => Promise<void>;
  clearAllTracks: () => Promise<void>;
  saveRoute: () => Promise<void>;
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  api: AppApi;
} | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { isAuthenticated, getAccessTokenSilently } = useAuth();
  const getToken = useCallback(() => getAccessTokenSilently(), [getAccessTokenSilently]);

  const refreshActions = useCallback(async () => {
    const list = await actionsApi.list(getToken);
    dispatch({ type: "SET_ACTIONS", payload: list.map(apiActionToActionArea) });
  }, [getToken]);

  const refreshGroups = useCallback(async () => {
    const list = await groupsApi.list(getToken);
    dispatch({ type: "SET_GROUPS", payload: list.map(apiGroupToGroup) });
  }, [getToken]);

  const refreshTracks = useCallback(
    async (actionId: string) => {
      const list = await actionsApi.getTracks(getToken, actionId);
      dispatch({ type: "SET_TRACKS", payload: list.map((t) => apiTrackToTrack(actionId, t)) });
    },
    [getToken]
  );

  const refreshRoutes = useCallback(
    async (actionId: string) => {
      const list = await actionsApi.getRoutes(getToken, actionId);
      dispatch({ type: "SET_ROUTES", payload: list.map((r) => apiRouteToRoute(actionId, r)) });
    },
    [getToken]
  );

  // Poll shared data (actions + groups) while logged in
  useEffect(() => {
    if (!isAuthenticated) return;
    refreshActions();
    refreshGroups();
    const interval = setInterval(() => {
      refreshActions();
      refreshGroups();
    }, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshActions, refreshGroups]);

  // Poll tracks (near-real-time positions) while an action is active
  useEffect(() => {
    if (!isAuthenticated || !state.activeActionId) {
      dispatch({ type: "SET_TRACKS", payload: [] });
      dispatch({ type: "SET_ROUTES", payload: [] });
      return;
    }
    const actionId = state.activeActionId;
    refreshTracks(actionId);
    refreshRoutes(actionId);
    const interval = setInterval(() => refreshTracks(actionId), 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, state.activeActionId, refreshTracks, refreshRoutes]);

  const api: AppApi = {
    createAction: async (name, description, area) => {
      const created = await actionsApi.create(getToken, {
        name,
        description,
        group_id: state.activeGroupId ?? undefined,
        points: area,
      });
      await refreshActions();
      return created.id;
    },

    updateAction: async (actionId, name, description, area) => {
      const current = state.actions.find((a) => a.id === actionId);
      await actionsApi.update(getToken, actionId, {
        name,
        description,
        group_id: current?.groupId ?? undefined,
        points: area,
      });
      await refreshActions();
    },

    deleteAction: async (actionId) => {
      await actionsApi.delete(getToken, actionId);
      await refreshActions();
    },

    createGroup: async (name) => {
      const created = await groupsApi.create(getToken, name);
      await refreshGroups();
      return created.id;
    },

    deleteGroup: async (groupId) => {
      await groupsApi.delete(getToken, groupId);
      await refreshGroups();
    },

    joinGroup: async (groupId) => {
      await groupsApi.join(getToken, groupId);
      await refreshGroups();
    },

    addComment: async (groupId, text) => {
      await groupsApi.addComment(getToken, groupId, text);
      await refreshGroups();
    },

    deleteComment: async (groupId, commentId) => {
      await groupsApi.deleteComment(getToken, groupId, commentId);
      await refreshGroups();
    },

    postTrackPoint: async (point) => {
      if (!state.activeActionId) return;
      await actionsApi.postTrackPoint(getToken, state.activeActionId, point);
      await refreshTracks(state.activeActionId);
    },

    clearAllTracks: async () => {
      await actionsApi.clearAllTracks(getToken);
      if (state.activeActionId) await refreshTracks(state.activeActionId);
    },

    saveRoute: async () => {
      if (!state.activeActionId || state.routePoints.length < 2) return;
      const points: RoutePoint[] = state.routePoints;
      await actionsApi.saveRoute(getToken, state.activeActionId, points);
      dispatch({ type: "CLEAR_ROUTE_POINTS" });
      dispatch({ type: "SET_ROUTE_DRAW_MODE", payload: false });
      await refreshRoutes(state.activeActionId);
    },
  };

  return (
    <AppContext.Provider value={{ state, dispatch, api }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
  return ctx;
};
