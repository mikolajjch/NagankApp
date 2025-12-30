import type { ActionArea } from "../types/ActionArea";

export function createActionArea(
  name: string,
  area: { lat: number; lng: number }[]
): ActionArea {
  return {
    id: crypto.randomUUID(),
    name,
    area,
    createdAt: new Date().toISOString(),
  };
}
