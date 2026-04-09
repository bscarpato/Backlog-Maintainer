import { type FormEvent, useCallback, useEffect, useState } from "react";
import type { TeamMember, CreateTeamMemberInput, UpdateTeamMemberInput } from "@shared/types";
import { Avatar } from "../components/Avatar";

interface TeamMembersPageProps {
  onListMembers: () => Promise<TeamMember[]>;
  onCreateMember: (input: CreateTeamMemberInput) => Promise<{ id: number }>;
  onUpdateMember: (input: UpdateTeamMemberInput) => Promise<unknown>;
  onDeleteMember: (id: number) => Promise<unknown>;
  onBack: () => void;
  onMembersChanged: () => void;
}

export function TeamMembersPage({
  onListMembers,
  onCreateMember,
  onUpdateMember,
  onDeleteMember,
  onBack,
  onMembersChanged
}: TeamMembersPageProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setMembers(await onListMembers());
  }, [onListMembers]);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onCreateMember({ name: trimmed });
      setNewName("");
      await load();
      onMembersChanged();
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit(id: number) {
    const trimmed = editName.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onUpdateMember({ id, name: trimmed });
      setEditingId(null);
      await load();
      onMembersChanged();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Remover este membro? Itens associados ficarão sem responsável.")) return;
    await onDeleteMember(id);
    if (editingId === id) setEditingId(null);
    await load();
    onMembersChanged();
  }

  function startEdit(member: TeamMember) {
    setEditingId(member.id);
    setEditName(member.name);
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-2 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
        >
          ← Dashboard
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Equipe</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cadastre pessoas do squad e associe-as aos itens — inclusive em{" "}
          <span className="font-semibold text-slate-700">A Fazer</span>, para planejar quem vai
          executar cada trabalho.
        </p>
      </div>

      {/* Add member form */}
      <form
        onSubmit={handleCreate}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <label className="min-w-[200px] flex-1">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Novo membro
          </span>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome completo ou apelido no time"
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
        <button
          type="submit"
          disabled={saving || !newName.trim()}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
        >
          Adicionar
        </button>
      </form>

      {/* Member list */}
      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-12 text-center">
          <div className="mb-3 text-4xl">👥</div>
          <h3 className="font-semibold text-slate-700">Nenhum membro ainda</h3>
          <p className="mt-1 text-sm text-slate-500">Adicione alguém acima para poder atribuir itens.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <Avatar name={member.name} size="lg" />

              <div className="min-w-0 flex-1">
                {editingId === member.id ? (
                  <div className="flex flex-col gap-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void handleSaveEdit(member.id)}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="truncate font-semibold text-slate-900">{member.name}</p>
                    <div className="mt-1 flex gap-3">
                      <button
                        type="button"
                        onClick={() => startEdit(member)}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(member.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Excluir
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
