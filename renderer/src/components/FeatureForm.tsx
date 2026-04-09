import { type FormEvent, useState } from "react";
import type { FeatureStatus, FeatureSummary } from "@shared/types";
import { inputCls, labelCls } from "../lib/ui";

interface FeatureFormProps {
  initial?: Partial<FeatureSummary>;
  onSubmit: (data: { title: string; description: string; status: FeatureStatus }) => Promise<void>;
  onCancel: () => void;
}

export function FeatureForm({ initial, onSubmit, onCancel }: FeatureFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<FeatureStatus>(initial?.status ?? "a_iniciar");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit({ title, description, status });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className={labelCls}>Título</span>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nome da feature ou épico"
          className={inputCls}
        />
      </label>

      <label className="block">
        <span className={labelCls}>Descrição</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Contexto, objetivos e escopo..."
          className={inputCls}
        />
      </label>

      <label className="block">
        <span className={labelCls}>Status</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as FeatureStatus)}
          className={inputCls}
        >
          <option value="a_iniciar">A Iniciar</option>
          <option value="in_progress">Em Andamento</option>
          <option value="completed">Concluído</option>
          <option value="archived">Arquivado</option>
        </select>
      </label>

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
