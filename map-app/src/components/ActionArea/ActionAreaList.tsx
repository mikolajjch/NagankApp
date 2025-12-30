import { useAppContext } from "../../context/AppContext";

export function ActionAreaList() {
  const { state, dispatch } = useAppContext();

  if (state.actions.length === 0) {
    return <p>Brak dodanych naganek</p>;
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <h4>Naganki</h4>

      {state.actions.map((action) => (
        <div key={action.id} style={{ marginBottom: 4 }}>
          <strong>{action.name}</strong>

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
