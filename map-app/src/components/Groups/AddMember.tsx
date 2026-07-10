import { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { useCurrentUser } from "../../auth/useCurrentUser";
import type { Group } from "../../types/Group";

export function AddMember({ groupId }: { groupId: string }) {
  const { state, dispatch } = useAppContext();
  const user = useCurrentUser();
  const [username, setUsername] = useState("");

  if (!user) return null;

  const group = state.groups.find((g: Group) => g.id === groupId);
  if (!group) return null;

  return (
    <div style={{ marginTop: 6 }}>
      <input
        placeholder="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <button
        onClick={() => {
          const name = username.trim();
          if (!name) return;
          if (group.members.includes(name)) return; // 👈 important

          dispatch({
            type: "ADD_GROUP_MEMBER",
            payload: { groupId, username: name },
          });

          setUsername("");
        }}
      >
        Add
      </button>
    </div>
  );
}
