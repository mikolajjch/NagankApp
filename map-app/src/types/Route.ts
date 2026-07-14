export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface Route {
  id: string;
  actionId: string;
  ownerSub: string;
  points: RoutePoint[];
}
