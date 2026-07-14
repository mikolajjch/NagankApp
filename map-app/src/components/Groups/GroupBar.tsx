import { useState, type CSSProperties } from "react";
import { useAppContext } from "../../context/AppContext";
import { useCurrentUser } from "../../auth/useCurrentUser";
import { JoinGroup } from "./JoinGroup";
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
  const { state, dispatch, api } = useAppContext();
  const user = useCurrentUser();
  const [manageOpen, setManageOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  if (!user) return null;

  const myGroups = state.groups.filter((g: Group) =>
    g.members.some((m) => m.sub === user.id)
  );

  const activeGroup: Group | null =
    state.activeGroupId != null
      ? state.groups.find((g: Group) => g.id === state.activeGroupId) ?? null
      : null;

  const selectGroup = (id: string | null) => {
    dispatch({ type: "SET_ACTIVE_GROUP", payload: id });
    setManageOpen(false);
  };

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    const exists = state.groups.some(
      (g: Group) => g.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setCreateError("A group with this name already exists");
      return;
    }

    const id = await api.createGroup(trimmed);
    dispatch({ type: "SET_ACTIVE_GROUP", payload: id });

    setNewName("");
    setCreating(false);
    setCreateError(null);
  };

  const canManage =
    activeGroup != null &&
    (activeGroup.ownerId === user.id || user.role === "admin");

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
          title="Drives without an assigned group"
        >
          📂 No group
        </button>

        <button
          style={{ ...tabBase, fontWeight: 700 }}
          onClick={() => {
            setCreating((v) => !v);
            setCreateError(null);
          }}
          title="Create new group"
        >
          ➕
        </button>

        <button
          style={tabBase}
          onClick={() => setBrowseOpen((v) => !v)}
          title="Browse other groups to join"
        >
          🔎 Join a group
        </button>
      </div>

      {creating && (
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          <input
            placeholder="New group name"
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
            Create
          </button>
        </div>
      )}

      {createError && (
        <div style={{ color: "#ffcccc", fontSize: "0.8rem", marginBottom: 6 }}>
          {createError}
        </div>
      )}

      {browseOpen && (
        <div
          style={{
            marginBottom: 8,
            background: "rgba(255,255,255,0.08)",
            borderRadius: 6,
            padding: 8,
          }}
        >
          <JoinGroup />
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
              <div style={{ fontWeight: 600 }}>📂 No group</div>
              <div style={{ fontSize: "0.75rem", opacity: 0.85 }}>
                Drives without an assigned group
              </div>
            </>
          )}
        </div>

        {activeGroup && (
          <button
            onClick={() => setManageOpen((v) => !v)}
            style={{ fontSize: "0.8rem", padding: "5px 8px" }}
            title="Manage group"
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
            <strong>Members</strong>
          </div>

          {activeGroup.members.map((m) => (
            <div
              key={m.sub}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.8rem",
                padding: "2px 0",
              }}
            >
              <span>{m.displayName}</span>
              <span style={{ opacity: 0.85 }}>★ {m.reputation}</span>
            </div>
          ))}

          <GroupComments groupId={activeGroup.id} />

          {canManage && (
            <button
              onClick={async () => {
                await api.deleteGroup(activeGroup.id);
                setManageOpen(false);
              }}
              style={{ marginTop: 8, width: "100%", background: "#c45656ff" }}
            >
              🗑️ Delete group
            </button>
          )}
        </div>
      )}
    </div>
  );
}
