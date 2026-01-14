import { useAppContext } from "../../context/AppContext";
import { useAuth } from "../../auth/AuthContext";
import { AddMember } from "./AddMember";
import type { Group } from "../../types/Group";

export function GroupList() {
  const { state, dispatch } = useAppContext();
  const { user } = useAuth();

  if (!user) return null;

  const myGroups = state.groups.filter((g: Group) =>
    g.members.includes(user.username)
  );

  if (myGroups.length === 0) {
    return <p>Nie należysz do żadnej grupy</p>;
  }

  return (
    <div>
      <h4>Twoje grupy</h4>

      {myGroups.map((g: Group) => (
        <div
          key={g.id}
          style={{
            marginBottom: 12,
            padding: 8,
            borderRadius: 6,
            background: "rgba(255,255,255,0.1)",
          }}
        >
          <strong>{g.name}</strong>

          <div style={{ fontSize: "0.8rem", marginBottom: 6 }}>
            Członkowie: {g.members.join(", ")}
          </div>

          <AddMember groupId={g.id} />
          {(g.ownerId == user.username || user.role == "admin") && (
            <button
              onClick={() => {
                dispatch({
                  type: "DELETE_GROUP",
                  payload: g.id,
                });
              }}
            >
              Usuń grupę
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
