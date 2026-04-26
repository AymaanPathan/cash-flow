import { configureStore } from "@reduxjs/toolkit";
import merchantReducer from "./slice/merchantSlice";
import payoutReducer from "./slice/payoutSlice";

export const store = configureStore({
  reducer: {
    merchants: merchantReducer,
    payouts: payoutReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
