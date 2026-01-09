import { useState } from "react";
import { useAppContext } from "../../context/AppContext";

import { ActionAreaForm } from "../ActionArea/ActionAreaForm";
import { ActionAreaList } from "../ActionArea/ActionAreaList";
import { DrawnActionSave } from "../ActionArea/DrawnActionSave";

import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };
  const [confirmClearTracks, setConfirmClearTracks] = useState(false);

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
                dispatch({
                  type: "SET_EDIT_ACTION_MODE",
                  payload: !state.editActionMode,
                })
              }
              title="Edytuj aktywną nagankę"
              style={{
                background: state.editActionMode ? "#7f967fff" : undefined,
              }}
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

          <ActionAreaList />

          <div className="location__panel">
            <h4>Lokalizacja</h4>
            <button onClick={onStartTracking}>Śledź lokalizacje</button>
            <button onClick={onStopTracking}>Stop</button>
            {isAdmin && (
              <button
                onClick={() => {
                  setConfirmClearTracks(true);
                }}
              >
                ❌
              </button>
            )}
          </div>

          <footer>
            <div>
              Zalogowany jako <strong>{user?.username} </strong>
            </div>

            <button onClick={handleLogout} style={{ background: "#c45656ff" }}>
              Wyloguj
            </button>
          </footer>

          {confirmClearTracks && (
            <div className="modal__overlay">
              <div className="modal">
                <h2>Usunąć lokalizację?</h2>
                <p>
                  Ta operacja usunie z mapy
                  <strong> wszystkie zapisane punkty lokalizacji</strong>{" "}
                </p>

                <div className="modal__actions">
                  <button
                    onClick={() => {
                      state.tracks.forEach((t: any) =>
                        dispatch({ type: "DELETE_TRACK", payload: t.id })
                      );
                      setConfirmClearTracks(false);
                    }}
                  >
                    Usuń
                  </button>

                  <button onClick={() => setConfirmClearTracks(false)}>
                    Anuluj
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
