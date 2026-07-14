import { useAppContext } from "../../context/AppContext";
import { useCurrentUser } from "../../auth/useCurrentUser";
import { useState } from "react";

export function ActionAreaList() {
  const { state, dispatch, api } = useAppContext();
  const user = useCurrentUser();
  const isAdmin = user?.role === "admin";
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const actionToDelete = state.actions.find((a: any) => a.id === confirmId);

  const visibleActions = state.actions.filter(
    (a: any) => (a.groupId ?? null) === state.activeGroupId
  );

  if (visibleActions.length === 0) {
    return <p>No drives in this group</p>;
  }

  return (
    <div className="action-area" style={{ marginBottom: 12 }}>
      <h4>Drives</h4>
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
                title="Delete drive"
              >
                ❌
              </button>
            )}

            {state.activeActionId === action.id ? (
              <span style={{ marginLeft: 6 }}>(active)</span>
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
                Set active
              </button>
            )}
          </div>
        ))}
      </div>
      {confirmId && (
        <div className="modal__overlay">
          <div className="modal">
            <h2>Delete "{actionToDelete?.name}"?</h2>
            <p>
              Deleting this drive will also delete its assigned
              routes.
            </p>

            <div className="modal__actions">
              <button
                onClick={async () => {
                  await api.deleteAction(confirmId);
                  setConfirmId(null);
                }}
              >
                Delete
              </button>

              <button onClick={() => setConfirmId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
