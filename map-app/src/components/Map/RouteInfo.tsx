import { useAppContext } from "../../context/AppContext";
import { findNearestPoint } from "../../services/nearestPath";
import type { Route } from "../../types/Route";

export function RouteInfo() {
  const { state } = useAppContext();

  /// (wszystkie punkty pierwszej ścieżki)
  const activeRoute = state.routes.find(
    (r: Route) => r.actionId === state.activeActionId
  );
  /// (dla wszystkich punktów wszystkich ścieżek)
  ///const allRoutePoints = state.routes.flatMap((r) => r.points);

  if (!activeRoute) {
    return <div>Brak aktywnej ścieżki</div>;
  }

  const lastTrack = state.tracks[state.tracks.length - 1];
  if (!lastTrack || lastTrack.points.length === 0) {
    return <div>Brak pozycji użytkownika</div>;
  }

  const userPos = lastTrack.points[lastTrack.points.length - 1];

  const nearest = findNearestPoint(
    userPos.lat,
    userPos.lng,
    activeRoute.points
    ///allRoutePoints
  );

  if (!nearest) {
    return <div>Nie znaleziono punktu ścieżki</div>;
  }

  return (
    <div>
      Odległość od najbliższego punktu na twojej ścieżce:{" "}
      <strong> {nearest.distance.toFixed(1)} m</strong>
    </div>
  );
}
