export type FeatureStatus = "a_iniciar" | "in_progress" | "completed" | "archived";
export type ItemStatus = "todo" | "doing" | "done";
export type ItemPriority = "low" | "medium" | "high";

export interface Feature {
  id: number;
  title: string;
  description: string;
  status: FeatureStatus;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: number;
  name: string;
  created_at: string;
}

export interface BacklogItem {
  id: number;
  title: string;
  description: string;
  status: ItemStatus;
  priority: ItemPriority;
  feature_id: number;
  assignee_id: number | null;
  /** Preenchido pelo JOIN com team_members; null se sem responsável. */
  assignee_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTeamMemberInput {
  name: string;
}

export interface UpdateTeamMemberInput {
  id: number;
  name: string;
}

export interface FeatureSummary extends Feature {
  item_count: number;
  done_count: number;
  progress_percent: number;
}

export interface CreateFeatureInput {
  title: string;
  description: string;
  status?: FeatureStatus;
}

export interface UpdateFeatureInput extends CreateFeatureInput {
  id: number;
}

export interface CreateBacklogItemInput {
  title: string;
  description: string;
  status?: ItemStatus;
  priority?: ItemPriority;
  feature_id: number;
  /** Responsável pelo item (opcional; pode ser definido já em todo). */
  assignee_id?: number | null;
}

export interface UpdateBacklogItemInput extends CreateBacklogItemInput {
  id: number;
}
