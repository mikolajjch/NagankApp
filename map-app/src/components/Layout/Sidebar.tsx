import { useState } from "react";
import { useAppContext } from "../../context/AppContext";

import { ActionAreaForm } from "../ActionArea/ActionAreaForm";
import { ActionAreaList } from "../ActionArea/ActionAreaList";
import { DrawnActionSave } from "../ActionArea/DrawnActionSave";
import { GroupBar } from "../Groups/GroupBar";

import { useCurrentUser } from "../../auth/useCurrentUser";
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
  const { state, dispatch, api } = useAppContext();
  const [drawMode, setDrawMode] = useState(false);
  const user = useCurrentUser();
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
          <GroupBar />

          <h4>Available tools</h4>

          <div className="sidebar__modes">
            <button
              onClick={() => {
                setDrawMode(false);
                dispatch({ type: "SET_DRAW_MODE", payload: false });
                dispatch({ type: "SET_ROUTE_DRAW_MODE", payload: false });
              }}
              title="Add by coordinates"
            >
              🧭
            </button>

            <button
              onClick={() => {
                setDrawMode(true);
                dispatch({ type: "SET_DRAW_MODE", payload: true });
                dispatch({ type: "SET_ROUTE_DRAW_MODE", payload: false });
              }}
              title="Draw a drive"
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
              title="Edit active drive"
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
              title="Draw a route"
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
                Clear drawing
              </button>
            </>
          )}

          {state.routeDrawMode && (
            <>
              <h4>Draw a route on the map</h4>

              <button
                onClick={() => api.saveRoute()}
                disabled={state.routePoints.length < 2}
                style={{ width: "100%" }}
              >
                Save route
              </button>

              <button
                onClick={() => dispatch({ type: "CLEAR_ROUTE_POINTS" })}
                style={{ width: "100%", marginBottom: 6 }}
              >
                Clear drawing
              </button>
            </>
          )}

          <ActionAreaList />

          <div className="location__panel">
            <h4>Location</h4>
            <button onClick={onStartTracking}>Track location</button>
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
              Logged in as <strong>{user?.username} </strong>
            </div>

            <button onClick={handleLogout} style={{ background: "#c45656ff" }}>
              Log out
            </button>
          </footer>

          {confirmClearTracks && (
            <div className="modal__overlay">
              <div className="modal">
                <h2>Delete location?</h2>
                <p>
                  This will remove
                  <strong> all saved location points</strong> from the map
                </p>

                <div className="modal__actions">
                  <button
                    onClick={async () => {
                      await api.clearAllTracks();
                      setConfirmClearTracks(false);
                    }}
                  >
                    Delete
                  </button>

                  <button onClick={() => setConfirmClearTracks(false)}>
                    Cancel
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
