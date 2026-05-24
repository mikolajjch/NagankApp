import React, { createContext, useContext, useEffect, useReducer } from "react";
import type { ActionArea } from "../types/ActionArea.ts";
import type { Track, TrackPoint } from "../types/Track";
import type { User } from "../types/User";
import { loadAppState, saveAppState } from "../services/appStorage.ts";
import type { Route } from "../types/Route.ts";
import type { Group, GroupComment } from "../types/Group.ts";

interface AppState {
  user: User | null;
  actions: ActionArea[];
  tracks: Track[];
  activeActionId: string | null;
  editActionMode: boolean;

  drawingPoints: { lat: number; lng: number }[];
  drawMode: boolean;

  routes: Route[];
  routeDrawMode: boolean;
  routePoints: { lat: number; lng: number }[];

  lastMapClick: { lat: number; lng: number } | null;

  groups: Group[];
  activeGroupId: string | null;
  comments: GroupComment[];
  reputations: Record<string, number>;
}

type Action =
  | { type: "ADD_DRAW_POINT"; payload: { lat: number; lng: number } }
  | { type: "CLEAR_DRAW_POINTS" }
  ///////// naganki
  | { type: "ADD_ACTION"; payload: ActionArea }
  | { type: "SET_ACTIVE_ACTION"; payload: string }
  | {
      type: "UPDATE_ACTION";
      payload: {
        actionId: string;
        area: { lat: number; lng: number }[];
      };
    }
  | { type: "SET_EDIT_ACTION_MODE"; payload: boolean }
  | { type: "DELETE_ACTION"; payload: string }
  /////////////////
  | {
      type: "ADD_TRACK_POINT";
      payload: { actionId: string; userId: string; point: TrackPoint };
    }
  | { type: "SET_DRAW_MODE"; payload: boolean }
  | { type: "DELETE_TRACK"; payload: string }
  /////////////
  | { type: "SET_ROUTE_DRAW_MODE"; payload: boolean }
  | { type: "ADD_ROUTE_POINT"; payload: { lat: number; lng: number } }
  | { type: "CLEAR_ROUTE_POINTS" }
  | { type: "SAVE_ROUTE" }
  //
  | {
      type: "SET_LAST_MAP_CLICK";
      payload: { lat: number; lng: number };
    }
  ////////////
  | { type: "ADD_GROUP"; payload: Group }
  | { type: "DELETE_GROUP"; payload: string }
  | { type: "SET_ACTIVE_GROUP"; payload: string | null }
  | {
      type: "ADD_GROUP_MEMBER";
      payload: { groupId: string; username: string };
    }
  ////////////
  | { type: "ADD_GROUP_COMMENT"; payload: GroupComment }
  | { type: "DELETE_GROUP_COMMENT"; payload: string }
  | {
      type: "INCREMENT_REPUTATION";
      payload: { username: string; delta: number };
    };

