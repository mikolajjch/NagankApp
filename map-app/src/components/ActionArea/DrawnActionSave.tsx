import { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { createActionArea } from "../../services/actionFactory";

export function DrawnActionSave() {
  const { state, dispatch } = useAppContext();
  const [name, setName] = useState("");

  const canSave = state.drawingPoints.length >= 3;

  const handleSave = () => {
    if (!canSave) return;

    const action = createActionArea(name, state.drawingPoints);
    dispatch({ type: "ADD_ACTION", payload: action });
    dispatch({ type: "SET_ACTIVE_ACTION", payload: action.id });
    dispatch({ type: "CLEAR_DRAW_POINTS" });

    setName("");
  };

  return (
    <div style={{ marginTop: 12 }}>
      <h4>Rysuj nagankę na mapie</h4>

      <input
        placeholder="Nazwa naganki"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button
        onClick={handleSave}
        disabled={!canSave}
        style={{ width: "100%" }}
      >
        Zapisz rysowaną nagankę
      </button>
    </div>
  );
}
