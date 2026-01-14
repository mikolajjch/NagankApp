export interface Group {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
  createdAt: number;
}

export interface GroupComment {
  id: string;
  groupId: string;
  ownerId: string;
  text: string;
  createdAt: number;
}