const persisted = loadAppState();
const initialState: AppState = {
  user: null,
  actions: persisted?.actions ?? [],
  tracks: persisted?.tracks ?? [],
  activeActionId: persisted?.activeActionId ?? null,
  editActionMode: false,

  drawingPoints: [],
  drawMode: false,

  routes: persisted?.routes ?? [],
  routeDrawMode: false,
  routePoints: [],

  lastMapClick: null,

  groups: persisted?.groups ?? [],
  activeGroupId: persisted?.activeGroupId ?? null,
  comments: persisted?.comments ?? [],
  reputations: persisted?.reputations ?? {},
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "ADD_DRAW_POINT":
      return {
        ...state,
        drawingPoints: [...state.drawingPoints, action.payload],
      };
    case "CLEAR_DRAW_POINTS":
      return {
        ...state,
        drawingPoints: [],
      };
    case "ADD_ACTION":
      return {
        ...state,
        actions: [
          ...state.actions,
          { ...action.payload, groupId: state.activeGroupId },
        ],
      };

    case "SET_ACTIVE_ACTION":
      return { ...state, activeActionId: action.payload };
    case "UPDATE_ACTION":
      return {
        ...state,
        actions: state.actions.map((a) =>
          a.id === action.payload.actionId
            ? { ...a, area: action.payload.area }
            : a
        ),
      };
    case "SET_EDIT_ACTION_MODE":
      return { ...state, editActionMode: action.payload };

    case "DELETE_ACTION": {
      const del_id = action.payload;
      return {
        ...state,
        actions: state.actions.filter((a) => a.id != del_id),
        routes: state.routes.filter((r) => r.actionId != del_id),
        activeActionId:
          state.activeActionId == del_id ? null : state.activeActionId,
      };
    }
    case "SET_DRAW_MODE":
      return {
        ...state,
        drawMode: action.payload,
      };
    case "ADD_TRACK_POINT": {
      const { actionId, userId, point } = action.payload;

      const existing = state.tracks.find(
        (t) => t.actionId === actionId && t.userId === userId
      );

      if (existing) {
        return {
          ...state,
          tracks: state.tracks.map((t) =>
            t === existing ? { ...t, points: [...t.points, point] } : t
          ),
        };
      }

      return {
        ...state,
        tracks: [
          ...state.tracks,
          {
            id: crypto.randomUUID(),
            actionId,
            userId,
            points: [point],
          },
        ],
      };
    }
    case "DELETE_TRACK":
      return {
        ...state,
        tracks: state.tracks.filter((t) => t.id !== action.payload),
      };

    ///////////////////////////////// logika sciezki do przejscia
    case "SET_ROUTE_DRAW_MODE":
      return { ...state, routeDrawMode: action.payload };
    case "ADD_ROUTE_POINT":
      return {
        ...state,
        routePoints: [...state.routePoints, action.payload],
      };
    case "CLEAR_ROUTE_POINTS":
      return { ...state, routePoints: [] };
    case "SAVE_ROUTE":
      if (!state.activeActionId || state.routePoints.length < 2) return state;
      return {
        ...state,
        routes: [
          ...state.routes,
          {
            id: crypto.randomUUID(),
            actionId: state.activeActionId,
            points: state.routePoints,
          },
        ],
        routePoints: [],
        routeDrawMode: false,
      };
    /////////////////////////////////////
    case "SET_LAST_MAP_CLICK":
      return {
        ...state,
        lastMapClick: action.payload,
      };
    /////////////////////////////////////
    case "ADD_GROUP":
      return {
        ...state,
        groups: [...state.groups, action.payload],
      };
    case "DELETE_GROUP": {
      const gid = action.payload;
      return {
        ...state,
        groups: state.groups.filter((g) => g.id !== gid),
        actions: state.actions.map((a) =>
          a.groupId === gid ? { ...a, groupId: null } : a
        ),
        activeGroupId:
          state.activeGroupId === gid ? null : state.activeGroupId,
      };
    }

    case "SET_ACTIVE_GROUP":
      return {
        ...state,
        activeGroupId: action.payload,
        activeActionId: null,
        editActionMode: false,
      };

    case "ADD_GROUP_MEMBER":
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === action.payload.groupId &&
          !g.members.includes(action.payload.username)
            ? { ...g, members: [...g.members, action.payload.username] }
            : g
        ),
      };

    ///////////////////////////////// komentarze i reputacja
    case "ADD_GROUP_COMMENT":
      return {
        ...state,
        comments: [...state.comments, action.payload],
      };

    case "DELETE_GROUP_COMMENT":
      return {
        ...state,
        comments: state.comments.filter((c) => c.id !== action.payload),
      };

    case "INCREMENT_REPUTATION": {
      const { username, delta } = action.payload;
      const current = state.reputations[username] ?? 0;
      return {
        ...state,
        reputations: { ...state.reputations, [username]: current + delta },
      };
    }

    default:
      return state;
  }
}

const AppContext = createContext<any>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    saveAppState({
      actions: state.actions,
      tracks: state.tracks,
      activeActionId: state.activeActionId,
      activeGroupId: state.activeGroupId,
      routes: state.routes,
      groups: state.groups,
      comments: state.comments,
      reputations: state.reputations,
    });
  }, [
    state.actions,
    state.tracks,
    state.activeActionId,
    state.activeGroupId,
    state.routes,
    state.groups,
    state.comments,
    state.reputations,
  ]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
