import { useAuth } from "../auth/AuthContext";
import "./LoginPage.scss";

export function LoginPage() {
  const { loginWithRedirect } = useAuth();

  return (
    <div className="login-page">
      <header>
        <h2>NagankApp</h2>
        <p>Zaloguj się przez Auth0, aby kontynuować</p>
      </header>

      <button
        className="login-btn"
        onClick={() => loginWithRedirect()}
      >
        Zaloguj się
      </button>
    </div>
  );
}
