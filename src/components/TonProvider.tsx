import type { ReactNode } from "react";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { apiUrl } from "@/lib/api";

/** Wallets fetch the manifest themselves, so it must be publicly reachable. */
export const MANIFEST_URL = apiUrl("/api/public/tonconnect-manifest");

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
