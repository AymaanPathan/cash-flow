import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { merchantsApi } from "../../api/merchant.api";
import type { LedgerEntry, Merchant, MerchantBalance } from "../../types/merchant.types";

interface MerchantState {
  list: Merchant[];
  selectedId: string | null;
  balance: MerchantBalance | null;
  ledger: LedgerEntry[];
  loading: boolean;
  balanceLoading: boolean;
  ledgerLoading: boolean;
  error: string | null;
}

const initialState: MerchantState = {
  list: [],
  selectedId: null,
  balance: null,
  ledger: [],
  loading: false,
  balanceLoading: false,
  ledgerLoading: false,
  error: null,
};

export const fetchMerchants = createAsyncThunk(
  "merchants/fetchAll",
  async () => {
    const res = await merchantsApi.list();
    return res.data;
  },
);

export const fetchBalance = createAsyncThunk(
  "merchants/fetchBalance",
  async (merchantId: string) => {
    const res = await merchantsApi.getBalance(merchantId);
    return res.data;
  },
);

export const fetchLedger = createAsyncThunk(
  "merchants/fetchLedger",
  async (merchantId: string) => {
    const res = await merchantsApi.getLedger(merchantId);
    return res.data;
  },
);

const merchantSlice = createSlice({
  name: "merchants",
  initialState,
  reducers: {
    selectMerchant(state, action) {
      state.selectedId = action.payload;
      state.balance = null;
      state.ledger = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchMerchants
      .addCase(fetchMerchants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMerchants.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
        if (action.payload.length > 0 && !state.selectedId) {
          state.selectedId = action.payload[0].id;
        }
      })
      .addCase(fetchMerchants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch merchants";
      })

      // fetchBalance
      .addCase(fetchBalance.pending, (state) => {
        state.balanceLoading = true;
      })
      .addCase(fetchBalance.fulfilled, (state, action) => {
        state.balanceLoading = false;
        state.balance = action.payload;
      })
      .addCase(fetchBalance.rejected, (state) => {
        state.balanceLoading = false;
      })

      // fetchLedger
      .addCase(fetchLedger.pending, (state) => {
        state.ledgerLoading = true;
      })
      .addCase(fetchLedger.fulfilled, (state, action) => {
        state.ledgerLoading = false;
        state.ledger = action.payload;
      })
      .addCase(fetchLedger.rejected, (state) => {
        state.ledgerLoading = false;
      });
  },
});

export const { selectMerchant } = merchantSlice.actions;
export default merchantSlice.reducer;
