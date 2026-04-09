import type {
  BacklogItem,
  CreateBacklogItemInput,
  CreateFeatureInput,
  CreateTeamMemberInput,
  FeatureSummary,
  ItemStatus,
  TeamMember,
  UpdateBacklogItemInput,
  UpdateFeatureInput,
  UpdateTeamMemberInput
} from "@shared/types";

declare global {
  interface Window {
    /** Present only when running inside Electron with preload (not in a plain browser tab). */
    electronAPI?: {
      getDbPath: () => Promise<string>;
      listFeatures: () => Promise<FeatureSummary[]>;
      createFeature: (payload: CreateFeatureInput) => Promise<{ id: number }>;
      updateFeature: (payload: UpdateFeatureInput) => Promise<{ ok: true }>;
      deleteFeature: (id: number) => Promise<{ ok: true }>;
      listItemsByFeature: (featureId: number) => Promise<BacklogItem[]>;
      createItem: (payload: CreateBacklogItemInput) => Promise<{ id: number }>;
      updateItem: (payload: UpdateBacklogItemInput) => Promise<{ ok: true }>;
      updateItemStatus: (id: number, status: ItemStatus) => Promise<{ ok: true }>;
      deleteItem: (id: number) => Promise<{ ok: true }>;
      listTeamMembers: () => Promise<TeamMember[]>;
      createTeamMember: (payload: CreateTeamMemberInput) => Promise<{ id: number }>;
      updateTeamMember: (payload: UpdateTeamMemberInput) => Promise<{ ok: true }>;
      deleteTeamMember: (id: number) => Promise<{ ok: true }>;
    };
  }
}

export {};
