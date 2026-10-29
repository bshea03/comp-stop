import { describe, expect, it } from "vitest";

import {
  canonicalCondition,
  formatListingCondition,
  listingMatchesQueryCondition,
} from "@/lib/listings/condition-match";
import { CONDITION_USED_ONLY } from "@/lib/schema";
import type { SoldListing } from "@/lib/marketplaces/types";

function listing(condition?: string): SoldListing {
  return {
    id: "1",
    marketplace: "poshmark",
    title: "Test",
    condition,
    priceCents: 1000,
    currency: "USD",
    soldAt: new Date().toISOString(),
    url: "https://example.com/item/1",
  };
}

describe("canonicalCondition", () => {
  it("maps Poshmark-style labels", () => {
    expect(canonicalCondition("Used like new")).toBe("Excellent");
    expect(canonicalCondition("Good")).toBe("Good");
  });

  it("maps canonical ingest values", () => {
    expect(canonicalCondition("Excellent")).toBe("Excellent");
  });
});

describe("formatListingCondition", () => {
  it("formats used grades consistently", () => {
    expect(formatListingCondition("Good")).toBe("Used - Good");
    expect(formatListingCondition("Used like new")).toBe("Used - Like New");
    expect(formatListingCondition("Excellent")).toBe("Used - Like New");
  });

  it("formats new grades", () => {
    expect(formatListingCondition("New with tags")).toBe("New - With Tags");
  });
});

describe("listingMatchesQueryCondition", () => {
  it("includes used tiers for used-only filter", () => {
    expect(
      listingMatchesQueryCondition(listing("Good"), CONDITION_USED_ONLY),
    ).toBe(true);
    expect(
      listingMatchesQueryCondition(listing("New with tags"), CONDITION_USED_ONLY),
    ).toBe(false);
  });
});
