import type {
  GroupRole
} from "./group";


export interface DashboardGroup {
  id: string;
  name: string;
  description: string | null;
  default_currency: string;
  current_user_role: GroupRole;
  member_count: number;
  created_at: string;
}


export interface DashboardActivity {
  id: string;
  group_id: string;
  group_name: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}


export interface DashboardSummary {
  currency: string;
  total_balance: string;
  you_are_owed: string;
  you_owe: string;
  active_groups: number;
  recent_groups: DashboardGroup[];
  recent_activities: DashboardActivity[];
}