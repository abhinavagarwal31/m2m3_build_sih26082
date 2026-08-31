"use client";

import { useBootstrap } from "@/lib/hooks";

export default function AppBootstrap({ children }: { children: React.ReactNode }) {
  useBootstrap();
  return <>{children}</>;
}
