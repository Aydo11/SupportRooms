/**
 * Single source of truth for branding. Change these values and the whole
 * product renames itself — nothing else hard-codes the name.
 */
export const brand = {
  name: "SupportRooms",
  shortName: "SupportRooms",
  tagline: "Supported accommodation, findable.",
  description:
    "Search supported accommodation across the UK, or advertise rooms to the people and professionals looking for them.",
  supportEmail: "hello@supportrooms.example",
  currency: "GBP",
  currencySymbol: "£",
  // Legal / trust copy. Deliberately makes no regulatory claims.
  trustNote:
    "Verification confirms we have checked a provider's stated identity and documents. It is not a regulatory endorsement, inspection or accreditation.",
} as const;
