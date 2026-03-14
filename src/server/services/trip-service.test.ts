import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { ParkMetadata } from "@/server/providers/contracts";
import { buildParkCatalog } from "@/server/services/trip-service";

describe("buildParkCatalog", () => {
  it("returns only curated must-do attractions in mustDoOptions", () => {
    const park: ParkMetadata = {
      park: {
        id: "park-1",
        slug: "aurora-adventure",
        name: "Aurora Adventure Park",
        resort: "Lumen Bay Resort",
        description: "A mock park.",
        opensAt: "08:00",
        closesAt: "22:00",
      },
      attractions: [
        {
          id: "ride-1",
          slug: "comet-run",
          name: "Comet Run",
          category: "RIDE",
          zone: "Launch Pier",
          description: "Headliner coaster",
          thrillLevel: 5,
          minHeight: 48,
          kidFriendly: false,
          indoor: false,
          familyFriendly: false,
          durationMinutes: 4,
          xCoord: 0,
          yCoord: 0,
          tags: ["coaster", "must-do"],
          typicalWaitProfile: { 8: 20 },
          status: "OPEN",
        },
        {
          id: "ride-2",
          slug: "harbor-carousel",
          name: "Harbor Carousel",
          category: "RIDE",
          zone: "Celestial Harbor",
          description: "Gentle classic",
          thrillLevel: 1,
          minHeight: null,
          kidFriendly: true,
          indoor: false,
          familyFriendly: true,
          durationMinutes: 6,
          xCoord: 1,
          yCoord: 1,
          tags: ["gentle", "family"],
          typicalWaitProfile: { 8: 8 },
          status: "OPEN",
        },
        {
          id: "show-1",
          slug: "aurora-show",
          name: "Aurora Show",
          category: "SHOW",
          zone: "Harbor",
          description: "Indoor show",
          thrillLevel: 1,
          minHeight: null,
          kidFriendly: true,
          indoor: true,
          familyFriendly: true,
          durationMinutes: 20,
          xCoord: 2,
          yCoord: 2,
          tags: ["show", "must-do"],
          typicalWaitProfile: { 8: 0 },
          status: "OPEN",
        },
      ],
    };

    const catalog = buildParkCatalog(park);

    expect(catalog.attractions).toHaveLength(3);
    expect(catalog.mustDoOptions.map((attraction) => attraction.slug)).toEqual(["comet-run"]);
    expect(catalog.mustDoOptions.every((attraction) => attraction.tags.includes("must-do"))).toBe(true);
  });
});
