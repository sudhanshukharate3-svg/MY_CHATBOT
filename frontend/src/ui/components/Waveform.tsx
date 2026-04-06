import React from "react";
import clsx from "clsx";

export function Waveform({ active }: { active: boolean }) {
  return (
    <div className={clsx("flex items-end gap-1 transition-opacity", !active && "opacity-0")} aria-hidden="true">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className={clsx(
            "h-3 w-1 origin-bottom rounded-full bg-indigo-500/90 dark:bg-indigo-400/90",
            active && "animate-pulseBars"
          )}
          style={{ animationDelay: `${i * 90}ms` }}
        />
      ))}
    </div>
  );
}

