"use client";

import { useEffect, useState, type ImgHTMLAttributes } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
  fallbackSrc: string;
  fallbackLabel?: string;
};

/** Replaces lost object-storage files with an honest illustrative image. */
export function ResilientImage({ src, fallbackSrc, fallbackLabel, alt, ...props }: Props) {
  const [failed, setFailed] = useState(!src);

  useEffect(() => setFailed(!src), [src]);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        {...props}
        src={failed ? fallbackSrc : src ?? fallbackSrc}
        alt={alt}
        onError={() => setFailed(true)}
      />
      {failed && fallbackLabel && (
        <span className="absolute bottom-2 left-2 rounded-pill bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
          {fallbackLabel}
        </span>
      )}
    </>
  );
}
