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
  const { dispatch } = useAppContext();
  const [drawMode, setDrawMode] = useState(false);
  const { user } = useAuth();

  return (
    <aside className={`sidebar ${open ? "sidebar--open" : ""}`}>
      <button className="sidebar__toggle" onClick={onToggle}>
        {open ? "←" : "→"}
      </button>

      {open && (
        <>
          <div className="sidebar__modes">
            <button
              onClick={() => {
                setDrawMode(false);
                dispatch({ type: "SET_DRAW_MODE", payload: false });
              }}
            >
              🧭
            </button>

            <button
              onClick={() => {
                setDrawMode(true);
                dispatch({ type: "SET_DRAW_MODE", payload: true });
              }}
            >
              ✏️
            </button>
          </div>

          {!drawMode && <ActionAreaForm />}

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

          <hr />

          <ActionAreaList />

          <hr />

          <button onClick={onStartTracking}>Śledź lokalizacje</button>
          <button onClick={onStopTracking}>Stop</button>

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
