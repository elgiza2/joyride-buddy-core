import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import MinePage from "@/pages/MinePage";
import AiPage from "@/pages/aiPage";
import StudioPage from "@/pages/studioPage";
import TasksPage from "@/pages/tasksPage";
import WalletPage from "@/pages/walletPage";
import { GameProvider } from "@/hooks/useGame";

const pages: Record<string, React.ComponentType> = {
  "/": MinePage,
  "/ai": AiPage,
  "/studio": StudioPage,
  "/tasks": TasksPage,
  "/wallet": WalletPage,
};

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname || "/");
  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname || "/");
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  const Page = pages[pathname] ?? MinePage;
  return (
    <GameProvider>
      <AppShell>
        <Page />
      </AppShell>
    </GameProvider>
  );
}
