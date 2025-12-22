import { MapView } from "./components/Map/MapView";
import { useTracker } from "./hooks/useTracker";
import { useAppContext } from "./context/AppContext";
import { useEffect } from "react";

export default function App() {
  const { dispatch } = useAppContext();
  const { startTracking, stopTracking } = useTracker();

  // 🔹 tymczasowa inicjalizacja testowa
  useEffect(() => {
    dispatch({
      type: "LOGIN",
      payload: {
        id: "u1",
        username: "naganiacz-test",
        role: "user",
        reputation: 0,
      },
    });

    dispatch({
      type: "ADD_ACTION",
      payload: {
        id: "a1",
        name: "Testowa naganka",
        area: [
          { lat: 52.1, lng: 19.0 },
          { lat: 52.1, lng: 19.2 },
          { lat: 52.0, lng: 19.2 },
          { lat: 52.0, lng: 19.0 },
        ],
        createdAt: new Date().toISOString(),
      },
    });

    dispatch({ type: "SET_ACTIVE_ACTION", payload: "a1" });
  }, [dispatch]);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapView />

      {/* testowe przyciski */}
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
        <button onClick={startTracking}>Start tracking</button>
        <button onClick={stopTracking} style={{ marginLeft: "8px" }}>
          Stop tracking
        </button>
      </div>
    </div>
  );
}
