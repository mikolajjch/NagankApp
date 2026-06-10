import { useAppContext } from "../../context/AppContext";
import { useCurrentUser } from "../../auth/useCurrentUser";
import { useState } from "react";

export function ActionAreaList() {
  const { state, dispatch } = useAppContext();
  const user = useCurrentUser();
  const isAdmin = user?.role === "admin";
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const actionToDelete = state.actions.find((a: any) => a.id === confirmId);

  const visibleActions = state.actions.filter(
    (a: any) => (a.groupId ?? null) === state.activeGroupId
  );

  if (visibleActions.length === 0) {
    return <p>Brak naganek w tej grupie</p>;
  }

  return (
    <div className="action-area" style={{ marginBottom: 12 }}>
      <h4>Naganki</h4>
      <div className="action-list">
        {visibleActions.map((action: any) => (
          <div
            key={action.id}
            style={{
              marginBottom: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <strong>{action.name}</strong>

            {isAdmin && (
              <button
                onClick={() => setConfirmId(action.id)}
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
      {confirmId && (
        <div className="modal__overlay">
          <div className="modal">
            <h2>Usunąć "{actionToDelete?.name}"?</h2>
            <p>
              Usunięcie naganki spowoduje również usunięcie przypisanych
              ścieżek.
            </p>

            <div className="modal__actions">
              <button
                onClick={() => {
                  dispatch({ type: "DELETE_ACTION", payload: confirmId });
                  setConfirmId(null);
                }}
              >
                Usuń
              </button>

              <button onClick={() => setConfirmId(null)}>Anuluj</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
