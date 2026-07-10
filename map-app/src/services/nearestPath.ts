import type { RoutePoint } from "../types/Route";
import { haversineDistance } from "./mathFun";

export function findNearestPoint(
  userLat: number,
  userLng: number,
  points: RoutePoint[]
) {
  let minDistance = Infinity;
  let nearest: RoutePoint | null = null;

  for (const p of points) {
    const d = haversineDistance(userLat, userLng, p.lat, p.lng);
    if (d < minDistance) {
      minDistance = d;
      nearest = p;
    }
  }

  return nearest ? { point: nearest, distance: minDistance } : null;
}

// later: any part of the route, or split the route into more points
// ...........
