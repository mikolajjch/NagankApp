import { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { useAuth } from "../../auth/AuthContext";
import type { Group } from "../../types/Group";

export function CreateGroup() {
  const { state, dispatch } = useAppContext();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  return (
    <div>
      <h4>Utwórz grupę</h4>

      <input
        placeholder="Nazwa grupy"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError(null);
        }}
      />

      <button
        onClick={() => {
          const trimmed = name.trim();
          if (!trimmed) return;

          const exists = state.groups.some(
            (g: Group) => g.name.toLowerCase() === trimmed.toLowerCase()
          );

          if (exists) {
            setError("Grupa o takiej nazwie już istnieje");
            return;
          }

          dispatch({
            type: "ADD_GROUP",
            payload: {
              id: crypto.randomUUID(),
              name: trimmed,
              ownerId: user.username,
              members: [user.username],
              createdAt: Date.now(),
            },
          });

          setName("");
        }}
      >
        Utwórz
      </button>

      {error && (
        <div style={{ color: "#ffcccc", fontSize: "0.8rem", marginTop: 4 }}>
          {error}
        </div>
      )}
    </div>
  );
}
