"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface RealtimeResponseCountProps {
  initialCount: number;
}

export function RealtimeResponseCount({
  initialCount,
}: RealtimeResponseCountProps) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("respondents-count")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "respondents" },
        () => {
          setCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return <p className="text-3xl font-bold">{count}</p>;
}
