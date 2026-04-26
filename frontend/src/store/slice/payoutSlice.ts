/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { payoutsApi } from "../../api/payOuts.api";
import type { CreatePayoutPayload, Payout } from "../../types/payOuts.types";

interface PayoutState {
  list: Payout[];
  loading: boolean;
  creating: boolean;
  error: string | null;
  createError: string | null;
  lastCreated: Payout | null;
}

const initialState: PayoutState = {
  list: [],
  loading: false,
  creating: false,
  error: null,
  createError: null,
  lastCreated: null,
};

export const fetchPayouts = createAsyncThunk(
  "payouts/fetchAll",
  async (merchantId: string) => {
    const res = await payoutsApi.list(merchantId);
    return res.data;
  },
);

export const createPayout = createAsyncThunk(
  "payouts/create",
  async (payload: CreatePayoutPayload, { rejectWithValue }) => {
    try {
      const res = await payoutsApi.create(payload);
      return res.data;
    } catch (err: any) {
      console.log("Create payout error", err);
      const message = err.response?.data?.error || "Failed to create payout";
      return rejectWithValue(message);
    }
  },
);

export const refreshPayout = createAsyncThunk(
  "payouts/refresh",
  async (payoutId: string) => {
    const res = await payoutsApi.get(payoutId);
    return res.data;
  },
);

const payoutSlice = createSlice({
  name: "payouts",
  initialState,
  reducers: {
    clearCreateError(state) {
      state.createError = null;
    },
    clearLastCreated(state) {
      state.lastCreated = null;
    },

    updatePayoutFromStream(state, action) {
      const incoming = action.payload;
      const idx = state.list.findIndex((p) => p.id === incoming.id);
      if (idx !== -1) {
        state.list[idx] = { ...state.list[idx], ...incoming };
      } else {
        state.list = [incoming, ...state.list];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchPayouts
      .addCase(fetchPayouts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayouts.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchPayouts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch payouts";
      })

      // createPayout
      .addCase(createPayout.pending, (state) => {
        state.creating = true;
        state.createError = null;
        state.lastCreated = null;
      })
      .addCase(createPayout.fulfilled, (state, action) => {
        state.creating = false;
        state.lastCreated = action.payload;
      })
      .addCase(createPayout.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.payload as string;
      })

      // refreshPayout — update a single payout in the list (for live status)
      .addCase(refreshPayout.fulfilled, (state, action) => {
        const idx = state.list.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) {
          state.list[idx] = action.payload;
        }
      });
  },
});

export const { clearCreateError, clearLastCreated, updatePayoutFromStream } =
  payoutSlice.actions;
export default payoutSlice.reducer;
