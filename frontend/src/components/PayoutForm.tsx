/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  createPayout,
  clearCreateError,
  clearLastCreated,
} from "../store/slice/payoutSlice";
import { fetchBalance, fetchLedger } from "../store/slice/merchantSlice";
import { fetchPayouts } from "../store/slice/payoutSlice";

export default function PayoutForm() {
  const dispatch = useAppDispatch();
  const { selectedId, list: merchants } = useAppSelector((s) => s.merchants);
  const { creating, createError, lastCreated } = useAppSelector(
    (s) => s.payouts,
  );

  const [amountInr, setAmountInr] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [success, setSuccess] = useState(false);

  const selectedMerchant = merchants.find((m) => m.id === selectedId);
  const bankAccounts = selectedMerchant?.bank_accounts || [];

  // Pre-select primary bank account
  useEffect(() => {
    const primary = bankAccounts.find((b) => b.is_primary);
    if (primary) setBankAccountId(primary.id);
  }, [selectedId]);

  // Show success state briefly then reset
  useEffect(() => {
    if (lastCreated) {
      setSuccess(true);
      setAmountInr("");
      setTimeout(() => {
        setSuccess(false);
        dispatch(clearLastCreated());
      }, 3000);
      // Refresh balance and payout list
      if (selectedId) {
        dispatch(fetchBalance(selectedId));
        dispatch(fetchPayouts(selectedId));
        dispatch(fetchLedger(selectedId));
      }
    }
  }, [lastCreated]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearCreateError());
    const paise = Math.round(parseFloat(amountInr) * 100);
    if (!paise || paise < 100) return;
    dispatch(
      createPayout({ amount_paise: paise, bank_account_id: bankAccountId }),
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
        Request Payout
      </h2>

      {success && (
        <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 font-medium">
          ✓ Payout created successfully — processing in background
        </div>
      )}

      {createError && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {createError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Amount (INR)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
              ₹
            </span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amountInr}
              onChange={(e) => setAmountInr(e.target.value)}
              placeholder="0.00"
              required
              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          {amountInr && (
            <p className="text-xs text-gray-400 mt-1">
              = {Math.round(parseFloat(amountInr) * 100).toLocaleString()} paise
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Bank Account
          </label>
          <select
            value={bankAccountId}
            onChange={(e) => setBankAccountId(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            {bankAccounts.map((b) => (
              <option key={b.id} value={b.id}>
                {b.account_holder_name} — ••••{b.account_number.slice(-4)} (
                {b.ifsc_code})
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={creating || !amountInr || !bankAccountId}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold transition-colors"
        >
          {creating ? "Submitting…" : "Request Payout"}
        </button>
      </form>
    </div>
  );
}
