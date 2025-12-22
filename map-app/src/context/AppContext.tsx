import React, { createContext, useContext, useReducer } from 'react';
import  type { ActionArea } from '../types/ActionArea.ts';
import type { Track, TrackPoint } from '../types/Track';
import type { User } from '../types/User';

interface AppState {
  user: User | null;
  actions: ActionArea[];
  tracks: Track[];
  activeActionId: string | null;
}

type Action =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'ADD_ACTION'; payload: ActionArea }
  | { type: 'SET_ACTIVE_ACTION'; payload: string }
  | { type: 'ADD_TRACK_POINT'; payload: { actionId: string; userId: string; point: TrackPoint } };

const initialState: AppState = {
  user: null,
  actions: [],
  tracks: [],
  activeActionId: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN':
      localStorage.setItem('user', JSON.stringify(action.payload));
      return { ...state, user: action.payload };

    case 'ADD_ACTION':
      return { ...state, actions: [...state.actions, action.payload] };

    case 'SET_ACTIVE_ACTION':
      return { ...state, activeActionId: action.payload };

    case 'ADD_TRACK_POINT': {
      const { actionId, userId, point } = action.payload;

      const existing = state.tracks.find(
        t => t.actionId === actionId && t.userId === userId
      );

      if (existing) {
        return {
          ...state,
          tracks: state.tracks.map(t =>
            t === existing
              ? { ...t, points: [...t.points, point] }
              : t
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


    default:
      return state;
  }
}

const AppContext = createContext<any>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
