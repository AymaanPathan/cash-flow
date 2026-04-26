import { useAppDispatch, useAppSelector } from "../store/hooks";
import { selectMerchant } from "../store/slice/merchantSlice";

export default function MerchantSelector() {
  const dispatch = useAppDispatch();
  const { list, selectedId, loading } = useAppSelector((s) => s.merchants);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {list.map((m) => (
        <button
          key={m.id}
          onClick={() => dispatch(selectMerchant(m.id))}
          className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
            selectedId === m.id
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <p className="text-sm font-semibold truncate">{m.name}</p>
          <p
            className={`text-xs truncate ${selectedId === m.id ? "text-indigo-200" : "text-gray-400"}`}
          >
            {m.email}
          </p>
        </button>
      ))}
    </div>
  );
}
