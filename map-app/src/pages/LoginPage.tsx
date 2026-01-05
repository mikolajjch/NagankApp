import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import "./LoginPage.scss";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    login(username.trim());
  };

  return (
    <div>
      <header>
        <h2>Logowanie</h2>
      </header>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Nazwa użytkownika"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button type="submit">Zaloguj</button>
      </form>

      <p>
        Wpisz <strong>admin</strong>, aby zalogować się jako administrator
      </p>
    </div>
  );
}
