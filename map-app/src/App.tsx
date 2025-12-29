import { useEffect } from "react";
import { useAuth } from "./auth/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { MapView } from "./components/Map/MapView";
import { useTracker } from "./hooks/useTracker";
import { useAppContext } from "./context/AppContext";

import { ActionAreaForm } from "./components/ActionArea/ActionAreaForm";
import { ActionAreaList } from "./components/ActionArea/ActionAreaList";

export default function App() {
  const { user, logout } = useAuth();
  const { dispatch } = useAppContext();
  const { startTracking, stopTracking } = useTracker();

  // synchro AUTH, APP STATE
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
    <div
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        position: "relative",
      }}
    >
      {/* future SIDEBAR */}
      <div
        style={{
          width: 300,
          padding: 12,
          borderRight: "1px solid #ddd",
          background: "#fff",
          zIndex: 1000,
        }}
      >
        <div>
          Zalogowany jako: <strong>{user.username}</strong>
        </div>

        <hr />

        <ActionAreaForm />
        <ActionAreaList />

        <hr />

        <button onClick={startTracking}>Zacznij śledzić</button>
        <button onClick={stopTracking} style={{ marginLeft: 6 }}>
          Stop
        </button>

        <hr />

        <button onClick={logout}>Wyloguj</button>
      </div>

      {/* MAIN */}
      <div
        style={{
          flex: 1,
          padding: 12,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            height: "80vh",
            width: "80vh",
            border: "2px solid #ccc",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <MapView />
        </div>

        <div style={{ marginTop: 12 }}>
          <p>Panel informacyjny</p>

          <hr />
          <p>Klikaj by narysować</p>
          <button onClick={() => dispatch({ type: "CLEAR_DRAW_POINTS" })}>
            Wyczyść rysowanie
          </button>
          <hr />
        </div>
      </div>
    </div>
  );
}
