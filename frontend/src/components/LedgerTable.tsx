import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchLedger } from "../store/slice/merchantSlice";

export default function LedgerTable() {
  const dispatch = useAppDispatch();
  const { selectedId, ledger, ledgerLoading } = useAppSelector(
    (s) => s.merchants,
  );

  useEffect(() => {
    if (selectedId) dispatch(fetchLedger(selectedId));
  }, [selectedId]);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (ledgerLoading && ledger.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
        <div className="h-3 bg-gray-100 rounded w-24 mb-4" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-50 rounded-xl mb-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
          Ledger
        </h2>
        <span className="text-xs text-gray-400">{ledger.length} entries</span>
      </div>

      {ledger.length === 0 ? (
        <div className="px-6 py-10 text-center text-gray-400 text-sm">
          No ledger entries yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-3 text-left font-semibold">Type</th>
                <th className="px-6 py-3 text-left font-semibold">Amount</th>
                <th className="px-6 py-3 text-left font-semibold">
                  Description
                </th>
                <th className="px-6 py-3 text-left font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ledger.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        entry.entry_type === "credit"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {entry.entry_type === "credit" ? "↑ Credit" : "↓ Debit"}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono font-semibold text-gray-900">
                    <span
                      className={
                        entry.entry_type === "credit"
                          ? "text-emerald-600"
                          : "text-red-600"
                      }
                    >
                      {entry.entry_type === "credit" ? "+" : "-"}₹
                      {Number(entry.amount_inr).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500 text-xs max-w-xs truncate">
                    {entry.description || "—"}
                  </td>
                  <td className="px-6 py-3 text-gray-400 text-xs">
                    {fmt(entry.created_at)}
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
