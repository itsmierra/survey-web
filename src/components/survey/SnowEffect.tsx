"use client";

import Snowfall from "react-snowfall";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function SnowEffect() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const color =
    theme === "dark"
      ? "rgba(255, 255, 255, 0.6)"
      : "rgba(255, 255, 255, 0.8)";

  return (
    <Snowfall
      color={color}
      snowflakeCount={80}
      speed={[0.5, 1.5]}
      radius={[1, 4]}
      wind={[-0.5, 1]}
      style={{ position: "fixed", zIndex: 50, pointerEvents: "none" }}
    />
  );
}
