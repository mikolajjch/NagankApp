import { useAppContext } from "../../context/AppContext";
import { findNearestPoint } from "../../services/nearestPath";
import type { Route } from "../../types/Route";
import { useMemo } from "react";

export function RouteInfo() {
  const { state } = useAppContext();

  /// (all points of the first route)
  const activeRoute = state.routes.find(
    (r: Route) => r.actionId === state.activeActionId
  );
  /// (for all points of all routes)
  ///const allRoutePoints = state.routes.flatMap((r) => r.points);

  if (!activeRoute) {
    return <div>No active route</div>;
  }

  const lastTrack = state.tracks[state.tracks.length - 1];
  if (!lastTrack || lastTrack.points.length === 0) {
    return <div>No user position</div>;
  }

  const userPos = lastTrack.points[lastTrack.points.length - 1];

  const nearest = useMemo(() => {
    return findNearestPoint(userPos.lat, userPos.lng, activeRoute.points);
  }, [userPos.lat, userPos.lng, activeRoute.points]);

  if (!nearest) {
    return <div>Route point not found</div>;
  }

  return (
    <div>
      Distance to the nearest point on your route:{" "}
      <strong> {nearest.distance.toFixed(1)} m</strong>
    </div>
  );
}
