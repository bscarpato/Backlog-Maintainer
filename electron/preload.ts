import { contextBridge, ipcRenderer } from "electron";
import type {
  CreateBacklogItemInput,
  CreateFeatureInput,
  CreateTeamMemberInput,
  ItemStatus,
  UpdateBacklogItemInput,
  UpdateFeatureInput,
  UpdateTeamMemberInput
} from "../shared/types";

const api = {
  getDbPath: () => ipcRenderer.invoke("db:getPath"),
  listFeatures: () => ipcRenderer.invoke("features:list"),
  createFeature: (payload: CreateFeatureInput) => ipcRenderer.invoke("features:create", payload),
  updateFeature: (payload: UpdateFeatureInput) => ipcRenderer.invoke("features:update", payload),
  deleteFeature: (id: number) => ipcRenderer.invoke("features:delete", id),
  listItemsByFeature: (featureId: number) => ipcRenderer.invoke("items:listByFeature", featureId),
  createItem: (payload: CreateBacklogItemInput) => ipcRenderer.invoke("items:create", payload),
  updateItem: (payload: UpdateBacklogItemInput) => ipcRenderer.invoke("items:update", payload),
  updateItemStatus: (id: number, status: ItemStatus) =>
    ipcRenderer.invoke("items:updateStatus", { id, status }),
  deleteItem: (id: number) => ipcRenderer.invoke("items:delete", id),
  listTeamMembers: () => ipcRenderer.invoke("team:list"),
  createTeamMember: (payload: CreateTeamMemberInput) => ipcRenderer.invoke("team:create", payload),
  updateTeamMember: (payload: UpdateTeamMemberInput) => ipcRenderer.invoke("team:update", payload),
  deleteTeamMember: (id: number) => ipcRenderer.invoke("team:delete", id)
};

contextBridge.exposeInMainWorld("electronAPI", api);
