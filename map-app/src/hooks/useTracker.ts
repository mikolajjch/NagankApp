import { useRef } from "react";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../auth/AuthContext";

export function useTracker() {
  const { state, dispatch } = useAppContext();
  const { user } = useAuth();
  const watchId = useRef<number | null>(null);

  const startTracking = () => {
    if (!user || !state.activeActionId) {
      console.warn("Brak usera lub aktywnej naganki");
      return;
    }

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        dispatch({
          type: "ADD_TRACK_POINT",
          payload: {
            actionId: state.activeActionId,
            userId: user.id,
            point: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              timestamp: Date.now(),
              accuracy: pos.coords.accuracy,
            },
          },
        });
      },
      (err) => console.error("GPS error", err),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );
  };

  const stopTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  };

  return { startTracking, stopTracking };
}
