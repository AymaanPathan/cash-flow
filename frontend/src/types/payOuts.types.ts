export interface Payout {
  id: string;
  merchant: string;
  bank_account: string;
  amount_paise: number;
  amount_inr: string;
  status: "pending" | "processing" | "completed" | "failed";
  attempt_count: number;
  failure_reason: string;
  created_at: string;
  updated_at: string;
  processing_started_at: string | null;
  completed_at: string | null;
}

export interface CreatePayoutPayload {
  amount_paise: number;
  bank_account_id: string;
}
