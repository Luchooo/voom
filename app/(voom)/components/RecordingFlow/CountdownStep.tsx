"use client";

import { useEffect, useState } from "react";

interface CountdownStepProps {
  onComplete: () => void;
  seconds?: number;
}

/** Cuenta regresiva 3, 2, 1 y luego llama onComplete */
export function CountdownStep({ onComplete, seconds = 3 }: CountdownStepProps) {
  const [count, setCount] = useState(seconds);

  useEffect(() => {
    if (count <= 0) {
      onComplete();
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, onComplete]);

  return (
    <div className="flex min-h-full flex-col items-center justify-center p-8">
      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-blue-600 shadow-2xl ring-4 ring-foreground/30">
        <span className="text-5xl font-bold tabular-nums text-white">
          {count > 0 ? count : ""}
        </span>
      </div>
      <p className="mt-6 text-sm font-medium text-foreground">
        {count > 0 ? `Grabación en ${count}…` : "¡Comienza la grabación!"}
      </p>
    </div>
  );
}
