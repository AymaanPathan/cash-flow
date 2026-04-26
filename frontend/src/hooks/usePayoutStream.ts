import { useEffect, useRef } from "react";
import { useAppDispatch } from "../store/hooks";
import { updatePayoutFromStream } from "../store/slice/payoutSlice";
import { fetchBalance } from "../store/slice/merchantSlice";

export function usePayoutStream(merchantId: string | null) {
  const dispatch = useAppDispatch();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!merchantId) return;

    if (esRef.current) {
      esRef.current.close();
    }

    const url = `${import.meta.env.VITE_API_URL}/events/merchant-${merchantId}/`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("payout_update", (e: MessageEvent) => {
      const payout = JSON.parse(e.data);

      dispatch(updatePayoutFromStream(payout));

      if (payout.status === "completed" || payout.status === "failed") {
        dispatch(fetchBalance(merchantId));
      }
    });

    es.onerror = () => {
      console.warn("SSE connection lost, browser will reconnect automatically");
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [merchantId, dispatch]);
}
