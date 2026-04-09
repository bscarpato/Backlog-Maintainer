import { useCallback, useEffect, useMemo, useState } from "react";
import type { BacklogItem, FeatureSummary, ItemStatus, TeamMember } from "@shared/types";
import { Dashboard } from "./pages/Dashboard";
import { FeatureView } from "./pages/FeatureView";
import { TeamMembersPage } from "./pages/TeamMembers";
import { FeatureForm } from "./components/FeatureForm";
import { ItemForm } from "./components/ItemForm";
import { Modal } from "./components/Modal";
import { ErrorBoundary } from "./components/ErrorBoundary";

type ModalState =
  | { type: "none" }
  | { type: "feature-create" }
  | { type: "feature-edit"; feature: FeatureSummary }
  | { type: "item-create" }
  | { type: "item-edit"; item: BacklogItem };

type ElectronAPI = NonNullable<Window["electronAPI"]>;
type ActiveView = "dashboard" | "feature" | "team";

/* ── Top navigation bar ─────────────────────────────────────────────── */
function TopNav({
  dbPath,
  activeView,
  featureTitle,
  onGoToDashboard,
  onOpenTeam
}: {
  dbPath: string;
  activeView: ActiveView;
  featureTitle?: string;
  onGoToDashboard: () => void;
  onOpenTeam: () => void;
}) {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow">
          BM
        </span>
        <span className="hidden text-base font-bold tracking-tight text-slate-900 sm:block">
          Backlog Maintainer
        </span>
      </div>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm">
        <button
          type="button"
          onClick={onGoToDashboard}
          className={`rounded px-2 py-1 font-medium transition-colors ${
            activeView === "dashboard"
              ? "text-indigo-600"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Dashboard
        </button>
        {activeView === "feature" && featureTitle && (
          <>
            <span className="text-slate-300">/</span>
            <span className="max-w-[200px] truncate rounded px-2 py-1 font-medium text-slate-900">
              {featureTitle}
            </span>
          </>
        )}
        {activeView === "team" && (
          <>
            <span className="text-slate-300">/</span>
            <span className="rounded px-2 py-1 font-medium text-indigo-600">Equipe</span>
          </>
        )}
      </nav>

      {/* Right */}
      <div className="flex items-center gap-3">
        <span
          className="hidden max-w-[180px] truncate text-xs text-slate-400 lg:block"
          title={dbPath}
        >
          {dbPath ? `DB: ${dbPath.split(/[/\\]/).pop()}` : "…"}
        </span>
        <button
          type="button"
          onClick={onOpenTeam}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            activeView === "team"
              ? "border-indigo-200 bg-indigo-50 text-indigo-700"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <span>👥</span>
          <span>Equipe</span>
        </button>
      </div>
    </header>
  );
}

/* ── No preload screen ───────────────────────────────────────────────── */
function NoPreloadScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="max-w-md rounded-xl bg-white p-6 shadow ring-1 ring-slate-200">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white">
          BM
        </div>
        <h1 className="text-lg font-semibold">Electron preload não encontrado</h1>
        <p className="mt-2 text-sm text-slate-600">
          Esta interface precisa rodar dentro da janela do Electron (com o preload). Não abra a URL
          do Vite em um browser comum.
        </p>
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm font-mono text-slate-700">
          npm start
        </p>
      </div>
    </main>
  );
}

/* ── Main app ────────────────────────────────────────────────────────── */
function AppContent({ api }: { api: ElectronAPI }) {
  const [features, setFeatures] = useState<FeatureSummary[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [mainView, setMainView] = useState<"main" | "team">("main");
  const [selectedFeatureId, setSelectedFeatureId] = useState<number | null>(null);
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [dbPath, setDbPath] = useState<string>("");

  const selectedFeature = useMemo(
    () => features.find((f) => f.id === selectedFeatureId) ?? null,
    [features, selectedFeatureId]
  );

  const activeView: ActiveView =
    mainView === "team" ? "team" : selectedFeature ? "feature" : "dashboard";

  const loadFeatures = useCallback(async () => {
    setFeatures(await api.listFeatures());
  }, [api]);

  const loadItems = useCallback(async (featureId: number) => {
    setItems(await api.listItemsByFeature(featureId));
  }, [api]);

  const loadTeamMembers = useCallback(async () => {
    setTeamMembers(await api.listTeamMembers());
  }, [api]);

  const refreshAfterTeamChange = useCallback(async () => {
    await loadTeamMembers();
    if (selectedFeatureId !== null) await loadItems(selectedFeatureId);
  }, [loadTeamMembers, loadItems, selectedFeatureId]);

  useEffect(() => {
    api.getDbPath().then(setDbPath).catch(console.error);
    loadFeatures().catch(console.error);
    loadTeamMembers().catch(console.error);
  }, [api, loadFeatures, loadTeamMembers]);

  useEffect(() => {
    if (selectedFeatureId !== null) loadItems(selectedFeatureId).catch(console.error);
  }, [selectedFeatureId, loadItems]);

  async function handleDeleteFeature(id: number) {
    if (!window.confirm("Excluir esta feature? Todos os itens associados serão removidos permanentemente.")) return;
    await api.deleteFeature(id);
    if (selectedFeatureId === id) setSelectedFeatureId(null);
    await loadFeatures();
  }
  async function handleDeleteItem(id: number) {
    if (!window.confirm("Excluir este item do backlog?")) return;
    await api.deleteItem(id);
    if (selectedFeatureId !== null) {
      await loadItems(selectedFeatureId);
      await loadFeatures();
    }
  }
  async function handleMoveItem(id: number, status: ItemStatus) {
    await api.updateItemStatus(id, status);
    if (selectedFeatureId !== null) {
      await loadItems(selectedFeatureId);
      await loadFeatures();
    }
  }

  function goToDashboard() {
    setSelectedFeatureId(null);
    setMainView("main");
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <TopNav
        dbPath={dbPath}
        activeView={activeView}
        featureTitle={selectedFeature?.title}
        onGoToDashboard={goToDashboard}
        onOpenTeam={() => setMainView("team")}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-6">
          {mainView === "team" && (
            <TeamMembersPage
              onListMembers={api.listTeamMembers}
              onCreateMember={api.createTeamMember}
              onUpdateMember={api.updateTeamMember}
              onDeleteMember={api.deleteTeamMember}
              onBack={() => setMainView("main")}
              onMembersChanged={() => void refreshAfterTeamChange()}
            />
          )}
          {mainView === "main" && !selectedFeature && (
            <Dashboard
              features={features}
              onOpenFeature={(f) => setSelectedFeatureId(f.id)}
              onCreateFeature={() => setModal({ type: "feature-create" })}
              onEditFeature={(f) => setModal({ type: "feature-edit", feature: f })}
              onDeleteFeature={handleDeleteFeature}
            />
          )}
          {mainView === "main" && selectedFeature && (
            <FeatureView
              feature={selectedFeature}
              items={items}
              onBack={() => setSelectedFeatureId(null)}
              onCreateItem={() => setModal({ type: "item-create" })}
              onEditItem={(item) => setModal({ type: "item-edit", item })}
              onDeleteItem={handleDeleteItem}
              onMoveItem={handleMoveItem}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {modal.type === "feature-create" && (
        <Modal title="Nova Feature" onClose={() => setModal({ type: "none" })}>
          <FeatureForm
            onCancel={() => setModal({ type: "none" })}
            onSubmit={async (payload) => {
              await api.createFeature(payload);
              await loadFeatures();
              setModal({ type: "none" });
            }}
          />
        </Modal>
      )}
      {modal.type === "feature-edit" && (
        <Modal title="Editar Feature" onClose={() => setModal({ type: "none" })}>
          <FeatureForm
            initial={modal.feature}
            onCancel={() => setModal({ type: "none" })}
            onSubmit={async (payload) => {
              await api.updateFeature({ id: modal.feature.id, ...payload });
              await loadFeatures();
              setModal({ type: "none" });
            }}
          />
        </Modal>
      )}
      {modal.type === "item-create" && selectedFeature && (
        <Modal title="Novo Item" onClose={() => setModal({ type: "none" })}>
          <ItemForm
            members={teamMembers}
            onCancel={() => setModal({ type: "none" })}
            onSubmit={async (payload) => {
              await api.createItem({ ...payload, feature_id: selectedFeature.id });
              await loadItems(selectedFeature.id);
              await loadFeatures();
              setModal({ type: "none" });
            }}
          />
        </Modal>
      )}
      {modal.type === "item-edit" && selectedFeature && (
        <Modal title="Editar Item" onClose={() => setModal({ type: "none" })}>
          <ItemForm
            members={teamMembers}
            initial={modal.item}
            onCancel={() => setModal({ type: "none" })}
            onSubmit={async (payload) => {
              await api.updateItem({ id: modal.item.id, feature_id: selectedFeature.id, ...payload });
              await loadItems(selectedFeature.id);
              await loadFeatures();
              setModal({ type: "none" });
            }}
          />
        </Modal>
      )}
    </div>
  );
}

export default function App() {
  const api = typeof window !== "undefined" ? window.electronAPI : undefined;
  if (!api) return <NoPreloadScreen />;
  return (
    <ErrorBoundary>
      <AppContent api={api} />
    </ErrorBoundary>
  );
}
