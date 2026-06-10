import { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { useCurrentUser } from "../../auth/useCurrentUser";
import type { GroupComment } from "../../types/Group";

export function GroupComments({ groupId }: { groupId: string }) {
  const { state, dispatch } = useAppContext();
  const user = useCurrentUser();
  const [text, setText] = useState("");

  if (!user) return null;

  const groupComments = state.comments
    .filter((c: GroupComment) => c.groupId === groupId)
    .sort((a: GroupComment, b: GroupComment) => a.createdAt - b.createdAt);

  const isAdmin = user.role === "admin";

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    dispatch({
      type: "ADD_GROUP_COMMENT",
      payload: {
        id: crypto.randomUUID(),
        groupId,
        ownerId: user.username,
        text: trimmed,
        createdAt: Date.now(),
      },
    });

    dispatch({
      type: "INCREMENT_REPUTATION",
      payload: { username: user.username, delta: 1 },
    });

    setText("");
  };

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: "0.85rem", marginBottom: 4 }}>
        <strong>Komentarze</strong>
      </div>

      {groupComments.length === 0 && (
        <div style={{ fontSize: "0.8rem", opacity: 0.8, marginBottom: 6 }}>
          Brak komentarzy
        </div>
      )}

      {groupComments.map((c: GroupComment) => {
        const rep = state.reputations[c.ownerId] ?? 0;
        const canDelete = c.ownerId === user.username || isAdmin;

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
              <strong>{c.ownerId}</strong>
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
                  onClick={() =>
                    dispatch({
                      type: "DELETE_GROUP_COMMENT",
                      payload: c.id,
                    })
                  }
                  style={{
                    padding: "0 6px",
                    fontSize: "0.7rem",
                  }}
                >
                  Usuń
                </button>
              )}
            </div>
          </div>
        );
      })}

      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
        <input
          placeholder="Dodaj komentarz"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          style={{ flex: 1 }}
        />
        <button onClick={handleAdd} disabled={!text.trim()}>
          Wyślij
        </button>
      </div>
    </di