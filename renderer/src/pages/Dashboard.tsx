import { useMemo, useState } from "react";
import type { FeatureStatus, FeatureSummary } from "@shared/types";
import { FEATURE_STATUS_BADGE, FEATURE_STATUS_BORDER_COLOR } from "../lib/ui";

interface DashboardProps {
  features: FeatureSummary[];
  onOpenFeature: (feature: FeatureSummary) => void;
  onCreateFeature: () => void;
  onEditFeature: (feature: FeatureSummary) => void;
  onDeleteFeature: (id: number) => Promise<void>;
}

const GROUP_ORDER: FeatureStatus[] = ["in_progress", "a_iniciar", "completed", "archived"];

const GROUP_META: Record<
  FeatureStatus,
  { label: string; description: string; dotClass: string; defaultOpen: boolean }
> = {
  in_progress: {
    label: "Em Andamento",
    description: "Features ativas que o squad está trabalhando agora",
    dotClass: "bg-indigo-500",
    defaultOpen: true
  },
  a_iniciar: {
    label: "A Iniciar",
    description: "Features mapeadas e planejadas, ainda não iniciadas",
    dotClass: "bg-amber-400",
    defaultOpen: false
  },
  completed: {
    label: "Concluídas",
    description: "Features finalizadas e entregues",
    dotClass: "bg-emerald-500",
    defaultOpen: false
  },
  archived: {
    label: "Arquivadas",
    description: "Features descontinuadas ou colocadas em espera",
    dotClass: "bg-slate-400",
    defaultOpen: false
  }
};

function FeatureCard({
  feature,
  onOpenFeature,
  onEditFeature,
  onDeleteFeature
}: {
  feature: FeatureSummary;
  onOpenFeature: (f: FeatureSummary) => void;
  onEditFeature: (f: FeatureSummary) => void;
  onDeleteFeature: (id: number) => Promise<void>;
}) {
  const badge = FEATURE_STATUS_BADGE[feature.status];
  const borderColor = FEATURE_STATUS_BORDER_COLOR[feature.status];

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
      style={{ borderTopColor: borderColor, borderTopWidth: 4 }}
    >
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
          <span className="text-xs text-slate-400">#{feature.id}</span>
        </div>

        <h2 className="text-base font-semibold leading-snug text-slate-900">{feature.title}</h2>
        {feature.description ? (
          <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">{feature.description}</p>
        ) : (
          <p className="mt-1.5 text-sm italic text-slate-400">Sem descrição</p>
        )}

        <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
          <span>
            <span className="font-semibold text-slate-800">{feature.done_count}</span>
            /{feature.item_count} {feature.item_count === 1 ? "item" : "itens"}
          </span>
          <span className="font-semibold text-slate-800">{feature.progress_percent}%</span>
        </div>

        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${feature.progress_percent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
        <button
          type="button"
          onClick={() => onOpenFeature(feature)}
          className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Abrir
        </button>
        <button
          type="button"
          onClick={() => onEditFeature(feature)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => void onDeleteFeature(feature.id)}
          className="rounded-lg border border-red-100 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          title="Excluir feature"
        >
          Excluir
        </button>
      </div>
    </article>
  );
}

export function Dashboard({
  features,
  onOpenFeature,
  onCreateFeature,
  onEditFeature,
  onDeleteFeature
}: DashboardProps) {
  const [expanded, setExpanded] = useState<Record<FeatureStatus, boolean>>({
    in_progress: true,
    a_iniciar: false,
    completed: false,
    archived: false
  });

  function toggleGroup(status: FeatureStatus) {
    setExpanded((prev) => ({ ...prev, [status]: !prev[status] }));
  }

  const grouped = useMemo(() => {
    const groups: Record<FeatureStatus, FeatureSummary[]> = {
      in_progress: [],
      a_iniciar: [],
      completed: [],
      archived: []
    };
    for (const f of features) {
      groups[f.status]?.push(f);
    }
    return groups;
  }, [features]);

  const inProgress = grouped.in_progress.length;
  const aIniciar = grouped.a_iniciar.length;
  const concluidas = grouped.completed.length;

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          {features.length === 0 ? (
            <p className="mt-1 text-sm text-slate-500">
              Nenhuma feature ainda. Crie a primeira para começar.
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-500">
              <span className="font-medium text-indigo-600">{inProgress} em andamento</span>
              {" · "}
              <span className="font-medium text-amber-600">{aIniciar} a iniciar</span>
              {" · "}
              <span className="font-medium text-emerald-600">
                {concluidas} {concluidas === 1 ? "concluída" : "concluídas"}
              </span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onCreateFeature}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          <span className="text-base leading-none">+</span>
          Nova Feature
        </button>
      </div>

      {/* Empty state */}
      {features.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
          <div className="mb-4 text-5xl">📋</div>
          <h3 className="text-lg font-semibold text-slate-700">Backlog vazio</h3>
          <p className="mt-1 text-sm text-slate-500">
            Crie a primeira feature para organizar os itens do seu squad.
          </p>
          <button
            type="button"
            onClick={onCreateFeature}
            className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + Nova Feature
          </button>
        </div>
      )}

      {/* Grouped sections */}
      {features.length > 0 && (
        <div className="space-y-3">
          {GROUP_ORDER.map((status) => {
            const groupFeatures = grouped[status];
            const isOpen = expanded[status];
            const meta = GROUP_META[status];

            return (
              <div
                key={status}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                {/* Group header — clickable */}
                <button
                  type="button"
                  onClick={() => toggleGroup(status)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 flex-shrink-0 rounded-full ${meta.dotClass}`} />
                    <div>
                      <span className="font-semibold text-slate-900">{meta.label}</span>
                      {!isOpen && groupFeatures.length > 0 && (
                        <span className="ml-2 text-xs text-slate-400">{meta.description}</span>
                      )}
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                      {groupFeatures.length}
                    </span>
                  </div>
                  <span
                    className="flex-shrink-0 text-slate-400 transition-transform duration-200"
                    style={{
                      display: "inline-block",
                      transform: isOpen ? "rotate(90deg)" : "rotate(0deg)"
                    }}
                  >
                    ▶
                  </span>
                </button>

                {/* Group content */}
                {isOpen && (
                  <div className="border-t border-slate-100">
                    {groupFeatures.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-sm text-slate-400">{meta.description}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          Nenhuma feature neste grupo ainda.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 xl:grid-cols-3">
                        {groupFeatures.map((feature) => (
                          <FeatureCard
                            key={feature.id}
                            feature={feature}
                            onOpenFeature={onOpenFeature}
                            onEditFeature={onEditFeature}
                            onDeleteFeature={onDeleteFeature}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
