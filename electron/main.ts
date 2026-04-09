import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import {
  closeDatabase,
  createBacklogItem,
  createFeature,
  createTeamMember,
  deleteBacklogItem,
  deleteFeature,
  deleteTeamMember,
  getFeatureItems,
  initDatabase,
  listFeatures,
  listTeamMembers,
  updateBacklogItem,
  updateBacklogItemStatus,
  updateFeature,
  updateTeamMember
} from "../database/db";
import type {
  CreateBacklogItemInput,
  CreateFeatureInput,
  CreateTeamMemberInput,
  ItemStatus,
  UpdateBacklogItemInput,
  UpdateFeatureInput,
  UpdateTeamMemberInput
} from "../shared/types";

let mainWindow: BrowserWindow | null = null;
let dbPath = "";

/** Em dev o Electron pode subir antes do Vite; retenta loadURL em vez de depender de wait-on (que às vezes nunca resolve). */
async function loadDevServerUrl(win: BrowserWindow, url: string): Promise<void> {
  const delayMs = 400;
  const maxAttempts = 150;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await win.loadURL(url);
      win.focus();
      if (process.platform === "darwin") {
        app.focus({ steal: true });
      }
      return;
    } catch (err) {
      if (attempt === 1 || attempt % 10 === 0) {
        console.log(`[dev] Aguardando Vite em ${url} (tentativa ${attempt}/${maxAttempts})…`);
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  console.error("[dev] Vite não respondeu. Confira se a porta 5174 está livre e rode npm start de novo.");
  await win.loadURL(url).catch((err) => console.error("[dev] loadURL final:", err));
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    console.log("[dev] Abrindo janela; carregando", devServerUrl, "quando o Vite estiver pronto.");
    mainWindow.webContents.on("did-fail-load", (_event, code, desc, url) => {
      console.error("[dev] Falha ao carregar URL:", url, code, desc);
    });
    void loadDevServerUrl(mainWindow, devServerUrl);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../../dist/index.html")).catch(console.error);
  }
}

function safeHandle(
  channel: string,
  handler: (event: Electron.IpcMainInvokeEvent, ...args: unknown[]) => unknown
): void {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      return await handler(event, ...args);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[IPC] ${channel} error:`, message);
      throw new Error(message);
    }
  });
}

function registerIpcHandlers(): void {
  safeHandle("db:getPath", () => dbPath);

  safeHandle("features:list", () => listFeatures());
  safeHandle("features:create", (_e, payload) => createFeature(payload as CreateFeatureInput));
  safeHandle("features:update", (_e, payload) => {
    updateFeature(payload as UpdateFeatureInput);
    return { ok: true };
  });
  safeHandle("features:delete", (_e, id) => {
    deleteFeature(id as number);
    return { ok: true };
  });

  safeHandle("items:listByFeature", (_e, featureId) => getFeatureItems(featureId as number));
  safeHandle("items:create", (_e, payload) => createBacklogItem(payload as CreateBacklogItemInput));
  safeHandle("items:update", (_e, payload) => {
    updateBacklogItem(payload as UpdateBacklogItemInput);
    return { ok: true };
  });
  safeHandle("items:updateStatus", (_e, payload) => {
    const { id, status } = payload as { id: number; status: ItemStatus };
    updateBacklogItemStatus(id, status);
    return { ok: true };
  });
  safeHandle("items:delete", (_e, id) => {
    deleteBacklogItem(id as number);
    return { ok: true };
  });

  safeHandle("team:list", () => listTeamMembers());
  safeHandle("team:create", (_e, payload) => createTeamMember(payload as CreateTeamMemberInput));
  safeHandle("team:update", (_e, payload) => {
    updateTeamMember(payload as UpdateTeamMemberInput);
    return { ok: true };
  });
  safeHandle("team:delete", (_e, id) => {
    deleteTeamMember(id as number);
    return { ok: true };
  });
}

app.whenReady().then(async () => {
  dbPath = await initDatabase(app.getPath("userData"));
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("before-quit", () => {
  closeDatabase();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
