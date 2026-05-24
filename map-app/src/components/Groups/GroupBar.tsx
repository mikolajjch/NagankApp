import { useState, type CSSProperties } from "react";
import { useAppContext } from "../../context/AppContext";
import { useAuth } from "../../auth/AuthContext";
import { AddMember } from "./AddMember";
import { GroupComments } from "./GroupComments";
import type { Group } from "../../types/Group";

const tabBase: CSSProperties = {
  fontSize: "0.8rem",
  padding: "5px 9px",
  borderRadius: 6,
  border: "1px solid transparent",
  cursor: "pointer",
  background: "rgba(255,255,255,0.12)",
  color: "#fff",
};

const tabActive: CSSProperties = {
  ...tabBase,
  background: "#ffffff",
  color: "#2f6107",
  fontWeight: 600,
};

export function GroupBar() {
  const { state, dispatch } = useAppContext();
  const { user } = useAuth();
  const [manageOpen, setManageOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  if (!user) return null;

  const myGroups = state.groups.filter((g: Group) =>
    g.members.includes(user.username)
  );

  const activeGroup: Group | null =
    state.activeGroupId != null
      ? state.groups.find((g: Group) => g.id === state.activeGroupId) ?? null
      : null;

  const selectGroup = (id: string | null) => {
    dispatch({ type: "SET_ACTIVE_GROUP", payload: id });
    setManageOpen(false);
  };

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    const exists = state.groups.some(
      (g: Group) => g.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setCreateError("Grupa o takiej nazwie już istnieje");
      return;
    }

    const id = crypto.randomUUID();
    dispatch({
      type: "ADD_GROUP",
      payload: {
        id,
        name: trimmed,
        ownerId: user.username,
        members: [user.username],
        createdAt: Date.now(),
      },
    });
    dispatch({ type: "SET_ACTIVE_GROUP", payload: id });

    setNewName("");
    setCreating(false);
    setCreateError(null);
  };

  const canManage =
    activeGroup != null &&
    (activeGroup.ownerId === user.username || user.role === "admin");

  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          marginBottom: 8,
        }}
      >
        {myGroups.map((g: Group) => (
          <button
            key={g.id}
            style={state.activeGroupId === g.id ? tabActive : tabBase}
            onClick={() => selectGroup(g.id)}
            title={g.name}
          >
            👥 {g.name}
          </button>
        ))}

        <button
          style={state.activeGroupId == null ? tabActive : tabBase}
          onClick={() => selectGroup(null)}
          title="Naganki bez przypisanej grupy"
        >
          📂 Bez grupy
        </button>

        <button
          style={{ ...tabBase, fontWeight: 700 }}
          onClick={() => {
            setCreating((v) => !v);
            setCreateError(null);
          }}
          title="Utwórz nową grupę"
        >
          ➕
        </button>
      </div>

      {creating && (
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          <input
            placeholder="Nazwa nowej grupy"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              setCreateError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
            style={{ flex: 1 }}
          />
          <button onClick={handleCreate} disabled={!newName.trim()}>
            Utwórz
          </button>
        </div>
      )}

      {createError && (
        <div style={{ color: "#ffcccc", fontSize: "0.8rem", marginBottom: 6 }}>
          {createError}
        </div>
      )}

      <div
        style={{
          background: "rgba(255,255,255,0.1)",
          borderRadius: 6,
          padding: "8px 10px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {activeGroup ? (
            <>
              <div style={{ fontWeight: 600 }}>{activeGroup.name}</div>
              <div style={{ fontSize: "0.75rem", opacity: 0.85 }}>
                👥 {activeGroup.members.length}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 600 }}>📂 Bez grupy</div>
              <div style={{ fontSize: "0.75rem", opacity: 0.85 }}>
                Naganki bez przypisanej grupy
              </div>
            </>
          )}
        </div>

        {activeGroup && (
          <button
            onClick={() => setManageOpen((v) => !v)}
            style={{ fontSize: "0.8rem", padding: "5px 8px" }}
            title="Zarządzaj grupą"
          >
            ⚙️ {manageOpen ? "▾" : "▸"}
          </button>
        )}
      </div>

      {activeGroup && manageOpen && (
        <div
          style={{
            marginTop: 6,
            background: "rgba(255,255,255,0.08)",
            borderRadius: 6,
            padding: 8,
          }}
        >
          <div style={{ fontSize: "0.8rem", marginBottom: 6 }}>
            <strong>Członkowie</strong>
          </div>

          {activeGroup.members.map((m: string) => {
            const rep = state.reputations[m] ?? 0;
            return (
              <div
                key={m}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.8rem",
                  padding: "2px 0",
                }}
              >
                <span>{m}</span>
                <span style={{ opacity: 0.85 }}>★ {rep}</span>
              </div>
            );
          })}

          <AddMember groupId={activeGroup.id} />

          <GroupComments groupId={activeGroup.id} />

          {canManage && (
            <button
              onClick={() => {
                dispatch({ type: "DELETE_GROUP", payload: activeGroup.id });
                setManageOpen(false);
              }}
              style={{ marginTop: 8, width: "100%", background: "#c45656ff" }}
            >
              🗑️ Usuń grupę
            </button>
          )}
        </div>
      )}
    </div>
  );
}
