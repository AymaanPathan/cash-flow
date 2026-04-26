import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchPayouts } from "../store/slice/payoutSlice";
import StatusBadge from "./StatusBadge";

export default function PayoutTable() {
  const dispatch = useAppDispatch();
  const { selectedId } = useAppSelector((s) => s.merchants);
  const { list: payouts, loading } = useAppSelector((s) => s.payouts);

  useEffect(() => {
    if (!selectedId) return;
    dispatch(fetchPayouts(selectedId));
  }, [selectedId]);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="h-3 bg-gray-100 rounded w-32 mb-4 animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-12 bg-gray-50 rounded-xl mb-2 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
          Payout History
        </h2>
        <span className="text-xs text-gray-400">{payouts.length} total</span>
      </div>

      {payouts.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-400 text-sm">
          No payouts yet. Request your first payout above.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-3 text-left font-semibold">Amount</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">Attempts</th>
                <th className="px-6 py-3 text-left font-semibold">Created</th>
                <th className="px-6 py-3 text-left font-semibold">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payouts.map((payout) => (
                <tr
                  key={payout.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 font-mono font-semibold text-gray-900">
                    ₹
                    {Number(payout.amount_inr).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                    <span className="block text-xs text-gray-400 font-normal">
                      {payout.amount_paise.toLocaleString()} paise
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={payout.status} />
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {payout.attempt_count}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {fmt(payout.created_at)}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs max-w-xs truncate">
                    {payout.failure_reason ||
                      (payout.status === "completed" ? "Settled" : "—")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
