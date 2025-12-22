export interface TrackPoint {
    lat: number;
    lng: number;
    timestamp: number;
    accuracy?: number;
}

export interface Track {
    id: string;
    actionId: string;
    userId: string;
    points: TrackPoint[];
}
