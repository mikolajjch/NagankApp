import { useRef } from "react";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../auth/AuthContext";

export function useTracker() {
  const { state, api } = useAppContext();
  const { user } = useAuth();
  const watchId = useRef<number | null>(null);

  const startTracking = () => {
    if (!user || !state.activeActionId) {
      console.warn("No user or active drive");
      return;
    }

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        api.postTrackPoint({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: Date.now(),
          accuracy: pos.coords.accuracy,
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
