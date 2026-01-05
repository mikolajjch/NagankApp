import { useState } from "react";
import { useAppContext } from "../../context/AppContext";

import { ActionAreaForm } from "../ActionArea/ActionAreaForm";
import { ActionAreaList } from "../ActionArea/ActionAreaList";
import { DrawnActionSave } from "../ActionArea/DrawnActionSave";

import { useAuth } from "../../auth/AuthContext";

type Props = {
  open: boolean;
  onToggle: () => void;
  onLogout: () => void;
  onStartTracking: () => void;
  onStopTracking: () => void;
};

export function Sidebar({
  open,
  onToggle,
  onLogout,
  onStartTracking,
  onStopTracking,
}: Props) {
  const { state, dispatch } = useAppContext();
  const [drawMode, setDrawMode] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <aside className={`sidebar ${open ? "sidebar--open" : ""}`}>
      <button className="sidebar__toggle" onClick={onToggle}>
        {open ? "←" : "→"}
      </button>

      {open && (
        <>
          <h4>Dostępne narzędzia</h4>

          <div className="sidebar__modes">
            <button
              onClick={() => {
                setDrawMode(false);
                dispatch({ type: "SET_DRAW_MODE", payload: false });
                dispatch({ type: "SET_ROUTE_DRAW_MODE", payload: false });
              }}
              title="Tryb przeglądania"
            >
              🧭
            </button>

            <button
              onClick={() => {
                setDrawMode(true);
                dispatch({ type: "SET_DRAW_MODE", payload: true });
                dispatch({ type: "SET_ROUTE_DRAW_MODE", payload: false });
              }}
              title="Rysuj nagankę"
            >
              ✏️
            </button>

            <button
              disabled={!state.activeActionId}
              onClick={() =>
                dispatch({ type: "SET_EDIT_ACTION_MODE", payload: true })
              }
              title="Edytuj nagankę"
            >
              ✋
            </button>

            <button
              disabled={!state.activeActionId}
              onClick={() => {
                setDrawMode(false);
                dispatch({ type: "SET_DRAW_MODE", payload: false });
                dispatch({ type: "SET_ROUTE_DRAW_MODE", payload: true });
              }}
              title="Rysuj ścieżkę"
            >
              🏞
            </button>
          </div>

          {!drawMode && !state.routeDrawMode && <ActionAreaForm />}

          {drawMode && (
            <>
              <DrawnActionSave />
              <button
                onClick={() => dispatch({ type: "CLEAR_DRAW_POINTS" })}
                style={{ width: "100%", marginBottom: 6 }}
              >
                Wyczyść rysowanie
              </button>
            </>
          )}

          {state.routeDrawMode && (
            <>
              <h4>Rysuj ścieżkę na mapie</h4>

              <button
                onClick={() => dispatch({ type: "SAVE_ROUTE" })}
                disabled={state.routePoints.length < 2}
                style={{ width: "100%" }}
              >
                Zapisz ścieżkę
              </button>

              <button
                onClick={() => dispatch({ type: "CLEAR_ROUTE_POINTS" })}
                style={{ width: "100%", marginBottom: 6 }}
              >
                Wyczyść rysowanie
              </button>
            </>
          )}
          <hr />

          <ActionAreaList />

          <hr />

          <button onClick={onStartTracking}>Śledź lokalizacje</button>
          <button onClick={onStopTracking}>Stop</button>
          {isAdmin && (
            <button
              onClick={() => {
                state.tracks.forEach((t) =>
                  dispatch({ type: "DELETE_TRACK", payload: t.id })
                );
              }}
            >
              ❌
            </button>
          )}

          <hr />

          <div>
            Zalogowany jako <strong>{user?.username} </strong>
            <button onClick={onLogout}>Wyloguj</button>
          </div>
        </>
      )}
    </aside>
  );
}
