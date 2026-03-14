import type { ReactNode } from "react";
import { PencilLine, Trash2 } from "lucide-react";
import type { PurchaseRecord } from "../types";
import {
  formatCurrency,
  formatDate,
  getPurchaseLedgerState,
} from "../utils";

interface PurchaseListProps {
  purchases: PurchaseRecord[];
  closingDay: number;
  entryDay: number;
  onEdit: (purchase: PurchaseRecord) => void;
  onDelete: (purchase: PurchaseRecord) => void;
}

const statusClasses: Record<PurchaseRecord["status"], string> = {
  "À vista": "bg-mint text-moss",
  "Não iniciado": "bg-sand text-ink",
  Pagando: "bg-[#f3d7cc] text-coral",
  Quitado: "bg-[#d7e7fb] text-[#295b90]",
};

export function PurchaseList({
  purchases,
  closingDay,
  entryDay,
  onEdit,
  onDelete,
}: PurchaseListProps) {
  if (purchases.length === 0) {
    return (
      <section className="rounded-[32px] border border-dashed border-moss/20 bg-white/75 p-10 text-center shadow-soft">
        <p className="font-display text-3xl text-ink">Nenhuma compra encontrada</p>
        <p className="mx-auto mt-3 max-w-xl text-sm text-moss/80">
          Ajuste os filtros ou registre uma nova compra para começar a acompanhar
          seus gastos e parcelamentos.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="grid max-h-[42rem] gap-4 overflow-y-auto pr-1 lg:hidden">
        {purchases.map((purchase) => (
          <MobilePurchaseCard
            key={purchase.id}
            purchase={purchase}
            closingDay={closingDay}
            entryDay={entryDay}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </section>

      <section className="hidden overflow-hidden rounded-[32px] border border-white/60 bg-white/85 shadow-soft lg:block">
        <div className="max-h-[42rem] overflow-auto">
          <table className="min-w-full border-collapse text-left">
            <thead className="bg-linen/80 text-xs uppercase tracking-[0.16em] text-moss/70">
              <tr>
                {[
                  "Descrição",
                  "Data",
                  "Valor total",
                  "Categoria",
                  "Status",
                  "Qtd. parcelas",
                  "Parcela atual",
                  "Situação",
                  "Valor da parcela",
                  "Já pago",
                  "Restante",
                  "Ações",
                ].map((header) => (
                  <th key={header} className="px-5 py-4 font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <DesktopPurchaseRow
                  key={purchase.id}
                  purchase={purchase}
                  closingDay={closingDay}
                  entryDay={entryDay}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

interface PurchaseRowProps {
  purchase: PurchaseRecord;
  closingDay: number;
  entryDay: number;
  onEdit: (purchase: PurchaseRecord) => void;
  onDelete: (purchase: PurchaseRecord) => void;
}

function MobilePurchaseCard({
  purchase,
  closingDay,
  entryDay,
  onEdit,
  onDelete,
}: PurchaseRowProps) {
  const ledger = getPurchaseLedgerState(purchase, closingDay, entryDay);

  return (
    <article className="rounded-[28px] border border-white/60 bg-white/85 p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coral">
            {purchase.categoria || "Sem categoria"}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-ink">{purchase.descricao}</h3>
          <p className="mt-1 text-sm text-moss/80">{formatDate(purchase.dataCompra)}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[purchase.status]}`}
        >
          {purchase.status}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <Metric label="Valor total" value={formatCurrency(purchase.valorTotal)} />
        <Metric label="Status" value={purchase.parcelado ? "Parcelado" : "À vista"} />
        <Metric label="Qtd. parcelas" value={String(ledger.totalInstallments)} />
        <Metric
          label="Parcela atual"
          value={
            purchase.parcelado
              ? `${purchase.parcelaAtual}/${purchase.quantidadeParcelas}`
              : `${ledger.effectivePaidInstallments}/1`
          }
        />
        <Metric label="Valor da parcela" value={formatCurrency(purchase.valorParcela)} />
        <Metric label="Situação" value={purchase.status} />
        <Metric label="Já pago" value={formatCurrency(ledger.valorJaPago)} />
        <Metric label="Restante" value={formatCurrency(ledger.valorRestante)} />
      </div>

      <div className="mt-5 flex gap-3">
        <ActionButton
          label="Editar"
          icon={<PencilLine size={16} />}
          onClick={() => onEdit(purchase)}
        />
        <ActionButton
          label="Excluir"
          danger
          icon={<Trash2 size={16} />}
          onClick={() => onDelete(purchase)}
        />
      </div>
    </article>
  );
}

function DesktopPurchaseRow({
  purchase,
  closingDay,
  entryDay,
  onEdit,
  onDelete,
}: PurchaseRowProps) {
  const ledger = getPurchaseLedgerState(purchase, closingDay, entryDay);

  return (
    <tr className="border-t border-moss/10 text-sm text-ink">
      <td className="px-5 py-4">
        <div>
          <p className="font-semibold">{purchase.descricao}</p>
          <p className="text-xs text-moss/70">
            {purchase.parcelado ? "Compra parcelada" : "Pagamento único"}
          </p>
        </div>
      </td>
      <td className="px-5 py-4 text-moss/80">{formatDate(purchase.dataCompra)}</td>
      <td className="px-5 py-4 font-semibold">{formatCurrency(purchase.valorTotal)}</td>
      <td className="px-5 py-4 text-moss/80">{purchase.categoria || "Sem categoria"}</td>
      <td className="px-5 py-4 text-moss/80">{purchase.parcelado ? "Parcelado" : "À vista"}</td>
      <td className="px-5 py-4 text-moss/80">{ledger.totalInstallments}</td>
      <td className="px-5 py-4 text-moss/80">
        {purchase.parcelado
          ? `${purchase.parcelaAtual}/${purchase.quantidadeParcelas}`
          : `${ledger.effectivePaidInstallments}/1`}
      </td>
      <td className="px-5 py-4">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[purchase.status]}`}
        >
          {purchase.status}
        </span>
      </td>
      <td className="px-5 py-4">{formatCurrency(purchase.valorParcela)}</td>
      <td className="px-5 py-4">{formatCurrency(ledger.valorJaPago)}</td>
      <td className="px-5 py-4">{formatCurrency(ledger.valorRestante)}</td>
      <td className="px-5 py-4">
        <div className="flex gap-2">
          <ActionButton
            label="Editar"
            icon={<PencilLine size={16} />}
            onClick={() => onEdit(purchase)}
          />
          <ActionButton
            label="Excluir"
            danger
            icon={<Trash2 size={16} />}
            onClick={() => onDelete(purchase)}
          />
        </div>
      </td>
    </tr>
  );
}

interface MetricProps {
  label: string;
  value: string;
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-2xl bg-linen p-3">
      <p className="text-xs uppercase tracking-[0.14em] text-moss/60">{label}</p>
      <p className="mt-2 font-semibold text-ink">{value}</p>
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  danger?: boolean;
}

function ActionButton({
  label,
  icon,
  onClick,
  danger = false,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition ${
        danger
          ? "border border-coral/20 bg-[#fff4f0] text-coral hover:bg-[#ffe5da]"
          : "border border-moss/10 bg-white text-moss hover:bg-mint"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
