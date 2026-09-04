"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function AdminSearch({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");

  return (
    <div className="flex gap-2">
      <label className="sr-only" htmlFor="admin-search">{placeholder}</label>
      <input
        id="admin-search"
        className="field max-w-sm"
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") router.push(`?q=${encodeURIComponent(value)}`);
        }}
      />
      <button className="btn-secondary" onClick={() => router.push(`?q=${encodeURIComponent(value)}`)}>
        Search
      </button>
    </div>
  );
}
