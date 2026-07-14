import { useState } from "react";
import { useAppContext } from "../../context/AppContext";

export function DrawnActionSave() {
  const { state, dispatch, api } = useAppContext();
  const [name, setName] = useState("");

  const canSave = state.drawingPoints.length >= 3;

  const handleSave = async () => {
    if (!canSave) return;

    const actionId = await api.createAction(name, "", state.drawingPoints);
    dispatch({ type: "SET_ACTIVE_ACTION", payload: actionId });
    dispatch({ type: "CLEAR_DRAW_POINTS" });

    setName("");
  };

  return (
    <div style={{ marginTop: 12 }}>
      <h4>Draw a drive on the map</h4>

      <input
        placeholder="Drive name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button
        onClick={handleSave}
        disabled={!canSave}
        style={{ width: "100%" }}
      >
        Save drawn drive
      </button>
    </div>
  );
}
