import { useEffect, useRef } from "react";
import { useAppDispatch } from "../store/hooks";
import { updatePayoutFromStream } from "../store/slice/payoutSlice";
import { fetchBalance } from "../store/slice/merchantSlice";

export function usePayoutStream(merchantId: string | null) {
  const dispatch = useAppDispatch();
  const esRef = useRef<EventSource | null>(null);
  const merchantIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!merchantId) {
      esRef.current?.close();
      esRef.current = null;
      merchantIdRef.current = null;
      return;
    }

    // Don't reconnect if same merchant and connection is still open
    if (
      merchantIdRef.current === merchantId &&
      esRef.current?.readyState === EventSource.OPEN
    ) {
      return;
    }

    // Close previous connection
    esRef.current?.close();

    const url = `${import.meta.env.VITE_API_URL}/events/merchant-${merchantId}/`;
    console.log("[SSE] Connecting to", url);

    const es = new EventSource(url);
    esRef.current = es;
    merchantIdRef.current = merchantId;

    es.onopen = () => {
      console.log("[SSE] Connection open for merchant", merchantId);
    };

    es.addEventListener("payout_update", (e: MessageEvent) => {
      console.log("[SSE] payout_update received", e.data);
      try {
        const payout = JSON.parse(e.data);
        dispatch(updatePayoutFromStream(payout));
        if (payout.status === "completed" || payout.status === "failed") {
          dispatch(fetchBalance(merchantId));
        }
      } catch (err) {
        console.error("[SSE] Failed to parse event", err);
      }
    });

    es.onerror = (err) => {
      console.warn("[SSE] Connection error", err, "readyState:", es.readyState);
    };

    return () => {
      console.log("[SSE] Cleanup — closing connection");
      es.close();
      esRef.current = null;
      merchantIdRef.current = null;
    };
  }, [merchantId, dispatch]);
}
