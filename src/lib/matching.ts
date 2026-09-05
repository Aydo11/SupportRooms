/**
 * Marketplace compatibility score. This is a discovery aid only — it is NOT an
 * eligibility, suitability or clinical assessment, and must never be presented
 * as one. Weights are deliberately simple and easy to tune.
 */
import type { AccommodationType, GenderArrangement } from "@prisma/client";

export type MatchSeeker = {
  city?: string | null;
  preferredLocations?: string[];
  supportTypes?: string[];
  preferredTypes?: AccommodationType[];
  availableFrom?: Date | null;
  genderArrangement?: GenderArrangement | null;
  age?: number | null;
  needsWheelchairAccess?: boolean;
  budgetWeekly?: number | null;
};

export type MatchListing = {
  city: string;
  supportTypes: string[];
  accommodationType: AccommodationType;
  availableFrom?: Date | null;
  genderArrangement: GenderArrangement;
  minAge?: number | null;
  maxAge?: number | null;
  wheelchairAccess: boolean;
  weeklyRentFrom?: number | null;
};

const WEIGHTS = {
  location: 25,
  support: 30,
  type: 15,
  availability: 10,
  gender: 8,
  age: 7,
  accessibility: 5,
};

export type MatchResult = { score: number; reasons: string[]; blockers: string[] };

export function matchScore(seeker: MatchSeeker, listing: MatchListing): MatchResult {
  let score = 0;
  const reasons: string[] = [];
  const blockers: string[] = [];

  const places = [seeker.city, ...(seeker.preferredLocations ?? [])]
    .filter(Boolean)
    .map((p) => String(p).toLowerCase());
  if (places.includes(listing.city.toLowerCase())) {
    score += WEIGHTS.location;
    reasons.push(`In ${listing.city}`);
  } else if (places.length === 0) {
    score += WEIGHTS.location * 0.5;
  }

  const wanted = seeker.supportTypes ?? [];
  if (wanted.length) {
    const overlap = wanted.filter((s) => listing.supportTypes.includes(s));
    score += WEIGHTS.support * (overlap.length / wanted.length);
    if (overlap.length) reasons.push(`Supports ${overlap.length} of your ${wanted.length} support needs`);
    else blockers.push("Does not list the support you need");
  } else {
    score += WEIGHTS.support * 0.5;
  }

  const types = seeker.preferredTypes ?? [];
  if (!types.length || types.includes(listing.accommodationType)) {
    score += WEIGHTS.type;
    if (types.length) reasons.push("Accommodation type matches");
  }

  if (!seeker.availableFrom || !listing.availableFrom || listing.availableFrom <= seeker.availableFrom) {
    score += WEIGHTS.availability;
    reasons.push("Available when you need it");
  }

  const pref = seeker.genderArrangement ?? "ANY";
  if (pref === "ANY" || listing.genderArrangement === "ANY" || pref === listing.genderArrangement) {
    score += WEIGHTS.gender;
  } else {
    blockers.push("Different gender arrangement");
  }

  const age = seeker.age ?? null;
  if (age === null) {
    score += WEIGHTS.age * 0.5;
  } else if ((listing.minAge ?? 0) <= age && age <= (listing.maxAge ?? 200)) {
    score += WEIGHTS.age;
  } else {
    blockers.push("Outside the stated age range");
  }

  if (!seeker.needsWheelchairAccess || listing.wheelchairAccess) {
    score += WEIGHTS.accessibility;
  } else {
    blockers.push("No step-free access listed");
  }

  if (seeker.budgetWeekly && listing.weeklyRentFrom && listing.weeklyRentFrom > seeker.budgetWeekly * 1.15) {
    score -= 10;
    blockers.push("Above your stated budget");
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons, blockers };
}

export const matchTone = (score: number) =>
  score >= 80 ? "strong" : score >= 55 ? "fair" : "weak";
