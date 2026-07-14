export interface TrackPoint {
    lat: number;
    lng: number;
    timestamp: number;
    accuracy?: number | null;
}

export interface Track {
    actionId: string;
    ownerSub: string;
    points: TrackPoint[];
}
