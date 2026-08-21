import { type AnchorHTMLAttributes, type ReactNode } from "react";
import { navigate } from "@/components/AppShell";

export function Link({
  to,
  children,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; children: ReactNode }) {
  return (
    <a
      href={to}
      {...props}
      onClick={(event) => {
        if (!event.defaultPrevented) {
          event.preventDefault();
          navigate(to);
        }
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}
