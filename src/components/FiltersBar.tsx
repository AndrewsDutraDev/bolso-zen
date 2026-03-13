import { Search, SlidersHorizontal, X } from "lucide-react";
import type { FiltersState } from "../types";

interface FiltersBarProps {
  filters: FiltersState;
  categories: string[];
  onChange: (next: FiltersState) => void;
  onClear: () => void;
}

export function FiltersBar({
  filters,
  categories,
  onChange,
  onClear,
}: FiltersBarProps) {
  return (
    <section className="rounded-[28px] border border-white/60 bg-white/85 p-5 shadow-soft backdrop-blur">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-ink">
          <SlidersHorizontal size={18} />
          <h2 className="text-lg font-semibold">Filtros</h2>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-2 rounded-full border border-moss/10 px-3 py-2 text-sm font-medium text-moss transition hover:border-moss/30 hover:bg-mint"
        >
          <X size={16} />
          Limpar
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-[1.5fr,1fr,1fr]">
        <label className="flex items-center gap-3 rounded-2xl border border-moss/10 bg-linen px-4 py-3">
          <Search size={18} className="text-moss/70" />
          <input
            type="search"
            value={filters.busca}
            onChange={(event) =>
              onChange({ ...filters, busca: event.target.value })
            }
            placeholder="Buscar por descrição"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-moss/50"
          />
        </label>
        <label className="rounded-2xl border border-moss/10 bg-linen px-4 py-3">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-moss/60">
            Mês
          </span>
          <input
            type="month"
            value={filters.mes}
            onChange={(event) => onChange({ ...filters, mes: event.target.value })}
            className="w-full bg-transparent text-sm text-ink outline-none"
          />
        </label>
        <label className="rounded-2xl border border-moss/10 bg-linen px-4 py-3">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-moss/60">
            Categoria
          </span>
          <select
            value={filters.categoria}
            onChange={(event) =>
              onChange({ ...filters, categoria: event.target.value })
            }
            className="w-full bg-transparent text-sm text-ink outline-none"
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
