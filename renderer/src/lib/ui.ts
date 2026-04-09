import type { FeatureStatus, ItemPriority, ItemStatus } from "@shared/types";

// Inline border colors for dynamic values (safer across Tailwind versions)
export const PRIORITY_BORDER_COLOR: Record<ItemPriority, string> = {
  high: "#f87171",   // red-400
  medium: "#fbbf24", // amber-400
  low: "#7dd3fc"     // sky-300
};

export const FEATURE_STATUS_BORDER_COLOR: Record<FeatureStatus, string> = {
  a_iniciar:   "#fbbf24", // amber-400
  in_progress: "#6366f1", // indigo-500
  completed:   "#10b981", // emerald-500
  archived:    "#94a3b8"  // slate-400
};

export const PRIORITY_BADGE: Record<ItemPriority, { label: string; className: string }> = {
  high:   { label: "Alta",   className: "bg-red-50   text-red-600   ring-1 ring-red-200"   },
  medium: { label: "Média",  className: "bg-amber-50 text-amber-600 ring-1 ring-amber-200" },
  low:    { label: "Baixa",  className: "bg-sky-50   text-sky-600   ring-1 ring-sky-200"   }
};

export const FEATURE_STATUS_BADGE: Record<FeatureStatus, { label: string; className: string }> = {
  a_iniciar:   { label: "A Iniciar",    className: "bg-amber-50   text-amber-700"   },
  in_progress: { label: "Em Andamento", className: "bg-indigo-50  text-indigo-700"  },
  completed:   { label: "Concluído",    className: "bg-emerald-50 text-emerald-700" },
  archived:    { label: "Arquivado",    className: "bg-slate-100  text-slate-600"   }
};

export const KANBAN_COL: Record<
  ItemStatus,
  { label: string; bg: string; overBg: string; headText: string; dot: string; countBg: string }
> = {
  todo: {
    label:    "A Fazer",
    bg:       "bg-slate-100",
    overBg:   "bg-slate-200",
    headText: "text-slate-700",
    dot:      "bg-slate-400",
    countBg:  "bg-white text-slate-500"
  },
  doing: {
    label:    "Em Andamento",
    bg:       "bg-blue-50",
    overBg:   "bg-blue-100",
    headText: "text-blue-800",
    dot:      "bg-blue-500",
    countBg:  "bg-blue-100 text-blue-700"
  },
  done: {
    label:    "Concluído",
    bg:       "bg-emerald-50",
    overBg:   "bg-emerald-100",
    headText: "text-emerald-800",
    dot:      "bg-emerald-500",
    countBg:  "bg-emerald-100 text-emerald-700"
  }
};

const AVATAR_PALETTE = [
  "bg-violet-500",
  "bg-indigo-500",
  "bg-blue-600",
  "bg-cyan-600",
  "bg-teal-500",
  "bg-emerald-600",
  "bg-amber-500",
  "bg-orange-500",
  "bg-rose-500",
  "bg-pink-500"
] as const;

export function avatarBg(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = name.charCodeAt(i) + ((h << 5) - h);
  }
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

export const inputCls =
  "w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

export const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500";

export function nameInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}
