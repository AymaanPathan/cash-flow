import type { CreatePayoutPayload, Payout } from "../types/payOuts.types";
import apiClient from "../utils/axios.utils";
import { v4 as uuidv4 } from "uuid";

export const payoutsApi = {
  list: (merchantId: string) =>
    apiClient.get<Payout[]>(`/payouts/list/?merchant_id=${merchantId}`),

  get: (payoutId: string) => apiClient.get<Payout>(`/payouts/${payoutId}/`),

  create: (payload: CreatePayoutPayload) =>
    apiClient.post<Payout>("/payouts/", payload, {
      headers: {
        "Idempotency-Key": uuidv4(),
      },
    }),
};
