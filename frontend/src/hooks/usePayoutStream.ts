import { useEffect, useRef } from "react";
import { useAppDispatch } from "../store/hooks";
import { updatePayoutFromStream } from "../store/slice/payoutSlice";
import { fetchBalance } from "../store/slice/merchantSlice";

export function usePayoutStream(merchantId: string | null) {
  const dispatch = useAppDispatch();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!merchantId) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/merchant/${merchantId}/`);
    wsRef.current = ws;

    ws.onopen = () => console.log("[WS] connected");

    ws.onmessage = (e) => {
      const payout = JSON.parse(e.data);
      dispatch(updatePayoutFromStream(payout));
      if (payout.status === "completed" || payout.status === "failed") {
        dispatch(fetchBalance(merchantId));
      }
    };

    ws.onerror = (e) => console.error("[WS] error", e);
    ws.onclose = () => console.log("[WS] closed");

    return () => ws.close();
  }, [merchantId, dispatch]);
}
