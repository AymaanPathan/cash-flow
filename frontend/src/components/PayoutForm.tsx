/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  createPayout,
  clearCreateError,
  clearLastCreated,
} from "../store/slice/payoutSlice";

export default function PayoutForm() {
  const dispatch = useAppDispatch();
  const { selectedId, list: merchants } = useAppSelector((s) => s.merchants);
  const { creating, createError, lastCreated } = useAppSelector(
    (s) => s.payouts,
  );

  const [amountInr, setAmountInr] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [success, setSuccess] = useState(false);
  const [focused, setFocused] = useState(false);

  const selectedMerchant = merchants.find((m) => m.id === selectedId);
  const bankAccounts = selectedMerchant?.bank_accounts || [];

  useEffect(() => {
    const primary = bankAccounts.find((b) => b.is_primary);
    if (primary) setBankAccountId(primary.id);
  }, [selectedId]);

  useEffect(() => {
    if (lastCreated) {
      setSuccess(true);
      setAmountInr("");
      setTimeout(() => {
        setSuccess(false);
        dispatch(clearLastCreated());
      }, 3000);
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

  const paiseValue = amountInr ? Math.round(parseFloat(amountInr) * 100) : 0;
  const isValid = paiseValue >= 100;

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        borderRadius: "12px",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            background: "rgba(20,184,166,0.12)",
            border: "1px solid rgba(20,184,166,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 2v10M2 7h10"
              stroke="#14b8a6"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
          }}
        >
          Request Payout
        </span>
      </div>

      <div style={{ padding: "20px" }}>
        {/* Success */}
        {success && (
          <div
            style={{
              marginBottom: "16px",
              borderRadius: "8px",
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.2)",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: "var(--accent-emerald)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path
                  d="M1.5 4l2 2 3-3"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span
              style={{
                fontSize: "12px",
                fontFamily: "'DM Mono', monospace",
                color: "var(--accent-emerald)",
              }}
            >
              Payout queued — processing
            </span>
          </div>
        )}

        {/* Error */}
        {createError && (
          <div
            style={{
              marginBottom: "16px",
              borderRadius: "8px",
              background: "rgba(244,63,94,0.08)",
              border: "1px solid rgba(244,63,94,0.2)",
              padding: "12px 14px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontFamily: "'DM Mono', monospace",
                color: "var(--accent-rose)",
              }}
            >
              {createError}
            </span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          {/* Amount */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "10px",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "8px",
              }}
            >
              Amount (INR)
            </label>
            <div
              style={{
                position: "relative",
                borderRadius: "8px",
                border: `1px solid ${focused ? "var(--accent-cyan)" : "var(--border)"}`,
                background: "var(--bg-elevated)",
                transition: "border-color 0.15s",
                boxShadow: focused ? "0 0 0 3px rgba(20,184,166,0.1)" : "none",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "14px",
                  color: focused ? "var(--accent-cyan)" : "var(--text-muted)",
                  fontWeight: 500,
                  transition: "color 0.15s",
                }}
              >
                ₹
              </span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amountInr}
                onChange={(e) => setAmountInr(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="0.00"
                required
                style={{
                  width: "100%",
                  paddingLeft: "32px",
                  paddingRight: "12px",
                  paddingTop: "10px",
                  paddingBottom: "10px",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "16px",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.01em",
                }}
              />
            </div>
            {amountInr && (
              <div
                style={{
                  marginTop: "6px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontFamily: "'DM Mono', monospace",
                    color: isValid
                      ? "var(--accent-cyan)"
                      : "var(--accent-rose)",
                  }}
                >
                  {paiseValue.toLocaleString()} paise
                </span>
                {!isValid && amountInr && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontFamily: "'DM Mono', monospace",
                      color: "var(--accent-rose)",
                    }}
                  >
                    Min ₹1.00
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Bank account */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "10px",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "8px",
              }}
            >
              Bank Account
            </label>
            <select
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                fontFamily: "'DM Mono', monospace",
                fontSize: "12px",
                outline: "none",
                cursor: "pointer",
                appearance: "none",
                WebkitAppearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%234a5568' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                paddingRight: "32px",
              }}
            >
              {bankAccounts.map((b) => (
                <option
                  key={b.id}
                  value={b.id}
                  style={{ background: "#0d1320" }}
                >
                  {b.account_holder_name} — ••••{b.account_number.slice(-4)} (
                  {b.ifsc_code})
                </option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={creating || !amountInr || !bankAccountId || !isValid}
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: "8px",
              background:
                creating || !amountInr || !bankAccountId || !isValid
                  ? "var(--bg-elevated)"
                  : "linear-gradient(135deg, var(--accent-cyan), #0891b2)",
              border:
                creating || !amountInr || !bankAccountId || !isValid
                  ? "1px solid var(--border)"
                  : "none",
              color:
                creating || !amountInr || !bankAccountId || !isValid
                  ? "var(--text-muted)"
                  : "white",
              fontFamily: "'Syne', sans-serif",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.02em",
              cursor:
                creating || !amountInr || !bankAccountId || !isValid
                  ? "not-allowed"
                  : "pointer",
              transition: "all 0.15s",
              boxShadow:
                creating || !amountInr || !bankAccountId || !isValid
                  ? "none"
                  : "0 4px 16px rgba(20,184,166,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {creating ? (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  style={{ animation: "spin 1s linear infinite" }}
                >
                  <circle
                    cx="7"
                    cy="7"
                    r="5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="20"
                    strokeDashoffset="10"
                    strokeLinecap="round"
                  />
                </svg>
                Processing…
              </>
            ) : (
              "Submit Payout →"
            )}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
}
