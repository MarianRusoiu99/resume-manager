"use client";

import React from "react";
import { useTheme } from "@/lib/theme/context";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      aria-label="Toggle theme"
      onClick={toggle}
      className="px-3 py-1 rounded border"
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
