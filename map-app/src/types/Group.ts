export interface GroupMember {
  sub: string;
  displayName: string;
  reputation: number;
}

export interface GroupComment {
  id: string;
  groupId: string;
  ownerSub: string;
  ownerName: string;
  text: string;
  createdAt: number;
}

export interface Group {
  id: string;
  name: string;
  ownerId: string;
  members: GroupMember[];
  comments: GroupComment[];
}
