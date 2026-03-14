import { CalendarClock } from "lucide-react";
import type { ForecastMonth } from "../types";
import { formatCurrency } from "../utils";

interface ForecastViewProps {
  months: ForecastMonth[];
  closingDay: number;
  entryDay: number;
}

export function ForecastView({
  months,
  closingDay,
  entryDay,
}: ForecastViewProps) {
  const projectedTotal = months.reduce((sum, month) => sum + month.total, 0);

  return (
    <section className="rounded-[32px] border border-white/60 bg-white/85 p-5 shadow-soft backdrop-blur sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coral">
            Próximas faturas
          </p>
          <h2 className="font-display mt-2 text-3xl text-ink">
            Gastos previstos dos próximos meses
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-moss/80">
            Considerando fechamento no dia {closingDay} e corte de entrada no dia{" "}
            {entryDay}. Compras feitas antes do dia {entryDay} entram na fatura do
            mês corrente; em {entryDay} ou depois, entram na seguinte. Parcelas em
            andamento projetam apenas o que ainda falta cair.
          </p>
        </div>

        <div className="rounded-[24px] bg-linen px-5 py-4 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-moss/60">
            Total projetado
          </p>
          <p className="mt-2 text-2xl font-bold text-ink">
            {formatCurrency(projectedTotal)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        {months.map((month) => (
          <article
            key={month.monthKey}
            className="rounded-[28px] border border-moss/10 bg-linen/90 p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-moss/60">
                  Fatura prevista
                </p>
                <h3 className="mt-2 text-2xl font-semibold capitalize text-ink">
                  {month.label}
                </h3>
              </div>
              <div className="rounded-2xl bg-white p-3 text-moss shadow-sm">
                <CalendarClock size={18} />
              </div>
            </div>

            <div className="mt-4 rounded-[24px] bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-moss/60">
                Total do mês
              </p>
              <p className="mt-2 text-2xl font-bold text-ink">
                {formatCurrency(month.total)}
              </p>
            </div>

            {month.items.length > 0 ? (
              <ul className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
                {month.items.map((item) => (
                  <li
                    key={`${month.monthKey}-${item.purchaseId}-${item.parcela}`}
                    className="rounded-[22px] border border-white/70 bg-white/75 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">{item.descricao}</p>
                        <p className="mt-1 text-sm text-moss/75">
                          {item.categoria || "Sem categoria"}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-ink">
                        {formatCurrency(item.valor)}
                      </p>
                    </div>
                    <p className="mt-3 text-sm text-moss/80">
                      Parcela {item.parcela} de {item.totalParcelas}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 rounded-[22px] border border-dashed border-moss/20 bg-white/60 px-4 py-5 text-sm text-moss/75">
                Nenhuma cobrança prevista com os filtros atuais.
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
