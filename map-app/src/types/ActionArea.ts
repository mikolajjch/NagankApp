export interface ActionArea {
  id: string;
  name: string;
  description?: string;

  area: {
    lat: number;
    lng: number;
  }[];

  groupId: string | null;
}
