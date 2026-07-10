import { useAuth } from "../auth/AuthContext";
import "./LoginPage.scss";

export function LoginPage() {
  const { loginWithRedirect } = useAuth();

  return (
    <div className="login-page">
      <header>
        <h2>NagankApp</h2>
        <p>Log in with Auth0 to continue</p>
      </header>

      <button
        className="login-btn"
        onClick={() => loginWithRedirect()}
      >
        Log in
      </button>
    </div>
  );
}
