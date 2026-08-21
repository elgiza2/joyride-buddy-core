import { Component, StrictMode, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import App from "@/App";
import { TonProvider } from "@/components/TonProvider";
import "@/styles.css";

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("App render error", error, info); }
  render() {
    if (this.state.error) return <div style={{ color: "white", padding: 24, fontFamily: "system-ui" }}>App error: {this.state.error.message}</div>;
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <TonProvider>
        <App />
        <Toaster position="top-center" richColors />
      </TonProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
