import type {
  FiltersState,
  ForecastItem,
  ForecastMonth,
  PurchaseLedgerState,
  PurchaseFormValues,
  PurchaseRecord,
  PurchaseStatus,
  PurchaseSummary,
} from "./types";

export const STORAGE_KEY = "bolso-zen:purchases";
export const DEFAULT_INVOICE_CLOSING_DAY = 15;
export const DEFAULT_INVOICE_ENTRY_DAY = 12;

export const defaultFormValues = (): PurchaseFormValues => ({
  descricao: "",
  dataCompra: new Date().toISOString().slice(0, 10),
  valorTotal: "",
  categoria: "",
  parcelado: false,
  quantidadeParcelas: "2",
  jaEstaSendoPago: false,
  parcelaAtual: "1",
});

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));

export const roundCurrency = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const generateId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `purchase-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const getStatus = (
  parcelado: boolean,
  parcelaAtual: number,
  quantidadeParcelas: number,
): PurchaseStatus => {
  if (!parcelado) {
    return "À vista";
  }

  if (!parcelaAtual) {
    return "Não iniciado";
  }

  if (parcelaAtual >= quantidadeParcelas) {
    return "Quitado";
  }

  return "Pagando";
};

export const buildPurchaseRecord = (
  values: PurchaseFormValues,
  existing?: PurchaseRecord,
): PurchaseRecord => {
  const valorTotal = roundCurrency(Number(values.valorTotal));
  const parcelado = values.parcelado;
  const quantidadeParcelas = parcelado
    ? Math.max(1, Math.trunc(Number(values.quantidadeParcelas) || 0))
    : 1;
  const jaEstaSendoPago = parcelado ? values.jaEstaSendoPago : true;
  const parcelaAtual = parcelado
    ? jaEstaSendoPago
      ? Math.min(
          quantidadeParcelas,
          Math.max(1, Math.trunc(Number(values.parcelaAtual) || 0)),
        )
      : 0
    : 1;
  const valorParcela = roundCurrency(valorTotal / quantidadeParcelas);
  const status = getStatus(parcelado, parcelaAtual, quantidadeParcelas);
  const valorJaPago =
    status === "Quitado" || status === "À vista"
      ? valorTotal
      : roundCurrency(valorParcela * parcelaAtual);
  const valorRestante =
    status === "Quitado" || status === "À vista"
      ? 0
      : roundCurrency(valorTotal - valorJaPago);
  const parcelasRestantes = parcelado
    ? Math.max(0, quantidadeParcelas - parcelaAtual)
    : 0;
  const now = new Date().toISOString();

  return {
    id: existing?.id ?? generateId(),
    descricao: values.descricao.trim(),
    dataCompra: values.dataCompra,
    valorTotal,
    categoria: values.categoria.trim(),
    parcelado,
    quantidadeParcelas,
    jaEstaSendoPago,
    parcelaAtual,
    valorParcela,
    valorJaPago,
    valorRestante,
    parcelasRestantes,
    status,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
};

export const getValidationErrors = (values: PurchaseFormValues) => {
  const errors: Partial<Record<keyof PurchaseFormValues, string>> = {};
  const valorTotal = Number(values.valorTotal);
  const quantidadeParcelas = Number(values.quantidadeParcelas);
  const parcelaAtual = Number(values.parcelaAtual);

  if (!values.descricao.trim()) {
    errors.descricao = "Informe uma descrição para identificar a compra.";
  }

  if (!values.dataCompra) {
    errors.dataCompra = "Selecione a data da compra.";
  }

  if (!values.valorTotal || Number.isNaN(valorTotal)) {
    errors.valorTotal = "Informe um valor total válido.";
  } else if (valorTotal < 0) {
    errors.valorTotal = "O valor total não pode ser negativo.";
  }

  if (values.parcelado) {
    if (!values.quantidadeParcelas || Number.isNaN(quantidadeParcelas)) {
      errors.quantidadeParcelas = "Informe a quantidade de parcelas.";
    } else if (quantidadeParcelas < 1) {
      errors.quantidadeParcelas = "A quantidade de parcelas deve ser no mínimo 1.";
    }

    if (values.jaEstaSendoPago) {
      if (!values.parcelaAtual || Number.isNaN(parcelaAtual)) {
        errors.parcelaAtual = "Informe a parcela atual.";
      } else if (parcelaAtual < 1) {
        errors.parcelaAtual = "A parcela atual deve ser maior que zero.";
      } else if (parcelaAtual > quantidadeParcelas) {
        errors.parcelaAtual =
          "A parcela atual não pode ser maior que o total de parcelas.";
      }
    }
  }

  return errors;
};

export const toFormValues = (purchase: PurchaseRecord): PurchaseFormValues => ({
  descricao: purchase.descricao,
  dataCompra: purchase.dataCompra,
  valorTotal: String(purchase.valorTotal),
  categoria: purchase.categoria,
  parcelado: purchase.parcelado,
  quantidadeParcelas: String(purchase.quantidadeParcelas),
  jaEstaSendoPago: purchase.parcelado ? purchase.jaEstaSendoPago : false,
  parcelaAtual: String(purchase.parcelaAtual || 1),
});

export const filterPurchases = (
  purchases: PurchaseRecord[],
  filters: FiltersState,
) => {
  const query = filters.busca.trim().toLowerCase();

  return [...purchases]
    .filter((purchase) => {
      if (query && !purchase.descricao.toLowerCase().includes(query)) {
        return false;
      }

      if (filters.mes && !purchase.dataCompra.startsWith(filters.mes)) {
        return false;
      }

      if (filters.categoria && purchase.categoria !== filters.categoria) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (a.dataCompra === b.dataCompra) {
        return b.createdAt.localeCompare(a.createdAt);
      }

      return b.dataCompra.localeCompare(a.dataCompra);
    });
};

export const buildSummary = (purchases: PurchaseRecord[]): PurchaseSummary =>
  purchases.reduce<PurchaseSummary>(
    (summary, purchase) => ({
      totalGasto: roundCurrency(summary.totalGasto + purchase.valorTotal),
      totalJaPago: roundCurrency(summary.totalJaPago + purchase.valorJaPago),
      totalRestante: roundCurrency(summary.totalRestante + purchase.valorRestante),
      comprasParceladas:
        summary.comprasParceladas + (purchase.parcelado ? 1 : 0),
      comprasQuitadas:
        summary.comprasQuitadas + (purchase.valorRestante === 0 ? 1 : 0),
    }),
    {
      totalGasto: 0,
      totalJaPago: 0,
      totalRestante: 0,
      comprasParceladas: 0,
      comprasQuitadas: 0,
    },
  );

export const loadPurchases = (): PurchaseRecord[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as PurchaseRecord[];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const savePurchases = (purchases: PurchaseRecord[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
};

export const exportPurchases = (purchases: PurchaseRecord[]) => {
  const blob = new Blob([JSON.stringify(purchases, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `bolso-zen-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
};

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const monthLabel = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);

const monthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date: Date, amount: number) =>
  new Date(date.getFullYear(), date.getMonth() + amount, 1);

const monthDiff = (from: Date, to: Date) =>
  Math.max(
    0,
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()),
  );

export const getFirstBillingMonth = (
  purchaseDateValue: string,
  entryDay: number,
) => {
  const purchaseDate = new Date(`${purchaseDateValue}T00:00:00`);
  const baseMonth = monthStart(purchaseDate);

  return purchaseDate.getDate() >= entryDay ? addMonths(baseMonth, 1) : baseMonth;
};

export const getOpenInvoiceMonth = (today: Date, closingDay: number) => {
  const base = monthStart(today);
  return today.getDate() <= closingDay ? base : addMonths(base, 1);
};

export const getPurchaseLedgerState = (
  purchase: PurchaseRecord,
  closingDay: number,
  entryDay: number,
  today = new Date(),
): PurchaseLedgerState => {
  const openInvoiceMonth = getOpenInvoiceMonth(today, closingDay);
  const firstBillingMonth = getFirstBillingMonth(purchase.dataCompra, entryDay);
  const totalInstallments = purchase.parcelado ? purchase.quantidadeParcelas : 1;
  const informedPaidInstallments = purchase.parcelado
    ? purchase.jaEstaSendoPago
      ? purchase.parcelaAtual
      : 0
    : 1;
  const installmentsBeforeOpenInvoice = monthDiff(firstBillingMonth, openInvoiceMonth);
  const effectivePaidInstallments = Math.min(
    totalInstallments,
    Math.max(0, Math.min(informedPaidInstallments, installmentsBeforeOpenInvoice)),
  );
  const valorJaPago =
    effectivePaidInstallments >= totalInstallments
      ? purchase.valorTotal
      : roundCurrency(purchase.valorParcela * effectivePaidInstallments);
  const valorRestante =
    effectivePaidInstallments >= totalInstallments
      ? 0
      : roundCurrency(purchase.valorTotal - valorJaPago);
  const parcelasRestantes = Math.max(0, totalInstallments - effectivePaidInstallments);
  const inOpenInvoice =
    monthKey(firstBillingMonth) >= monthKey(openInvoiceMonth) &&
    effectivePaidInstallments < totalInstallments;

  return {
    effectivePaidInstallments,
    totalInstallments,
    valorJaPago,
    valorRestante,
    parcelasRestantes,
    firstBillingMonthKey: monthKey(firstBillingMonth),
    inOpenInvoice,
  };
};

