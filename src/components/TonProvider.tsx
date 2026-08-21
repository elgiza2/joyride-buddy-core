import type { ReactNode } from "react";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { API_BASE } from "@/lib/api";

/** Wallets fetch the manifest themselves, so it must be publicly reachable. */
export const MANIFEST_URL = `${
  API_BASE || "https://project--cabbd000-2e02-47bd-9490-cb3561f12ac2-dev.lovable.app"
}/api/public/tonconnect-manifest`;

/** One TON Connect session for the whole app so any screen can pay in one tap. */
export function TonProvider({ children }: { children: ReactNode }) {
  return (
    <TonConnectUIProvider
      manifestUrl={MANIFEST_URL}
      actionsConfiguration={{ twaReturnUrl: "https://t.me/Mosuclbot/App" }}
    >
      {children}
    </TonConnectUIProvider>
  );
}
