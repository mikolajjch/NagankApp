import { useEffect } from "react";
import { useAuth } from "./auth/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { MapView } from "./components/Map/MapView";
import { useTracker } from "./hooks/useTracker";
import { useAppContext } from "./context/AppContext";

export default function App() {
  const { user, logout } = useAuth();
  const { dispatch } = useAppContext();
  const { startTracking, stopTracking } = useTracker();

  //synchronizacja AUTH i APP STATE
  useEffect(() => {
    if (user) {
      dispatch({ type: "LOGIN", payload: user });
    } else {
      dispatch({ type: "LOGOUT" });
    }
  }, [user, dispatch]);

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapView />

      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 1000,
          background: "white",
          padding: "10px",
          borderRadius: "6px",
        }}
      >
        <div>
          Zalogowany jako: <strong>{user.username}</strong>
        </div>

        <button onClick={startTracking}>Start tracking</button>
        <button onClick={stopTracking} style={{ marginLeft: "8px" }}>
          Stop tracking
        </button>
        <button onClick={logout} style={{ marginLeft: "8px" }}>
          Wyloguj
        </button>
      </div>
    </div>
  );
}
