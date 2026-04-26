export interface BankAccount {
  id: string;
  account_number: string;
  ifsc_code: string;
  account_holder_name: string;
  is_primary: boolean;
}

export interface Merchant {
  id: string;
  name: string;
  email: string;
  bank_accounts: BankAccount[];
  created_at: string;
}

export interface MerchantBalance {
  available_balance_paise: number;
  held_balance_paise: number;
  total_credits_paise: number;
  total_debits_paise: number;
  available_balance_inr: string;
  held_balance_inr: string;
}

export interface LedgerEntry {
  id: string;
  entry_type: "credit" | "debit";
  amount_paise: number;
  amount_inr: string;
  description: string;
  payout: string | null;
  created_at: string;
}
