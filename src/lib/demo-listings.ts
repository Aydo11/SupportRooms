export const DEMO_LISTING_IMAGES = [
  {
    url: "/demo-listings/supported-bedroom.png",
    caption: "Illustrative photo — furnished bedroom",
  },
  {
    url: "/demo-listings/shared-kitchen.png",
    caption: "Illustrative photo — shared kitchen",
  },
  {
    url: "/demo-listings/accessible-studio.png",
    caption: "Illustrative photo — accessible studio",
  },
] as const;

function stableIndex(seed: string) {
  let value = 0;
  for (let index = 0; index < seed.length; index += 1) {
    value = (value * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return value % DEMO_LISTING_IMAGES.length;
}

/** A consistent fallback prevents empty cards without pretending it is the real property. */
export function demoListingImage(seed: string, offset = 0) {
  const index = (stableIndex(seed) + offset) % DEMO_LISTING_IMAGES.length;
  return DEMO_LISTING_IMAGES[index];
}

export function demoListingGallery(seed: string) {
  return DEMO_LISTING_IMAGES.map((_, index) => {
    const image = demoListingImage(seed, index);
    return {
      id: `illustrative-${index}`,
      type: "IMAGE",
      url: image.url,
      caption: image.caption,
      room: null,
      illustrative: true,
    };
  });
}
