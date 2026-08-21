import { useRef, useState } from "react";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { toast } from "sonner";
import { TON_WALLET, commentPayload, makeMemo, telegram } from "@/lib/payments";
import { verifyTonPayment } from "@/lib/ton.functions";

/**
 * One-tap GRAM payment: TON Connect signs the transfer in the connected wallet
 * (no manual link, no typed comment), then we confirm it on-chain.
 */
export function useGramPay() {
  const verify = verifyTonPayment;
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress();
  const [pending, setPending] = useState<string | null>(null);
  const cancelled = useRef(false);

  const pay = async (key: string, amount: number, label: string, onPaid: () => void) => {
    if (!address) {
      toast("Connect your TON wallet first", { description: "Opening the wallet list…" });
      try {
        await tonConnectUI.openModal();
      } catch {
        /* user closed it */
      }
      return;
    }

    const memo = makeMemo("coins");
    setPending(key);
    cancelled.current = false;

    try {
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: TON_WALLET,
            amount: String(Math.round(amount * 1e9)),
            payload: commentPayload(memo),
          },
        ],
      });
    } catch {
      setPending(null);
      toast("Payment cancelled");
      return;
    }

    toast("Confirming on the blockchain", { description: `${amount} GRAM · ${label}` });

    for (let i = 0; i < 40; i++) {
      if (cancelled.current) break;
      await new Promise((r) => setTimeout(r, 4000));
      try {
        const res = await verify({ data: { memo, minTon: amount } });
        if (res.paid) {
          setPending(null);
          onPaid();
          telegram()?.HapticFeedback?.notificationOccurred?.("success");
          toast.success(`${label} activated`);
          return;
        }
      } catch {
        /* keep polling */
      }
    }
    setPending(null);
    toast("Still confirming", {
      description: "The transfer was signed — it will unlock as soon as the chain confirms it.",
    });
  };

  const cancel = () => {
    cancelled.current = true;
    setPending(null);
  };

  return { pay, pending, cancel };
}
