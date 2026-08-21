import { useEffect, useState } from "react";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { ArrowDownLeft, ArrowUpRight, Loader2, LogOut, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { useGame } from "@/hooks/useGame";
import { MINERS } from "@/lib/game";
import { TON_WALLET, telegram } from "@/lib/payments";

function short(a: string) {
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

function Inner() {
  const address = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const { state, connectWallet, disconnectWallet, withdraw } = useGame();
  const [sending, setSending] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [amount, setAmount] = useState("");

  /* The session restores itself — the user never types an address. */
  useEffect(() => {
    if (address && address !== state.walletAddress) connectWallet(address);
    if (!address && state.walletAddress) disconnectWallet();
  }, [address, state.walletAddress, connectWallet, disconnectWallet]);

  if (!address) {
    return (
      <div className="animate-fade-up delay-1">
        <button
          onClick={() => void tonConnectUI.openModal()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm text-gray-900 transition-transform duration-200 active:scale-95"
        >
          <Wallet size={16} strokeWidth={2} /> Connect TON wallet
        </button>
        <p className="mt-2 text-center text-[11px] text-foreground/45">
          Deposits and withdrawals appear once your wallet is connected.
        </p>
      </div>
    );
  }

  const deposit = async () => {
    const value = Number(amount);
    if (!(value > 0)) {
      toast.error("Enter an amount first");
      return;
    }
    setSending(true);
    try {
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{ address: TON_WALLET, amount: String(Math.round(value * 1e9)) }],
      });
      telegram()?.HapticFeedback?.notificationOccurred?.("success");
      toast.success(`${value} GRAM sent`, { description: "It lands in a few seconds." });
      setDepositOpen(false);
      setAmount("");
    } catch {
      toast("Deposit cancelled");
    } finally {
      setSending(false);
    }
  };

  const onWithdraw = () => {
    const ready = MINERS.filter(
      (m) => (m.id === "gram" ? state.gram : state.usdt) >= m.minWithdraw,
    );
    if (ready.length === 0) {
      toast.error("Nothing to withdraw yet", {
        description: `Minimum ${MINERS[0]!.minWithdraw} GRAM or ${MINERS[1]!.minWithdraw} USDT.`,
      });
      return;
    }
    const sent = ready.filter((m) => withdraw(m.id)).map((m) => m.symbol);
    toast.success(`Withdrawal requested — ${sent.join(" + ")}`, {
      description: `Sent to ${short(address)}`,
    });
  };

  return (
    <div className="animate-fade-up delay-1 space-y-3">
      <div className="flex items-center justify-center">
        <button
          onClick={() => void tonConnectUI.disconnect()}
          className="glass-thin flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] text-foreground/70"
        >
          {short(address)} <LogOut size={12} strokeWidth={2} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setDepositOpen(true)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm text-gray-900 transition-transform duration-200 active:scale-95"
        >
          <ArrowDownLeft size={16} strokeWidth={2} />
          Deposit
        </button>
        <button
          onClick={onWithdraw}
          className="glass-thin flex items-center justify-center gap-2 rounded-2xl py-3 text-sm transition-transform duration-200 active:scale-95"
        >
          <ArrowUpRight size={16} strokeWidth={2} /> Withdraw
        </button>
      </div>

      {depositOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="liquid-glass animate-fade-up w-full max-w-md rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm">Deposit GRAM</p>
              <button
                onClick={() => setDepositOpen(false)}
                className="rounded-full p-1 text-foreground/60"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <p className="mt-1 text-[11px] text-foreground/55">
              Enter the amount — your wallet opens with the transaction ready.
            </p>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              placeholder="0.00"
              autoFocus
              className="glass-thin mt-4 w-full rounded-2xl p-4 text-center text-2xl tabular-nums outline-none placeholder:text-foreground/30 focus:ring-2 focus:ring-blue-700"
            />
            <button
              onClick={deposit}
              disabled={sending || !(Number(amount) > 0)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm text-gray-900 transition-transform duration-200 active:scale-95 disabled:opacity-50"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : null}
              Confirm deposit
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function WalletPanel() {
  return <Inner />;
}
