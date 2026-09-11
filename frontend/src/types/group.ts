export type GroupRole = "admin" | "member";


export interface Group {
  id: string;
  name: string;
  description: string | null;
  default_currency: string;
  created_by_id: string;
  current_user_role: GroupRole;
  member_count: number;
  created_at: string;
  updated_at: string;
}
export interface CreateGroupPayload {
  name: string;
  description: string;
  default_currency: string;
}


export interface CreatedGroup {
  id: string;
  name: string;
  description: string | null;
  default_currency: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}
export interface GroupMember {
  user_id: string;
  name: string;
  email: string;
  role: GroupRole;
  joined_at: string;
}


export interface GroupDetail extends Group {
  members: GroupMember[];
}
export interface AddGroupMemberPayload {
  email: string;
}