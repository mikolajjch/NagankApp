import React, { createContext, useContext, useEffect, useReducer } from "react";
import type { ActionArea } from "../types/ActionArea.ts";
import type { Track, TrackPoint } from "../types/Track";
import type { User } from "../types/User";
import { loadAppState, saveAppState } from "../services/appStorage.ts";
import type { Route } from "../types/Route.ts";

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
  | { type: "SAVE_ROUTE" };

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
      return { ...state, actions: [...state.actions, action.payload] };

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

    case "DELETE_ACTION":
      const del_id = action.payload;
      return {
        ...state,
        actions: state.actions.filter((a) => a.id != del_id),
        activeActionId:
          state.activeActionId == del_id ? null : state.activeActionId,
      };
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

    ///////////////////////////////// logika ścieżki do przejścia
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
      routes: state.routes,
    });
  }, [state.actions, state.tracks, state.activeActionId, state.routes]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
