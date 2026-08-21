/** @doc Bottom-sheet menu opened from the referral header button (mobile only). */
import { useNavigate } from "react-router-dom";
import { ListChecks, FileText, QrCode, X } from "lucide-react";

type Item = { label: string; icon: typeof ListChecks; to?: string; action?: () => void };

export default function TasksMenu({
  open,
  onClose,
  onQr,
}: {
  open: boolean;
  onClose: () => void;
  onQr: () => void;
}) {
  const navigate = useNavigate();
  if (!open) return null;

  const items: Item[] = [
    { label: "Tasks", icon: ListChecks, to: "/settings/referrals/tasks" },
    { label: "Program rules", icon: FileText, to: "/settings/referrals/program" },
    { label: "Invitation QR code", icon: QrCode, action: onQr },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-end" onClick={onClose}>
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      />
      <div
        className="relative w-full rounded-t-3xl pb-[env(safe-area-inset-bottom)]"
        style={{ background: "#141414", border: "1px solid hsl(0 0% 100% / 0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4">
          <span className="text-[15px] font-medium text-white">Tasks & rewards</span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full text-white/70"
            style={{ background: "hsl(0 0% 100% / 0.08)" }}
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <ul className="px-3 pb-4 pt-3">
          {items.map((it) => (
            <li key={it.label}>
              <button
                onClick={() => {
                  onClose();
                  if (it.to) navigate(it.to);
                  else it.action?.();
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-left text-[15px] text-white/90 transition active:bg-white/[0.06]"
              >
                <it.icon className="h-[18px] w-[18px] text-white/70" strokeWidth={1.8} />
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
