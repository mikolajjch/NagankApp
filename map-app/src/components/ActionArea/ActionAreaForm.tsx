import { useState } from "react";
import { useAppContext } from "../../context/AppContext";

export function ActionAreaForm() {
  const { dispatch, api } = useAppContext();

  const [name, setName] = useState("");
  const [points, setPoints] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // format: lat,lng;lat,lng;lat,lng...
    const area = points.split(";").map((p) => {
      const [lat, lng] = p.split(",").map(Number);
      return { lat, lng };
    });

    const actionId = await api.createAction(name, "", area);
    dispatch({ type: "SET_ACTIVE_ACTION", payload: actionId });

    setName("");
    setPoints("");
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 12 }}>
      <h4>Enter geographic coordinates</h4>

      <input
        placeholder="Drive name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <textarea
        placeholder="lat,lng;lat,lng;lat,lng..."
        value={points}
        onChange={(e) => setPoints(e.target.value)}
        required
      />

      <button type="submit">Add</button>
    </form>
  );
}
