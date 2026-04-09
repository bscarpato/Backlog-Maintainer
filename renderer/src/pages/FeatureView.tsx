import { type ReactNode, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { BacklogItem, FeatureSummary, ItemStatus } from "@shared/types";
import {
  FEATURE_STATUS_BADGE,
  FEATURE_STATUS_BORDER_COLOR,
  KANBAN_COL,
  PRIORITY_BADGE,
  PRIORITY_BORDER_COLOR
} from "../lib/ui";
import { Avatar } from "../components/Avatar";

const statuses: ItemStatus[] = ["todo", "doing", "done"];

function isItemStatus(value: string): value is ItemStatus {
  return statuses.includes(value as ItemStatus);
}

/* ── Kanban column ──────────────────────────────────────────────────── */
function KanbanColumn({
  status,
  count,
  children
}: {
  status: ItemStatus;
  count: number;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const cfg = KANBAN_COL[status];

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[360px] flex-col rounded-2xl p-3 transition-colors ${
        isOver ? cfg.overBg : cfg.bg
      }`}
    >
      {/* Column header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
          <span className={`text-sm font-semibold ${cfg.headText}`}>{cfg.label}</span>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.countBg}`}
        >
          {count}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2.5">
        {children}
        {count === 0 && (
          <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">
            Arraste um cartão aqui
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Kanban card ────────────────────────────────────────────────────── */
function KanbanCard({
  item,
  onEditItem,
  onDeleteItem
}: {
  item: BacklogItem;
  onEditItem: (item: BacklogItem) => void;
  onDeleteItem: (id: number) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(item.id),
    data: { type: "item" as const, item }
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: isDragging ? 50 : undefined }
    : undefined;

  const priBadge = PRIORITY_BADGE[item.priority];
  const priBorder = PRIORITY_BORDER_COLOR[item.priority];

  return (
    <article
      ref={setNodeRef}
      style={{ ...style, borderLeftColor: priBorder }}
      {...listeners}
      {...attributes}
      className={`cursor-grab select-none rounded-xl border border-slate-200 border-l-4 bg-white p-3.5 shadow-sm transition-shadow active:cursor-grabbing ${
        isDragging ? "opacity-50 shadow-lg ring-2 ring-indigo-300" : "hover:shadow-md"
      }`}
    >
      {/* Title */}
      <h3 className="text-sm font-semibold leading-snug text-slate-900">{item.title}</h3>

      {/* Description */}
      {item.description && (
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.description}</p>
      )}

      {/* Divider */}
      <div className="my-2.5 border-t border-slate-100" />

      {/* Footer row */}
      <div className="flex items-center justify-between gap-2">
        {/* Assignee */}
        {item.assignee_name ? (
          <Avatar name={item.assignee_name} size="sm" showName />
        ) : (
          <span className="flex items-center gap-1.5 text-xs italic text-slate-400">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-dashed border-slate-200 text-slate-300">
              ?
            </span>
            Não atribuído
          </span>
        )}

        {/* Priority badge + actions */}
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priBadge.className}`}>
            {priBadge.label}
          </span>
          <button
            type="button"
            className="text-xs text-slate-400 hover:text-indigo-600"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onEditItem(item)}
            title="Editar"
          >
            ✏️
          </button>
          <button
            type="button"
            className="text-xs text-slate-400 hover:text-red-600"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => void onDeleteItem(item.id)}
            title="Excluir"
          >
            🗑️
          </button>
        </div>
      </div>
    </article>
  );
}

/* ── Drag overlay preview ───────────────────────────────────────────── */
function DragPreview({ item }: { item: BacklogItem }) {
  const priBorder = PRIORITY_BORDER_COLOR[item.priority];
  return (
    <div
      style={{ borderLeftColor: priBorder }}
      className="w-64 cursor-grabbing rounded-xl border border-slate-200 border-l-4 bg-white p-3.5 shadow-2xl ring-2 ring-indigo-400"
    >
      <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
      {item.assignee_name && (
        <div className="mt-2">
          <Avatar name={item.assignee_name} size="sm" showName />
        </div>
      )}
    </div>
  );
}

/* ── Main FeatureView ───────────────────────────────────────────────── */
interface FeatureViewProps {
  feature: FeatureSummary;
  items: BacklogItem[];
  onBack: () => void;
  onCreateItem: () => void;
  onEditItem: (item: BacklogItem) => void;
  onDeleteItem: (id: number) => Promise<void>;
  onMoveItem: (id: number, status: ItemStatus) => Promise<void>;
}

export function FeatureView({
  feature,
  items,
  onBack,
  onCreateItem,
  onEditItem,
  onDeleteItem,
  onMoveItem
}: FeatureViewProps) {
  const [activeItem, setActiveItem] = useState<BacklogItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );
  const itemsById = useMemo(() => new Map(items.map((i) => [String(i.id), i])), [items]);

  function resolveDropTarget(overId: string | number | undefined): ItemStatus | null {
    if (overId === undefined || overId === null) return null;
    const key = String(overId);
    if (isItemStatus(key)) return key;
    return itemsById.get(key)?.status ?? null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveItem(itemsById.get(String(event.active.id)) ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;
    const itemId = Number(active.id);
    if (Number.isNaN(itemId)) return;
    const targetStatus = resolveDropTarget(over.id);
    if (!targetStatus) return;
    const dragged = items.find((i) => i.id === itemId);
    if (!dragged || dragged.status === targetStatus) return;
    await onMoveItem(itemId, targetStatus);
  }

  const badge = FEATURE_STATUS_BADGE[feature.status];
  const borderColor = FEATURE_STATUS_BORDER_COLOR[feature.status];

  return (
    <section className="space-y-5">
      {/* Feature header */}
      <div
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        style={{ borderLeftColor: borderColor, borderLeftWidth: 4 }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={onBack}
              className="mb-2 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
            >
              ← Dashboard
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                {badge.label}
              </span>
              <h1 className="text-xl font-bold text-slate-900">{feature.title}</h1>
            </div>
            {feature.description && (
              <p className="mt-1.5 text-sm text-slate-500">{feature.description}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Progress mini */}
            <div className="hidden flex-col items-end md:flex">
              <span className="text-xs font-semibold text-slate-700">
                {feature.progress_percent}% concluído
              </span>
              <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${feature.progress_percent}%` }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={onCreateItem}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <span>+</span> Novo Item
            </button>
          </div>
        </div>
      </div>

      {/* Kanban board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={(e) => { handleDragEnd(e).catch(console.error); }}
        onDragCancel={() => setActiveItem(null)}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {statuses.map((status) => {
            const statusItems = items.filter((i) => i.status === status);
            return (
              <KanbanColumn key={status} status={status} count={statusItems.length}>
                {statusItems.map((item) => (
                  <KanbanCard
                    key={item.id}
                    item={item}
                    onEditItem={onEditItem}
                    onDeleteItem={onDeleteItem}
                  />
                ))}
              </KanbanColumn>
            );
          })}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeItem ? <DragPreview item={activeItem} /> : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
}
