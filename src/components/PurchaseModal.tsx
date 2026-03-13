import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { AlertCircle, CalendarRange, CreditCard, Package, X } from "lucide-react";
import type { PurchaseFormValues, PurchaseRecord } from "../types";
import {
  buildPurchaseRecord,
  defaultFormValues,
  formatCurrency,
  getPurchaseLedgerState,
  getValidationErrors,
  toFormValues,
} from "../utils";

interface PurchaseModalProps {
  isOpen: boolean;
  purchase?: PurchaseRecord | null;
  closingDay: number;
  entryDay: number;
  onClose: () => void;
  onSubmit: (record: PurchaseRecord) => void;
}

type FormErrors = Partial<Record<keyof PurchaseFormValues, string>>;

export function PurchaseModal({
  isOpen,
  purchase,
  closingDay,
  entryDay,
  onClose,
  onSubmit,
}: PurchaseModalProps) {
  const [values, setValues] = useState<PurchaseFormValues>(defaultFormValues);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setValues(purchase ? toFormValues(purchase) : defaultFormValues());
    setErrors({});
  }, [isOpen, purchase]);

  const preview = useMemo(() => {
    const record = buildPurchaseRecord(values, purchase ?? undefined);
    const ledger = getPurchaseLedgerState(record, closingDay, entryDay);

    return {
      valorParcela: record.valorParcela,
      valorJaPago: ledger.valorJaPago,
      valorRestante: ledger.valorRestante,
      parcelasRestantes: ledger.parcelasRestantes,
    };
  }, [values, purchase, closingDay, entryDay]);

  if (!isOpen) {
    return null;
  }

  const updateField = <K extends keyof PurchaseFormValues>(
    field: K,
    value: PurchaseFormValues[K],
  ) => {
    setValues((current) => {
      const next = { ...current, [field]: value };

      if (field === "parcelado" && !value) {
        next.jaEstaSendoPago = false;
        next.parcelaAtual = "1";
      }

      if (field === "jaEstaSendoPago" && !value) {
        next.parcelaAtual = "1";
      }

      return next;
    });

    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = getValidationErrors(values);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit(buildPurchaseRecord(values, purchase ?? undefined));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 backdrop-blur-sm md:items-center md:p-6">
      <div className="max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-t-[32px] bg-linen md:rounded-[32px]">
        <div className="sticky top-0 flex items-center justify-between border-b border-moss/10 bg-linen/90 px-6 py-5 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coral">
              {purchase ? "Editar compra" : "Nova compra"}
            </p>
            <h2 className="font-display mt-1 text-3xl text-ink">
              {purchase ? "Atualize os dados" : "Registrar gasto"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-moss/10 bg-white p-3 text-moss transition hover:border-moss/30 hover:bg-mint"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 p-6 lg:grid-cols-[1.15fr,0.85fr]"
        >
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Descrição da compra"
                icon={<Package size={18} />}
                error={errors.descricao}
              >
                <input
                  type="text"
                  value={values.descricao}
                  onChange={(event) => updateField("descricao", event.target.value)}
                  placeholder="Ex.: Fone bluetooth"
                  className="field-input"
                />
              </Field>

              <Field
                label="Data da compra"
                icon={<CalendarRange size={18} />}
                error={errors.dataCompra}
              >
                <input
                  type="date"
                  value={values.dataCompra}
                  onChange={(event) => updateField("dataCompra", event.target.value)}
                  className="field-input"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Valor total"
                icon={<CreditCard size={18} />}
                error={errors.valorTotal}
              >
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={values.valorTotal}
                  onChange={(event) => updateField("valorTotal", event.target.value)}
                  placeholder="0,00"
                  className="field-input"
                />
              </Field>

              <Field label="Categoria (opcional)" icon={<Package size={18} />}>
                <input
                  type="text"
                  value={values.categoria}
                  onChange={(event) => updateField("categoria", event.target.value)}
                  placeholder="Ex.: Mercado, Transporte, Tecnologia"
                  className="field-input"
                />
              </Field>
            </div>

            <div className="grid gap-4 rounded-[28px] border border-moss/10 bg-white/70 p-4">
              <ToggleRow
                title="Compra parcelada"
                description="Ative para calcular automaticamente o valor de cada parcela."
                checked={values.parcelado}
                onChange={(checked) => updateField("parcelado", checked)}
              />

              {values.parcelado ? (
                <>
                  <Field
                    label="Quantidade de parcelas"
                    icon={<CreditCard size={18} />}
                    error={errors.quantidadeParcelas}
                  >
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={values.quantidadeParcelas}
                      onChange={(event) =>
                        updateField("quantidadeParcelas", event.target.value)
                      }
                      className="field-input"
                    />
                  </Field>

                  <ToggleRow
                    title="Pagamento já iniciado"
                    description="Use esta opção se você já estiver pagando as parcelas."
                    checked={values.jaEstaSendoPago}
                    onChange={(checked) => updateField("jaEstaSendoPago", checked)}
                  />

                  {values.jaEstaSendoPago && (
                    <Field
                      label="Parcela atual"
                      icon={<CreditCard size={18} />}
                      error={errors.parcelaAtual}
                    >
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={values.parcelaAtual}
                        onChange={(event) =>
                          updateField("parcelaAtual", event.target.value)
                        }
                        className="field-input"
                      />
                    </Field>
                  )}
                </>
              ) : (
                <ToggleRow
                  title="Pagamento já iniciado"
                  description="Compra à vista pode ficar pendente até cair na fatura conforme a data da compra."
                  checked
                  disabled
                  onChange={() => undefined}
                />
              )}
            </div>
          </div>

          <aside className="space-y-4 rounded-[32px] bg-gradient-to-br from-ink via-moss to-[#6b8f7f] p-5 text-white shadow-soft">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                Prévia automática
              </p>
              <h3 className="font-display mt-2 text-3xl">
                {values.parcelado ? "Resumo das parcelas" : "Pagamento à vista"}
              </h3>
              <p className="mt-3 text-sm text-white/75">
                Considerando corte no dia {entryDay} e fechamento no dia {closingDay}.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <PreviewCard
                label="Valor da parcela"
                value={formatCurrency(preview.valorParcela)}
              />
              <PreviewCard
                label="Parcelas restantes"
                value={String(preview.parcelasRestantes)}
              />
              <PreviewCard
                label="Valor já pago"
                value={formatCurrency(preview.valorJaPago)}
              />
              <PreviewCard
                label="Valor restante"
                value={formatCurrency(preview.valorRestante)}
              />
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/10 p-4 text-sm text-white/80">
              <p className="flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                Se a compra for feita no dia {entryDay} ou depois, ela entra na próxima
                fatura e não é tratada como paga imediatamente.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row lg:flex-col">
              <button
                type="submit"
                className="rounded-full bg-sand px-5 py-3 text-sm font-bold text-ink transition hover:translate-y-[-1px] hover:bg-white"
              >
                {purchase ? "Salvar alterações" : "Adicionar compra"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Cancelar
              </button>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  icon: ReactNode;
  error?: string;
  children: ReactNode;
}

function Field({ label, icon, error, children }: FieldProps) {
  return (
    <label className="block rounded-[24px] border border-moss/10 bg-white/85 p-4 shadow-sm">
      <span className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <span className="text-moss">{icon}</span>
        {label}
      </span>
      {children}
      {error ? <span className="mt-2 block text-sm text-coral">{error}</span> : null}
    </label>
  );
}

interface ToggleRowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled = false,
}: ToggleRowProps) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-[24px] border px-4 py-4 ${
        disabled
          ? "border-moss/5 bg-moss/5 opacity-70"
          : "border-moss/10 bg-linen"
      }`}
    >
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="text-sm text-moss/80">{description}</p>
      </div>
      <button
        type="button"
        aria-pressed={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 rounded-full transition ${
          checked ? "bg-coral" : "bg-moss/15"
        } ${disabled ? "cursor-not-allowed" : ""}`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
            checked ? "left-7" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

interface PreviewCardProps {
  label: string;
  value: string;
}

function PreviewCard({ label, value }: PreviewCardProps) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/10 p-4">
      <p className="text-sm text-white/70">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
