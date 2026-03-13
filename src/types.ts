export type PurchaseStatus = "À vista" | "Não iniciado" | "Pagando" | "Quitado";

export interface PurchaseRecord {
  id: string;
  descricao: string;
  dataCompra: string;
  valorTotal: number;
  categoria: string;
  parcelado: boolean;
  quantidadeParcelas: number;
  jaEstaSendoPago: boolean;
  parcelaAtual: number;
  valorParcela: number;
  valorJaPago: number;
  valorRestante: number;
  parcelasRestantes: number;
  status: PurchaseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseFormValues {
  descricao: string;
  dataCompra: string;
  valorTotal: string;
  categoria: string;
  parcelado: boolean;
  quantidadeParcelas: string;
  jaEstaSendoPago: boolean;
  parcelaAtual: string;
}

export interface PurchaseSummary {
  totalGasto: number;
  totalJaPago: number;
  totalRestante: number;
  comprasParceladas: number;
  comprasQuitadas: number;
}

export interface FiltersState {
  busca: string;
  mes: string;
  categoria: string;
}

export interface ForecastItem {
  purchaseId: string;
  descricao: string;
  categoria: string;
  parcela: number;
  totalParcelas: number;
  valor: number;
}

export interface ForecastMonth {
  monthKey: string;
  label: string;
  total: number;
  items: ForecastItem[];
}

export interface PurchaseLedgerState {
  effectivePaidInstallments: number;
  totalInstallments: number;
  valorJaPago: number;
  valorRestante: number;
  parcelasRestantes: number;
  firstBillingMonthKey: string;
  inOpenInvoice: boolean;
}
