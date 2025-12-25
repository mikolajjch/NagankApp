import { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import type { ActionArea } from "../../types/ActionArea";

export function ActionAreaForm() {
  const { dispatch } = useAppContext();

  const [name, setName] = useState("");
  const [points, setPoints] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // format: lat,lng;lat,lng;lat,lng...
    const area = points.split(";").map(p => {
      const [lat, lng] = p.split(",").map(Number);
      return { lat, lng };
    });

    const action: ActionArea = {
      id: crypto.randomUUID(),
      name,
      area,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: "ADD_ACTION", payload: action });
    dispatch({ type: "SET_ACTIVE_ACTION", payload: action.id });

    setName("");
    setPoints("");
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 12 }}>
      <h4>Dodaj nagankę</h4>

      <input
        placeholder="Nazwa naganki"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />

      <textarea
        placeholder="lat,lng;lat,lng;lat,lng..."
        value={points}
        onChange={e => setPoints(e.target.value)}
        required
      />

      <button type="submit">Dodaj</button>
    </form>
  );
}
