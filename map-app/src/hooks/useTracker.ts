import { useRef } from 'react';
import { useAppContext } from '../context/AppContext';

export function useTracker() {
  const { state, dispatch } = useAppContext();
  const watchId = useRef<number | null>(null);

  const startTracking = () => {
    if (!state.user || !state.activeActionId) return;

    watchId.current = navigator.geolocation.watchPosition(
      pos => {
        dispatch({
          type: 'ADD_TRACK_POINT',
          payload: {
            actionId: state.activeActionId,
            userId: state.user.id,
            point: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              timestamp: Date.now(),
              accuracy: pos.coords.accuracy,
            },
          },
        });
      },
      err => console.error(err),
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
    }
  };

  return { startTracking, stopTracking };
}
