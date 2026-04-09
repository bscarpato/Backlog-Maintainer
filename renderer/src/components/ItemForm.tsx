import { type FormEvent, useState } from "react";
import type { BacklogItem, ItemPriority, ItemStatus, TeamMember } from "@shared/types";
import { Avatar } from "./Avatar";
import { inputCls, labelCls } from "../lib/ui";

interface ItemFormProps {
  members: TeamMember[];
  initial?: Partial<BacklogItem>;
  onSubmit: (data: {
    title: string;
    description: string;
    status: ItemStatus;
    priority: ItemPriority;
    assignee_id: number | null;
  }) => Promise<void>;
  onCancel: () => void;
}

export function ItemForm({ members, initial, onSubmit, onCancel }: ItemFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<ItemStatus>(initial?.status ?? "todo");
  const [priority, setPriority] = useState<ItemPriority>(initial?.priority ?? "medium");
  const [assigneeId, setAssigneeId] = useState<string>(
    initial?.assignee_id != null ? String(initial.assignee_id) : ""
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        title,
        description,
        status,
        priority,
        assignee_id: assigneeId === "" ? null : Number(assigneeId)
      });
    } finally {
      setSaving(false);
    }
  }

  const selectedMember = members.find((m) => String(m.id) === assigneeId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className={labelCls}>Título</span>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Descreva o que precisa ser feito"
          className={inputCls}
        />
      </label>

      <label className="block">
        <span className={labelCls}>Descrição</span>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Critérios de aceite, contexto técnico..."
          className={inputCls}
        />
      </label>

      {/* Assignee */}
      <div>
        <span className={labelCls}>Responsável</span>
        <div className="flex items-center gap-3">
          {selectedMember ? (
            <Avatar name={selectedMember.name} size="md" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-sm text-slate-400">
              ?
            </span>
          )}
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className={`${inputCls} flex-1`}
          >
            <option value="">Ninguém — definir depois</option>
            {members.map((m) => (
              <option key={m.id} value={String(m.id)}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Pode atribuir já em A Fazer para planejar quem vai pegar o item.
        </p>
      </div>

      {/* Status + Priority */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={labelCls}>Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ItemStatus)}
            className={inputCls}
          >
            <option value="todo">A Fazer</option>
            <option value="doing">Em Andamento</option>
            <option value="done">Concluído</option>
          </select>
        </label>
        <label className="block">
          <span className={labelCls}>Prioridade</span>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as ItemPriority)}
            className={inputCls}
          >
            <option value="high">🔴 Alta</option>
            <option value="medium">🟡 Média</option>
            <option value="low">🔵 Baixa</option>
          </select>
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          disabled={saving}
          type="submit"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
