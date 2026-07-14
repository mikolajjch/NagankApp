import { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { useCurrentUser } from "../../auth/useCurrentUser";
import type { Group, GroupComment } from "../../types/Group";

export function GroupComments({ groupId }: { groupId: string }) {
  const { state, api } = useAppContext();
  const user = useCurrentUser();
  const [text, setText] = useState("");

  if (!user) return null;

  const group = state.groups.find((g: Group) => g.id === groupId);
  if (!group) return null;

  const groupComments = [...group.comments].sort(
    (a: GroupComment, b: GroupComment) => a.createdAt - b.createdAt
  );

  const isAdmin = user.role === "admin";

  const handleAdd = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    await api.addComment(groupId, trimmed);
    setText("");
  };

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: "0.85rem", marginBottom: 4 }}>
        <strong>Comments</strong>
      </div>

      {groupComments.length === 0 && (
        <div style={{ fontSize: "0.8rem", opacity: 0.8, marginBottom: 6 }}>
          No comments
        </div>
      )}

      {groupComments.map((c: GroupComment) => {
        const rep = group.members.find((m) => m.sub === c.ownerSub)?.reputation ?? 0;
        const canDelete = c.ownerSub === user.id || isAdmin;

        return (
          <div
            key={c.id}
            style={{
              padding: 6,
              marginBottom: 4,
              borderRadius: 4,
              background: "rgba(255,255,255,0.08)",
              fontSize: "0.85rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 6,
              }}
            >
              <strong>{c.ownerName}</strong>
              <span style={{ opacity: 0.8 }}>★ {rep}</span>
            </div>
            <div style={{ margin: "2px 0" }}>{c.text}</div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.7rem",
                opacity: 0.7,
              }}
            >
              <span>{new Date(c.createdAt).toLocaleString()}</span>
              {canDelete && (
                <button
                  onClick={() => api.deleteComment(groupId, c.id)}
                  style={{
                    padding: "0 6px",
                    fontSize: "0.7rem",
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        );
      })}

      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
        <input
          placeholder="Add a comment"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          style={{ flex: 1 }}
        />
        <button onClick={handleAdd} disabled={!text.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
