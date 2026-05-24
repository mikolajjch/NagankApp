export interface ActionArea {
  id: string;
  name: string;
  description?: string;

  area: {
    lat: number;
    lng: number;
  }[];

  createdAt: string;

  groupId: string | null;
}
