import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    login(username.trim());
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Logowanie</h2>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Nazwa użytkownika"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button type="submit">Zaloguj</button>
      </form>

      <p style={{ marginTop: 10 }}>
        Wpisz <strong>admin</strong>, aby zalogować się jako administrator
      </p>
    </div>
  );
}
