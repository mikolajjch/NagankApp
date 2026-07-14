import { useAppContext } from "../../context/AppContext";
import { useCurrentUser } from "../../auth/useCurrentUser";
import type { Group } from "../../types/Group";

export function JoinGroup() {
  const { state, api } = useAppContext();
  const user = useCurrentUser();

  if (!user) return null;

  const joinable = state.groups.filter(
    (g: Group) => !g.members.some((m) => m.sub === user.id)
  );

  if (joinable.length === 0) {
    return (
      <div style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: 8 }}>
        No other groups to join
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 8 }}>
      {joinable.map((g: Group) => (
        <div
          key={g.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.85rem",
            padding: "4px 0",
          }}
        >
          <span>
            👥 {g.name} ({g.members.length})
          </span>
          <button onClick={() => api.joinGroup(g.id)}>Join</button>
        </div>
      ))}
    </div>
  );
}
