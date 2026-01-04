export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface Route {
  id: string;
  actionId: string;
  points: RoutePoint[];
}
