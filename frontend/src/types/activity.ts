export type GroupActivity = {
  id: string;
  group_id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

export type GroupActivityListResponse = {
  items: GroupActivity[];
  total: number;
  limit: number;
  offset: number;
};