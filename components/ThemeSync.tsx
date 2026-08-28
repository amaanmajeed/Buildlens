"use client";

import { useLayoutEffect } from "react";

function readTheme(): "dark" | "light" {
  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Keep html.dark + cookie in sync with localStorage after hydrate. */
export function ThemeSync() {
  useLayoutEffect(() => {
    const theme = readTheme();
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.cookie = `theme=${theme};path=/;max-age=31536000;SameSite=Lax`;
  }, []);
  return null;
}
