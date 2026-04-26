import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchMerchants } from "../store/merchantSlice";
import { fetchPayouts } from "../store/payoutSlice";
import MerchantSelector from "../components/MerchantSelector";
import BalanceCard from "../components/BalanceCard";
import PayoutForm from "../components/PayoutForm";
import PayoutTable from "../components/PayoutTable";
import LedgerTable from "../components/LedgerTable";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { selectedId, list } = useAppSelector((s) => s.merchants);
  const selectedMerchant = list.find((m) => m.id === selectedId);

  useEffect(() => {
    dispatch(fetchMerchants());
  }, [dispatch]);

  useEffect(() => {
    if (selectedId) dispatch(fetchPayouts(selectedId));
  }, [selectedId, dispatch]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white border-r border-gray-100 flex flex-col p-4 gap-6">
        <div className="flex items-center gap-2 px-2 pt-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">P</span>
          </div>
          <span className="font-bold text-gray-900 text-sm">Playto Pay</span>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-2 mb-2">
            Merchants
          </p>
          <MerchantSelector />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {selectedMerchant ? (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                {selectedMerchant.name}
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {selectedMerchant.email}
              </p>
            </div>

            {/* Balance cards */}
            <div className="mb-6">
              <BalanceCard />
            </div>

            {/* Payout form + payout history */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-1">
                <PayoutForm />
              </div>
              <div className="lg:col-span-2">
                <PayoutTable />
              </div>
            </div>

            {/* Ledger */}
            <LedgerTable />
          </>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
            Select a merchant from the sidebar
          </div>
        )}
      </main>
    </div>
  );
}
