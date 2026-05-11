"use client";

import { AppStateProvider } from "@/components/workspace/AppStateProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AppStateProvider>{children}</AppStateProvider>;
}
