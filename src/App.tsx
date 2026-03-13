import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Plus,
  WalletCards,
} from "lucide-react";
import { ForecastView } from "./components/ForecastView";
import { FiltersBar } from "./components/FiltersBar";
import { PurchaseList } from "./components/PurchaseList";
import { PurchaseModal } from "./components/PurchaseModal";
import { SummaryCard } from "./components/SummaryCard";
import type { FiltersState, PurchaseRecord } from "./types";
import {
  DEFAULT_INVOICE_CLOSING_DAY,
  DEFAULT_INVOICE_ENTRY_DAY,
  buildEffectiveSummary,
  buildForecastMonths,
  exportPurchases,
  filterPurchases,
  formatCurrency,
  loadPurchases,
  savePurchases,
} from "./utils";

const emptyFilters: FiltersState = {
  busca: "",
  mes: "",
  categoria: "",
};

const BILL_CLOSING_DAY = DEFAULT_INVOICE_CLOSING_DAY;
const BILL_ENTRY_DAY = DEFAULT_INVOICE_ENTRY_DAY;

export default function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [filters, setFilters] = useState<FiltersState>(emptyFilters);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseRecord | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [forecastRange, setForecastRange] = useState(6);

  useEffect(() => {
    setPurchases(loadPurchases());
  }, []);

  useEffect(() => {
    savePurchases(purchases);
  }, [purchases]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = window.setTimeout(() => setFeedback(""), 2800);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const filteredPurchases = useMemo(
    () => filterPurchases(purchases, filters),
    [filters, purchases],
  );

  const summary = useMemo(
    () =>
      buildEffectiveSummary(
        filteredPurchases,
        BILL_CLOSING_DAY,
        BILL_ENTRY_DAY,
      ),
    [filteredPurchases],
  );
  const forecastMonths = useMemo(
    () =>
      buildForecastMonths(
        filteredPurchases,
        BILL_CLOSING_DAY,
        BILL_ENTRY_DAY,
        forecastRange,
      ),
    [filteredPurchases, forecastRange],
  );

  const categories = useMemo(
    () =>
      [...new Set(purchases.map((purchase) => purchase.categoria).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [purchases],
  );

  const handleCreate = () => {
    setEditingPurchase(null);
    setIsModalOpen(true);
  };

  const handleEdit = (purchase: PurchaseRecord) => {
    setEditingPurchase(purchase);
    setIsModalOpen(true);
  };

  const handleDelete = (purchase: PurchaseRecord) => {
    const confirmed = window.confirm(
      `Excluir a compra "${purchase.descricao}"? Esta ação remove o registro local.`,
    );

    if (!confirmed) {
      return;
    }

    setPurchases((current) => current.filter((item) => item.id !== purchase.id));
    setFeedback("Compra removida.");
  };

  const handleSubmit = (record: PurchaseRecord) => {
    setPurchases((current) => {
      const existingIndex = current.findIndex((item) => item.id === record.id);

      if (existingIndex >= 0) {
        const next = [...current];
        next[existingIndex] = record;
        return next;
      }

      return [record, ...current];
    });

    setIsModalOpen(false);
    setEditingPurchase(null);
    setFeedback(editingPurchase ? "Compra atualizada." : "Compra adicionada.");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as PurchaseRecord[];

      if (!Array.isArray(parsed)) {
        throw new Error("Formato inválido");
      }

      setPurchases(parsed);
      setFeedback("Dados importados com sucesso.");
    } catch {
      window.alert("Não foi possível importar o JSON. Verifique o arquivo.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(217,111,74,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(83,128,110,0.18),_transparent_26%),linear-gradient(180deg,_#fbf7ef_0%,_#f4ecdd_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="overflow-hidden rounded-[36px] bg-gradient-to-br from-ink via-moss to-[#6a8678] p-6 text-white shadow-soft sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sand/70">
                Controle pessoal de gastos
              </p>
              <h1 className="font-display mt-4 max-w-2xl text-4xl leading-tight sm:text-5xl">
                Registre compras e acompanhe parcelamentos sem planilha.
              </h1>
              <p className="mt-4 max-w-2xl text-sm text-white/80 sm:text-base">
                Painel local em pt-BR para cadastrar gastos, ver o que j&aacute; foi
                pago e enxergar rapidamente o que ainda falta quitar.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:justify-self-end">
              <HeroButton
                onClick={handleCreate}
                icon={<Plus size={18} />}
                label="Nova compra"
                primary
              />
              <HeroButton
                onClick={() => exportPurchases(purchases)}
                icon={<ArrowDownToLine size={18} />}
                label="Exportar JSON"
              />
              <HeroButton
                onClick={handleImportClick}
                icon={<ArrowUpFromLine size={18} />}
                label="Importar JSON"
              />
            </div>
          </div>
        </header>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImportFile}
        />

        {feedback ? (
          <div className="mt-4 rounded-2xl border border-mint bg-white/80 px-4 py-3 text-sm font-medium text-moss shadow-sm">
            {feedback}
          </div>
        ) : null}

        <main className="mt-6 space-y-6 lg:mt-8">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <SummaryCard
              label="Total gasto"
              value={formatCurrency(summary.totalGasto)}
              hint="Soma das compras filtradas."
              icon={<WalletCards size={22} />}
            />
            <SummaryCard
              label="Total já pago"
              value={formatCurrency(summary.totalJaPago)}
              hint="Valor acumulado das parcelas já liquidadas."
              icon={<CircleDollarSign size={22} />}
            />
            <SummaryCard
              label="Total restante"
              value={formatCurrency(summary.totalRestante)}
              hint="Quanto ainda falta pagar."
              icon={<CreditCard size={22} />}
            />
            <SummaryCard
              label="Compras parceladas"
              value={String(summary.comprasParceladas)}
              hint="Quantidade de registros parcelados."
              icon={<CreditCard size={22} />}
            />
            <SummaryCard
              label="Compras quitadas"
              value={String(summary.comprasQuitadas)}
              hint="Registros com saldo restante igual a zero."
              icon={<CheckCircle2 size={22} />}
            />
          </section>

          <FiltersBar
            filters={filters}
            categories={categories}
            onChange={setFilters}
            onClear={() => setFilters(emptyFilters)}
          />

          <section className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coral">
                Compras registradas
              </p>
              <h2 className="font-display mt-1 text-3xl text-ink">
                {filteredPurchases.length} item(ns) encontrados
              </h2>
            </div>
            <p className="rounded-full border border-moss/10 bg-white/70 px-4 py-2 text-sm text-moss">
              Ordenado por data mais recente
            </p>
          </section>

          <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coral">
                Horizonte da projeção
              </p>
              <p className="mt-1 text-sm text-moss/80">
                Ajuste quantos meses futuros devem aparecer na previsão.
              </p>
            </div>

            <label className="rounded-full border border-moss/10 bg-white/80 px-4 py-3 text-sm text-ink shadow-sm">
              <span className="mr-3 font-medium text-moss">Mostrar</span>
              <select
                value={forecastRange}
                onChange={(event) => setForecastRange(Number(event.target.value))}
                className="bg-transparent font-semibold outline-none"
              >
                <option value={3}>3 meses</option>
                <option value={6}>6 meses</option>
                <option value={12}>12 meses</option>
              </select>
            </label>
          </section>

          <ForecastView
            months={forecastMonths}
            closingDay={BILL_CLOSING_DAY}
            entryDay={BILL_ENTRY_DAY}
          />

          <PurchaseList
            purchases={filteredPurchases}
            closingDay={BILL_CLOSING_DAY}
            entryDay={BILL_ENTRY_DAY}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </main>
      </div>

      <PurchaseModal
        isOpen={isModalOpen}
        purchase={editingPurchase}
        closingDay={BILL_CLOSING_DAY}
        entryDay={BILL_ENTRY_DAY}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPurchase(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

interface HeroButtonProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  primary?: boolean;
}

function HeroButton({
  label,
  icon,
  onClick,
  primary = false,
}: HeroButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
        primary
          ? "bg-sand text-ink hover:bg-white"
          : "border border-white/20 bg-white/10 text-white hover:bg-white/20"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
