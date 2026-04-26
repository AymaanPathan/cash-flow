import type {
  LedgerEntry,
  Merchant,
  MerchantBalance,
} from "../types/merchant.types";
import apiClient from "../utils/axios.utils";

export const merchantsApi = {
  list: () => apiClient.get<Merchant[]>("/merchants/"),

  getBalance: (merchantId: string) =>
    apiClient.get<MerchantBalance>(`/merchants/${merchantId}/balance/`),

  getLedger: (merchantId: string) =>
    apiClient.get<LedgerEntry[]>(`/merchants/${merchantId}/ledger/`),
};
