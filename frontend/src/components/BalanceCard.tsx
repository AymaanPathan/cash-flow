import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchBalance } from "../store/slice/merchantSlice";

export default function BalanceCard() {
  const dispatch = useAppDispatch();
  const { selectedId, balance, balanceLoading } = useAppSelector(
    (s) => s.merchants,
  );

  useEffect(() => {
    if (selectedId) {
      dispatch(fetchBalance(selectedId));
      const interval = setInterval(
        () => dispatch(fetchBalance(selectedId)),
        5000,
      );
      return () => clearInterval(interval);
    }
  }, [selectedId, dispatch]);

  if (balanceLoading && !balance) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse"
          >
            <div className="h-3 bg-gray-100 rounded w-24 mb-4" />
            <div className="h-8 bg-gray-100 rounded w-36" />
          </div>
        ))}
      </div>
    );
  }

  if (!balance) return null;

  const cards = [
    {
      label: "Available Balance",
      value: `₹${Number(balance.available_balance_inr).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      sub: `${balance.available_balance_paise.toLocaleString()} paise`,
      accent: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
    },
    {
      label: "Held (In Progress)",
      value: `₹${Number(balance.held_balance_inr).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      sub: `${balance.held_balance_paise.toLocaleString()} paise`,
      accent: "from-amber-500 to-orange-500",
      bg: "bg-amber-50",
      text: "text-amber-700",
    },
    {
      label: "Total Credits",
      value: `₹${(balance.total_credits_paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      sub: `${balance.total_credits_paise.toLocaleString()} paise`,
      accent: "from-violet-500 to-purple-600",
      bg: "bg-violet-50",
      text: "text-violet-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
            {card.label}
          </p>
          <p className="text-2xl font-bold text-gray-900 font-mono">
            {card.value}
          </p>
          <p className={`text-xs mt-1 font-medium ${card.text}`}>{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