export const buildEffectiveSummary = (
  purchases: PurchaseRecord[],
  closingDay: number,
  entryDay: number,
  today = new Date(),
): PurchaseSummary =>
  purchases.reduce<PurchaseSummary>(
    (summary, purchase) => {
      const ledger = getPurchaseLedgerState(purchase, closingDay, entryDay, today);

      return {
        totalGasto: roundCurrency(summary.totalGasto + purchase.valorTotal),
        totalJaPago: roundCurrency(summary.totalJaPago + ledger.valorJaPago),
        totalRestante: roundCurrency(summary.totalRestante + ledger.valorRestante),
        comprasParceladas:
          summary.comprasParceladas + (purchase.parcelado ? 1 : 0),
        comprasQuitadas:
          summary.comprasQuitadas + (ledger.valorRestante === 0 ? 1 : 0),
      };
    },
    {
      totalGasto: 0,
      totalJaPago: 0,
      totalRestante: 0,
      comprasParceladas: 0,
      comprasQuitadas: 0,
    },
  );

export const buildForecastMonths = (
  purchases: PurchaseRecord[],
  closingDay: number,
  entryDay: number,
  monthsAhead = 6,
  today = new Date(),
): ForecastMonth[] => {
  const openInvoiceMonth = getOpenInvoiceMonth(today, closingDay);

  const buckets = new Map<string, ForecastMonth>();

  for (let index = 0; index < monthsAhead; index += 1) {
    const currentMonth = addMonths(openInvoiceMonth, index);
    buckets.set(monthKey(currentMonth), {
      monthKey: monthKey(currentMonth),
      label: monthLabel(currentMonth),
      total: 0,
      items: [],
    });
  }

  for (const purchase of purchases) {
    const ledger = getPurchaseLedgerState(purchase, closingDay, entryDay, today);

    if (ledger.valorRestante === 0) {
      continue;
    }

    const firstBillingMonth = getFirstBillingMonth(purchase.dataCompra, entryDay);
    const startInstallment = ledger.effectivePaidInstallments + 1;

    for (
      let installmentNumber = startInstallment;
      installmentNumber <= ledger.totalInstallments;
      installmentNumber += 1
    ) {
      const installmentMonth = addMonths(firstBillingMonth, installmentNumber - 1);
      const bucket = buckets.get(monthKey(installmentMonth));

      if (!bucket || installmentMonth.getTime() < openInvoiceMonth.getTime()) {
        continue;
      }

      const item: ForecastItem = {
        purchaseId: purchase.id,
        descricao: purchase.descricao,
        categoria: purchase.categoria,
        parcela: installmentNumber,
        totalParcelas: ledger.totalInstallments,
        valor: purchase.valorParcela,
      };

      bucket.items.push(item);
      bucket.total = roundCurrency(bucket.total + item.valor);
    }
  }

  return [...buckets.values()].map((bucket) => ({
    ...bucket,
    items: bucket.items.sort((a, b) => {
      if (a.parcela === b.parcela) {
        return a.descricao.localeCompare(b.descricao);
      }

      return a.parcela - b.parcela;
    }),
  }));
};
