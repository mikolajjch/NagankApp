import { useAppContext } from "../../context/AppContext";
import { useAuth } from "../../auth/AuthContext";

export function ActionAreaList() {
  const { state, dispatch } = useAppContext();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  if (state.actions.length === 0) {
    return <p>Brak dodanych naganek</p>;
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <h4>Naganki</h4>

      {state.actions.map((action) => (
        <div
          key={action.id}
          style={{ marginBottom: 4, display: "flex", alignItems: "center" }}
        >
          <strong>{action.name}</strong>

          {isAdmin && (
            <button
              onClick={() =>
                dispatch({ type: "DELETE_ACTION", payload: action.id })
              }
              style={{
                marginLeft: 8,
                color: "red",
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
              title="Usuń nagankę"
            >
              ❌
            </button>
          )}

          {state.activeActionId === action.id ? (
            <span style={{ marginLeft: 6 }}>(aktywna)</span>
          ) : (
            <button
              style={{ marginLeft: 6 }}
              onClick={() =>
                dispatch({
                  type: "SET_ACTIVE_ACTION",
                  payload: action.id,
                })
              }
            >
              Ustaw aktywną
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
