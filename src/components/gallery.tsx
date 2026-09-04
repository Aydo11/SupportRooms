"use client";

import { useState } from "react";

type Media = { id: string; type: string; url: string; caption: string | null };

export function Gallery({ media, title }: { media: Media[]; title: string }) {
  const [active, setActive] = useState(0);

  if (!media.length) {
    return (
      <div className="grid aspect-[16/9] place-items-center rounded-card border border-line bg-paper-sunk text-[15px] text-ink-faint">
        The provider hasn&apos;t added photos yet
      </div>
    );
  }

  const current = media[Math.min(active, media.length - 1)];

  return (
    <div>
      <div className="overflow-hidden rounded-card border border-line bg-black">
        {current.type === "VIDEO" ? (
          <video src={current.url} controls playsInline className="aspect-video w-full bg-black" />
        ) : current.type === "VIDEO_URL" ? (
          <div className="aspect-video w-full">
            <iframe
              src={toEmbed(current.url)}
              title={`${title} video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.url} alt={current.caption ?? title} className="aspect-video w-full object-cover" />
        )}
      </div>

      {media.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {media.map((item, index) => (
            <li key={item.id}>
              <button
                onClick={() => setActive(index)}
                aria-current={index === active}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-[8px] border-2 ${
                  index === active ? "border-pine" : "border-transparent"
                }`}
              >
                {item.type.startsWith("VIDEO") ? (
                  <span className="grid h-full w-full place-items-center bg-ink text-[12px] text-white">Video</span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt="" className="h-full w-full object-cover" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function toEmbed(url: string) {
  const youtube = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
}
