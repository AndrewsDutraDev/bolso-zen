import type { PurchaseRecord } from "./types";

const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

export const isApiConfigured = () => Boolean(apiBaseUrl);

export const fetchPurchasesFromApi = async () => {
  const data = await request<{ purchases: PurchaseRecord[] }>("/purchases");
  return data.purchases;
};

export const createPurchaseInApi = async (purchase: PurchaseRecord) => {
  const data = await request<{ purchase: PurchaseRecord }>("/purchases", {
    method: "POST",
    body: JSON.stringify(purchase),
  });
  return data.purchase;
};

export const updatePurchaseInApi = async (purchase: PurchaseRecord) => {
  const data = await request<{ purchase: PurchaseRecord }>(
    `/purchases/${purchase.id}`,
    {
      method: "PUT",
      body: JSON.stringify(purchase),
    },
  );
  return data.purchase;
};

export const deletePurchaseInApi = async (id: string) => {
  await request<void>(`/purchases/${id}`, {
    method: "DELETE",
  });
};

export const importPurchasesToApi = async (purchases: PurchaseRecord[]) => {
  const data = await request<{ purchases: PurchaseRecord[] }>("/purchases/import", {
    method: "POST",
    body: JSON.stringify({ purchases }),
  });
  return data.purchases;
};
